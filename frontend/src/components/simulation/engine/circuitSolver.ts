/**
 * Circuit Solver - Main Interface
 * Person 1: Simulation Engine
 * Orchestrates validation and solving
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

import { generateAllGraphs } from './graphData';

/**
 * Main circuit solver
 * Validates then solves the circuit
 */
export function solveCircuit(circuit: CircuitDefinition): SimulationResult {
  // Step 1: Validate
  const validation = validateCircuit(circuit);
  
  if (!validation.valid) {
    return {
      status: 'invalid',
      validation,
      error: 'Circuit validation failed',
    };
  }

  // Step 2: Solve
  try {
    const dcResult = solveDC(circuit);
    
    if (!dcResult.success) {
      return {
        status: 'failed',
        validation,
        error: dcResult.error || 'Solver failed',
        graphs: [],
      };
    }

    // Step 3: Authoritative measurements from DC result (including instruments)
    const measurements = generateMeasurementsFromDCResult(circuit, dcResult);

    // Step 4: Graphs from the same SimulationResult path (no competing pipeline)
    let graphs = [];
    try {
      graphs = generateAllGraphs(circuit, dcResult);
    } catch {
      graphs = [];
    }

    return {
      status: 'completed',
      validation,
      dcResult,
      measurements,
      graphs,
    };
  } catch (error) {
    return {
      status: 'failed',
      validation,
      error: error instanceof Error ? error.message : 'Unknown solver error',
    };
  }
}

/**
 * Resolve node voltage for a terminal from DC node voltages / component results.
 */
function terminalVoltage(
  circuit: CircuitDefinition,
  dcResult: DCResult,
  componentId: string,
  terminalType: string,
): number | null {
  const termId = `${componentId}.${terminalType}`;
  if (dcResult.nodeVoltages.has(termId)) {
    return dcResult.nodeVoltages.get(termId) ?? null;
  }
  const host = dcResult.componentResults.get(componentId);
  if (host) {
    return host.voltage;
  }
  return null;
}

/**
 * Generate measurements directly from DC result — never invent values.
 */
function generateMeasurementsFromDCResult(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurements {
  const componentMeasurements: ComponentMeasurement[] = [];

  const passiveComponents = circuit.components.filter(
    c => ['resistor', 'capacitor', 'inductor', 'diode', 'led'].includes(c.type)
  );

  for (const component of passiveComponents) {
    const result = dcResult.componentResults.get(component.id);
    if (result) {
      componentMeasurements.push({
        componentId: component.id,
        type: component.type,
        voltage: result.voltage,
        current: result.current,
        power: result.power,
        resistance: result.resistance,
      });
    }
  }

  for (const source of circuit.components.filter(c =>
    c.type === 'voltage_source' || c.type === 'current_source'
  )) {
    const result = dcResult.componentResults.get(source.id);
    if (result) {
      componentMeasurements.push({
        componentId: source.id,
        type: source.type,
        voltage: result.voltage,
        current: result.current,
        power: result.power,
      });
    }
  }

  // Instruments — values only when simulation provides them
  for (const meter of circuit.components.filter(c => c.type === 'voltmeter')) {
    let voltage: number | null = null;
    const pos = terminalVoltage(circuit, dcResult, meter.id, 'positive');
    const neg = terminalVoltage(circuit, dcResult, meter.id, 'negative');
    if (pos !== null && neg !== null) {
      voltage = Math.abs(pos - neg);
    } else {
      const parallelComp = findParallelMeasuredComponent(circuit, meter.id);
      if (parallelComp) {
        const r = dcResult.componentResults.get(parallelComp);
        if (r) voltage = Math.abs(r.voltage);
      }
    }
    if (voltage !== null && Number.isFinite(voltage)) {
      componentMeasurements.push({
        componentId: meter.id,
        type: 'voltmeter',
        voltage,
        current: 0,
        power: 0,
      });
    }
  }

  for (const meter of circuit.components.filter(c => c.type === 'ammeter')) {
    const seriesComp = findSeriesMeasuredComponent(circuit, meter.id);
    let current: number | null = null;
    if (seriesComp) {
      const r = dcResult.componentResults.get(seriesComp);
      if (r) current = r.current;
    }
    if (current === null && Number.isFinite(dcResult.totalCurrent)) {
      current = dcResult.totalCurrent;
    }
    if (current !== null && Number.isFinite(current)) {
      componentMeasurements.push({
        componentId: meter.id,
        type: 'ammeter',
        voltage: 0,
        current,
        power: 0,
      });
    }
  }

  // Virtual ohmmeter / power readings from Req and total power (instrument rail)
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
    totalVoltage = voltageSource.properties.voltage || 0;
  }

  return {
    totalVoltage,
    totalCurrent: dcResult.totalCurrent,
    totalPower: dcResult.totalPower,
    equivalentResistance: dcResult.equivalentResistance,
    componentMeasurements,
  };
}

/** Find a passive component that shares nets with a voltmeter (parallel). */
function findParallelMeasuredComponent(circuit: CircuitDefinition, meterId: string): string | null {
  const meter = circuit.components.find(c => c.id === meterId);
  if (!meter) return null;
  const meterTerms = new Set(meter.terminals.map(t => t.id));
  const meterConnections = circuit.connections.filter(
    c => meterTerms.has(c.from) || meterTerms.has(c.to)
  );
  const neighborTerms = new Set<string>();
  for (const conn of meterConnections) {
    neighborTerms.add(conn.from);
    neighborTerms.add(conn.to);
  }
  for (const comp of circuit.components) {
    if (comp.id === meterId) continue;
    if (!['resistor', 'capacitor', 'inductor', 'diode', 'led'].includes(comp.type)) continue;
    const terms = comp.terminals.map(t => t.id);
    if (terms.every(t => neighborTerms.has(t) || meterTerms.has(t))) {
      return comp.id;
    }
    const shared = terms.filter(t =>
      circuit.connections.some(conn =>
        (conn.from === t || conn.to === t) &&
        (meterTerms.has(conn.from) || meterTerms.has(conn.to) ||
          [...neighborTerms].some(n => n === conn.from || n === conn.to))
      )
    );
    if (shared.length >= 1) return comp.id;
  }
  return null;
}

/** Find a component in series with an ammeter (shares one net). */
function findSeriesMeasuredComponent(circuit: CircuitDefinition, meterId: string): string | null {
  const meter = circuit.components.find(c => c.id === meterId);
  if (!meter) return null;
  const meterTerms = new Set(meter.terminals.map(t => t.id));
  for (const conn of circuit.connections) {
    const other =
      meterTerms.has(conn.from) ? conn.to :
      meterTerms.has(conn.to) ? conn.from : null;
    if (!other) continue;
    const otherComp = circuit.components.find(c => c.terminals.some(t => t.id === other));
    if (otherComp && otherComp.id !== meterId &&
      ['resistor', 'capacitor', 'inductor', 'diode', 'led', 'voltage_source'].includes(otherComp.type)
    ) {
      return otherComp.id;
    }
  }
  return null;
}
