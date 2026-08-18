export type ExperimentDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

export interface Experiment {
  id: string;
  title: string;
  slug: string;
  short_description: string;

  description?: string;
  objective?: string;
  theory?: string;
  components?: string[];

  difficulty: ExperimentDifficulty;
  category: string;
  duration_minutes: number;
}