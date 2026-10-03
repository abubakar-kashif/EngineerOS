/**
 * Series RC low-pass filter.
 *
 *   Vin(sine) ── R ── Vout ── C ── GND
 *
 * Cutoff theory is fc = 1/(2πRC). Simulated cutoff is the sweep frequency
 * where the AC solve's |Vout|/|Vin| crosses 1/√2. Nothing here draws a Bode
 * curve that the solver did not produce.
 */
import type { CircuitDefinition } from './circuitGraph';
import type { FrequencySweepMetrics, FrequencySweepOptions } from './frequencySweepAnalysis';
import type { RcLowPassLabMeasurements } from './types';
import type { TransientOptions } from './transientSolver';

export const RC_LOW_PASS_EXPERIMENT_ID = 'rc-low-pass-filter';

const HALF_POWER_GAIN = 1 / Math.sqrt(2);

export function theoreticalRcCutoffHz(resistance: number, capacitance: number): number {
  return 1 / (2 * Math.PI * resistance * capacitance);
}

export function theoreticalRcLowPassGain(frequency: number, cutoffHz: number): number {
  if (!(cutoffHz > 0) || !(frequency >= 0)) return 0;
  const ratio = frequency / cutoffHz;
  return 1 / Math.sqrt(1 + ratio * ratio);
}

export function theoreticalRcLowPassPhaseDeg(frequency: number, cutoffHz: number): number {
  if (!(cutoffHz > 0) || !(frequency >= 0)) return 0;
  return (-Math.atan2(frequency, cutoffHz) * 180) / Math.PI;
}

interface RcParts {
  R: number;
  C: number;
  Vin: number;
  frequency: number;
  capacitorId: string;
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function readRcLowPassParts(circuit: CircuitDefinition): RcParts | null {
  const resistor = circuit.components.find((c) => c.type === 'resistor');
  const capacitor = circuit.components.find((c) => c.type === 'capacitor');
  const source = circuit.components.find(
    (c) => c.type === 'voltage_source' && c.properties.acMode === true,
  );
  if (!resistor || !capacitor || !source) return null;
  if (circuit.components.some((c) => c.type === 'inductor' || c.type === 'diode' || c.type === 'led')) {
    return null;
  }
  const R = resistor.properties.resistance;
  const C = capacitor.properties.capacitance;
  const amplitude = source.properties.amplitude ?? source.properties.voltage;
  const frequency = source.properties.frequency;
  if (!finitePositive(R) || !finitePositive(C) || !finitePositive(amplitude)) return null;
  if (typeof frequency !== 'number' || !Number.isFinite(frequency) || frequency < 0) return null;
  return { R, C, Vin: amplitude, frequency, capacitorId: capacitor.id };
}

export function rcLowPassSweepOptions(
  circuit: CircuitDefinition,
): FrequencySweepOptions | null {
  const parts = readRcLowPassParts(circuit);
  if (!parts) return null;
  const fc = theoreticalRcCutoffHz(parts.R, parts.C);
  if (!(fc > 0)) return null;
  return {
    fStart: fc / 20,
    fStop: fc * 20,
    points: 61,
    scale: 'log',
    probeId: parts.capacitorId,
  };
}

/** A few cycles of the drive, and at least several time constants, for the scope. */
export function rcLowPassScopeOptions(circuit: CircuitDefinition): TransientOptions {
  const parts = readRcLowPassParts(circuit);
  const frequency = parts && parts.frequency > 0 ? parts.frequency : 500;
  const tau = parts ? parts.R * parts.C : 1e-3;
  const duration = Math.max(4 / frequency, 8 * tau);
  return { duration, timeStep: duration / 400, t0: 0 };
}

function logInterpolateFrequency(
  f0: number,
  g0: number,
  f1: number,
  g1: number,
  target: number,
): number {
  const span = g1 - g0;
  const t = span === 0 ? 0 : (target - g0) / span;
  const logF = Math.log(f0) + t * (Math.log(f1) - Math.log(f0));
  return Math.exp(logF);
}

function simulatedCutoffHz(sweep: FrequencySweepMetrics): number | null {
  const points = sweep.response;
  for (let i = 1; i < points.length; i += 1) {
    const left = points[i - 1];
    const right = points[i];
    if (!left || !right) continue;
    const crosses =
      (left.gain - HALF_POWER_GAIN) * (right.gain - HALF_POWER_GAIN) <= 0 &&
      left.gain !== right.gain;
    if (!crosses) continue;
    if (!(left.frequency > 0) || !(right.frequency > 0)) continue;
    return logInterpolateFrequency(
      left.frequency,
      left.gain,
      right.frequency,
      right.gain,
      HALF_POWER_GAIN,
    );
  }
  return null;
}

function gainAndPhaseAt(
  sweep: FrequencySweepMetrics,
  frequency: number,
): { gain: number; phaseDeg: number } | null {
  const points = sweep.response;
  if (points.length === 0 || !(frequency > 0)) return null;
  let best = points[0];
  let bestDistance = Math.abs(Math.log(best.frequency) - Math.log(frequency));
  for (const point of points) {
    if (!(point.frequency > 0)) continue;
    const distance = Math.abs(Math.log(point.frequency) - Math.log(frequency));
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return { gain: best.gain, phaseDeg: best.phaseDeg };
}

export function extractRcLowPassMetrics(
  circuit: CircuitDefinition,
  sweep?: FrequencySweepMetrics | null,
): RcLowPassLabMeasurements | null {
  const parts = readRcLowPassParts(circuit);
  if (!parts || !sweep || sweep.response.length < 3) return null;
  const fcTheoretical = theoreticalRcCutoffHz(parts.R, parts.C);
  const atDrive = parts.frequency > 0 ? gainAndPhaseAt(sweep, parts.frequency) : null;
  const gainAtDrive = atDrive?.gain ?? null;
  const attenuationDbAtDrive =
    gainAtDrive != null && gainAtDrive > 0 ? 20 * Math.log10(gainAtDrive) : null;
  return {
    R: parts.R,
    C: parts.C,
    Vin: parts.Vin,
    driveFrequency: parts.frequency,
    fcTheoretical,
    fcSimulated: simulatedCutoffHz(sweep),
    gainAtDrive,
    phaseAtDriveDeg: atDrive?.phaseDeg ?? null,
    attenuationDbAtDrive,
    fStart: sweep.fStart,
    fStop: sweep.fStop,
    points: sweep.points,
    scale: sweep.scale,
  };
}
