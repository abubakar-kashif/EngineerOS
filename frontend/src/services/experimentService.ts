import { ApiError, apiRequest } from "./api";
import type { Experiment } from "../types/experiment";

export interface ExperimentListResponse {
  items: Experiment[];
  total: number;
}

export async function getExperiments(): Promise<ExperimentListResponse> {
  return apiRequest<ExperimentListResponse>("/experiments");
}

export async function getExperimentById(
  id: string,
): Promise<Experiment | undefined> {
  try {
    return await apiRequest<Experiment>(
      `/experiments/${id}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }

    throw error;
  }
}