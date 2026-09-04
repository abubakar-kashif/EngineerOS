/**
 * Structured workspace project format for Save / Open.
 * Preserves editable circuit state (not a screenshot).
 */

import type { EditorCircuit } from "../components/simulation/editorTypes";
import { normalizeEditorCircuit } from "../components/simulation/wireTopology";

export const WORKSPACE_PROJECT_VERSION = 1;
export const WORKSPACE_STORAGE_KEY = "engineeros.sim.workspace.v1";
export const WORKSPACE_FILE_EXTENSION = "engineeros.json";

export interface WorkspaceViewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorkspaceProject {
  version: number;
  kind: "engineeros-simulation-workspace";
  savedAt: string;
  experimentId: string | null;
  circuit: EditorCircuit;
  viewport?: WorkspaceViewport | null;
}

export function createWorkspaceProject(
  circuit: EditorCircuit,
  options: {
    experimentId?: string | null;
    viewport?: WorkspaceViewport | null;
  } = {},
): WorkspaceProject {
  return {
    version: WORKSPACE_PROJECT_VERSION,
    kind: "engineeros-simulation-workspace",
    savedAt: new Date().toISOString(),
    experimentId: options.experimentId ?? null,
    circuit: structuredClone(circuit),
    viewport: options.viewport ?? null,
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
  if (!Array.isArray(circuit.connections)) return null;
  const normalizedCircuit = normalizeEditorCircuit({
    ...circuit,
    junctions: circuit.junctions ?? [],
  });
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
  };
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
