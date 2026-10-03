import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createNortonTheoremStarter } from "../../starters/nortonTheorem";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import { extractNortonMetrics } from "../nortonAnalysis";

describe("Norton theorem starter + DC solve", () => {
  it("finds IN≈6 mA, RN≈1 kΩ and matches original IL", () => {
    const circuit = toEngineCircuit(createNortonTheoremStarter());
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");

    const metrics = extractNortonMetrics(circuit);
    expect(metrics).not.toBeNull();
    expect(metrics!.inorton).toBeCloseTo(0.006, 3);
    expect(metrics!.rn).toBeCloseTo(1000, 0);
    expect(metrics!.nortonIL).toBeCloseTo(0.002, 4);
    expect(metrics!.originalIL).toBeCloseTo(metrics!.nortonIL, 3);
    expect(metrics!.errorPercentIL).toBeLessThan(2);
  });

  it("keeps IN/RN when RL changes", () => {
    const editor = createNortonTheoremStarter();
    const rl = editor.components.find((c) => c.id === "RL")!;
    rl.properties.resistance = 4000;
    const circuit = toEngineCircuit(editor);
    const metrics = extractNortonMetrics(circuit)!;
    expect(metrics.inorton).toBeCloseTo(0.006, 3);
    expect(metrics.rn).toBeCloseTo(1000, 0);
    expect(metrics.nortonIL).toBeCloseTo(0.006 * 1000 / 5000, 4);
    expect(metrics.originalIL).toBeCloseTo(metrics.nortonIL, 3);
  });

  it("emits original vs Norton comparison graph", () => {
    const circuit = toEngineCircuit(createNortonTheoremStarter());
    circuit.experimentId = "norton-theorem";
    const result = solveCircuit(circuit);
    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const graph = graphs.find((g) => g.id === "norton_comparison");
    expect(graph).toBeDefined();
    expect(graph!.metadata?.inorton).toBeCloseTo(0.006, 2);
    expect(graphs.some((g) => g.id === "thevenin_comparison")).toBe(false);
  });
});
