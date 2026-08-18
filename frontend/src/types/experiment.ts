export type ExperimentDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

export interface Experiment {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  objective: string | null;
  theory: string | null;
  difficulty: ExperimentDifficulty;
  category: string;
  duration_minutes: number;
  status: string;
}