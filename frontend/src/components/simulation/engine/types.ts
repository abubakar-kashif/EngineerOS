/**
 * Simulation Types
 * Person 1: Simulation Engine
 * Core types for simulation results - SINGLE SOURCE OF TRUTH
 */

import type { ValidationResult } from './errors';
import type { DCResult } from './dcSolver';
import type { GraphData } from './graphData';

export type SimulationStatus = 'idle' | 'ready' | 'running' | 'completed' | 'invalid' | 'failed';

export interface ComponentMeasurement {
  componentId: string;
  type: string;
  voltage: number;
  current: number;
  power: number;
  resistance?: number;
}

/** One sample from a real SimulationRun time series (never invented for DC). */
export interface TimeSeriesSample {
  t: number;
  values: Record<string, number>;
}

/** RC charging/discharging lab metrics (from real transient samples). */
export interface RcLabMeasurements {
  mode: "charging" | "discharging";
  R: number;
  C: number;
  Vin: number;
  V0: number;
  tauTheoretical: number;
  tauSimulated: number | null;
  tauErrorPercent: number | null;
  time: number;
  Vc: number;
  Ic: number;
  Ic0: number;
  sampleCount: number;
}

export interface Measurements {
  totalVoltage: number;
  totalCurrent: number;
  totalPower: number;
  equivalentResistance: number;
  componentMeasurements: ComponentMeasurement[];
  /** Present only when the run actually recorded time-domain samples. */
  timeSeries?: TimeSeriesSample[];
  /** Present for RC charge/discharge runs with dynamic elements. */
  rc?: RcLabMeasurements;
}

export interface SimulationResult {
  status: SimulationStatus;
  validation?: ValidationResult;
  dcResult?: DCResult;
  measurements?: Measurements;
  graphs?: GraphData[];
  error?: string;
  metadata?: Record<string, unknown>;
}