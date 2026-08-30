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
      };
    }

    // Step 3: Generate measurements directly from dcResult
    const measurements = generateMeasurementsFromDCResult(circuit, dcResult);

    return {
      status: 'completed',
      validation,
      dcResult,
      measurements,
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
 * Generate measurements directly from DC result
 */
function generateMeasurementsFromDCResult(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurements {
  const componentMeasurements: ComponentMeasurement[] = [];

  // Get all passive components
  const passiveComponents = circuit.components.filter(
    c => ['resistor', 'capacitor', 'inductor', 'diode', 'led'].includes(c.type)
  );

  // Add measurements for each passive component
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

  // Add voltage source
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  if (voltageSource) {
    const result = dcResult.componentResults.get(voltageSource.id);
    if (result) {
      componentMeasurements.push({
        componentId: voltageSource.id,
        type: voltageSource.type,
        voltage: result.voltage,
        current: result.current,
        power: result.power,
      });
    }
  }

  // Calculate total values
  let totalVoltage = 0;
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