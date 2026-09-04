/**
 * Phase 10 — Final acceptance gate (automated).
 *
 * Locks the product E2E matrix without browser automation:
 * simulation values, LED invalidation, measurement graphs,
 * wiring interactions, and viewport alignment under zoom/pan.
 */
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { solveCircuit } from "../components/simulation/engine/circuitSolver";
import type { CircuitDefinition } from "../components/simulation/engine/circuitGraph";
import { createTerminalId } from "../components/simulation/engine/circuitGraph";
import {
  listAvailableSignals,
  generateGraphsFromMeasurements,
} from "../components/simulation/engine/graphData";
import { useCircuitEditor } from "../hooks/useCircuitEditor";
import { toEngineCircuit } from "../components/simulation/editorAdapters";
import {
  panViewBoxByClientDelta,
  screenToWorldFromRect,
  zoomViewBoxAt,
  type ViewportRect,
} from "../components/simulation/viewportMath";

function seriesDivider(v: number, r1: number, r2: number): CircuitDefinition {
  return {
    components: [
      {
        id: "V1",
        type: "voltage_source",
        label: "V1",
        position: { x: 0, y: 0 },
        rotation: 0,
        properties: { voltage: v },
        terminals: [
          { id: createTerminalId("V1", "positive"), type: "positive", componentId: "V1" },
          { id: createTerminalId("V1", "negative"), type: "negative", componentId: "V1" },
        ],
      },
      {
        id: "R1",
        type: "resistor",
        label: "R1",
        position: { x: 80, y: 0 },
        rotation: 0,
        properties: { resistance: r1 },
        terminals: [
          { id: createTerminalId("R1", "A"), type: "A", componentId: "R1" },
          { id: createTerminalId("R1", "B"), type: "B", componentId: "R1" },
        ],
      },
      {
        id: "R2",
        type: "resistor",
        label: "R2",
        position: { x: 160, y: 0 },
        rotation: 0,
        properties: { resistance: r2 },
        terminals: [
          { id: createTerminalId("R2", "A"), type: "A", componentId: "R2" },
          { id: createTerminalId("R2", "B"), type: "B", componentId: "R2" },
        ],
      },
      {
        id: "GND1",
        type: "ground",
        label: "GND",
        position: { x: 240, y: 0 },
        rotation: 0,
        properties: {},
        terminals: [
          { id: createTerminalId("GND1", "ground"), type: "ground", componentId: "GND1" },
        ],
      },
    ],
    connections: [
      { id: "W1", from: createTerminalId("V1", "positive"), to: createTerminalId("R1", "A") },
      { id: "W2", from: createTerminalId("R1", "B"), to: createTerminalId("R2", "A") },
      { id: "W3", from: createTerminalId("R2", "B"), to: createTerminalId("GND1", "ground") },
      { id: "W4", from: createTerminalId("V1", "negative"), to: createTerminalId("GND1", "ground") },
    ],
  };
}

