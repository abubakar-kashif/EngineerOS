/**
 * Thévenin's theorem metrics from a live DC solve of the loaded network.
 */
import type { CircuitDefinition } from "./circuitGraph";
import { extractPortEquivalentCore } from "./portEquivalentAnalysis";

export interface TheveninMetrics {
  loadId: string;
  rl: number;
  sourceVoltage: number | null;
  vth: number;
  rth: number;
  originalVL: number;
  originalIL: number;
  /** IL from Thévenin equivalent: Vth / (Rth + RL) */
  theveninIL: number;
  /** VL from Thévenin equivalent: IL * RL */
  theveninVL: number;
  differenceIL: number;
  errorPercentIL: number;
}

export function extractTheveninMetrics(
  circuit: CircuitDefinition,
): TheveninMetrics | null {
  const core = extractPortEquivalentCore(circuit);
  if (!core) return null;

  const theveninIL = core.vth / (core.rth + core.rl);
  const theveninVL = theveninIL * core.rl;
  const differenceIL = core.originalIL - theveninIL;
  const errorPercentIL =
    Math.abs(core.originalIL) < 1e-15
      ? Math.abs(differenceIL) < 1e-12
        ? 0
        : 100
      : (Math.abs(differenceIL) / Math.abs(core.originalIL)) * 100;

  return {
    loadId: core.loadId,
    rl: core.rl,
    sourceVoltage: core.sourceVoltage,
    vth: core.vth,
    rth: core.rth,
    originalVL: core.originalVL,
    originalIL: core.originalIL,
    theveninIL,
    theveninVL,
    differenceIL,
    errorPercentIL,
  };
}
