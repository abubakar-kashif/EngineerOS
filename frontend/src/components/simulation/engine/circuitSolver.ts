/**
 * Circuit Solver - Main Interface
 * Orchestrates validation, DC solve, and measurements bound to that solve.
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

export function solveCircuit(circuit: CircuitDefinition): SimulationResult {
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
    const graphs: GraphData[] = generateGraphsFromMeasurements(measurements, circuit);

    return {
      status: 'completed',
      validation,
      dcResult,
      measurements,
      graphs,
      metadata: binding,
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
    'resistor', 'capacitor', 'inductor', 'diode', 'led',
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
