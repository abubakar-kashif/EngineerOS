/**
 * Device-local experiment progress tracking for anonymous visitors.
 * Signed-in users are tracked on the server instead — see
 * services/progressService.ts (getStatusMap / saveStatus).
 */

const STORAGE_KEY = "engineeros_experiment_progress";

export type UserProgress = "not_started" | "in_progress" | "completed";

type ProgressMap = Record<string, UserProgress>;

function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(map: ProgressMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getExperimentProgress(id: string): UserProgress {
  return loadProgress()[id] ?? "not_started";
}

export function setExperimentProgress(id: string, status: UserProgress) {
  const map = loadProgress();
  map[id] = status;
  saveProgress(map);
}

export function getAllProgress(): ProgressMap {
  return loadProgress();
}

/** Recently viewed experiment IDs */
const RECENT_KEY = "engineeros_recent_experiments";
const MAX_RECENT = 5;

export function addRecentExperiment(id: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const filtered = ids.filter((i) => i !== id);
    filtered.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch {
    // Ignore storage errors
  }
}

export function getRecentExperiments(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
