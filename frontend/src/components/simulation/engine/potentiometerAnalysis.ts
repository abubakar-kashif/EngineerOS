/**
 * Potentiometer / variable voltage-divider helpers from a real DC solve.
 */
import type { CircuitDefinition } from "./circuitGraph";
import type { DCResult } from "./dcSolver";
import { solveDC } from "./dcSolver";

export interface PotentiometerMetrics {
  potId: string;
  vin: number;
  rpot: number;
  wiperPosition: number;
  vout: number;
  theoreticalVout: number;
}

export function findPotentiometer(circuit: CircuitDefinition) {
  return circuit.components.find((c) => c.type === "potentiometer") ?? null;
}

export function extractPotentiometerMetrics(
  circuit: CircuitDefinition,
  dcResult: DCResult,
): PotentiometerMetrics | null {
  if (!dcResult.success) return null;
  const pot = findPotentiometer(circuit);
  if (!pot) return null;

  const rpot = pot.properties.resistance;
  const alphaRaw = pot.properties.wiperPosition;
  if (typeof rpot !== "number" || rpot <= 0) return null;
  const wiperPosition =
    typeof alphaRaw === "number" && Number.isFinite(alphaRaw)
      ? Math.min(1, Math.max(0, alphaRaw))
      : 0.5;

  const source = circuit.components.find((c) => c.type === "voltage_source");
  const srcResult = source ? dcResult.componentResults.get(source.id) : undefined;
  const vin =
    srcResult?.voltage ??
    (typeof source?.properties.voltage === "number" ? source.properties.voltage : null);
  if (vin == null || !Number.isFinite(vin)) return null;

  const potResult = dcResult.componentResults.get(pot.id);
  if (!potResult || !Number.isFinite(potResult.voltage)) return null;

  // Prefer voltmeter from wiper to ground/B if present.
  let vout = potResult.voltage;
  const vm = circuit.components.find((c) => c.type === "voltmeter");
  if (vm) {
    const vmResult = dcResult.componentResults.get(vm.id);
    if (vmResult && Number.isFinite(vmResult.voltage)) vout = vmResult.voltage;
  }

  return {
    potId: pot.id,
    vin,
    rpot,
    wiperPosition,
    vout,
    theoreticalVout: wiperPosition * vin,
  };
}

/** Sweep wiper α and re-solve for a real Vout vs position curve. */
export function potentiometerWiperSweep(
  circuit: CircuitDefinition,
  potId: string,
  points = 11,
): { alpha: number; vout: number }[] {
  const out: { alpha: number; vout: number }[] = [];
  for (let i = 0; i < points; i++) {
    const alpha = points === 1 ? 0.5 : i / (points - 1);
    const variant: CircuitDefinition = {
      ...circuit,
      components: circuit.components.map((c) =>
        c.id === potId
          ? { ...c, properties: { ...c.properties, wiperPosition: alpha } }
          : c,
      ),
    };
    const dc = solveDC(variant);
    if (!dc.success) continue;
    const metrics = extractPotentiometerMetrics(variant, dc);
    if (!metrics) continue;
    out.push({ alpha, vout: metrics.vout });
  }
  return out;
}
