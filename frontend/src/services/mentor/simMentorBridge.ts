/** Shared Lab ↔ full Mentor conversation/snapshot keys. Not a second store. */

export function simMentorConversationStorageKey(experimentId: string | null): string {
  return `engineeros.sim-mentor.conversation:${experimentId ?? "lab"}`;
}

export function simMentorSnapshotStorageKey(experimentId: string | null): string {
  return `engineeros.sim-mentor.snapshot:${experimentId ?? "lab"}`;
}

export type StoredCircuitSnapshot = {
  components: Array<Record<string, unknown>>;
  connections: Array<Record<string, unknown>>;
};

export function saveSimMentorSnapshot(
  experimentId: string | null,
  snapshot: StoredCircuitSnapshot | null,
): void {
  try {
    const key = simMentorSnapshotStorageKey(experimentId);
    if (!snapshot) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Private mode / quota — Mentor expand still works without the snapshot.
  }
}

export function loadSimMentorSnapshot(
  experimentId: string | null,
): StoredCircuitSnapshot | null {
  try {
    const raw = sessionStorage.getItem(simMentorSnapshotStorageKey(experimentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCircuitSnapshot;
    if (!parsed || !Array.isArray(parsed.components) || !Array.isArray(parsed.connections)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildMentorExpandHref(options: {
  experimentId?: string | null;
  simulationRunId?: string | null;
  simStatus?: string | null;
  conversationId?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options.experimentId) params.set("experiment", options.experimentId);
  params.set("stage", "simulation");
  if (options.simStatus) params.set("sim", options.simStatus);
  if (options.simulationRunId) params.set("simulation", options.simulationRunId);
  if (options.conversationId) params.set("conversation", options.conversationId);
  const qs = params.toString();
  return qs ? `/mentor?${qs}` : "/mentor";
}