describe("Phase 10 — simulation acceptance", () => {
  it("12V · 1k · 2k → I≈4mA, VR1≈4V, VR2≈8V", () => {
    const result = solveCircuit(seriesDivider(12, 1000, 2000));
    expect(result.status).toBe("completed");
    expect(result.measurements?.totalCurrent).toBeCloseTo(0.004, 6);
    const r1 = result.measurements?.componentMeasurements.find((m) => m.componentId === "R1");
    const r2 = result.measurements?.componentMeasurements.find((m) => m.componentId === "R2");
    expect(r1?.voltage).toBeCloseTo(4, 3);
    expect(r2?.voltage).toBeCloseTo(8, 3);
  });

  it("changing R2 to 4kΩ yields Vout≈9.6V as a new solve", () => {
    const a = solveCircuit(seriesDivider(12, 1000, 2000));
    const b = solveCircuit(seriesDivider(12, 1000, 4000));
    expect(b.status).toBe("completed");
    const vout = b.measurements?.componentMeasurements.find((m) => m.componentId === "R2")?.voltage;
    expect(vout).toBeCloseTo(9.6, 3);
    expect(vout).not.toBeCloseTo(
      a.measurements?.componentMeasurements.find((m) => m.componentId === "R2")?.voltage ?? 0,
      2,
    );
  });

  it("invalid LED reports LED_NO_CURRENT_LIMIT; fixed circuit completes", () => {
    const invalid: CircuitDefinition = {
      components: [
        {
          id: "V1",
          type: "voltage_source",
          label: "V1",
          position: { x: 0, y: 0 },
          rotation: 0,
          properties: { voltage: 12 },
          terminals: [
            { id: createTerminalId("V1", "positive"), type: "positive", componentId: "V1" },
            { id: createTerminalId("V1", "negative"), type: "negative", componentId: "V1" },
          ],
        },
        {
          id: "LED1",
          type: "led",
          label: "LED1",
          position: { x: 100, y: 0 },
          rotation: 0,
          properties: { forwardVoltage: 2 },
          terminals: [
            { id: createTerminalId("LED1", "anode"), type: "anode", componentId: "LED1" },
            { id: createTerminalId("LED1", "cathode"), type: "cathode", componentId: "LED1" },
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
        { id: "W1", from: createTerminalId("V1", "positive"), to: createTerminalId("LED1", "anode") },
        { id: "W2", from: createTerminalId("LED1", "cathode"), to: createTerminalId("GND1", "ground") },
      ],
    };

    const bad = solveCircuit(invalid);
    expect(bad.status).toBe("invalid");
    expect(bad.validation?.errors.some((e) => e.code === "LED_NO_CURRENT_LIMIT")).toBe(true);

    const fixed: CircuitDefinition = {
      components: [
        ...invalid.components.filter((c) => c.id !== "LED1"),
        {
          id: "R1",
          type: "resistor",
          label: "R1",
          position: { x: 60, y: 0 },
          rotation: 0,
          properties: { resistance: 500 },
          terminals: [
            { id: createTerminalId("R1", "A"), type: "A", componentId: "R1" },
            { id: createTerminalId("R1", "B"), type: "B", componentId: "R1" },
          ],
        },
        {
          id: "LED1",
          type: "led",
          label: "LED1",
          position: { x: 140, y: 0 },
          rotation: 0,
          properties: { forwardVoltage: 2 },
          terminals: [
            { id: createTerminalId("LED1", "anode"), type: "anode", componentId: "LED1" },
            { id: createTerminalId("LED1", "cathode"), type: "cathode", componentId: "LED1" },
          ],
        },
      ],
      connections: [
        { id: "W1", from: createTerminalId("V1", "positive"), to: createTerminalId("R1", "A") },
        { id: "W2", from: createTerminalId("R1", "B"), to: createTerminalId("LED1", "anode") },
        { id: "W3", from: createTerminalId("LED1", "cathode"), to: createTerminalId("GND1", "ground") },
        { id: "W4", from: createTerminalId("V1", "negative"), to: createTerminalId("GND1", "ground") },
      ],
    };

    const good = solveCircuit(fixed);
    expect(good.status).toBe("completed");
  });
});

describe("Phase 10 — graph acceptance", () => {
  it("offers measurement signals, not KVL/KCL experiment titles", () => {
    const result = solveCircuit(seriesDivider(12, 1000, 2000));
    expect(result.measurements).toBeTruthy();
    const signals = listAvailableSignals({ measurements: result.measurements! }, seriesDivider(12, 1000, 2000));
    const ids = signals.map((s) => s.id);
    const labels = signals.map((s) => s.label.toLowerCase());

    expect(ids).toEqual(expect.arrayContaining(["Vs", "V_R1", "V_R2", "I_R1", "I_R2", "ΣI"]));
    expect(ids.some((id) => /kvl|kcl/i.test(id))).toBe(false);
    expect(labels.some((l) => l.includes("kvl graph") || l.includes("kcl graph"))).toBe(false);

    const graphs = generateGraphsFromMeasurements(result.measurements!, seriesDivider(12, 1000, 2000));
    expect(graphs.length).toBeGreaterThan(0);
    expect(graphs.every((g) => g.metadata?.source === "measurements")).toBe(true);
    expect(graphs.some((g) => /KVL graph|KCL graph/i.test(g.title))).toBe(false);
  });
});

describe("Phase 10 — wiring acceptance", () => {
  it("terminal click → cursor preview → destination creates a wire immediately", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("voltage_source", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 120, 0);
    });
    const [vs, r] = result.current.state.circuit.components;

    act(() => {
      result.current.startWire(vs.id, "positive", vs.x, vs.y - 20);
    });
    expect(result.current.state.wireStart).not.toBeNull();

    act(() => {
      result.current.updateWirePreview(80, -10);
    });
    expect(result.current.state.wirePreviewPoints.length).toBeGreaterThan(1);

    act(() => {
      result.current.completeWire(r.id, "A");
    });
    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.circuit.wires).toHaveLength(1);
  });

  it("start-from-wire → junction → attach component → still solvable topology", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("voltage_source", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 80, 80);
    });
    act(() => {
      result.current.addComponent("ground", 0, 120);
    });
    const [vs, r1, r2, gnd] = result.current.state.circuit.components;

    act(() => {
      result.current.startWire(vs.id, "positive", vs.x, vs.y - 20);
    });
    act(() => {
      result.current.completeWire(r1.id, "A");
    });
    const host = result.current.state.circuit.wires[0];

    act(() => {
      result.current.startWireFromWire(host.id, 80, -20);
    });
    expect(result.current.state.wireStart?.origin.kind).toBe("wire");
    act(() => {
      result.current.completeWire(r2.id, "A");
    });
    expect(result.current.state.circuit.junctions!.length).toBeGreaterThanOrEqual(1);

    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
    });
    act(() => {
      result.current.completeWire(gnd.id, "ground");
    });
    act(() => {
      result.current.startWire(r2.id, "B", r2.x, r2.y + 20);
    });
    act(() => {
      result.current.completeWire(gnd.id, "ground");
    });
    act(() => {
      result.current.startWire(vs.id, "negative", vs.x, vs.y + 20);
    });
    act(() => {
      result.current.completeWire(gnd.id, "ground");
    });

    const engine = toEngineCircuit(result.current.state.circuit);
    expect(engine.connections.length).toBeGreaterThan(0);
  });

  it("reshape (drag segment) keeps endpoints electrically attached", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    const [r1, r2] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
    });
    act(() => {
      result.current.completeWire(r2.id, "A");
    });
    const wire = result.current.state.circuit.wires[0];
    const fromBefore = wire.a;
    const toBefore = wire.b;

    act(() => {
      result.current.beginReshapeWire(wire.id);
    });
    act(() => {
      result.current.reshapeWire(wire.id, 1, 80, 40);
    });

    const after = result.current.state.circuit.wires.find((w) => w.id === wire.id)!;
    expect(after.a).toEqual(fromBefore);
    expect(after.b).toEqual(toBefore);
    expect(after.points.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Phase 10 — zoom/pan wire alignment", () => {
  it("keeps the world point under the cursor after zoom and pan", () => {
    const view: ViewportRect = { x: 0, y: 0, w: 800, h: 600 };
    const rect = { left: 0, top: 0, width: 800, height: 600 };
    const clientX = 200;
    const clientY = 150;

    const underCursor = screenToWorldFromRect(clientX, clientY, rect, view);
    const zoomed = zoomViewBoxAt(view, 0.5, underCursor.x, underCursor.y);
    const stillThere = screenToWorldFromRect(clientX, clientY, rect, zoomed);
    expect(stillThere.x).toBeCloseTo(underCursor.x, 5);
    expect(stillThere.y).toBeCloseTo(underCursor.y, 5);

    const panned = panViewBoxByClientDelta(zoomed, 40, -20, rect.width, rect.height);
    const afterPanA = screenToWorldFromRect(clientX, clientY, rect, zoomed);
    const afterPanB = screenToWorldFromRect(clientX + 40, clientY - 20, rect, panned);
    expect(afterPanB.x).toBeCloseTo(afterPanA.x, 5);
    expect(afterPanB.y).toBeCloseTo(afterPanA.y, 5);
  });
});
