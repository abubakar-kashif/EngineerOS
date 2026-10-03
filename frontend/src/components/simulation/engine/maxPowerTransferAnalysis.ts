/**
 * Maximum power transfer: Thévenin port + real RL sweep of PL = VL·IL.
 */
import type { CircuitDefinition } from "./circuitGraph";
import { solveDC } from "./dcSolver";
import { extractPortEquivalentCore } from "./portEquivalentAnalysis";

export interface MaxPowerSweepPoint {
  rl: number;
  vl: number;
  il: number;
  pl: number;
}

export interface MaxPowerTransferMetrics {
  loadId: string;
  rl: number;
  vth: number;
  rth: number;
  vl: number;
  il: number;
  pl: number;
  theoreticalOptimumRl: number;
  theoreticalMaxPower: number;
  simulatedOptimumRl: number;
  simulatedMaxPower: number;
  sweep: MaxPowerSweepPoint[];
}

function withLoadResistance(
  circuit: CircuitDefinition,
  loadId: string,
  resistance: number,
): CircuitDefinition {
  return {
    ...circuit,
    components: circuit.components.map((c) =>
      c.id === loadId
        ? { ...c, properties: { ...c.properties, resistance } }
        : c,
    ),
  };
}

function readLoadPower(
  circuit: CircuitDefinition,
  loadId: string,
): { vl: number; il: number; pl: number } | null {
  const dc = solveDC(circuit);
  if (!dc.success) return null;
  const load = dc.componentResults.get(loadId);
  if (!load || !Number.isFinite(load.voltage) || !Number.isFinite(load.current)) {
    return null;
  }
  let vl = load.voltage;
  const vm = circuit.components.find((c) => c.type === "voltmeter");
  if (vm) {
    const vmResult = dc.componentResults.get(vm.id);
    if (vmResult && Number.isFinite(vmResult.voltage)) vl = vmResult.voltage;
  }
  const il = Math.abs(load.current);
  return { vl, il, pl: Math.abs(vl * il) };
}

/** Log-ish sweep around Rth (and always include Rth and the operating RL). */
export function buildLoadSweepValues(rth: number, operatingRl: number, points = 21): number[] {
  const values = new Set<number>();
  const lo = Math.max(rth / 20, 1);
  const hi = Math.max(rth * 20, operatingRl * 2, 10);
  for (let i = 0; i < points; i++) {
    const t = points === 1 ? 0 : i / (points - 1);
    values.add(lo * Math.pow(hi / lo, t));
  }
  values.add(rth);
  values.add(operatingRl);
  return [...values].sort((a, b) => a - b);
}

export function extractMaxPowerTransferMetrics(
  circuit: CircuitDefinition,
): MaxPowerTransferMetrics | null {
  const core = extractPortEquivalentCore(circuit);
  if (!core || !(core.rth > 0)) return null;

  const operating = readLoadPower(circuit, core.loadId);
  if (!operating) return null;

  const sweepValues = buildLoadSweepValues(core.rth, core.rl, 21);
  const sweep: MaxPowerSweepPoint[] = [];
  for (const rl of sweepValues) {
    const variant = withLoadResistance(circuit, core.loadId, rl);
    const q = readLoadPower(variant, core.loadId);
    if (!q) continue;
    sweep.push({ rl, vl: q.vl, il: q.il, pl: q.pl });
  }
  if (sweep.length < 3) return null;

  let best = sweep[0];
  for (const p of sweep) {
    if (p.pl > best.pl) best = p;
  }

  const theoreticalOptimumRl = core.rth;
  const theoreticalMaxPower = (core.vth * core.vth) / (4 * core.rth);

  return {
    loadId: core.loadId,
    rl: core.rl,
    vth: core.vth,
    rth: core.rth,
    vl: operating.vl,
    il: operating.il,
    pl: operating.pl,
    theoreticalOptimumRl,
    theoreticalMaxPower,
    simulatedOptimumRl: best.rl,
    simulatedMaxPower: best.pl,
    sweep,
  };
}
