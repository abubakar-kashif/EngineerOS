import { apiRequest } from "./api";

export type ProgressStatus = "in_progress" | "completed";

export interface Progress {
  id: number;
  experiment_id: string;
  status: ProgressStatus;
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

export async function updateProgress(
  data: UpdateProgressRequest,
): Promise<Progress> {
  return apiRequest<Progress>("/progress", {
    method: "POST",
    body: JSON.stringify(data),
  });
}