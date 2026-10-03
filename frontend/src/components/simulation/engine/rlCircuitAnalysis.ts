/**
 * RL transient analysis — real BE companion samples only.
 *
 * Energizing: i(t) = (Vin/R)(1 − e^(−t/τ)), τ = L/R
 * De-energizing (open charge switch): Vin→0 with iL(0)=Vin/R on a closed R–L loop.
 */
import type { CircuitDefinition } from "./circuitGraph";
import { timeConstantRL } from "./inductorAnalysis";
import type { Measurements, RlLabMeasurements, TimeSeriesSample } from "./types";

const EXP_NEG_1 = Math.exp(-1);

export type RlMode = "energizing" | "deenergizing";
export type RlCircuitMetrics = RlLabMeasurements;

function switchIsClosed(circuit: CircuitDefinition): boolean | null {
  const sw = circuit.components.find((c) => c.type === "switch");
  if (!sw) return null;
  if (sw.properties.state === "open") return false;
  if (sw.properties.state === "closed") return true;
  if (typeof sw.properties.closed === "boolean") return sw.properties.closed;
  return null;
}

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

function readVin(circuit: CircuitDefinition): number {
  const vs = circuit.components.find((c) => c.type === "voltage_source");
  const v = vs?.properties.voltage;
  return typeof v === "number" && Number.isFinite(v) ? v : NaN;
}

function readI0(circuit: CircuitDefinition): number {
  const l = circuit.components.find((c) => c.type === "inductor");
  const v = l?.properties.initialCurrent;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function inductorId(circuit: CircuitDefinition): string | null {
  return circuit.components.find((c) => c.type === "inductor")?.id ?? null;
}

function resistorId(circuit: CircuitDefinition): string | null {
  return circuit.components.find((c) => c.type === "resistor")?.id ?? null;
}

export function sampleIl(sample: TimeSeriesSample, indId: string): number {
  return sample.values[`I_${indId}`] ?? NaN;
}

export function sampleVr(sample: TimeSeriesSample, resId: string): number {
  return sample.values[`V_${resId}`] ?? NaN;
}

export function detectRlMode(circuit: CircuitDefinition): RlMode {
  const closed = switchIsClosed(circuit);
  if (closed === false) return "deenergizing";
  const vin = readVin(circuit);
  const i0 = readI0(circuit);
  if (Number.isFinite(vin) && vin === 0 && i0 > 0) return "deenergizing";
  return "energizing";
}

export function prepareRlTransientCircuit(circuit: CircuitDefinition): {
  circuit: CircuitDefinition;
  mode: RlMode;
  R: number;
  L: number;
  Vin: number;
  I0: number;
} {
  const mode = detectRlMode(circuit);
  const R = readR(circuit);
  const L = readL(circuit);
  const Vin = readVin(circuit);
  let I0 = readI0(circuit);

  if (mode === "deenergizing") {
    if (!(I0 > 0) && Number.isFinite(Vin) && Vin > 0 && R > 0) {
      I0 = Vin / R;
    }
    const next: CircuitDefinition = {
      ...circuit,
      components: circuit.components.map((comp) => {
        if (comp.type === "voltage_source") {
          return { ...comp, properties: { ...comp.properties, voltage: 0 } };
        }
        if (comp.type === "switch") {
          return { ...comp, properties: { ...comp.properties, state: "closed" } };
        }
        if (comp.type === "inductor") {
          return {
            ...comp,
            properties: { ...comp.properties, initialCurrent: I0 },
          };
        }
        return comp;
      }),
    };
    return { circuit: next, mode, R, L, Vin: Number.isFinite(Vin) ? Vin : 0, I0 };
  }

  return {
    circuit,
    mode,
    R,
    L,
    Vin: Number.isFinite(Vin) ? Vin : 0,
    I0,
  };
}

export function timeToCurrentCrossing(
  series: TimeSeriesSample[],
  indId: string,
  target: number,
  rising: boolean,
): number | null {
  if (series.length < 2 || !Number.isFinite(target)) return null;
  for (let i = 1; i < series.length; i++) {
    const y0 = sampleIl(series[i - 1], indId);
    const y1 = sampleIl(series[i], indId);
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;
    const crossed = rising
      ? y0 < target && y1 >= target
      : y0 > target && y1 <= target;
    if (!crossed) continue;
    const span = y1 - y0;
    if (Math.abs(span) < 1e-18) return series[i].t;
    const frac = (target - y0) / span;
    return series[i - 1].t + frac * (series[i].t - series[i - 1].t);
  }
  return null;
}

function estimateRlTauFromSeries(
  series: TimeSeriesSample[],
  indId: string,
  mode: RlMode,
  Vin: number,
  R: number,
  I0: number,
): number | null {
  if (mode === "energizing") {
    const Ifinal = R > 0 ? Vin / R : 0;
    const target = I0 + (Ifinal - I0) * (1 - EXP_NEG_1);
    return timeToCurrentCrossing(series, indId, target, true);
  }
  const target = I0 * EXP_NEG_1;
  return timeToCurrentCrossing(series, indId, target, false);
}

export function extractRlCircuitMetrics(
  circuit: CircuitDefinition,
  measurements?: Measurements | null,
): RlCircuitMetrics | null {
  const prepared = prepareRlTransientCircuit(circuit);
  const { mode, R, L, Vin, I0 } = prepared;
  if (!(R > 0) || !(L > 0)) return null;

  const tauTheoretical = timeConstantRL(L, R);
  const series = measurements?.timeSeries;
  const indId = inductorId(circuit);
  const resId = resistorId(circuit);
  const Ifinal = R > 0 ? Vin / R : 0;

  if (!series?.length || !indId) {
    return {
      mode,
      R,
      L,
      Vin,
      I0,
      Ifinal,
      tauTheoretical,
      tauSimulated: null,
      tauErrorPercent: null,
      time: 0,
      iL: I0,
      vR: 0,
      sampleCount: 0,
    };
  }

  const tauSimulated = estimateRlTauFromSeries(series, indId, mode, Vin, R, I0);
  let tauErrorPercent: number | null = null;
  if (tauSimulated != null && tauTheoretical > 0 && Number.isFinite(tauTheoretical)) {
    tauErrorPercent =
      (Math.abs(tauSimulated - tauTheoretical) / tauTheoretical) * 100;
  }

  const last = series[series.length - 1];
  return {
    mode,
    R,
    L,
    Vin,
    I0,
    Ifinal: mode === "energizing" ? Ifinal : 0,
    tauTheoretical,
    tauSimulated,
    tauErrorPercent,
    time: last.t,
    iL: sampleIl(last, indId),
    vR: resId ? sampleVr(last, resId) : NaN,
    sampleCount: series.length,
  };
}
