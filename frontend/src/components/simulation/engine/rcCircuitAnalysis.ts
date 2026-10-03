/**
 * RC charging / discharging analysis — real transient samples only.
 *
 * Charging:  Vc(t) = Vin (1 − e^(−t/τ)), τ = RC
 * Discharging: Vc(t) = V0 e^(−t/τ)
 *
 * Discharge mode (open charge switch): source forced to 0 V with the switch
 * closed for the solve so the R–C loop can evolve; V0 from capacitor IC
 * (defaults to the supply voltage when the cap was previously charged).
 */
import type { CircuitDefinition } from "./circuitGraph";
import { timeConstant } from "./capacitorAnalysis";
import type { Measurements, RcLabMeasurements, TimeSeriesSample } from "./types";

const EXP_NEG_1 = Math.exp(-1);

export type RcMode = "charging" | "discharging";
export type RcCircuitMetrics = RcLabMeasurements;

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

function readV0(circuit: CircuitDefinition): number {
  const c = circuit.components.find((c) => c.type === "capacitor");
  const v = c?.properties.initialVoltage;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function capacitorId(circuit: CircuitDefinition): string | null {
  return circuit.components.find((c) => c.type === "capacitor")?.id ?? null;
}

export function sampleVc(sample: TimeSeriesSample, capId: string): number {
  return (
    sample.values[`V_${capId}`] ??
    sample.values.vc ??
    sample.values.capacitorVoltage ??
    NaN
  );
}

export function sampleIc(sample: TimeSeriesSample, capId: string): number {
  return sample.values[`I_${capId}`] ?? NaN;
}

/** Infer charge vs discharge from switch / source / IC. */
export function detectRcMode(circuit: CircuitDefinition): RcMode {
  const closed = switchIsClosed(circuit);
  if (closed === false) return "discharging";
  const vin = readVin(circuit);
  const v0 = readV0(circuit);
  if (Number.isFinite(vin) && vin === 0 && v0 > 0) return "discharging";
  return "charging";
}

/**
 * Prepare a circuit for a transient solve in the detected mode.
 * Discharge keeps an R–C loop by zeroing the source and closing the switch.
 */
export function prepareRcTransientCircuit(circuit: CircuitDefinition): {
  circuit: CircuitDefinition;
  mode: RcMode;
  R: number;
  C: number;
  Vin: number;
  V0: number;
} {
  const mode = detectRcMode(circuit);
  const R = readR(circuit);
  const C = readC(circuit);
  const Vin = readVin(circuit);
  let V0 = readV0(circuit);

  if (mode === "discharging") {
    if (!(V0 > 0) && Number.isFinite(Vin) && Vin > 0) V0 = Vin;
    const next: CircuitDefinition = {
      ...circuit,
      components: circuit.components.map((comp) => {
        if (comp.type === "voltage_source") {
          return {
            ...comp,
            properties: { ...comp.properties, voltage: 0 },
          };
        }
        if (comp.type === "switch") {
          return {
            ...comp,
            properties: { ...comp.properties, state: "closed" },
          };
        }
        if (comp.type === "capacitor") {
          return {
            ...comp,
            properties: { ...comp.properties, initialVoltage: V0 },
          };
        }
        return comp;
      }),
    };
    return { circuit: next, mode, R, C, Vin: Number.isFinite(Vin) ? Vin : 0, V0 };
  }

  return {
    circuit,
    mode,
    R,
    C,
    Vin: Number.isFinite(Vin) ? Vin : 0,
    V0,
  };
}

/** First time Vc crosses `target` (linear interpolate). */
export function timeToVoltageCrossing(
  series: TimeSeriesSample[],
  capId: string,
  target: number,
  rising: boolean,
): number | null {
  if (series.length < 2 || !Number.isFinite(target)) return null;
  for (let i = 1; i < series.length; i++) {
    const y0 = sampleVc(series[i - 1], capId);
    const y1 = sampleVc(series[i], capId);
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;
    const crossed = rising
      ? y0 < target && y1 >= target
      : y0 > target && y1 <= target;
    if (!crossed) continue;
    const span = y1 - y0;
    if (Math.abs(span) < 1e-18) return series[i].t;
    const frac = (target - y0) / span;
    const t0 = series[i - 1].t;
    const t1 = series[i].t;
    return t0 + frac * (t1 - t0);
  }
  return null;
}

export function estimateTauFromSeries(
  series: TimeSeriesSample[],
  capId: string,
  mode: RcMode,
  Vin: number,
  V0: number,
): number | null {
  if (mode === "charging") {
    const final = Vin;
    const start = V0;
    const target = start + (final - start) * (1 - EXP_NEG_1);
    return timeToVoltageCrossing(series, capId, target, true);
  }
  const target = V0 * EXP_NEG_1;
  return timeToVoltageCrossing(series, capId, target, false);
}

export function extractRcCircuitMetrics(
  circuit: CircuitDefinition,
  measurements?: Measurements | null,
): RcCircuitMetrics | null {
  const prepared = prepareRcTransientCircuit(circuit);
  const { mode, R, C, Vin, V0 } = prepared;
  if (!(R > 0) || !(C > 0)) return null;

  const tauTheoretical = timeConstant(R, C);
  const series = measurements?.timeSeries;
  const capId = capacitorId(circuit);
  if (!series?.length || !capId) {
    return {
      mode,
      R,
      C,
      Vin,
      V0,
      tauTheoretical,
      tauSimulated: null,
      tauErrorPercent: null,
      time: 0,
      Vc: V0,
      Ic: 0,
      Ic0: 0,
      sampleCount: 0,
    };
  }

  const tauSimulated = estimateTauFromSeries(series, capId, mode, Vin, V0);
  let tauErrorPercent: number | null = null;
  if (tauSimulated != null && tauTheoretical > 0) {
    tauErrorPercent =
      (Math.abs(tauSimulated - tauTheoretical) / tauTheoretical) * 100;
  }

  const last = series[series.length - 1];
  const firstDyn = series.length > 1 ? series[1] : series[0];
  return {
    mode,
    R,
    C,
    Vin,
    V0,
    tauTheoretical,
    tauSimulated,
    tauErrorPercent,
    time: last.t,
    Vc: sampleVc(last, capId),
    Ic: sampleIc(last, capId),
    Ic0: sampleIc(firstDyn, capId),
    sampleCount: series.length,
  };
}
