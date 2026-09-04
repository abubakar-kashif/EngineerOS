import { describe, expect, it, beforeEach } from "vitest";
import {
  WORKSPACE_STORAGE_KEY,
  createWorkspaceProject,
  downloadWorkspaceProject,
  loadWorkspaceFromLocalStorage,
  parseWorkspaceProject,
  saveWorkspaceToLocalStorage,
  serializeEditorCircuit,
  workspaceHasContent,
} from "../services/workspaceCircuitStorage";
import type { EditorCircuit } from "../components/simulation/editorTypes";

const sampleCircuit: EditorCircuit = {
  components: [
    {
      id: "c1",
      type: "voltage_source",
      label: "V1",
      x: 0,
      y: 0,
      rotation: 0,
      properties: { voltage: 12 },
      terminals: ["positive", "negative"],
    },
    {
      id: "c2",
      type: "resistor",
      label: "R1",
      x: 100,
      y: 0,
      rotation: 90,
      properties: { resistance: 1000 },
      terminals: ["A", "B"],
    },
    {
      id: "c3",
      type: "voltmeter",
      label: "VM1",
      x: 50,
      y: 80,
      rotation: 0,
      properties: {},
      terminals: ["positive", "negative"],
    },
  ],
  wires: [
    {
      id: "w1",
      netId: "net_main",
      points: [
        { x: 0, y: -20 },
        { x: 50, y: -20 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ],
      a: { kind: "terminal", componentId: "c1", terminalId: "positive" },
      b: { kind: "junction", junctionId: "j1" },
    },
    {
      id: "w2",
      netId: "net_main",
      points: [
        { x: 50, y: 0 },
        { x: 70, y: 0 },
      ],
      a: { kind: "junction", junctionId: "j1" },
      b: { kind: "terminal", componentId: "c2", terminalId: "A" },
    },
  ],
  connections: [],
  junctions: [{ id: "j1", x: 50, y: 0, netId: "net_main" }],
};

const legacyCircuit = {
  components: sampleCircuit.components.slice(0, 2),
  wires: [{ id: "old", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }],
  connections: [{ from: "c1:positive", to: "c2:A" }],
  junctions: [{ x: 50, y: 0 }],
} as unknown as EditorCircuit;

describe("workspaceCircuitStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a structured project without inventing components", () => {
    const project = createWorkspaceProject(sampleCircuit, {
      experimentId: "kvl",
      viewport: { x: 0, y: 0, w: 800, h: 600 },
    });
    expect(project.kind).toBe("engineeros-simulation-workspace");
    expect(project.version).toBe(1);
    expect(project.experimentId).toBe("kvl");
    expect(project.circuit.components).toHaveLength(3);
    expect(project.circuit.components[0].label).toBe("V1");
    expect(project.viewport?.w).toBe(800);
    expect(project.simulationMeta?.schemaVersion).toBe(1);
  });

  it("serializes complete Phase-3 wire geometry, ends, nets, and junctions", () => {
    const project = createWorkspaceProject(sampleCircuit, {
      experimentId: "series-circuit",
      viewport: { x: -10, y: -20, w: 900, h: 500 },
    });
    const raw = JSON.parse(JSON.stringify(project));
    // Ensure measurements are never embedded in the save payload.
    expect(JSON.stringify(raw)).not.toMatch(/measurements|simulationRunId|simResult/i);

    const loaded = parseWorkspaceProject(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.circuit.components[1].rotation).toBe(90);
    expect(loaded!.circuit.components[1].properties.resistance).toBe(1000);
    expect(loaded!.circuit.components[2].type).toBe("voltmeter");

    expect(loaded!.circuit.wires).toHaveLength(2);
    expect(loaded!.circuit.wires[0].netId).toBe("net_main");
    expect(loaded!.circuit.wires[0].points).toHaveLength(4);
    expect(loaded!.circuit.wires[0].a).toEqual({
      kind: "terminal",
      componentId: "c1",
      terminalId: "positive",
    });
    expect(loaded!.circuit.wires[0].b).toEqual({ kind: "junction", junctionId: "j1" });
    expect(loaded!.circuit.junctions).toEqual([
      { id: "j1", x: 50, y: 0, netId: "net_main" },
    ]);
    expect(loaded!.viewport).toEqual({ x: -10, y: -20, w: 900, h: 500 });
    expect(loaded!.experimentId).toBe("series-circuit");
    // Connections rebuilt from nets for the solver adapter.
    expect(loaded!.circuit.connections.length).toBeGreaterThanOrEqual(1);
  });

  it("round-trips through localStorage without losing wire waypoints", () => {
    const project = createWorkspaceProject(sampleCircuit, { experimentId: "ohms-law" });
    saveWorkspaceToLocalStorage(project);
    const loaded = loadWorkspaceFromLocalStorage();
    expect(loaded?.circuit.components[1].label).toBe("R1");
    expect(loaded?.circuit.wires[0].points[1]).toEqual({ x: 50, y: -20 });
    expect(loaded?.circuit.junctions?.[0].id).toBe("j1");
    expect(loaded?.experimentId).toBe("ohms-law");
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toContain("engineeros-simulation-workspace");
  });

  it("accepts projects that omit connections (nets are enough)", () => {
    const project = createWorkspaceProject(sampleCircuit);
    const raw = {
      ...project,
      circuit: {
        components: project.circuit.components,
        wires: project.circuit.wires,
        junctions: project.circuit.junctions,
        // connections intentionally missing
      },
    };
    const loaded = parseWorkspaceProject(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.circuit.connections.length).toBeGreaterThanOrEqual(1);
  });

  it("migrates legacy parallel wires[]/connections[] on open", () => {
    const project = createWorkspaceProject(legacyCircuit);
    expect(project.circuit.wires[0].netId).toBeTruthy();
    expect(project.circuit.wires[0].a?.kind).toBe("terminal");
    expect(project.circuit.wires[0].b?.kind).toBe("terminal");
  });

  it("workspaceHasContent detects wires-only and empty projects", () => {
    expect(workspaceHasContent(null)).toBe(false);
    expect(workspaceHasContent(createWorkspaceProject({ components: [], wires: [], connections: [], junctions: [] }))).toBe(
      false,
    );
    expect(workspaceHasContent(createWorkspaceProject(sampleCircuit))).toBe(true);
  });

  it("serializeEditorCircuit is idempotent for complete circuits", () => {
    const once = serializeEditorCircuit(sampleCircuit);
    const twice = serializeEditorCircuit(once);
    expect(twice.wires[0].points).toEqual(once.wires[0].points);
    expect(twice.wires[0].a).toEqual(once.wires[0].a);
    expect(twice.junctions).toEqual(once.junctions);
  });

  it("rejects unrelated JSON as a workspace project", () => {
    expect(parseWorkspaceProject({ foo: 1 })).toBeNull();
    expect(parseWorkspaceProject({ kind: "other", version: 1, circuit: sampleCircuit })).toBeNull();
    expect(
      parseWorkspaceProject({
        kind: "engineeros-simulation-workspace",
        version: 1,
        circuit: { components: [], wires: "bad" },
      }),
    ).toBeNull();
  });

  it("downloadWorkspaceProject creates a blob download without throwing", () => {
    const project = createWorkspaceProject(sampleCircuit);
    const clicks: string[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = () => "blob:test";
    URL.revokeObjectURL = () => undefined;
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        const anchor = el as HTMLAnchorElement;
        anchor.click = () => {
          clicks.push(anchor.download);
        };
      }
      return el;
    }) as typeof document.createElement;

    downloadWorkspaceProject(project, "branch.engineeros.json");
    expect(clicks[0]).toBe("branch.engineeros.json");

    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    document.createElement = originalCreateElement;
  });
});
