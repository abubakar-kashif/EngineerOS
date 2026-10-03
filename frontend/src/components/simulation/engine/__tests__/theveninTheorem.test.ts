import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createTheveninTheoremStarter } from "../../starters/theveninTheorem";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import { extractTheveninMetrics } from "../theveninAnalysis";
import { extractPortEquivalentCore } from "../portEquivalentAnalysis";

describe("Thévenin theorem starter + DC solve", () => {
  it("finds Vth≈6 V, Rth≈1 kΩ and matches original IL", () => {
    const circuit = toEngineCircuit(createTheveninTheoremStarter());
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");

    const metrics = extractTheveninMetrics(circuit);
    expect(metrics).not.toBeNull();
    expect(metrics!.vth).toBeCloseTo(6, 2);
    expect(metrics!.rth).toBeCloseTo(1000, 0);
    expect(metrics!.theveninIL).toBeCloseTo(0.002, 4);
    expect(metrics!.originalIL).toBeCloseTo(metrics!.theveninIL, 3);
    expect(metrics!.errorPercentIL).toBeLessThan(2);
  });

  it("keeps Vth/Rth when RL changes", () => {
    const editor = createTheveninTheoremStarter();
    const rl = editor.components.find((c) => c.id === "RL")!;
    rl.properties.resistance = 4000;
    const circuit = toEngineCircuit(editor);
    const metrics = extractTheveninMetrics(circuit)!;
    expect(metrics.vth).toBeCloseTo(6, 2);
    expect(metrics.rth).toBeCloseTo(1000, 0);
    expect(metrics.theveninIL).toBeCloseTo(6 / 5000, 4);
    expect(metrics.originalIL).toBeCloseTo(metrics.theveninIL, 3);
  });

  it("exposes Voc/Isc core used by Thévenin", () => {
    const core = extractPortEquivalentCore(toEngineCircuit(createTheveninTheoremStarter()));
    expect(core).not.toBeNull();
    expect(core!.voc).toBeCloseTo(6, 2);
    expect(core!.isc).toBeCloseTo(0.006, 3);
  });

  it("emits original vs Thévenin comparison graph", () => {
    const circuit = toEngineCircuit(createTheveninTheoremStarter());
    const result = solveCircuit(circuit);
    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const graph = graphs.find((g) => g.id === "thevenin_comparison");
    expect(graph).toBeDefined();
    expect(graph!.metadata?.vth).toBeCloseTo(6, 1);
  });
});
