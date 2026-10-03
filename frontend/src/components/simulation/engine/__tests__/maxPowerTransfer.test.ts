import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createMaxPowerTransferStarter } from "../../starters/maxPowerTransfer";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import { extractMaxPowerTransferMetrics } from "../maxPowerTransferAnalysis";

describe("Maximum power transfer starter + RL sweep", () => {
  it("finds Vth≈6 V, Rth≈1 kΩ and Pmax≈9 mW at RL=Rth", () => {
    const circuit = toEngineCircuit(createMaxPowerTransferStarter());
    circuit.experimentId = "maximum-power-transfer";
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");

    const metrics = extractMaxPowerTransferMetrics(circuit);
    expect(metrics).not.toBeNull();
    expect(metrics!.vth).toBeCloseTo(6, 2);
    expect(metrics!.rth).toBeCloseTo(1000, 0);
    expect(metrics!.theoreticalOptimumRl).toBeCloseTo(1000, 0);
    expect(metrics!.theoreticalMaxPower).toBeCloseTo(0.009, 4);
    expect(metrics!.simulatedOptimumRl).toBeCloseTo(1000, 0);
    expect(metrics!.simulatedMaxPower).toBeCloseTo(0.009, 3);
    expect(metrics!.sweep.length).toBeGreaterThanOrEqual(5);
  });

  it("shows operating RL=500 Ω below Pmax", () => {
    const circuit = toEngineCircuit(createMaxPowerTransferStarter());
    const metrics = extractMaxPowerTransferMetrics(circuit)!;
    expect(metrics.rl).toBe(500);
    expect(metrics.pl).toBeLessThan(metrics.theoreticalMaxPower);
  });

  it("emits RL vs PL sweep graph from real solves", () => {
    const circuit = toEngineCircuit(createMaxPowerTransferStarter());
    circuit.experimentId = "maximum-power-transfer";
    const result = solveCircuit(circuit);
    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const graph = graphs.find((g) => g.id === "max_power_transfer");
    expect(graph).toBeDefined();
    expect(graph!.series[0].points.length).toBeGreaterThanOrEqual(5);
    expect(graph!.metadata?.theoreticalMaxPower).toBeCloseTo(0.009, 3);
    expect(graphs.some((g) => g.id === "thevenin_comparison")).toBe(false);
    expect(graphs.some((g) => g.id === "norton_comparison")).toBe(false);
  });
});
