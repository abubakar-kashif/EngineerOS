/**
 * Series RLC transient metrics — only quantities taken from the real solve.
 *
 * Does not invent Q, bandwidth, or damping ratio. Catalog theory may discuss
 * those concepts; the report lists measured waveform statistics only.
 */
import type { CircuitDefinition } from "./circuitGraph";
import type { Measurements, RlcLabMeasurements, TimeSeriesSample } from "./types";

function readR(circuit: CircuitDefinition): number {
  const r = circuit.components.find((c) => c.type === "resistor");
  const v = r?.properties.resistance;
  return typeof v === "number" && v > 0 ? v : NaN;
}

function readL(circuit: CircuitDefinition): number {
  const l = circuit.components.find((c) => c.type === "inductor");
  const v = l?.properties.inductance;
  return typeof v === "number" && v > 0 ? v : NaN;
}

function readC(circuit: CircuitDefinition): number {
  const c = circuit.components.find((c) => c.type === "capacitor");
  const v = c?.properties.capacitance;
  return typeof v === "number" && v > 0 ? v : NaN;
}

function readVin(circuit: CircuitDefinition): number {
  const vs = circuit.components.find((c) => c.type === "voltage_source");
  const v = vs?.properties.voltage;
  return typeof v === "number" && Number.isFinite(v) ? v : NaN;
}

function inductorId(circuit: CircuitDefinition): string | null {
  return circuit.components.find((c) => c.type === "inductor")?.id ?? null;
}

function capacitorId(circuit: CircuitDefinition): string | null {
  return circuit.components.find((c) => c.type === "capacitor")?.id ?? null;
}

export function circuitIsSeriesRlc(circuit: CircuitDefinition): boolean {
  return (
    circuit.components.some((c) => c.type === "resistor") &&
    circuit.components.some((c) => c.type === "inductor") &&
    circuit.components.some((c) => c.type === "capacitor")
  );
}

function sampleI(series: TimeSeriesSample, indId: string): number {
  return series.values[`I_${indId}`] ?? NaN;
}

function sampleVc(series: TimeSeriesSample, capId: string): number {
  return (
    series.values[`V_${capId}`] ??
    series.values.vc ??
    series.values.capacitorVoltage ??
    NaN
  );
}

/** Count sign changes of series current (observed oscillation indicator). */
export function countCurrentZeroCrossings(
  series: TimeSeriesSample[],
  indId: string,
): number {
  let count = 0;
  let prev: number | null = null;
  for (const s of series) {
    const i = sampleI(s, indId);
    if (!Number.isFinite(i)) continue;
    if (prev != null && prev !== 0 && i !== 0 && Math.sign(prev) !== Math.sign(i)) {
      count += 1;
    }
    if (i !== 0) prev = i;
  }
  return count;
}

export function extractRlcCircuitMetrics(
  circuit: CircuitDefinition,
  measurements?: Measurements | null,
  transientMeta?: { duration?: number; timeStep?: number } | null,
): RlcLabMeasurements | null {
  if (!circuitIsSeriesRlc(circuit)) return null;

  const R = readR(circuit);
  const L = readL(circuit);
  const C = readC(circuit);
  const Vin = readVin(circuit);
  if (!(R > 0) || !(L > 0) || !(C > 0)) return null;

  const indId = inductorId(circuit);
  const capId = capacitorId(circuit);
  const series = measurements?.timeSeries;
  if (!series?.length || !indId || !capId) {
    return {
      R,
      L,
      C,
      Vin: Number.isFinite(Vin) ? Vin : 0,
      time: 0,
      i: 0,
      Vc: 0,
      iPeak: 0,
      vcPeak: 0,
      energyL: 0,
      energyC: 0,
      zeroCrossings: 0,
      sampleCount: 0,
      duration: transientMeta?.duration ?? 0,
      timeStep: transientMeta?.timeStep ?? 0,
    };
  }

  let iPeak = 0;
  let vcPeak = 0;
  for (const s of series) {
    const i = sampleI(s, indId);
    const vc = sampleVc(s, capId);
    if (Number.isFinite(i)) iPeak = Math.max(iPeak, Math.abs(i));
    if (Number.isFinite(vc)) vcPeak = Math.max(vcPeak, Math.abs(vc));
  }

  const last = series[series.length - 1];
  const i = sampleI(last, indId);
  const Vc = sampleVc(last, capId);
  const energyL = Number.isFinite(i) ? 0.5 * L * i * i : 0;
  const energyC = Number.isFinite(Vc) ? 0.5 * C * Vc * Vc : 0;

  return {
    R,
    L,
    C,
    Vin: Number.isFinite(Vin) ? Vin : 0,
    time: last.t,
    i: Number.isFinite(i) ? i : 0,
    Vc: Number.isFinite(Vc) ? Vc : 0,
    iPeak,
    vcPeak,
    energyL,
    energyC,
    zeroCrossings: countCurrentZeroCrossings(series, indId),
    sampleCount: series.length,
    duration: transientMeta?.duration ?? last.t,
    timeStep: transientMeta?.timeStep ?? 0,
  };
}
