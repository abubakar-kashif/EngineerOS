import { ApiError, apiRequest } from "./api";
import type { Experiment } from "../types/experiment";

export async function getExperiments(): Promise<Experiment[]> {
  return apiRequest<Experiment[]>("/experiments");
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