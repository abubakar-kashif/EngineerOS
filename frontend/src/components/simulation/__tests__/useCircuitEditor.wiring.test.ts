/**
 * useCircuitEditor wiring interaction matrix (hook-level).
 */
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCircuitEditor } from "../../../hooks/useCircuitEditor";
import { toEngineCircuit } from "../../simulation/editorAdapters";
import { validateCircuit } from "../../simulation/engine/circuitValidator";
import { solveCircuit } from "../../simulation/engine/circuitSolver";

describe("useCircuitEditor wiring", () => {
  it("terminal → terminal completes in one step and feeds the solver", () => {
    const { result } = renderHook(() => useCircuitEditor());

    act(() => {
      result.current.addComponent("voltage_source", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 120, 0);
    });
    act(() => {
      result.current.addComponent("ground", 0, 80);
    });

    const [vs, r, gnd] = result.current.state.circuit.components;
    expect(vs.type).toBe("voltage_source");

    act(() => {
      result.current.startWire(vs.id, "positive", vs.x, vs.y - 20);
    });
    expect(result.current.state.wireStart).not.toBeNull();

    act(() => {
      result.current.completeWire(r.id, "A");
    });
    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.circuit.wires.length).toBe(1);

    act(() => {
      result.current.startWire(r.id, "B", r.x + 30, r.y);
    });
    act(() => {
      result.current.completeWire(vs.id, "negative");
    });
    act(() => {
      result.current.startWire(vs.id, "negative", vs.x, vs.y + 20);
    });
    act(() => {
      result.current.completeWire(gnd.id, "ground");
    });

    const engine = toEngineCircuit(result.current.state.circuit);
    const validation = validateCircuit(engine);
    expect(validation.valid || validation.errors.length === 0).toBeTruthy();
  });

  it("cancels an in-progress wire without leaving geometry", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    const r = result.current.state.circuit.components[0];
    act(() => {
      result.current.startWire(r.id, "A", r.x - 30, r.y);
    });
    act(() => {
      result.current.updateWirePreview(80, 40);
    });
    expect(result.current.state.wirePreviewPoints.length).toBeGreaterThan(1);
    act(() => {
      result.current.cancelWire();
    });
    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.circuit.wires).toHaveLength(0);
  });

  it("wire → wire creates a junction and merges nets", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 200, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 100, 100);
    });
    const [r1, r2, r3] = result.current.state.circuit.components;

    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
    });
    act(() => {
      result.current.completeWire(r2.id, "A");
    });
    expect(result.current.state.circuit.wires).toHaveLength(1);
    const host = result.current.state.circuit.wires[0];

    act(() => {
      result.current.startWire(r3.id, "A", r3.x - 30, r3.y);
    });
    act(() => {
      result.current.completeWireToWire(host.id, 100, 0);
    });

    expect(result.current.state.circuit.junctions!.length).toBeGreaterThanOrEqual(1);
    expect(result.current.state.circuit.wires.length).toBeGreaterThanOrEqual(3);
    const nets = new Set(result.current.state.circuit.wires.map((w) => w.netId));
    expect(nets.size).toBe(1);
  });

  it("starts a branch from an existing wire", () => {
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
    });
    act(() => {
      result.current.completeWire(r2.id, "A");
    });
    const host = result.current.state.circuit.wires[0];
    act(() => {
      result.current.startWireFromWire(host.id, 100, 0);
    });
    expect(result.current.state.wireStart?.origin.kind).toBe("wire");
    act(() => {
      result.current.completeWire(r3.id, "A");
    });
    expect(result.current.state.wireStart).toBeNull();
    expect(result.current.state.circuit.junctions!.length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a wire and updates topology; undo restores it", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 120, 0);
    });
    const [r1, r2] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
    });
    act(() => {
      result.current.completeWire(r2.id, "A");
    });
    const wireId = result.current.state.circuit.wires[0].id;
    act(() => {
      result.current.deleteWire(wireId);
    });
    expect(result.current.state.circuit.wires).toHaveLength(0);
    expect(result.current.state.circuit.connections).toHaveLength(0);
    act(() => {
      result.current.undo();
    });
    expect(result.current.state.circuit.wires).toHaveLength(1);
    act(() => {
      result.current.redo();
    });
    expect(result.current.state.circuit.wires).toHaveLength(0);
  });

  it("pins waypoints for multi-segment wires", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("resistor", 0, 0);
    });
    act(() => {
      result.current.addComponent("resistor", 160, 80);
    });
    const [r1, r2] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(r1.id, "B", r1.x + 30, r1.y);
    });
    act(() => {
      result.current.pinWireWaypoint(80, 0);
    });
    act(() => {
      result.current.pinWireWaypoint(80, 80);
    });
    expect(result.current.state.wireStart!.fixedPoints.length).toBeGreaterThanOrEqual(3);
    act(() => {
      result.current.completeWire(r2.id, "A");
    });
    expect(result.current.state.circuit.wires[0].points.length).toBeGreaterThanOrEqual(3);
  });

  it("series circuit through editor → validate → solve", () => {
    const { result } = renderHook(() => useCircuitEditor());
    act(() => {
      result.current.addComponent("voltage_source", 0, 40);
    });
    act(() => {
      result.current.addComponent("resistor", 120, 40);
    });
    act(() => {
      result.current.addComponent("ground", 0, 120);
    });
    const [vs, r, gnd] = result.current.state.circuit.components;
    act(() => {
      result.current.startWire(vs.id, "positive", 0, 20);
      result.current.completeWire(r.id, "A");
    });
    act(() => {
      result.current.startWire(r.id, "B", 150, 40);
      result.current.completeWire(vs.id, "negative");
    });
    act(() => {
      result.current.startWire(vs.id, "negative", 0, 60);
      result.current.completeWire(gnd.id, "ground");
    });

    const engine = result.current.getEngineCircuit();
    const validation = validateCircuit(engine);
    const ok =
      (validation as { ok?: boolean; valid?: boolean; isValid?: boolean }).ok ??
      (validation as { valid?: boolean }).valid ??
      (validation as { isValid?: boolean }).isValid;
    expect(ok).toBeTruthy();
    const solved = solveCircuit(engine);
    expect(solved).toBeTruthy();
  });
});
