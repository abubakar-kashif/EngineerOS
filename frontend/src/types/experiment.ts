export type ExperimentDifficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

export interface ExperimentFormulaVariable {
  symbol: string;
  name: string;
}

export interface ExperimentFormula {
  expression: string;
  variables: ExperimentFormulaVariable[];
}

export interface ExperimentVariable {
  symbol: string;
  name: string;
  unit: string | null;
  description: string | null;
}

export interface ExperimentComponent {
  name: string;
  quantity: number;
  spec: string | null;
}

export interface CircuitDiagram {
  art: string;
  caption: string | null;
}

export interface CommonMistake {
  mistake: string;
  consequence: string;
}

export interface SimulationConfiguration {
  mode: string;
  parameters: Record<string, number>;
}

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
  formulas?: ExperimentFormula[];
  components?: ExperimentComponent[];
  procedure?: string[];
  expected_results?: string[];
  prerequisites?: string[];
  learning_outcomes?: string[];
  historical_background?: string | null;
  variables?: ExperimentVariable[];
  circuit_diagram?: CircuitDiagram | null;
  common_mistakes?: CommonMistake[];
  safety_precautions?: string[];
  observation_guidance?: string[];
  real_world_applications?: string[];
  related_experiments?: string[];
  simulation_configuration?: SimulationConfiguration | null;
}
