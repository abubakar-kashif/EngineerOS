/**
 * Circuit Solver - Main Interface
 * Orchestrates validation, DC solve, optional transient, and measurements.
 */

import type {
  CircuitDefinition,
} from './circuitGraph';

import {
  validateCircuit,
} from './circuitValidator';

import {
  solveDC,
  type DCResult,
} from './dcSolver';

import type {
  SimulationResult,
  Measurements,
  ComponentMeasurement,
} from './types';

import { generateGraphsFromMeasurements, type GraphData } from './graphData';
import { buildElectricalNodes } from './circuitGraphBuilder';
import { buildNetlist } from './netlist';
import {
  electricalFingerprint,
  serializeNetlistSnapshot,
} from './electricalSnapshot';
import {
  circuitHasDynamicElements,
  circuitNeedsTimeDomain,
  inferTransientOptions,
  solveTransient,
  type TransientOptions,
} from './transientSolver';
import { extractHalfWaveRectifierMetrics } from './halfWaveRectifierAnalysis';
import {
  extractRcCircuitMetrics,
  prepareRcTransientCircuit,
} from './rcCircuitAnalysis';
import {
  extractRlCircuitMetrics,
  prepareRlTransientCircuit,
} from './rlCircuitAnalysis';
import {
  circuitIsSeriesRlc,
  extractRlcCircuitMetrics,
} from './rlcCircuitAnalysis';
import {
  circuitHasAcSource,
  extractFrequencySweepMetrics,
  type FrequencySweepOptions,
} from './frequencySweepAnalysis';
import {
  extractSeriesResonanceMetrics,
  seriesResonanceSweepOptions,
} from './seriesResonanceAnalysis';

export interface SolveOptions {
  /**
   * Transient integration options.
   * - object: use as-is
   * - true: infer duration/Δt from RC/RL/RLC
   * - omitted: auto-run for rc/rl/rlc labs when C/L present
   */
  transient?: TransientOptions | boolean;
  /**
   * AC frequency sweep (phasor MNA at each frequency).
   * - object: use as-is (fStart/fStop/points or step)
   * - true: infer window from AC source / LC resonance
   * - omitted: auto-run when the circuit has an AC voltage source
   * - false: never run
   */
  frequencySweep?: FrequencySweepOptions | boolean;
}

function isTransientLab(experimentId?: string): boolean {
  return (
    experimentId === 'rc-circuit' ||
    experimentId === 'rl-circuit' ||
    experimentId === 'rlc-circuit' ||
    experimentId === 'half-wave-rectifier'
  );
}

function resolveTransientOptions(
  circuit: CircuitDefinition,
  options?: SolveOptions,
): TransientOptions | null {
  if (options?.transient === false) return null;
  if (options?.transient && typeof options.transient === 'object') {
    return options.transient;
  }
  const auto =
    options?.transient === true || isTransientLab(circuit.experimentId);
  if (!auto) return null;
  if (!circuitNeedsTimeDomain(circuit)) return null;
  return inferTransientOptions(circuit);
}

function resolveFrequencySweepOptions(
  circuit: CircuitDefinition,
  options?: SolveOptions,
): FrequencySweepOptions | boolean | null {
  if (options?.frequencySweep === false) return null;
  // Rectifier is a time-domain lab — do not run phasor frequency sweeps.
  if (circuit.experimentId === 'half-wave-rectifier') return null;
  if (options?.frequencySweep && typeof options.frequencySweep === 'object') {
    return options.frequencySweep;
  }
  if (circuit.experimentId === 'series-resonance') {
    return seriesResonanceSweepOptions(circuit) ?? true;
  }
  if (options?.frequencySweep === true || circuitHasAcSource(circuit)) {
    return true;
  }
  return null;
}

