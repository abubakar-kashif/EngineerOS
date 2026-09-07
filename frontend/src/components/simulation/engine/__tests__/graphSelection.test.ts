/**
 * Phase 2: graph options come from real SimulationRun data only.
 */
import { describe, expect, it } from "vitest";
import { solveCircuit } from "../circuitSolver";
import {
  generateGraphsFromMeasurements,
  graphHasRenderableData,
  listAvailableSignals,
  selectAvailableGraphs,
} from "../graphData";
import { displayableSimulationResult } from "../electricalSnapshot";
import { ohmsLaw, voltageDivider12V } from "./circuitFixtures";
import { createTerminalId, type CircuitDefinition } from "../circuitGraph";
import type { Measurements } from "../types";

describe("selectAvailableGraphs / real component filtering", () => {
  it("only exposes graphs backed by real measurement points", () => {
    const result = solveCircuit(ohmsLaw(5, 1000));
    expect(result.status).toBe("completed");
    const all = result.graphs ?? [];
    const available = selectAvailableGraphs(all);

    expect(available.every(graphHasRenderableData)).toBe(true);
    expect(available.some((g) => g.id === "ohms_law")).toBe(true);
    expect(available.some((g) => g.id === "voltage_divider")).toBe(false);
    expect(available.some((g) => g.id === "rc_time")).toBe(false);
    expect(available.some((g) => g.unavailableReason)).toBe(false);
  });

  it("keeps voltage-divider when R2 measurement exists", () => {
    const available = selectAvailableGraphs(solveCircuit(voltageDivider12V()).graphs);
    expect(available.some((g) => g.id === "voltage_divider")).toBe(true);
    expect(available.some((g) => g.id === "rc_time")).toBe(false);
  });

  it("names signals from circuit designators for production-style ids", () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: "comp_v1_internal",
          type: "voltage_source",
          label: "V1",
          position: { x: 0, y: 0 },
          rotation: 0,
          properties: { voltage: 5 },
          terminals: [
            {
              id: createTerminalId("comp_v1_internal", "positive"),
              type: "positive",
              componentId: "comp_v1_internal",
            },
            {
              id: createTerminalId("comp_v1_internal", "negative"),
              type: "negative",
              componentId: "comp_v1_internal",
            },
          ],
        },
        {
          id: "comp_r1_internal",
          type: "resistor",
          label: "R1",
          position: { x: 100, y: 0 },
          rotation: 0,
          properties: { resistance: 1000 },
          terminals: [
            {
              id: createTerminalId("comp_r1_internal", "A"),
              type: "A",
              componentId: "comp_r1_internal",
            },
            {
              id: createTerminalId("comp_r1_internal", "B"),
              type: "B",
              componentId: "comp_r1_internal",
            },
          ],
        },
      ],
      connections: [],
    };
    const measurements: Measurements = {
      totalVoltage: 5,
      totalCurrent: 0.005,
      totalPower: 0.025,
      equivalentResistance: 1000,
      componentMeasurements: [
        {
          componentId: "comp_r1_internal",
          type: "resistor",
          voltage: 5,
          current: 0.005,
          power: 0.025,
          resistance: 1000,
        },
        {
          componentId: "__ohmmeter__",
          type: "ohmmeter",
          voltage: 0,
          current: 0,
          power: 0,
        },
      ],
    };

    const signals = listAvailableSignals({ measurements }, circuit);
    expect(signals.some((s) => s.label === "Current — R1")).toBe(true);
    expect(signals.some((s) => s.id.includes("__ohmmeter__"))).toBe(false);

    const graphs = generateGraphsFromMeasurements(measurements, circuit);
    const available = selectAvailableGraphs(graphs);
    expect(available.length).toBeGreaterThan(0);
    expect(available.every((g) => !g.unavailableReason)).toBe(true);
  });

  it("distinguishes R1 and R2 signals", () => {
    const result = solveCircuit(voltageDivider12V());
    const signals = listAvailableSignals(result, voltageDivider12V());
    const labels = signals.map((s) => s.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Voltage — R1", "Voltage — R2", "Current — R1", "Current — R2"]),
    );
  });

  it("stale results are not displayable after the circuit changes", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    expect(displayableSimulationResult(result, circuit)).toBeTruthy();

    const mutated = {
      ...circuit,
      components: circuit.components.map((c) =>
        c.id === "R1"
          ? { ...c, properties: { ...c.properties, resistance: 2000 } }
          : c,
      ),
    };
    expect(displayableSimulationResult(result, mutated)).toBeNull();
  });

  it("rerun produces a fresh available graph set", () => {
    const first = solveCircuit(ohmsLaw(5, 1000));
    expect(first.status).toBe("completed");
    const firstIds = selectAvailableGraphs(first.graphs).map((g) => g.id).sort();

    const second = solveCircuit(ohmsLaw(5, 500));
    expect(second.status).toBe("completed");
    const secondIds = selectAvailableGraphs(second.graphs).map((g) => g.id).sort();
    expect(secondIds).toEqual(firstIds);
    expect(second.measurements!.totalCurrent).not.toBeCloseTo(first.measurements!.totalCurrent);
  });
});
