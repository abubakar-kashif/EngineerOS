/**
 * Simulation Types
 * Person 1: Simulation Engine
 * Core types for simulation results
 */

import { ValidationResult } from './errors';
import { DCResult } from './dcSolver';

export type SimulationStatus = 'idle' | 'ready' | 'running' | 'completed' | 'invalid' | 'failed';

export interface ComponentMeasurement {
  componentId: string;
  type: string;
  voltage: number;
  current: number;
  power: number;
  resistance?: number;
}

export interface Measurements {
  totalVoltage: number;
  totalCurrent: number;
  totalPower: number;
  equivalentResistance: number;
  componentMeasurements: ComponentMeasurement[];
}

export interface SimulationResult {
  status: SimulationStatus;
  validation?: ValidationResult;
  dcResult?: DCResult;
  measurements?: Measurements;
  error?: string;
}