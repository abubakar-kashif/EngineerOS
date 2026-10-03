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

/** RL transient lab metrics (from real transient samples). */
export interface RlLabMeasurements {
  mode: "energizing" | "deenergizing";
  R: number;
  L: number;
  Vin: number;
  I0: number;
  /** Steady-state current Vin/R when energizing; 0 when de-energizing. */
  Ifinal: number;
  tauTheoretical: number;
  tauSimulated: number | null;
  tauErrorPercent: number | null;
  time: number;
  iL: number;
  vR: number;
  sampleCount: number;
}

/**
 * Series RLC lab metrics — only values from the circuit props + time series.
 * No fabricated Q, bandwidth, or damping ratio.
 */
export interface RlcLabMeasurements {
  R: number;
  L: number;
  C: number;
  Vin: number;
  time: number;
  i: number;
  Vc: number;
  iPeak: number;
  vcPeak: number;
  /** ½ L i² at the last sample. */
  energyL: number;
  /** ½ C Vc² at the last sample. */
  energyC: number;
  /** Observed current zero-crossings in the recorded window. */
  zeroCrossings: number;
  sampleCount: number;
  duration: number;
  timeStep: number;
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
  /** Present for RL transient runs with an inductor. */
  rl?: RlLabMeasurements;
  /** Present for series RLC transient runs. */
  rlc?: RlcLabMeasurements;
  /** Present when an AC frequency sweep was run on the circuit model. */
  frequencySweep?: FrequencySweepLabMeasurements;
  /** Present for the series-resonance lab (driven AC + sweep). */
  seriesResonance?: SeriesResonanceLabMeasurements;
  /** Present for half-wave rectifier (AC + diode transient). */
  halfWaveRectifier?: HalfWaveRectifierLabMeasurements;
}

/** Half-wave rectifier lab — metrics from a real AC+diode time series. */
export interface HalfWaveRectifierLabMeasurements {
  VinAmplitude: number;
  VinPeak: number;
  VoutPeak: number;
  /** Configured (or measured) input frequency (Hz). */
  inputFrequency: number | null;
  inputFrequencyMeasured: number | null;
  /** Output pulse / ripple frequency from the waveform (Hz). */
  rippleFrequency: number | null;
  averageOutput: number;
  forwardVoltage: number;
  RL: number;
  sampleCount: number;
  duration: number;
}

/** Series resonance lab — f0 from sweep; BW/Q only when half-power flanks exist. */
export interface SeriesResonanceLabMeasurements {
  R: number;
  L: number;
  C: number;
  Vin: number;
  fStart: number;
  fStop: number;
  points: number;
  step: number | null;
  scale: 'log' | 'lin';
  f0Theoretical: number;
  f0Simulated: number | null;
  errorPercent: number | null;
  peakCurrentMag: number | null;
  /** Lower half-power frequency (Hz), or null if not found on the sweep. */
  f1: number | null;
  /** Upper half-power frequency (Hz), or null if not found on the sweep. */
  f2: number | null;
  bandwidth: number | null;
  Q: number | null;
  response: FrequencyResponseSample[];
}

/** Frequency-response samples from real AC phasor solves (not hard-coded curves). */
export interface FrequencyResponseSample {
  frequency: number;
  currentMag: number;
  sourceVoltageMag: number;
  voltageMag: number;
  impedanceMag: number;
  gain: number;
  phaseDeg: number;
}

export interface FrequencySweepLabMeasurements {
  fStart: number;
  fStop: number;
  points: number;
  scale: 'log' | 'lin';
  step: number | null;
  amplitude: number;
  probeId: string | null;
  response: FrequencyResponseSample[];
  peakCurrentFrequency: number | null;
  peakCurrentMag: number | null;
  peakVoltageFrequency: number | null;
  peakVoltageMag: number | null;
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