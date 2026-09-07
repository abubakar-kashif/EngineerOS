import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { solveCircuit } from "../engine/circuitSolver";
import { displayableSimulationResult } from "../engine/electricalSnapshot";
import { listAvailableSignals, selectableGraphs } from "../engine/graphData";
import { ohmsLaw, series5VTwo1k } from "../engine/__tests__/circuitFixtures";
import { createTerminalId, type CircuitDefinition } from "../engine/circuitGraph";
import GraphViewer from "../GraphViewer";
import {
  RUN_SIMULATION_FOR_GRAPHS,
  buildGraphSelectorGroups,
  defaultSelectorOptionId,
  flattenSelectorOptions,
} from "../graphSelector";

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

describe("graph selector UX", () => {
  it("lists real voltage/current/power options from the SimulationRun", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    const groups = buildGraphSelectorGroups(
      selectableGraphs(result.graphs),
      listAvailableSignals(result, circuit),
    );
    const labels = flattenSelectorOptions(groups).map((o) => o.label);
    expect(labels).toEqual(expect.arrayContaining(["Voltage — R1", "Current — R1", "Power — R1"]));
    expect(labels.some((l) => l.includes("Ohm's Law"))).toBe(true);
  });

  it("does not offer nonexistent R2/C1/D1/LED1 options", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    const labels = flattenSelectorOptions(
      buildGraphSelectorGroups(selectableGraphs(result.graphs), listAvailableSignals(result, circuit)),
    ).map((o) => o.label);
    expect(labels.some((l) => /R2|C1|D1|LED1/.test(l))).toBe(false);
    expect(labels.some((l) => l.includes("Voltage Divider"))).toBe(false);
    expect(labels.some((l) => l.includes("RC response"))).toBe(false);
  });

  it("uses circuit labels instead of internal component ids", () => {
    const circuit = labeledInternalIds();
    const result = solveCircuit(circuit);
    const labels = flattenSelectorOptions(
      buildGraphSelectorGroups(selectableGraphs(result.graphs), listAvailableSignals(result, circuit)),
    ).map((o) => o.label);
    expect(labels).toEqual(expect.arrayContaining(["Voltage — R1", "Current — R1"]));
    expect(labels.some((l) => l.includes("comp_"))).toBe(false);
  });

  it("marks the default analysis graph as selected and updates on switch", async () => {
    const user = userEvent.setup();
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    render(<GraphViewer result={result} graphs={result.graphs} circuit={circuit} />);

    const ohms = screen.getByRole("radio", { name: /ohm's law/i });
    expect(ohms).toHaveAttribute("aria-checked", "true");
    expect(ohms).toHaveClass("sim-graph-option--selected");
    expect(screen.getByRole("img", { name: /ohm's law/i })).toBeInTheDocument();

    const currentR1 = screen.getByRole("radio", { name: "Current — R1" });
    await user.click(currentR1);
    expect(currentR1).toHaveAttribute("aria-checked", "true");
    expect(ohms).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("img", { name: "Current — R1" })).toBeInTheDocument();
  });

  it("shows a clear empty state with no fake options when there is no run", () => {
    render(<GraphViewer result={{ status: "idle" }} />);
    expect(screen.getByRole("status")).toHaveTextContent(RUN_SIMULATION_FOR_GRAPHS);
    expect(screen.queryByTestId("graph-selector")).not.toBeInTheDocument();
  });

  it("drops stale graph options after the circuit changes", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    expect(displayableSimulationResult(result, ohmsLaw(12, 2000))).toBeNull();
    const groups = buildGraphSelectorGroups(
      selectableGraphs(displayableSimulationResult(result, ohmsLaw(12, 2000))?.graphs),
      listAvailableSignals(displayableSimulationResult(result, ohmsLaw(12, 2000)), ohmsLaw(12, 2000)),
    );
    expect(groups).toEqual([]);
  });

  it("includes Voltage Divider only when R2 measurements exist", () => {
    const ohms = flattenSelectorOptions(
      buildGraphSelectorGroups(
        selectableGraphs(solveCircuit(ohmsLaw(5, 1000)).graphs),
        listAvailableSignals(solveCircuit(ohmsLaw(5, 1000)), ohmsLaw(5, 1000)),
      ),
    ).map((o) => o.label);
    expect(ohms.some((l) => l.includes("Voltage Divider"))).toBe(false);

    const dividerCircuit = series5VTwo1k();
    const divider = flattenSelectorOptions(
      buildGraphSelectorGroups(
        selectableGraphs(solveCircuit(dividerCircuit).graphs),
        listAvailableSignals(solveCircuit(dividerCircuit), dividerCircuit),
      ),
    ).map((o) => o.label);
    expect(divider).toEqual(expect.arrayContaining(["Voltage — R1", "Voltage — R2", "Current — R1", "Current — R2"]));
    expect(divider.some((l) => l.includes("Voltage Divider"))).toBe(true);
  });

  it("defaults to the first analysis option when one exists", () => {
    const circuit = ohmsLaw(5, 1000);
    const result = solveCircuit(circuit);
    const groups = buildGraphSelectorGroups(
      selectableGraphs(result.graphs),
      listAvailableSignals(result, circuit),
    );
    expect(defaultSelectorOptionId(groups)).toBe("preset:ohms_law");
  });
});
