import { describe, expect, it, beforeEach } from "vitest";
import {
  WORKSPACE_STORAGE_KEY,
  createWorkspaceProject,
  downloadWorkspaceProject,
  loadWorkspaceFromLocalStorage,
  parseWorkspaceProject,
  saveWorkspaceToLocalStorage,
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
      rotation: 0,
      properties: { resistance: 1000 },
      terminals: ["A", "B"],
    },
  ],
  wires: [{ id: "w1", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] }],
  connections: [{ from: "c1:positive", to: "c2:A" }],
  junctions: [],
};

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
    expect(project.circuit.components).toHaveLength(2);
    expect(project.circuit.components[0].label).toBe("V1");
    expect(project.viewport?.w).toBe(800);
  });

  it("round-trips through localStorage", () => {
    const project = createWorkspaceProject(sampleCircuit, { experimentId: "ohms-law" });
    saveWorkspaceToLocalStorage(project);
    const loaded = loadWorkspaceFromLocalStorage();
    expect(loaded?.circuit.components[1].label).toBe("R1");
    expect(loaded?.experimentId).toBe("ohms-law");
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toContain("engineeros-simulation-workspace");
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
        el.click = () => {
          clicks.push(el.download);
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
