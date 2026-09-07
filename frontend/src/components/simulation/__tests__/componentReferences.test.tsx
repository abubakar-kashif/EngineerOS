/**
 * Phase 1: user-facing simulation component references (designators, not comp_*).
 */
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import type { CircuitDefinition } from "../engine/circuitGraph";
import { createTerminalId } from "../engine/circuitGraph";
import { listAvailableSignals, generateGraphsFromMeasurements } from "../engine/graphData";
import type { Measurements, SimulationResult } from "../engine/types";
import { resolveComponentReference } from "../componentReference";
import MeasurementsPanel from "../MeasurementsPanel";

function circuitWithInternalIds(): CircuitDefinition {
  return {
    components: [
      {
        id: "comp_abc123_vsrc",
        type: "voltage_source",
        label: "V1",
        position: { x: 0, y: 0 },
        rotation: 0,
        properties: { voltage: 5 },
        terminals: [
          {
            id: createTerminalId("comp_abc123_vsrc", "positive"),
            type: "positive",
            componentId: "comp_abc123_vsrc",
          },
          {
            id: createTerminalId("comp_abc123_vsrc", "negative"),
            type: "negative",
            componentId: "comp_abc123_vsrc",
          },
        ],
      },
      {
        id: "comp_73idru_r1",
        type: "resistor",
        label: "R1",
        position: { x: 100, y: 0 },
        rotation: 0,
        properties: { resistance: 1000 },
        terminals: [
          { id: createTerminalId("comp_73idru_r1", "A"), type: "A", componentId: "comp_73idru_r1" },
          { id: createTerminalId("comp_73idru_r1", "B"), type: "B", componentId: "comp_73idru_r1" },
        ],
      },
      {
        id: "comp_88xyz_r2",
        type: "resistor",
        label: "R2",
        position: { x: 200, y: 0 },
        rotation: 0,
        properties: { resistance: 2000 },
        terminals: [
          { id: createTerminalId("comp_88xyz_r2", "A"), type: "A", componentId: "comp_88xyz_r2" },
          { id: createTerminalId("comp_88xyz_r2", "B"), type: "B", componentId: "comp_88xyz_r2" },
        ],
      },
    ],
    connections: [],
  };
}

const measurements: Measurements = {
  totalVoltage: 5,
  totalCurrent: 0.005,
  totalPower: 0.025,
  equivalentResistance: 1000,
  componentMeasurements: [
    {
      componentId: "comp_abc123_vsrc",
      type: "voltage_source",
      voltage: 5,
      current: 0.005,
      power: 0.025,
    },
    {
      componentId: "comp_73idru_r1",
      type: "resistor",
      voltage: 5,
      current: 0.005,
      power: 0.025,
      resistance: 1000,
    },
    {
      componentId: "comp_88xyz_r2",
      type: "resistor",
      voltage: 0,
      current: 0,
      power: 0,
      resistance: 2000,
    },
  ],
};

describe("resolveComponentReference", () => {
  it("maps internal ids to designators", () => {
    const circuit = circuitWithInternalIds();
    expect(resolveComponentReference(circuit, "comp_73idru_r1", "resistor")).toBe("R1");
    expect(resolveComponentReference(circuit, "comp_abc123_vsrc", "voltage_source")).toBe("V1");
    expect(resolveComponentReference(circuit, "comp_88xyz_r2")).toBe("R2");
  });

  it("does not crash on unknown component ids", () => {
    expect(resolveComponentReference(circuitWithInternalIds(), "comp_missing", "resistor")).toBe(
      "resistor",
    );
    expect(resolveComponentReference(null, "comp_missing")).toBe("Unknown component");
  });
});

describe("MeasurementsPanel user-facing references", () => {
  it("shows R1 / V1 instead of internal ids", () => {
    const result: SimulationResult = { status: "completed", measurements };
    render(
      <MemoryRouter>
        <MeasurementsPanel result={result} circuit={circuitWithInternalIds()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("R1")).toBeInTheDocument();
    expect(screen.getByText("V1")).toBeInTheDocument();
    expect(screen.getByText("R2")).toBeInTheDocument();
    expect(screen.queryByText(/comp_73idru/)).not.toBeInTheDocument();
    expect(screen.queryByText(/comp_abc123/)).not.toBeInTheDocument();
  });

  it("handles a measurement for an unknown component without crashing", () => {
    const result: SimulationResult = {
      status: "completed",
      measurements: {
        ...measurements,
        componentMeasurements: [
          {
            componentId: "comp_orphan_xyz",
            type: "resistor",
            voltage: 1,
            current: 0.001,
            power: 0.001,
            resistance: 1000,
          },
        ],
      },
    };
    render(
      <MemoryRouter>
        <MeasurementsPanel result={result} circuit={circuitWithInternalIds()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("resistor")).toBeInTheDocument();
    expect(screen.queryByText(/comp_orphan/)).not.toBeInTheDocument();
  });
});

describe("graph signal labels use designators", () => {
  it("names voltage/current/power with R1 not internal ids", () => {
    const circuit = circuitWithInternalIds();
    const signals = listAvailableSignals({ measurements }, circuit);
    const labels = signals.map((s) => s.label);
    expect(labels).toEqual(expect.arrayContaining(["Voltage — R1", "Current — R1", "Power — R1"]));
    expect(labels.some((l) => /comp_/i.test(l))).toBe(false);

    const graphs = generateGraphsFromMeasurements(measurements, circuit);
    const kcl = graphs.find((g) => g.id === "current_signals");
    expect(kcl?.metadata?.labels).toEqual(expect.arrayContaining(["I_R1", "I_R2", "ΣI"]));
  });
});
