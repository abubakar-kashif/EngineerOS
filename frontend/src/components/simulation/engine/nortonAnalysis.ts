/**
 * Norton's theorem metrics from a live DC solve of the loaded network.
 */
import type { CircuitDefinition } from "./circuitGraph";
import { extractPortEquivalentCore } from "./portEquivalentAnalysis";

export interface NortonMetrics {
  loadId: string;
  rl: number;
  sourceVoltage: number | null;
  inorton: number;
  rn: number;
  originalVL: number;
  originalIL: number;
  /** IL from Norton equivalent: IN · RN / (RN + RL) */
  nortonIL: number;
  nortonVL: number;
  differenceIL: number;
  errorPercentIL: number;
}

export function extractNortonMetrics(circuit: CircuitDefinition): NortonMetrics | null {
  const core = extractPortEquivalentCore(circuit);
  if (!core) return null;

  const nortonIL = (core.inorton * core.rn) / (core.rn + core.rl);
  const nortonVL = nortonIL * core.rl;
  const differenceIL = core.originalIL - nortonIL;
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
    inorton: core.inorton,
    rn: core.rn,
    originalVL: core.originalVL,
    originalIL: core.originalIL,
    nortonIL,
    nortonVL,
    differenceIL,
    errorPercentIL,
  };
}
