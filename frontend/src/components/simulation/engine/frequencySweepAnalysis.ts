/**
 * Frequency sweep: frequency → circuit response from real AC phasor solves.
 * No hard-coded resonance curves — peaks come from the stamped R/L/C model.
 */

import type { CircuitDefinition } from './circuitGraph';
import {
  acSourceAmplitude,
  isAcVoltageSource,
  solveAC,
  type AcResult,
} from './acSolver';
import { cAbs, cArgDeg } from './complexLinearAlgebra';

export interface FrequencySweepOptions {
  /** Start frequency (Hz). */
  fStart: number;
  /** Stop frequency (Hz). */
  fStop: number;
  /** Number of points (used when `step` is omitted). Default 41. */
  points?: number;
  /** Linear frequency step / resolution (Hz). Takes precedence over `points`. */
  step?: number;
  /** Spacing when using `points`. Default 'log'. */
  scale?: 'log' | 'lin';
  /**
   * Component whose voltage magnitude is reported as Vout
   * (capacitor, voltmeter, resistor, …). Defaults to first C, else first VM.
   */
  probeId?: string;
}

export interface FrequencyResponsePoint {
  frequency: number;
  /** |Isource| peak (A). */
  currentMag: number;
  /** |Vsource| peak (V). */
  sourceVoltageMag: number;
  /** |Vprobe| peak (V). */
  voltageMag: number;
  /** |Zin| ≈ |Vs|/|Is| when Is ≠ 0. */
  impedanceMag: number;
  /** Voltage gain |Vout|/|Vin|. */
  gain: number;
  /** Phase of probe voltage relative to source (degrees). */
  phaseDeg: number;
}

export interface FrequencySweepMetrics {
  fStart: number;
  fStop: number;
  points: number;
  scale: 'log' | 'lin';
  step: number | null;
  amplitude: number;
  probeId: string | null;
  response: FrequencyResponsePoint[];
  /** Frequency of max |I| (series resonance proxy) from the sweep data. */
  peakCurrentFrequency: number | null;
  peakCurrentMag: number | null;
  /** Frequency of max |Vprobe| from the sweep data. */
  peakVoltageFrequency: number | null;
  peakVoltageMag: number | null;
}

/** Build frequency list from start/stop + points or step/resolution. */
export function buildFrequencyList(options: FrequencySweepOptions): number[] {
  const { fStart, fStop } = options;
  if (!(fStart > 0) || !(fStop > 0) || fStop < fStart) return [];

  if (typeof options.step === 'number' && options.step > 0) {
    const freqs: number[] = [];
    for (let f = fStart; f <= fStop + options.step * 1e-9; f += options.step) {
      freqs.push(f);
    }
    if (freqs.length === 0 || freqs[freqs.length - 1] < fStop * 0.999) {
      freqs.push(fStop);
    }
    return freqs;
  }

  const points = Math.max(2, Math.floor(options.points ?? 41));
  const scale = options.scale ?? 'log';
  const freqs: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = points === 1 ? 0 : i / (points - 1);
    if (scale === 'lin') {
      freqs.push(fStart + t * (fStop - fStart));
    } else {
      freqs.push(fStart * Math.pow(fStop / fStart, t));
    }
  }
  return freqs;
}

export function circuitHasAcSource(circuit: CircuitDefinition): boolean {
  return circuit.components.some(
    (c) => c.type === 'voltage_source' && isAcVoltageSource(c.properties),
  );
}

function findProbeId(circuit: CircuitDefinition, preferred?: string): string | null {
  if (preferred && circuit.components.some((c) => c.id === preferred)) {
    return preferred;
  }
  const cap = circuit.components.find((c) => c.type === 'capacitor');
  if (cap) return cap.id;
  const vm = circuit.components.find((c) => c.type === 'voltmeter');
  if (vm) return vm.id;
  const r = circuit.components.find((c) => c.type === 'resistor');
  return r?.id ?? null;
}

function readLc(circuit: CircuitDefinition): { L: number; C: number } | null {
  const L = circuit.components.find((c) => c.type === 'inductor')?.properties.inductance;
  const C = circuit.components.find((c) => c.type === 'capacitor')?.properties.capacitance;
  if (typeof L === 'number' && L > 0 && typeof C === 'number' && C > 0) {
    return { L, C };
  }
  return null;
}

