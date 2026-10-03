import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createSuperpositionTheoremStarter } from "../../starters/superpositionTheorem";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import {
  deactivateSourcesExcept,
  deactivatedCurrentSourceIsOpen,
  deactivatedVoltageSourceIsShort,
  extractSuperpositionMetrics,
} from "../superpositionAnalysis";
import { solveDC } from "../dcSolver";
import type { CircuitDefinition } from "../circuitGraph";
import { createTerminalId } from "../circuitGraph";

describe("Superposition theorem starter + DC solve", () => {
  it("preloads a two-source network that verifies VL_full ≈ VL1 + VL2", () => {
    const editor = createSuperpositionTheoremStarter();
    expect(editor.components.map((c) => c.id).sort()).toEqual(
      ["GND1", "R1", "R2", "RL", "V1", "V2", "VM1"].sort(),
    );

    const circuit = toEngineCircuit(editor);
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.dcResult?.success).toBe(true);

    const metrics = extractSuperpositionMetrics(circuit);
    expect(metrics).not.toBeNull();
    expect(metrics!.sources).toHaveLength(2);
    expect(metrics!.full.vout).toBeCloseTo(90 / 11, 2);
    expect(metrics!.contributions[0].vout + metrics!.contributions[1].vout).toBeCloseTo(
      metrics!.full.vout,
      3,
    );
    expect(metrics!.errorPercent).toBeLessThan(1);
  });

  it("deactivates voltage sources as shorts (0 V)", () => {
    const circuit = toEngineCircuit(createSuperpositionTheoremStarter());
    expect(deactivatedVoltageSourceIsShort(circuit, "V2")).toBe(true);

    const v1Only = deactivateSourcesExcept(circuit, new Set(["V1"]));
    const v2 = v1Only.components.find((c) => c.id === "V2")!;
    expect(v2.properties.voltage).toBe(0);

    const dc = solveDC(v1Only);
    expect(dc.success).toBe(true);
    const metrics = extractSuperpositionMetrics(circuit)!;
    const v1Contribution = metrics.contributions.find((c) =>
      c.activeSourceIds.includes("V1"),
    )!;
    expect(v1Contribution.vout).toBeCloseTo(72 / 11, 2);
  });

  it("deactivates current sources as opens (0 A)", () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: "I1",
          type: "current_source",
          label: "I1",
          position: { x: 0, y: 0 },
          rotation: 0,
          properties: { current: 0.01 },
          terminals: [
            { id: createTerminalId("I1", "positive"), type: "positive", componentId: "I1" },
            { id: createTerminalId("I1", "negative"), type: "negative", componentId: "I1" },
          ],
        },
        {
          id: "I2",
          type: "current_source",
          label: "I2",
          position: { x: 40, y: 0 },
          rotation: 0,
          properties: { current: 0.005 },
          terminals: [
            { id: createTerminalId("I2", "positive"), type: "positive", componentId: "I2" },
            { id: createTerminalId("I2", "negative"), type: "negative", componentId: "I2" },
          ],
        },
        {
          id: "RL",
          type: "resistor",
          label: "RL",
          position: { x: 80, y: 0 },
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            { id: createTerminalId("RL", "A"), type: "A", componentId: "RL" },
            { id: createTerminalId("RL", "B"), type: "B", componentId: "RL" },
          ],
        },
        {
          id: "GND1",
          type: "ground",
          label: "GND",
          position: { x: 120, y: 0 },
          rotation: 0,
          properties: {},
          terminals: [
            { id: createTerminalId("GND1", "ground"), type: "ground", componentId: "GND1" },
          ],
        },
      ],
      connections: [
        { id: "W1", from: createTerminalId("I1", "positive"), to: createTerminalId("RL", "A") },
        { id: "W2", from: createTerminalId("I2", "positive"), to: createTerminalId("RL", "A") },
        { id: "W3", from: createTerminalId("RL", "B"), to: createTerminalId("GND1", "ground") },
        { id: "W4", from: createTerminalId("I1", "negative"), to: createTerminalId("GND1", "ground") },
        { id: "W5", from: createTerminalId("I2", "negative"), to: createTerminalId("GND1", "ground") },
      ],
    };

    expect(deactivatedCurrentSourceIsOpen(circuit, "I2")).toBe(true);
    const i1Only = deactivateSourcesExcept(circuit, new Set(["I1"]));
    expect(i1Only.components.find((c) => c.id === "I2")!.properties.current).toBe(0);
  });

  it("emits a full vs contributions comparison graph", () => {
    const circuit = toEngineCircuit(createSuperpositionTheoremStarter());
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const graph = graphs.find((g) => g.id === "superposition_comparison");
    expect(graph).toBeDefined();
    expect(graph!.series[0].points.length).toBeGreaterThanOrEqual(4);
    expect(graph!.metadata?.errorPercent).toBeLessThan(1);
  });
});
