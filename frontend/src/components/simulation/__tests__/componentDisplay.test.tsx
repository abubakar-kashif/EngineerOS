/**
 * User-facing simulation component references (Phase 5).
 * Internal ids stay on topology/measurements; UI uses circuit labels.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  UNKNOWN_COMPONENT_LABEL,
  labelForComponent,
  listAvailableSignals,
} from "../engine/graphData";
import type { CircuitDefinition } from "../engine/circuitGraph";
import { createTerminalId } from "../engine/circuitGraph";
import MeasurementsPanel from "../MeasurementsPanel";
import type { SimulationResult } from "../engine/types";

function circuitWithIds(): CircuitDefinition {
  return {
    components: [
      {
        id: "comp_abc",
        type: "resistor",
        label: "R1",
        position: { x: 0, y: 0 },
        rotation: 0,
        properties: { resistance: 1000 },
        terminals: [
          { id: createTerminalId("comp_abc", "A"), type: "A", componentId: "comp_abc" },
          { id: createTerminalId("comp_abc", "B"), type: "B", componentId: "comp_abc" },
        ],
      },
      {
        id: "comp_def",
        type: "resistor",
        label: "R2",
        position: { x: 40, y: 0 },
        rotation: 0,
        properties: { resistance: 2000 },
        terminals: [
          { id: createTerminalId("comp_def", "A"), type: "A", componentId: "comp_def" },
          { id: createTerminalId("comp_def", "B"), type: "B", componentId: "comp_def" },
        ],
      },
      {
        id: "comp_cap",
        type: "capacitor",
        label: "C1",
        position: { x: 80, y: 0 },
        rotation: 0,
        properties: { capacitance: 1e-6 },
        terminals: [
          { id: createTerminalId("comp_cap", "A"), type: "A", componentId: "comp_cap" },
          { id: createTerminalId("comp_cap", "B"), type: "B", componentId: "comp_cap" },
        ],
      },
    ],
    connections: [],
  };
}

function completedResult(): SimulationResult {
  return {
    status: "completed",
    measurements: {
      totalVoltage: 5,
      totalCurrent: 0.005,
      totalPower: 0.025,
      equivalentResistance: 1000,
      componentMeasurements: [
        {
          componentId: "comp_abc",
          type: "resistor",
          voltage: 5,
          current: 0.005,
          power: 0.025,
          resistance: 1000,
        },
        {
          componentId: "comp_missing",
          type: "resistor",
          voltage: 1,
          current: 0.001,
          power: 0.001,
          resistance: 1000,
        },
      ],
    },
  };
}

describe("user-facing component references", () => {
  it("resolves measurement componentId to the circuit label R1", () => {
    const circuit = circuitWithIds();
    expect(labelForComponent(circuit, "comp_abc", "resistor")).toBe("R1");
    expect(labelForComponent(circuit, "comp_abc", "resistor")).not.toBe("comp_abc");

    render(<MeasurementsPanel result={completedResult()} circuit={circuit} />);
    expect(screen.getByText("R1")).toBeInTheDocument();
    expect(screen.queryByText("comp_abc")).not.toBeInTheDocument();
  });

  it("maps each measurement to the matching label, not the first component", () => {
    const circuit = circuitWithIds();
    expect(labelForComponent(circuit, "comp_abc", "resistor")).toBe("R1");
    expect(labelForComponent(circuit, "comp_def", "resistor")).toBe("R2");
    expect(labelForComponent(circuit, "comp_cap", "capacitor")).toBe("C1");
  });

  it("uses a safe fallback when the component is not on the circuit", () => {
    const circuit = circuitWithIds();
    expect(labelForComponent(circuit, "comp_gone", "resistor")).toBe(UNKNOWN_COMPONENT_LABEL);

    render(<MeasurementsPanel result={completedResult()} circuit={circuit} />);
    expect(screen.getByText(UNKNOWN_COMPONENT_LABEL)).toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
    expect(screen.queryByText("[object Object]")).not.toBeInTheDocument();
  });

  it("does not mutate component ids, topology, or connections", () => {
    const circuit = circuitWithIds();
    const before = JSON.stringify(circuit);
    labelForComponent(circuit, "comp_abc", "resistor");
    labelForComponent(circuit, "comp_def", "resistor");
    expect(JSON.stringify(circuit)).toBe(before);
    expect(circuit.components[0].id).toBe("comp_abc");
    expect(circuit.connections).toEqual([]);
  });

  it("uses component labels on graph signals while keeping internal ids", () => {
    const circuit = circuitWithIds();
    const signals = listAvailableSignals(
      {
        measurements: {
          totalVoltage: 5,
          totalCurrent: 0.005,
          totalPower: 0.025,
          equivalentResistance: 1000,
          componentMeasurements: [
            {
              componentId: "comp_abc",
              type: "resistor",
              voltage: 5,
              current: 0.005,
              power: 0.025,
              resistance: 1000,
            },
            {
              componentId: "comp_def",
              type: "resistor",
              voltage: 2,
              current: 0.001,
              power: 0.002,
              resistance: 2000,
            },
          ],
        },
      },
      circuit,
    );

    const iAbc = signals.find((s) => s.id === "I_comp_abc");
    const iDef = signals.find((s) => s.id === "I_comp_def");
    expect(iAbc?.label).toBe("I(R1)");
    expect(iDef?.label).toBe("I(R2)");
    expect(iAbc?.id).toBe("I_comp_abc");
    expect(signals.some((s) => s.label.includes("comp_abc"))).toBe(false);
  });
});