/**
 * Infer a sensible sweep window from the AC source and/or series LC resonance.
 * Resonance is derived from circuit L·C — never a fixed constant.
 */
export function inferFrequencySweepOptions(
  circuit: CircuitDefinition,
): FrequencySweepOptions | null {
  const src = circuit.components.find(
    (c) => c.type === 'voltage_source' && isAcVoltageSource(c.properties),
  );
  const lc = readLc(circuit);
  let center: number | null = null;
  if (lc) {
    center = 1 / (2 * Math.PI * Math.sqrt(lc.L * lc.C));
  } else if (src && typeof src.properties.frequency === 'number') {
    center = src.properties.frequency;
  }
  if (!center || !(center > 0)) return null;

  return {
    fStart: center / 10,
    fStop: center * 10,
    points: 41,
    scale: 'log',
    probeId: findProbeId(circuit) ?? undefined,
  };
}

function pointFromSolve(
  ac: AcResult,
  probeId: string | null,
): FrequencyResponsePoint | null {
  if (!ac.success) return null;
  const vin = cAbs(ac.sourceVoltage);
  const iMag = cAbs(ac.sourceCurrent);
  let vMag = vin;
  let phaseDeg = 0;
  if (probeId) {
    const probe = ac.componentResults.get(probeId);
    if (probe) {
      vMag = probe.voltageMag;
      phaseDeg = probe.voltagePhaseDeg - cArgDeg(ac.sourceVoltage);
      while (phaseDeg > 180) phaseDeg -= 360;
      while (phaseDeg <= -180) phaseDeg += 360;
    }
  }
  const zin = iMag > 1e-18 ? vin / iMag : Number.POSITIVE_INFINITY;
  return {
    frequency: ac.frequency,
    currentMag: iMag,
    sourceVoltageMag: vin,
    voltageMag: vMag,
    impedanceMag: zin,
    gain: vin > 1e-18 ? vMag / vin : 0,
    phaseDeg,
  };
}

/**
 * Run frequency → response using the actual AC circuit model at each frequency.
 */
export function runFrequencySweep(
  circuit: CircuitDefinition,
  options?: FrequencySweepOptions | boolean,
): FrequencySweepMetrics | null {
  const resolved =
    options && typeof options === 'object'
      ? options
      : inferFrequencySweepOptions(circuit);
  if (!resolved) return null;

  const freqs = buildFrequencyList(resolved);
  if (freqs.length < 2) return null;

  const probeId = findProbeId(circuit, resolved.probeId);
  const src = circuit.components.find((c) => c.type === 'voltage_source');
  const amplitude = acSourceAmplitude(src?.properties ?? {});

  const response: FrequencyResponsePoint[] = [];
  for (const f of freqs) {
    const ac = solveAC(circuit, { frequency: f });
    const pt = pointFromSolve(ac, probeId);
    if (pt) response.push(pt);
  }
  if (response.length < 2) return null;

  let peakI = response[0];
  let peakV = response[0];
  for (const p of response) {
    if (p.currentMag > peakI.currentMag) peakI = p;
    if (p.voltageMag > peakV.voltageMag) peakV = p;
  }

  const step =
    typeof resolved.step === 'number' && resolved.step > 0 ? resolved.step : null;

  return {
    fStart: resolved.fStart,
    fStop: resolved.fStop,
    points: response.length,
    scale: resolved.scale ?? 'log',
    step,
    amplitude,
    probeId,
    response,
    peakCurrentFrequency: peakI.frequency,
    peakCurrentMag: peakI.currentMag,
    peakVoltageFrequency: peakV.frequency,
    peakVoltageMag: peakV.voltageMag,
  };
}

/** Convenience: extract metrics when the circuit has an AC source (or options given). */
export function extractFrequencySweepMetrics(
  circuit: CircuitDefinition,
  options?: FrequencySweepOptions | boolean,
): FrequencySweepMetrics | null {
  if (options === false) return null;
  if (options === true || (options && typeof options === 'object')) {
    return runFrequencySweep(circuit, options === true ? undefined : options);
  }
  if (!circuitHasAcSource(circuit) && !readLc(circuit)) return null;
  return runFrequencySweep(circuit, true);
}
