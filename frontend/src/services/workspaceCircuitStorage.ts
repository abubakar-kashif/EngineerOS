/**
 * Structured workspace project format for Save / Open.
 * Preserves the full editable circuit (geometry + nets), not a screenshot
 * and never stale simulation measurements.
 */

import type { EditorCircuit } from "../components/simulation/editorTypes";
import { normalizeEditorCircuit, rebuildConnections } from "../components/simulation/wireTopology";

export const WORKSPACE_PROJECT_VERSION = 1;
export const WORKSPACE_STORAGE_KEY = "engineeros.sim.workspace.v1";
export const WORKSPACE_FILE_EXTENSION = "engineeros.json";

export interface WorkspaceViewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Lab configuration only — never measurements / SimulationRun payloads.
 * Reopening a project always starts a fresh run.
 */
export interface WorkspaceSimulationMeta {
  schemaVersion: 1;
  /** Optional freeform note from the lab (not solver output). */
  notes?: string;
}

export interface WorkspaceProject {
  version: number;
  kind: "engineeros-simulation-workspace";
  savedAt: string;
  experimentId: string | null;
  circuit: EditorCircuit;
  viewport?: WorkspaceViewport | null;
  simulationMeta?: WorkspaceSimulationMeta | null;
}

/** Ensure wires have netId/a/b, junctions are complete, connections match nets. */
export function serializeEditorCircuit(circuit: EditorCircuit): EditorCircuit {
  const normalized = normalizeEditorCircuit(circuit);
  return {
    components: structuredClone(normalized.components),
    wires: structuredClone(normalized.wires),
    junctions: structuredClone(normalized.junctions ?? []),
    connections: rebuildConnections(normalized),
  };
}

export function createWorkspaceProject(
  circuit: EditorCircuit,
  options: {
    experimentId?: string | null;
    viewport?: WorkspaceViewport | null;
    simulationMeta?: WorkspaceSimulationMeta | null;
  } = {},
): WorkspaceProject {
  return {
    version: WORKSPACE_PROJECT_VERSION,
    kind: "engineeros-simulation-workspace",
    savedAt: new Date().toISOString(),
    experimentId: options.experimentId ?? null,
    circuit: serializeEditorCircuit(circuit),
    viewport: options.viewport ? { ...options.viewport } : null,
    simulationMeta: options.simulationMeta
      ? { schemaVersion: 1 as const, notes: options.simulationMeta.notes }
      : { schemaVersion: 1 },
  };
}

export function parseWorkspaceProject(raw: unknown): WorkspaceProject | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (data.kind !== "engineeros-simulation-workspace") return null;
  if (typeof data.version !== "number") return null;
  const circuit = data.circuit as EditorCircuit | undefined;
  if (!circuit || !Array.isArray(circuit.components) || !Array.isArray(circuit.wires)) {
    return null;
  }
  const connections = Array.isArray(circuit.connections) ? circuit.connections : [];
  const normalizedCircuit = serializeEditorCircuit({
    ...circuit,
    connections,
    junctions: circuit.junctions ?? [],
  });

  let simulationMeta: WorkspaceSimulationMeta | null = null;
  if (data.simulationMeta && typeof data.simulationMeta === "object") {
    const meta = data.simulationMeta as Record<string, unknown>;
    simulationMeta = {
      schemaVersion: 1,
      notes: typeof meta.notes === "string" ? meta.notes : undefined,
    };
  }

  return {
    version: data.version,
    kind: "engineeros-simulation-workspace",
    savedAt: typeof data.savedAt === "string" ? data.savedAt : new Date().toISOString(),
    experimentId: typeof data.experimentId === "string" ? data.experimentId : null,
    circuit: normalizedCircuit,
    viewport:
      data.viewport && typeof data.viewport === "object"
        ? (data.viewport as WorkspaceViewport)
        : null,
    simulationMeta,
  };
}

/** True when a project has editable content worth restoring. */
export function workspaceHasContent(project: WorkspaceProject | null | undefined): boolean {
  if (!project) return false;
  const { components, wires, junctions } = project.circuit;
  return (
    components.length > 0 ||
    wires.length > 0 ||
    (junctions?.length ?? 0) > 0
  );
}

export function saveWorkspaceToLocalStorage(project: WorkspaceProject): void {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(project));
}

export function loadWorkspaceFromLocalStorage(): WorkspaceProject | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    return parseWorkspaceProject(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function downloadWorkspaceProject(project: WorkspaceProject, filename?: string): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `circuit.${WORKSPACE_FILE_EXTENSION}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readWorkspaceProjectFile(file: File): Promise<WorkspaceProject | null> {
  const text = await file.text();
  try {
    return parseWorkspaceProject(JSON.parse(text));
  } catch {
    return null;
  }
}
