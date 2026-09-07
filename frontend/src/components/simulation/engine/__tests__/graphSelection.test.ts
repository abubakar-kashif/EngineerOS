/**
 * Graph selector uses the current SimulationRun + live circuit only.
 */
import { describe, expect, it } from "vitest";
import { solveCircuit } from "../circuitSolver";
import { displayableSimulationResult } from "../electricalSnapshot";
import {
  generateGraphsFromMeasurements,
  getGraphById,
  listAvailableSignals,
  selectableGraphs,
} from "../graphData";
import { createTerminalId, type CircuitDefinition } from "../circuitGraph";
import { ohmsLaw, openCircuitMissingReturn, series5VTwo1k, seriesDiode } from "./circuitFixtures";

function labeledInternalIds(): CircuitDefinition {
  return {
    components: [
      {
        id: "comp_a",
        type: "voltage_source",
        label: "V1",
        position: { x: 0, y: 0 },
        rotation: 0,
        properties: { voltage: 5 },
        terminals: [
          { id: createTerminalId("comp_a", "positive"), type: "positive", componentId: "comp_a" },
          { id: createTerminalId("comp_a", "negative"), type: "negative", componentId: "comp_a" },
        ],
      },
      {
        id: "comp_b",
        type: "resistor",
        label: "R1",
        position: { x: 80, y: 0 },
        rotation: 0,
        properties: { resistance: 1000 },
        terminals: [
          { id: createTerminalId("comp_b", "A"), type: "A", componentId: "comp_b" },
          { id: createTerminalId("comp_b", "B"), type: "B", componentId: "comp_b" },
        ],
      },
      {
        id: "comp_g",
        type: "ground",
        label: "GND1",
        position: { x: 160, y: 0 },
        rotation: 0,
        properties: {},
        terminals: [
          { id: createTerminalId("comp_g", "ground"), type: "ground", componentId: "comp_g" },
        ],
      },
    ],
    connections: [
      { id: "W1", from: createTerminalId("comp_a", "positive"), to: createTerminalId("comp_b", "A") },
      { id: "W2", from: createTerminalId("comp_b", "B"), to: createTerminalId("comp_g", "ground") },
      { id: "W3", from: createTerminalId("comp_a", "negative"), to: createTerminalId("comp_g", "ground") },
    ],
  };
}

describe("graph data selection from the current run", () => {
  it("exposes signals for V1/R1/GND1 measurements and not for absent R2/C1/D1", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    const signals = listAvailableSignals(result, circuit);
    const ids = signals.map((s) => s.id);

    expect(ids).toContain("V_R1");
    expect(ids).toContain("I_R1");
    expect(ids).not.toContain("I_R2");
    expect(ids).not.toContain("V_C1");
    expect(ids).not.toContain("I_D1");
    expect(ids).not.toContain("I_LED1");

    const graphs = selectableGraphs(result.graphs);
    expect(graphs.some((g) => g.id === "ohms_law")).toBe(true);
    expect(graphs.some((g) => g.id === "voltage_divider")).toBe(false);
    expect(graphs.every((g) => g.series.some((s) => s.points.length > 0))).toBe(true);
  });

  it("exposes R1 and R2 when both have real measurements", () => {
    const circuit = series5VTwo1k();
    const result = solveCircuit(circuit);
    const signals = listAvailableSignals(result, circuit);
    expect(signals.find((s) => s.id === "I_R1")?.label).toBe("I(R1)");
    expect(signals.find((s) => s.id === "I_R2")?.label).toBe("I(R2)");
    expect(getGraphById(selectableGraphs(result.graphs), "voltage_divider")).toBeTruthy();
  });

  it("does not synthesize an R2 signal when only R1 was measured", () => {
    const circuit = series5VTwo1k();
    const result = solveCircuit(circuit);
    const partial = {
      ...result.measurements!,
      componentMeasurements: result.measurements!.componentMeasurements.filter(
        (cm) => cm.componentId !== "R2",
      ),
    };
    const signals = listAvailableSignals({ measurements: partial }, circuit);
    expect(signals.some((s) => s.id === "I_R1")).toBe(true);
    expect(signals.some((s) => s.id === "I_R2")).toBe(false);
    const graphs = generateGraphsFromMeasurements(partial, circuit);
    const currentLabels = getGraphById(graphs, "current_signals")?.metadata?.labels as string[];
    expect(currentLabels).toEqual(["I(R1)", "ΣI"]);
  });

  it("returns no signals and no selectable graphs without a SimulationRun", () => {
    expect(listAvailableSignals(null, ohmsLaw(5, 1000))).toEqual([]);
    expect(selectableGraphs(undefined)).toEqual([]);
    expect(selectableGraphs([])).toEqual([]);
  });

  it("does not treat a stale run as current graph data", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    const edited = ohmsLaw(12, 1000);
    expect(displayableSimulationResult(result, edited)).toBeNull();
    expect(selectableGraphs(displayableSimulationResult(result, edited)?.graphs)).toEqual([]);
  });

  it("does not expose graphable measurements for invalid or failed runs", () => {
    const invalid = solveCircuit(openCircuitMissingReturn());
    expect(invalid.status).toBe("invalid");
    expect(invalid.measurements).toBeUndefined();
    expect(selectableGraphs(invalid.graphs)).toEqual([]);
    expect(listAvailableSignals(invalid, openCircuitMissingReturn())).toEqual([]);
  });

  it("uses circuit labels R1/R2 on graph-facing signals while keeping internal ids", () => {
    const circuit = labeledInternalIds();
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    const signals = listAvailableSignals(result, circuit);
    expect(signals.find((s) => s.id === "I_comp_b")?.label).toBe("I(R1)");
    expect(signals.some((s) => s.label.includes("comp_"))).toBe(false);
  });

  it("does not create catalog graph signals for diode/LED/C1 when those parts are absent", () => {
    const graphs = selectableGraphs(solveCircuit(ohmsLaw(5, 1000)).graphs);
    const ids = graphs.map((g) => g.id);
    expect(ids).not.toContain("voltage_divider");
    expect(ids).not.toContain("rc_time");
    expect(ids).not.toContain("power_time");
    expect(graphs.some((g) => /diode|LED|C1/i.test(g.title))).toBe(false);

    const withDiode = selectableGraphs(solveCircuit(seriesDiode()).graphs);
    const dropLabels = getGraphById(withDiode, "component_voltages")?.metadata?.labels as string[];
    expect(dropLabels).toEqual(expect.arrayContaining(["R1", "D1"]));
  });
});
