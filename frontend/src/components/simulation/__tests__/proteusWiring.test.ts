/**
 * Phase 1 — Proteus-like wire editor: select vs branch, crossings,
 * duplicates, cancellation, endpoint commit, zoom/pan coords.
 */
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCircuitEditor } from "../../../hooks/useCircuitEditor";
import { toEngineCircuit } from "../../simulation/editorAdapters";
import type { EditorCircuit, ComponentInstance } from "../editorTypes";
import {
  rebuildConnections,
  snapWiringCursor,
  splitWireAtPoint,
} from "../wireTopology";
import {
  panViewBoxByClientDelta,
  screenToWorldFromRect,
  zoomViewBoxAt,
} from "../viewportMath";

function resistor(id: string, x: number, y: number): ComponentInstance {
  return {
    id,
    type: "resistor",
    label: id,
    x,
    y,
    rotation: 0,
    properties: { resistance: 1000 },
    terminals: ["A", "B"],
  };
}

describe("Proteus wiring — create / cancel / select / delete", () => {
  it("creates a wire on the destination click and leaves drawing mode", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    const [a, b] = result.current.state.circuit.components;

    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.updateWirePreview(80, 0);
      result.current.completeWire(b.id, "A");
    });

    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.circuit.wires).toHaveLength(1);
    expect(result.current.state.circuit.connections.length).toBeGreaterThanOrEqual(1);
  });

  it("cancels with no committed geometry", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    const r = result.current.state.circuit.components[0];
    act(() => {
      result.current.startWire(r.id, "A", r.x - 30, r.y);
      result.current.updateWirePreview(40, 20);
      result.current.cancelWire();
    });
    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.wirePreviewPoints).toHaveLength(0);
    expect(result.current.state.circuit.wires).toHaveLength(0);
  });

  it("selects a wire without starting a branch", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    const [a, b] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.completeWire(b.id, "A");
    });
    const id = result.current.state.circuit.wires[0].id;
    act(() => {
      result.current.selectWire(id);
    });
    expect(result.current.state.selectedWireId).toBe(id);
    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.circuit.wires).toHaveLength(1);
  });

  it("deletes the selected wire and rebuilds electrical connections", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    const [a, b] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.completeWire(b.id, "A");
    });
    const id = result.current.state.circuit.wires[0].id;
    act(() => {
      result.current.selectWire(id);
      result.current.deleteWire(id);
    });
    expect(result.current.state.circuit.wires).toHaveLength(0);
    expect(result.current.state.circuit.connections).toHaveLength(0);
    expect(result.current.getEngineCircuit().connections).toHaveLength(0);
  });
});

