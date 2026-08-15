import { mockExperiments } from "../data/mockExperiments";
import type { Experiment } from "../types/experiment";

export async function getExperiments(): Promise<Experiment[]> {
  return mockExperiments;
}

export async function getExperimentById(
  id: string,
): Promise<Experiment | undefined> {
  return mockExperiments.find((experiment) => experiment.id === id);
}