export function solveCircuit(
  circuit: CircuitDefinition,
  options?: SolveOptions,
): SimulationResult {
  const binding = solveBinding(circuit);
  const transientOpts = resolveTransientOptions(circuit, options);
  const frequencySweepOpts = resolveFrequencySweepOptions(circuit, options);
  const isRcLab = circuit.experimentId === 'rc-circuit';
  const isRlLab = circuit.experimentId === 'rl-circuit';
  const isRlcLab = circuit.experimentId === 'rlc-circuit';
  const isSeriesResonanceLab = circuit.experimentId === 'series-resonance';
  const isHalfWaveLab = circuit.experimentId === 'half-wave-rectifier';
  /** Open charge switch remaps to a solvable R–C / R–L loop before validate/solve. */
  let active = circuit;
  let preparedMode: string | undefined;
  if (transientOpts && isRcLab) {
    const prepared = prepareRcTransientCircuit(circuit);
    active = prepared.circuit;
    preparedMode = prepared.mode;
  } else if (transientOpts && isRlLab) {
    const prepared = prepareRlTransientCircuit(circuit);
    active = prepared.circuit;
    preparedMode = prepared.mode;
  }

  const validation = validateCircuit(active);

  if (!validation.valid) {
    return {
      status: 'invalid',
      validation,
      error: 'Circuit validation failed',
      metadata: binding,
    };
  }

  try {
    const dcResult = solveDC(active);

    if (!dcResult.success) {
      return {
        status: 'failed',
        validation: {
          ...validation,
          errors: [
            ...validation.errors,
            {
              code: dcResult.errorCode ?? 'SOLVER_FAILED',
              severity: 'error' as const,
              message: dcResult.error || 'Solver failed',
              suggestedFix: 'Check for shorts, floating nodes, or unsupported topology.',
            },
          ],
        },
        error: dcResult.error || 'Solver failed',
        graphs: [],
        metadata: binding,
      };
    }

    const measurements = generateMeasurementsFromDCResult(active, dcResult);
    const meta: Record<string, unknown> = { ...binding };

    if (transientOpts) {
      let optsForSolve: TransientOptions = transientOpts;
      if (isRcLab && preparedMode === 'discharging') {
        optsForSolve = {
          ...transientOpts,
          capacitorVoltage: Object.fromEntries(
            active.components
              .filter((c) => c.type === 'capacitor')
              .map((c) => [
                c.id,
                typeof c.properties.initialVoltage === 'number'
                  ? c.properties.initialVoltage
                  : 0,
              ]),
          ),
        };
      } else if (isRlLab && preparedMode === 'deenergizing') {
        optsForSolve = {
          ...transientOpts,
          inductorCurrent: Object.fromEntries(
            active.components
              .filter((c) => c.type === 'inductor')
              .map((c) => [
                c.id,
                typeof c.properties.initialCurrent === 'number'
                  ? c.properties.initialCurrent
                  : 0,
              ]),
          ),
        };
      }

      const transient = solveTransient(active, optsForSolve);
      meta.transient = {
        requested: true,
        success: transient.success,
        duration: transient.duration,
        timeStep: transient.timeStep,
        steps: transient.steps,
        error: transient.error,
        mode: preparedMode,
      };
      if (transient.success && transient.timeSeries.length > 0) {
        measurements.timeSeries = transient.timeSeries;
      } else if (!transient.success) {
        return {
          status: 'failed',
          validation,
          dcResult,
          measurements,
          graphs: [],
          error: transient.error || 'Transient solver failed',
          metadata: meta,
        };
      }
    }

    const hasC = circuit.components.some((c) => c.type === 'capacitor');
    const hasL = circuit.components.some((c) => c.type === 'inductor');
    const isRlc =
      isRlcLab || (Boolean(measurements.timeSeries) && circuitIsSeriesRlc(circuit));

    if (isRlc) {
      const transientInfo = meta.transient as
        | { duration?: number; timeStep?: number }
        | undefined;
      const rlc = extractRlcCircuitMetrics(circuit, measurements, transientInfo);
      if (rlc) {
        measurements.rlc = rlc;
        meta.rlc = rlc;
      }
    } else if (isRcLab || (measurements.timeSeries && hasC)) {
      const rc = extractRcCircuitMetrics(circuit, measurements);
      if (rc) {
        measurements.rc = rc;
        meta.rc = rc;
      }
    } else if (isRlLab || (measurements.timeSeries && hasL && !hasC)) {
      const rl = extractRlCircuitMetrics(circuit, measurements);
      if (rl) {
        measurements.rl = rl;
        meta.rl = rl;
      }
    }

    if (isHalfWaveLab || (measurements.timeSeries && circuitNeedsTimeDomain(active))) {
      const hasDiode = active.components.some(
        (c) => c.type === 'diode' || c.type === 'led',
      );
      if (hasDiode && !hasC && !hasL) {
        const hw = extractHalfWaveRectifierMetrics(active, measurements);
        if (hw) {
          measurements.halfWaveRectifier = hw;
          meta.halfWaveRectifier = hw;
        }
      }
    }

    if (frequencySweepOpts) {
      const sweep = extractFrequencySweepMetrics(active, frequencySweepOpts);
      meta.frequencySweep = {
        requested: true,
        success: Boolean(sweep),
        points: sweep?.points ?? 0,
      };
      if (sweep) {
        measurements.frequencySweep = sweep;
      }
      if (isSeriesResonanceLab || (sweep && circuitHasAcSource(active))) {
        const resonance = extractSeriesResonanceMetrics(active, sweep);
        if (resonance) {
          measurements.seriesResonance = resonance;
          meta.seriesResonance = {
            R: resonance.R,
            L: resonance.L,
            C: resonance.C,
            Vin: resonance.Vin,
            f0Theoretical: resonance.f0Theoretical,
            f0Simulated: resonance.f0Simulated,
            errorPercent: resonance.errorPercent,
            peakCurrentMag: resonance.peakCurrentMag,
            bandwidth: resonance.bandwidth,
            Q: resonance.Q,
          };
        }
      }
    }

    const graphs: GraphData[] = generateGraphsFromMeasurements(measurements, circuit);

    return {
      status: 'completed',
      validation,
      dcResult,
      measurements,
      graphs,
      metadata: meta,
    };
  } catch (error) {
    return {
      status: 'failed',
      validation,
      error: error instanceof Error ? error.message : 'Unknown solver error',
      metadata: binding,
    };
  }
}

