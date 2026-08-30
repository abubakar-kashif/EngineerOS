/**
 * Circuit Solver - Main Interface
 * Person 1: Simulation Engine
 * Orchestrates validation and solving
 */

import {
  CircuitDefinition,
} from './circuitGraph';

import {
  validateCircuit,
  ValidationResult,
} from './circuitValidator';

import {
  solveDC,
  DCResult,
} from './dcSolver';

import {
  SimulationResult,
  SimulationStatus,
} from './types';

// We'll define types here temporarily until Phase A9
export type SimulationStatus = 'idle' | 'ready' | 'running' | 'completed' | 'invalid' | 'failed';

export interface SimulationResult {
  status: SimulationStatus;
  validation?: ValidationResult;
  dcResult?: DCResult;
  error?: string;
  measurements?: Measurements;
}

export interface Measurements {
  totalVoltage: number;
  totalCurrent: number;
  totalPower: number;
  equivalentResistance: number;
  componentMeasurements: ComponentMeasurement[];
}

export interface ComponentMeasurement {
  componentId: string;
  type: string;
  voltage: number;
  current: number;
  power: number;
  resistance?: number;
}

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

    // Step 3: Generate measurements
    const measurements = generateMeasurements(circuit, dcResult);

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
 * Generate measurements from solver results
 */
function generateMeasurements(
  circuit: CircuitDefinition,
  dcResult: DCResult
): Measurements {
  const componentMeasurements: ComponentMeasurement[] = [];

  // Get measurements for each component
  for (const [id, result] of dcResult.componentResults) {
    const component = circuit.components.find(c => c.id === id);
    if (component) {
      componentMeasurements.push({
        componentId: id,
        type: component.type,
        voltage: result.voltage,
        current: result.current,
        power: result.power,
        resistance: result.resistance,
      });
    }
  }

  // Find voltage source for total voltage
  const voltageSource = circuit.components.find(c => c.type === 'voltage_source');
  const totalVoltage = voltageSource?.properties.voltage || 0;

  return {
    totalVoltage,
    totalCurrent: dcResult.totalCurrent,
    totalPower: dcResult.totalPower,
    equivalentResistance: dcResult.equivalentResistance,
    componentMeasurements,
  };
}