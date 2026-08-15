export type ExperimentDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

export interface Experiment {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  difficulty: ExperimentDifficulty;
  category: string;
  duration_minutes: number;
}