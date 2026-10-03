/**
 * Series resonance lab metrics from a real AC frequency sweep.
 * Bandwidth / Q only when both half-power flanks are found on the sweep.
 */

import type { CircuitDefinition } from './circuitGraph';
import { acSourceAmplitude } from './acSolver';
import type {
  FrequencyResponsePoint,
  FrequencySweepMetrics,
  FrequencySweepOptions,
} from './frequencySweepAnalysis';
import {
  inferFrequencySweepOptions,
  runFrequencySweep,
} from './frequencySweepAnalysis';
import type { SeriesResonanceLabMeasurements } from './types';

export function theoreticalSeriesResonanceHz(L: number, C: number): number {
  if (!(L > 0) || !(C > 0)) return NaN;
  return 1 / (2 * Math.PI * Math.sqrt(L * C));
}

function readRlcVin(circuit: CircuitDefinition): {
  R: number;
  L: number;
  C: number;
  Vin: number;
} | null {
  const R = circuit.components.find((c) => c.type === 'resistor')?.properties.resistance;
  const L = circuit.components.find((c) => c.type === 'inductor')?.properties.inductance;
  const C = circuit.components.find((c) => c.type === 'capacitor')?.properties.capacitance;
  const vs = circuit.components.find((c) => c.type === 'voltage_source');
  const Vin = acSourceAmplitude(vs?.properties ?? {});
  if (
    typeof R !== 'number' ||
    !(R > 0) ||
    typeof L !== 'number' ||
    !(L > 0) ||
    typeof C !== 'number' ||
    !(C > 0)
  ) {
    return null;
  }
  return { R, L, C, Vin };
}

/** Linear interpolate frequency where |I| crosses target between two samples. */
function interpolateCrossing(
  a: FrequencyResponsePoint,
  b: FrequencyResponsePoint,
  target: number,
): number | null {
  const ya = a.currentMag;
  const yb = b.currentMag;
  if ((ya - target) * (yb - target) > 0) return null;
  if (Math.abs(yb - ya) < 1e-18) return a.frequency;
  const t = (target - ya) / (yb - ya);
  return a.frequency + t * (b.frequency - a.frequency);
}

/**
 * Half-power bandwidth from |I|(f): find f1 < fpeak and f2 > fpeak where
 * |I| = Ipeak/√2. Returns nulls when either flank is missing.
 */
export function halfPowerFromSweep(sweep: FrequencySweepMetrics): {
  f1: number | null;
  f2: number | null;
  bandwidth: number | null;
  Q: number | null;
} {
  const peakF = sweep.peakCurrentFrequency;
  const peakI = sweep.peakCurrentMag;
  if (peakF == null || peakI == null || !(peakI > 0)) {
    return { f1: null, f2: null, bandwidth: null, Q: null };
  }
  const target = peakI / Math.SQRT2;
  const pts = sweep.response;
  let f1: number | null = null;
  let f2: number | null = null;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (b.frequency <= peakF) {
      const cross = interpolateCrossing(a, b, target);
      if (cross != null && cross <= peakF) f1 = cross;
    }
    if (a.frequency >= peakF) {
      const cross = interpolateCrossing(a, b, target);
      if (cross != null && cross >= peakF) {
        f2 = cross;
        break;
      }
    }
    // Segment straddling the peak: check both sides separately.
    if (a.frequency < peakF && b.frequency > peakF) {
      // Left half of segment toward peak uses a→peak synthetic; skip — denser grid preferred.
      void 0;
    }
  }

  // Second pass for f2 if peak is mid-grid: walk segments with a.frequency < peak < b only for f1 already handled.
  if (f2 == null) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (a.frequency < peakF && b.frequency <= peakF) continue;
      if (b.frequency < peakF) continue;
      const cross = interpolateCrossing(a, b, target);
      if (cross != null && cross >= peakF) {
        f2 = cross;
        break;
      }
    }
  }

  if (f1 == null || f2 == null || !(f2 > f1)) {
    return { f1, f2, bandwidth: null, Q: null };
  }
  const bandwidth = f2 - f1;
  const Q = bandwidth > 0 ? peakF / bandwidth : null;
  return { f1, f2, bandwidth, Q };
}

/** Denser log sweep around LC resonance for the series-resonance lab. */
export function seriesResonanceSweepOptions(
  circuit: CircuitDefinition,
): FrequencySweepOptions | null {
  const vals = readRlcVin(circuit);
  if (!vals) return inferFrequencySweepOptions(circuit);
  const f0 = theoreticalSeriesResonanceHz(vals.L, vals.C);
  if (!(f0 > 0)) return inferFrequencySweepOptions(circuit);
  return {
    fStart: f0 / 10,
    fStop: f0 * 10,
    points: 81,
    scale: 'log',
    probeId: circuit.components.find((c) => c.type === 'capacitor')?.id,
  };
}

export function extractSeriesResonanceMetrics(
  circuit: CircuitDefinition,
  sweep?: FrequencySweepMetrics | null,
): SeriesResonanceLabMeasurements | null {
  const vals = readRlcVin(circuit);
  if (!vals) return null;

  const f0Theoretical = theoreticalSeriesResonanceHz(vals.L, vals.C);
  const resolved =
    sweep ??
    runFrequencySweep(circuit, seriesResonanceSweepOptions(circuit) ?? true);
  if (!resolved || resolved.response.length < 3) return null;

  const f0Simulated = resolved.peakCurrentFrequency;
  const errorPercent =
    f0Simulated != null && f0Theoretical > 0
      ? (Math.abs(f0Simulated - f0Theoretical) / f0Theoretical) * 100
      : null;

  const hp = halfPowerFromSweep(resolved);

  return {
    R: vals.R,
    L: vals.L,
    C: vals.C,
    Vin: vals.Vin,
    fStart: resolved.fStart,
    fStop: resolved.fStop,
    points: resolved.points,
    step: resolved.step,
    scale: resolved.scale,
    f0Theoretical,
    f0Simulated,
    errorPercent,
    peakCurrentMag: resolved.peakCurrentMag,
    f1: hp.f1,
    f2: hp.f2,
    bandwidth: hp.bandwidth,
    Q: hp.Q,
    response: resolved.response,
  };
}
