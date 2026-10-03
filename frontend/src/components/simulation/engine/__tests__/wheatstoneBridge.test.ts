import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createWheatstoneBridgeStarter } from "../../starters/wheatstoneBridge";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import {
  extractWheatstoneMetrics,
  findWheatstoneArms,
} from "../wheatstoneAnalysis";
import { solveDC } from "../dcSolver";

describe("Wheatstone bridge starter + DC solve", () => {
  it("preloads a balanced bridge that solves with Vout ≈ 0", () => {
    const editor = createWheatstoneBridgeStarter();
    expect(editor.components.map((c) => c.id).sort()).toEqual(
      ["GND1", "R1", "R2", "R3", "R4", "V1", "VM1"].sort(),
    );

    const circuit = toEngineCircuit(editor);
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.dcResult?.success).toBe(true);

    const metrics = extractWheatstoneMetrics(circuit, result.dcResult!, result.measurements);
    expect(metrics).not.toBeNull();
    expect(metrics!.vin).toBeCloseTo(10, 6);
    expect(metrics!.vleft).toBeCloseTo(5, 3);
    expect(metrics!.vright).toBeCloseTo(5, 3);
    expect(metrics!.vout).toBeCloseTo(0, 3);
    expect(metrics!.balanced).toBe(true);
  });

  it("unbalances when R4 changes and emits wheatstone graphs from real solves", () => {
    const editor = createWheatstoneBridgeStarter();
    const r4 = editor.components.find((c) => c.id === "R4")!;
    r4.properties.resistance = 2000;

    const circuit = toEngineCircuit(editor);
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");

    const metrics = extractWheatstoneMetrics(circuit, result.dcResult!, result.measurements);
    expect(metrics).not.toBeNull();
    expect(metrics!.vleft).toBeCloseTo(5, 2);
    expect(metrics!.vright).toBeCloseTo(10 * (2000 / 3000), 2);
    expect(metrics!.vout).toBeCloseTo(metrics!.vleft - metrics!.vright, 3);
    expect(metrics!.balanced).toBe(false);

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    expect(graphs.some((g) => g.id === "wheatstone_bridge")).toBe(true);
    expect(graphs.some((g) => g.id === "wheatstone_bridge_nodes")).toBe(true);

    const sweep = graphs.find((g) => g.id === "wheatstone_bridge")!;
    expect(sweep.series[0].points.length).toBeGreaterThanOrEqual(2);
  });

  it("detects arms by designator labels", () => {
    const circuit = toEngineCircuit(createWheatstoneBridgeStarter());
    const arms = findWheatstoneArms(circuit);
    expect(arms).toEqual({
      r1Id: "R1",
      r2Id: "R2",
      r3Id: "R3",
      r4Id: "R4",
      sourceId: "V1",
      voltmeterId: "VM1",
    });
    expect(solveDC(circuit).success).toBe(true);
  });
});
