/**
 * Proteus-like wiring topology: nets, junctions, hit-test, adapter expansion.
 */
import { describe, expect, it } from "vitest";
import type { EditorCircuit, ComponentInstance } from "../editorTypes";
import { toEngineCircuit } from "../editorAdapters";
import {
  hitTestWire,
  mergeNetIds,
  nearestOnPolyline,
  normalizeEditorCircuit,
  rebuildConnections,
  splitWireAtPoint,
  terminalsOnNet,
} from "../wireTopology";
import { buildElectricalNodes } from "../engine/circuitGraphBuilder";

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

describe("wireTopology geometry", () => {
  it("finds nearest point on a horizontal wire", () => {
    const hit = nearestOnPolyline({ x: 50, y: 10 }, [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(hit).not.toBeNull();
    expect(hit!.point.x).toBeCloseTo(50);
    expect(hit!.point.y).toBeCloseTo(0);
  });

  it("hit-tests wires within tolerance", () => {
    const wires = [
      {
        id: "w1",
        netId: "n1",
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
        a: { kind: "terminal" as const, componentId: "R1", terminalId: "A" },
        b: { kind: "terminal" as const, componentId: "R2", terminalId: "A" },
      },
    ];
    expect(hitTestWire({ x: 40, y: 3 }, wires)?.wireId).toBe("w1");
    expect(hitTestWire({ x: 40, y: 40 }, wires)).toBeNull();
  });

  it("splits a wire and inserts a junction on the same net", () => {
    const circuit: EditorCircuit = {
      components: [resistor("R1", 0, 0), resistor("R2", 200, 0)],
      wires: [
        {
          id: "w1",
          netId: "netA",
          points: [
            { x: 30, y: 0 },
            { x: 170, y: 0 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
      ],
      connections: [{ from: "R1:B", to: "R2:A" }],
      junctions: [],
    };
    const split = splitWireAtPoint(circuit, "w1", { x: 100, y: 0 });
    expect(split).not.toBeNull();
    expect(split!.circuit.wires).toHaveLength(2);
    expect(split!.circuit.junctions).toHaveLength(1);
    expect(split!.netId).toBe("netA");
    expect(terminalsOnNet(split!.circuit, "netA").sort()).toEqual(["R1:B", "R2:A"]);
  });
});

describe("wireTopology electrical nets", () => {
  it("rebuilds star connections from shared netId (T-junction)", () => {
    const circuit: EditorCircuit = {
      components: [resistor("R1", 0, 0), resistor("R2", 200, 0), resistor("R3", 100, 100)],
      wires: [
        {
          id: "w1",
          netId: "n1",
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "junction", junctionId: "j1" },
        },
        {
          id: "w2",
          netId: "n1",
          points: [
            { x: 100, y: 0 },
            { x: 200, y: 0 },
          ],
          a: { kind: "junction", junctionId: "j1" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
        {
          id: "w3",
          netId: "n1",
          points: [
            { x: 100, y: 0 },
            { x: 100, y: 100 },
          ],
          a: { kind: "junction", junctionId: "j1" },
          b: { kind: "terminal", componentId: "R3", terminalId: "A" },
        },
      ],
      connections: [],
      junctions: [{ id: "j1", x: 100, y: 0, netId: "n1" }],
    };
    const conns = rebuildConnections(circuit);
    expect(conns.length).toBe(2);
    const terms = new Set(conns.flatMap((c) => [c.from, c.to]));
    expect(terms.has("R1:B")).toBe(true);
    expect(terms.has("R2:A")).toBe(true);
    expect(terms.has("R3:A")).toBe(true);
  });

  it("mergeNetIds unifies terminals for the solver", () => {
    let circuit: EditorCircuit = {
      components: [resistor("R1", 0, 0), resistor("R2", 100, 0)],
      wires: [
        {
          id: "w1",
          netId: "n1",
          points: [
            { x: 0, y: 0 },
            { x: 40, y: 0 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "junction", junctionId: "j1" },
        },
        {
          id: "w2",
          netId: "n2",
          points: [
            { x: 60, y: 0 },
            { x: 100, y: 0 },
          ],
          a: { kind: "junction", junctionId: "j2" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
      ],
      connections: [],
      junctions: [
        { id: "j1", x: 40, y: 0, netId: "n1" },
        { id: "j2", x: 60, y: 0, netId: "n2" },
      ],
    };
    circuit = mergeNetIds(circuit, "n1", "n2");
    circuit.connections = rebuildConnections(circuit);
    expect(circuit.connections.some((c) => c.from === "R1:B" || c.to === "R1:B")).toBe(true);
    expect(circuit.connections.some((c) => c.from === "R2:A" || c.to === "R2:A")).toBe(true);
  });

  it("toEngineCircuit expands nets into terminal edges (no wire geometry)", () => {
    const editor: EditorCircuit = normalizeEditorCircuit({
      components: [resistor("R1", 0, 0), resistor("R2", 200, 0)],
      wires: [
        {
          id: "w1",
          netId: "n1",
          points: [
            { x: 30, y: 0 },
            { x: 50, y: 40 },
            { x: 170, y: 0 },
          ],
          a: { kind: "terminal", componentId: "R1", terminalId: "B" },
          b: { kind: "terminal", componentId: "R2", terminalId: "A" },
        },
      ],
      connections: [],
      junctions: [],
    });
    const engine = toEngineCircuit(editor);
    expect(engine.connections).toHaveLength(1);
    expect(engine.connections[0].from).toContain("R1");
    expect(engine.connections[0].to).toContain("R2");
    const built = buildElectricalNodes(engine);
    expect(built.nodes.length).toBeGreaterThan(0);
  });

  it("migrates legacy parallel wires[]/connections[] on normalize", () => {
    const legacy = {
      components: [resistor("R1", 0, 0), resistor("R2", 100, 0)],
      wires: [
        {
          id: "old",
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
        },
      ],
      connections: [{ from: "R1:B", to: "R2:A" }],
      junctions: [{ x: 50, y: 0 }],
    } as unknown as EditorCircuit;
    const n = normalizeEditorCircuit(legacy);
    expect(n.wires[0].netId).toBeTruthy();
    expect(n.wires[0].a?.kind).toBe("terminal");
    expect(n.wires[0].b?.kind).toBe("terminal");
    expect(n.connections.length).toBeGreaterThanOrEqual(1);
  });
});
