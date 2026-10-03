/**
 * Wheatstone bridge detection and metrics from a real DC solve.
 * Does not invent measurements — only derives labeled quantities from solver output.
 */
import type { CircuitDefinition } from "./circuitGraph";
import type { DCResult } from "./dcSolver";
import { solveDC } from "./dcSolver";
import type { Measurements } from "./types";

export interface WheatstoneArms {
  r1Id: string;
  r2Id: string;
  r3Id: string;
  r4Id: string;
  sourceId: string;
  voltmeterId?: string;
}

export interface WheatstoneMetrics {
  vin: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  vleft: number;
  vright: number;
  vout: number;
  ratioLeft: number;
  ratioRight: number;
  balanced: boolean;
  arms: WheatstoneArms;
}

function resistanceOf(circuit: CircuitDefinition, id: string): number | null {
  const c = circuit.components.find((x) => x.id === id);
  const r = c?.properties?.resistance;
  return typeof r === "number" && Number.isFinite(r) && r > 0 ? r : null;
}

function labelOf(circuit: CircuitDefinition, id: string): string {
  const c = circuit.components.find((x) => x.id === id);
  return (c?.label || id).trim();
}

/** Prefer designators R1–R4; otherwise first four resistors by id. */
export function findWheatstoneArms(circuit: CircuitDefinition): WheatstoneArms | null {
  const resistors = circuit.components.filter((c) => c.type === "resistor");
  if (resistors.length < 4) return null;

  const byLabel = (name: string) =>
    resistors.find((c) => c.id === name || labelOf(circuit, c.id) === name);

  const r1 = byLabel("R1");
  const r2 = byLabel("R2");
  const r3 = byLabel("R3");
  const r4 = byLabel("R4");
  if (!r1 || !r2 || !r3 || !r4) return null;

  const source = circuit.components.find((c) => c.type === "voltage_source");
  if (!source) return null;

  const voltmeter = circuit.components.find((c) => c.type === "voltmeter");

  return {
    r1Id: r1.id,
    r2Id: r2.id,
    r3Id: r3.id,
    r4Id: r4.id,
    sourceId: source.id,
    voltmeterId: voltmeter?.id,
  };
}

/**
 * Extract bridge voltages from a completed DC solve.
 * Vleft ≈ voltage across R2 (bottom-left), Vright ≈ across R4 (bottom-right),
 * Vout from voltmeter when present, else Vleft − Vright.
 */
export function extractWheatstoneMetrics(
  circuit: CircuitDefinition,
  dcResult: DCResult,
  measurements?: Measurements,
): WheatstoneMetrics | null {
  if (!dcResult.success) return null;
  const arms = findWheatstoneArms(circuit);
  if (!arms) return null;

  const r1 = resistanceOf(circuit, arms.r1Id);
  const r2 = resistanceOf(circuit, arms.r2Id);
  const r3 = resistanceOf(circuit, arms.r3Id);
  const r4 = resistanceOf(circuit, arms.r4Id);
  if (r1 == null || r2 == null || r3 == null || r4 == null) return null;

  const src = dcResult.componentResults.get(arms.sourceId);
  const vin =
    src?.voltage ??
    circuit.components.find((c) => c.id === arms.sourceId)?.properties.voltage ??
    null;
  if (vin == null || !Number.isFinite(vin)) return null;

  const vR2 = dcResult.componentResults.get(arms.r2Id)?.voltage;
  const vR4 = dcResult.componentResults.get(arms.r4Id)?.voltage;
  if (vR2 == null || vR4 == null || !Number.isFinite(vR2) || !Number.isFinite(vR4)) {
    return null;
  }

  let vout: number | null = null;
  if (arms.voltmeterId) {
    const vm = dcResult.componentResults.get(arms.voltmeterId);
    if (vm && Number.isFinite(vm.voltage)) vout = vm.voltage;
    else {
      const cm = measurements?.componentMeasurements.find(
        (m) => m.componentId === arms.voltmeterId,
      );
      if (cm && Number.isFinite(cm.voltage)) vout = cm.voltage;
    }
  }
  if (vout == null) vout = vR2 - vR4;

  const ratioLeft = r1 / r2;
  const ratioRight = r3 / r4;
  const balanced = Math.abs(ratioLeft - ratioRight) < 1e-6 && Math.abs(vout) < 1e-6;

  return {
    vin,
    r1,
    r2,
    r3,
    r4,
    vleft: vR2,
    vright: vR4,
    vout,
    ratioLeft,
    ratioRight,
    balanced,
    arms,
  };
}

/**
 * Sweep R4 across a range and re-solve to produce real Vout vs ratio points.
 * Uses the live circuit's Vin/R1/R2/R3; only R4 is varied.
 */
export function wheatstoneRatioSweep(
  circuit: CircuitDefinition,
  arms: WheatstoneArms,
  points = 11,
): { ratio: number; vout: number; r4: number }[] {
  const baseR4 = resistanceOf(circuit, arms.r4Id) ?? 1000;
  const r1 = resistanceOf(circuit, arms.r1Id);
  const r2 = resistanceOf(circuit, arms.r2Id);
  if (r1 == null || r2 == null) return [];

  const minR = Math.max(baseR4 * 0.25, 100);
  const maxR = baseR4 * 4;
  const out: { ratio: number; vout: number; r4: number }[] = [];

  for (let i = 0; i < points; i++) {
    const t = points === 1 ? 0 : i / (points - 1);
    const r4 = minR + t * (maxR - minR);
    const variant: CircuitDefinition = {
      ...circuit,
      components: circuit.components.map((c) =>
        c.id === arms.r4Id
          ? { ...c, properties: { ...c.properties, resistance: r4 } }
          : c,
      ),
    };
    const dc = solveDC(variant);
    if (!dc.success) continue;
    const metrics = extractWheatstoneMetrics(variant, dc);
    if (!metrics) continue;
    out.push({
      ratio: r1 / r2, // left ratio fixed; x-axis uses R3/R4 for sensitivity
      vout: metrics.vout,
      r4,
    });
  }

  // Prefer x = R3/R4 (right ratio) which changes with the sweep.
  return out.map((p) => {
    const r3 = resistanceOf(circuit, arms.r3Id) ?? 1000;
    return { ratio: r3 / p.r4, vout: p.vout, r4: p.r4 };
  });
}
