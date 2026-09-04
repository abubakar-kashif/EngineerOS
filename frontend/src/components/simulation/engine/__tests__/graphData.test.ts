/**
 * Graph data from SimulationRun measurements — no synthetic sweeps.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  buildGraphFromSignals,
  generateAllGraphs,
  generateGraphsFromMeasurements,
  getGraphById,
  listAvailableSignals,
  validateGraphData,
} from "../graphData";
import type { CircuitDefinition } from "../circuitGraph";
import { createTerminalId } from "../circuitGraph";
import { solveCircuit } from "../circuitSolver";
import type { Measurements } from "../types";

describe("measurement-based graph data", () => {
  let circuit: CircuitDefinition;
  let measurements: Measurements;

  beforeEach(() => {
    circuit = {
      components: [
        {
          id: "V1",
          type: "voltage_source",
          label: "V1",
          position: { x: 0, y: 0 },
          rotation: 0,
          properties: { voltage: 5 },
          terminals: [
            { id: createTerminalId("V1", "positive"), type: "positive", componentId: "V1" },
            { id: createTerminalId("V1", "negative"), type: "negative", componentId: "V1" },
          ],
        },
        {
          id: "R1",
          type: "resistor",
          label: "R1",
          position: { x: 100, y: 0 },
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            { id: createTerminalId("R1", "A"), type: "A", componentId: "R1" },
            { id: createTerminalId("R1", "B"), type: "B", componentId: "R1" },
          ],
        },
        {
          id: "R2",
          type: "resistor",
          label: "R2",
          position: { x: 100, y: 50 },
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            { id: createTerminalId("R2", "A"), type: "A", componentId: "R2" },
            { id: createTerminalId("R2", "B"), type: "B", componentId: "R2" },
          ],
        },
        {
          id: "GND1",
          type: "ground",
          label: "GND",
          position: { x: 200, y: 0 },
          rotation: 0,
          properties: {},
          terminals: [
            { id: createTerminalId("GND1", "ground"), type: "ground", componentId: "GND1" },
          ],
        },
      ],
      connections: [
        { id: "W1", from: createTerminalId("V1", "positive"), to: createTerminalId("R1", "A") },
        { id: "W2", from: createTerminalId("V1", "positive"), to: createTerminalId("R2", "A") },
        { id: "W3", from: createTerminalId("R1", "B"), to: createTerminalId("GND1", "ground") },
        { id: "W4", from: createTerminalId("R2", "B"), to: createTerminalId("GND1", "ground") },
      ],
    };

    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    measurements = result.measurements!;
  });

  it("lists real signals (Vs, I1, V_R1) not experiment names", () => {
    const signals = listAvailableSignals({ measurements }, circuit);
    const ids = signals.map((s) => s.id);
    expect(ids).toContain("Vs");
    expect(ids).toContain("ΣI");
    expect(ids).toContain("V_R1");
    expect(ids).toContain("I_R1");
    expect(ids).not.toContain("kvl");
    expect(ids).not.toContain("kcl");
    expect(ids).not.toContain("ohms_law");

    const time = signals.find((s) => s.id === "time");
    expect(time?.available).toBe(false);
    expect(time?.unavailableReason).toMatch(/time-series/i);
  });

  it("builds default graphs from measurements only", () => {
    const graphs = generateGraphsFromMeasurements(measurements, circuit);
    expect(graphs.length).toBeGreaterThan(0);
    expect(graphs.every((g) => g.metadata?.source === "measurements")).toBe(true);
    expect(graphs.some((g) => /KVL|KCL|Ohm/i.test(g.title))).toBe(false);

    const voltages = getGraphById(graphs, "component_voltages");
    expect(voltages).toBeTruthy();
    expect(voltages!.series[0].points.length).toBe(measurements.componentMeasurements.length);
    expect(validateGraphData(voltages!)).toBe(true);

    const currents = getGraphById(graphs, "current_signals");
    expect(currents?.metadata?.labels).toEqual(
      expect.arrayContaining(["I1", "I2", "ΣI"]),
    );
  });

  it("does not invent Ohm/RC time sweeps via generateAllGraphs without measurements", () => {
    expect(generateAllGraphs(circuit, { success: true, nodeVoltages: new Map(), componentResults: new Map() } as never)).toEqual([]);
  });

  it("refuses current-vs-time when no time series exists", () => {
    const built = buildGraphFromSignals(measurements, "time", ["I_R1"], circuit);
    expect(built.graph).toBeNull();
    expect(built.unavailableReason).toMatch(/No current-vs-time data is available/i);
  });

  it("builds custom V vs Component from available signals", () => {
    const built = buildGraphFromSignals(measurements, "index", ["V_R1"], circuit);
    expect(built.unavailableReason).toBeUndefined();
    expect(built.graph?.type).toBe("bar");
    expect(built.graph?.series[0].points.length).toBeGreaterThan(0);
  });

  it("solveCircuit attaches measurement graphs not synthetic ohms_law id", () => {
    const result = solveCircuit(circuit);
    expect(result.graphs?.some((g) => g.id === "ohms_law")).toBe(false);
    expect(result.graphs?.some((g) => g.id === "rc_charging")).toBe(false);
    expect(result.graphs?.some((g) => g.id === "component_voltages")).toBe(true);
    expect(result.graphs?.every((g) => g.metadata?.source === "measurements")).toBe(true);
  });
});