function solveBinding(circuit: CircuitDefinition): Record<string, unknown> {
  const graph = buildElectricalNodes(circuit);
  const netlist = buildNetlist(circuit, graph.nodes);
  return {
    solvedCircuitFingerprint: electricalFingerprint(circuit),
    netlistSnapshot: serializeNetlistSnapshot(netlist),
  };
}

/**
 * Measurements from the solved netlist only.
 * A voltmeter reads V(pos net) − V(neg net). An ammeter reads its own branch current.
 * Power is V·I from that same solve. Nearby components are never used as a proxy.
 */
export function generateMeasurementsFromDCResult(
  circuit: CircuitDefinition,
  dcResult: DCResult,
): Measurements {
  const componentMeasurements: ComponentMeasurement[] = [];

  const reportedTypes = new Set([
    'resistor', 'potentiometer', 'capacitor', 'inductor', 'diode', 'led',
    'voltage_source', 'current_source', 'voltmeter', 'ammeter', 'switch',
  ]);

  for (const component of circuit.components) {
    if (!reportedTypes.has(component.type)) continue;
    const result = dcResult.componentResults.get(component.id);
    if (!result) continue;
    const voltage = result.voltage;
    const current = result.current;
    const power = Number.isFinite(result.power) ? result.power : voltage * current;
    componentMeasurements.push({
      componentId: component.id,
      type: component.type,
      voltage,
      current,
      power,
      resistance: result.resistance,
    });
  }

  if (Number.isFinite(dcResult.equivalentResistance) && dcResult.equivalentResistance > 0) {
    componentMeasurements.push({
      componentId: '__ohmmeter__',
      type: 'ohmmeter',
      voltage: 0,
      current: 0,
      power: 0,
      resistance: dcResult.equivalentResistance,
    });
  }
  if (Number.isFinite(dcResult.totalPower)) {
    componentMeasurements.push({
      componentId: '__power_meter__',
      type: 'power_meter',
      voltage: 0,
      current: dcResult.totalCurrent,
      power: dcResult.totalPower,
    });
  }

  let totalVoltage = 0;
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  if (voltageSource) {
    const src = dcResult.componentResults.get(voltageSource.id);
    totalVoltage = src?.voltage ?? voltageSource.properties.voltage ?? 0;
  }

  return {
    totalVoltage,
    totalCurrent: dcResult.totalCurrent,
    totalPower: dcResult.totalPower,
    equivalentResistance: dcResult.equivalentResistance,
    componentMeasurements,
  };
}
