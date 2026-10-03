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
  inferTransientOptions,
  solveTransient,
  type TransientOptions,
} from './transientSolver';

export interface SolveOptions {
  /**
   * Transient integration options.
   * - object: use as-is
   * - true: infer duration/Δt from RC/RL
   * - omitted: auto-run only for experimentId === 'rc-circuit' when C/L present
   */
  transient?: TransientOptions | boolean;
}

function resolveTransientOptions(
  circuit: CircuitDefinition,
  options?: SolveOptions,
): TransientOptions | null {
  if (!circuitHasDynamicElements(circuit)) return null;

  if (options?.transient === false) return null;
  if (options?.transient && typeof options.transient === 'object') {
    return options.transient;
  }
  if (options?.transient === true || circuit.experimentId === 'rc-circuit') {
    return inferTransientOptions(circuit);
  }
  return null;
}

export function solveCircuit(
  circuit: CircuitDefinition,
  options?: SolveOptions,
): SimulationResult {
  const binding = solveBinding(circuit);
  const validation = validateCircuit(circuit);

  if (!validation.valid) {
    return {
      status: 'invalid',
      validation,
      error: 'Circuit validation failed',
      metadata: binding,
    };
  }

  try {
    const dcResult = solveDC(circuit);

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

    const measurements = generateMeasurementsFromDCResult(circuit, dcResult);
    const transientOpts = resolveTransientOptions(circuit, options);
    const meta: Record<string, unknown> = { ...binding };

    if (transientOpts) {
      const transient = solveTransient(circuit, transientOpts);
      meta.transient = {
        requested: true,
        success: transient.success,
        duration: transient.duration,
        timeStep: transient.timeStep,
        steps: transient.steps,
        error: transient.error,
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
