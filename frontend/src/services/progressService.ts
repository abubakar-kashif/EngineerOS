import { apiRequest, getAuthToken } from "./api";
import { getAllProgress, setExperimentProgress, type UserProgress } from "../utils/experimentProgress";

export type ProgressStatus = "in_progress" | "completed";

export interface Progress {
  id: number;
  experiment_id: string;
  status: ProgressStatus;
  /** ISO date string of the last update (used for the activity feed). */
  updated_at: string;
}

export interface ProgressSummary {
  completed_experiments: number;
  completed_quizzes: number;
  average_quiz_score: number;
  overall_progress: number;
}

export interface UpdateProgressRequest {
  experiment_id: string;
  status: ProgressStatus;
}

export async function getProgress(): Promise<ProgressSummary> {
  return apiRequest<ProgressSummary>("/progress");
}

/** Per-experiment progress rows for the signed-in user (auth required). */
export async function getMyProgress(): Promise<Progress[]> {
  return apiRequest<Progress[]>("/progress/me");
}

/**
 * Account-aware experiment statuses: the signed-in user's server rows, or
 * this device's local tracking for anonymous visitors. Local tracking never
 * leaks into a signed-in view, so a new account starts clean.
 */
export async function getStatusMap(): Promise<Record<string, UserProgress>> {
  if (!getAuthToken()) return getAllProgress();

  const rows = await getMyProgress();
  const map: Record<string, UserProgress> = {};
  for (const row of rows) {
    map[row.experiment_id] = row.status === "completed" ? "completed" : "in_progress";
  }
  return map;
}

/**
 * Persists a status change — to the account on the server when signed in,
 * to this device's local tracking otherwise.
 */
export async function saveStatus(
  experimentId: string,
  status: UserProgress,
): Promise<void> {
  if (!getAuthToken()) {
    setExperimentProgress(experimentId, status);
    return;
  }
  // The API has no "not started" state — a missing row means not started.
  if (status === "not_started") return;
  await updateProgress({ experiment_id: experimentId, status });
}

export async function updateProgress(
  data: UpdateProgressRequest,
): Promise<Progress> {
  return apiRequest<Progress>("/progress", {
    method: "POST",
    body: JSON.stringify(data),
  });
}