describe("Proteus wiring — junctions, crossings, snapping", () => {
  it("intentional wire-to-wire join creates a junction on one net", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 200, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 100, 80);
    });
    const [r1, r2, r3] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
      result.current.completeWire(r2.id, "A");
    });
    const host = result.current.state.circuit.wires[0];
    act(() => {
      result.current.startWire(r3.id, "A", r3.x - 30, r3.y);
      result.current.completeWireToWire(host.id, 100, 0);
    });
    const nets = new Set(result.current.state.circuit.wires.map((w) => w.netId));
    expect(nets.size).toBe(1);
    expect(result.current.state.circuit.junctions!.length).toBeGreaterThanOrEqual(1);
  });

  it("does not magnetically snap drawing preview onto a crossed wire", () => {
    const circuit: EditorCircuit = {
      components: [resistor("R1", 0, 0), resistor("R2", 200, 0)],
      wires: [
        {
          id: "w1",
          netId: "n1",
          points: [
            { x: 0, y: 0 },
            { x: 200, y: 0 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
      ],
      connections: [],
      junctions: [],
    };
    const nearCrossing = snapWiringCursor(circuit, { x: 100, y: 4 }, { snapToWires: false });
    expect(nearCrossing.kind).toBe("none");
    const intentional = snapWiringCursor(circuit, { x: 100, y: 4 }, { snapToWires: true });
    expect(intentional.kind).toBe("wire");
  });

  it("crossing polylines without a junction keep separate nets", () => {
    const circuit: EditorCircuit = {
      components: [
        resistor("R1", 0, 50),
        resistor("R2", 200, 50),
        resistor("R3", 100, 0),
        resistor("R4", 100, 100),
      ],
      wires: [
        {
          id: "h",
          netId: "nh",
          points: [
            { x: 30, y: 50 },
            { x: 170, y: 50 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
        {
          id: "v",
          netId: "nv",
          points: [
            { x: 100, y: 20 },
            { x: 100, y: 80 },
          ],
          a: { kind: "terminal", componentId: "R3", terminalId: "B" },
          b: { kind: "terminal", componentId: "R4", terminalId: "A" },
        },
      ],
      connections: [],
      junctions: [],
    };
    const conns = rebuildConnections(circuit);
    expect(conns).toHaveLength(2);
    const engine = toEngineCircuit(circuit);
    expect(engine.connections).toHaveLength(2);
    const termsH = conns.find((c) => c.from.startsWith("R1") || c.to.startsWith("R1"));
    const termsV = conns.find((c) => c.from.startsWith("R3") || c.to.startsWith("R3"));
    expect(termsH).toBeTruthy();
    expect(termsV).toBeTruthy();
  });

  it("splitWireAtPoint is the intentional junction path", () => {
    const circuit: EditorCircuit = {
      components: [resistor("R1", 0, 0), resistor("R2", 200, 0)],
      wires: [
        {
          id: "w1",
          netId: "n1",
          points: [
            { x: 30, y: 0 },
            { x: 170, y: 0 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
      ],
      connections: [],
      junctions: [],
    };
    const split = splitWireAtPoint(circuit, "w1", { x: 100, y: 0 });
    expect(split?.circuit.junctions).toHaveLength(1);
    expect(split?.circuit.wires.every((w) => w.netId === "n1")).toBe(true);
  });
});

describe("Proteus wiring — reshape, endpoints, duplicates", () => {
  it("reshape keeps electrical endpoints", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    const [a, b] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.completeWire(b.id, "A");
    });
    const wire = result.current.state.circuit.wires[0];
    const ends = { a: wire.a, b: wire.b };
    act(() => {
      result.current.beginReshapeWire(wire.id);
      const idx = result.current.prepareWireReshape(wire.id, 80, 0);
      result.current.reshapeWire(wire.id, idx, 80, 40);
    });
    const after = result.current.state.circuit.wires.find((w) => w.id === wire.id)!;
    expect(after.a).toEqual(ends.a);
    expect(after.b).toEqual(ends.b);
  });

  it("endpoint commit can reattach to a pin without a duplicate wire", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 80);
    });
    const [a, b, c] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.completeWire(b.id, "A");
    });
    const wireId = result.current.state.circuit.wires[0].id;
    act(() => {
      result.current.beginMoveWireEndpoint(wireId);
      result.current.moveWireEndpoint(wireId, "b", c.x - 30, c.y);
      result.current.commitWireEndpoint(wireId, "b", c.x - 30, c.y);
    });
    const wire = result.current.state.circuit.wires.find((w) => w.id === wireId)!;
    expect(wire.b?.kind).toBe("terminal");
    if (wire.b?.kind === "terminal") {
      expect(wire.b.componentId).toBe(c.id);
    }
  });

  it("dragging an endpoint across another wire does not join until commit", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 200, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 0, 80);
    });
    act(() => {
      result.current.addComponent("resistor", 200, 80);
    });
    const [r1, r2, r3, r4] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
      result.current.completeWire(r2.id, "A");
    });
    act(() => {
      result.current.startWire(r3.id, "B", r3.x + 30, r3.y);
      result.current.completeWire(r4.id, "A");
    });
    const netsBefore = new Set(result.current.state.circuit.wires.map((w) => w.netId));
    expect(netsBefore.size).toBe(2);
    const mover = result.current.state.circuit.wires[1];
    act(() => {
      result.current.moveWireEndpoint(mover.id, "a", 100, 0);
    });
    const netsAfterMove = new Set(result.current.state.circuit.wires.map((w) => w.netId));
    expect(netsAfterMove.size).toBe(2);
  });

  it("rejects a duplicate terminal-to-terminal wire", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 0);
    });
    const [a, b] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.completeWire(b.id, "A");
    });
    act(() => {
      result.current.startWire(a.id, "B", a.x + 30, a.y);
      result.current.completeWire(b.id, "A");
    });
    expect(result.current.state.circuit.wires).toHaveLength(1);
    expect(result.current.state.wireStart).toBeNull();
  });

  it("ignores NaN coordinates instead of corrupting the circuit", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    const r = result.current.state.circuit.components[0];
    act(() => {
      result.current.startWire(r.id, "A", Number.NaN, Number.NaN);
    });
    expect(result.current.state.wireStart).toBeNull();
    act(() => {
      result.current.startWire(r.id, "A", r.x - 30, r.y);
      result.current.updateWirePreview(Number.NaN, 10);
      result.current.completeWire(r.id, "B");
    });
    const pts = result.current.state.circuit.wires[0]?.points ?? [];
    expect(pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });
});

describe("Proteus wiring — zoom/pan coordinates", () => {
  it("keeps the same world point under the cursor after zoom then pan", () => {
    const view = { x: -40, y: -40, w: 880, h: 560 };
    const rect = { left: 0, top: 0, width: 880, height: 560 };
    const clientX = 220;
    const clientY = 180;
    const world = screenToWorldFromRect(clientX, clientY, rect, view);
    const zoomed = zoomViewBoxAt(view, 0.5, world.x, world.y);
    const afterZoom = screenToWorldFromRect(clientX, clientY, rect, zoomed);
    expect(afterZoom.x).toBeCloseTo(world.x, 5);
    expect(afterZoom.y).toBeCloseTo(world.y, 5);
    const panned = panViewBoxByClientDelta(zoomed, 30, -12, rect.width, rect.height);
    const a = screenToWorldFromRect(clientX, clientY, rect, zoomed);
    const b = screenToWorldFromRect(clientX + 30, clientY - 12, rect, panned);
    expect(b.x).toBeCloseTo(a.x, 5);
    expect(b.y).toBeCloseTo(a.y, 5);
  });
});
