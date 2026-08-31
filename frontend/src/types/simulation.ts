export type SimulationMode = "series" | "parallel";

export interface SimulationInput {
  voltage: number;
  r1: number;
  r2?: number;
  mode: SimulationMode;
  switchOn: boolean;
}

export interface SimulationResult {
  totalResistance: number;
  current: number;
  power: number;
}

export interface SimulationState {
  voltage: string;
  r1: string;
  r2: string;
  mode: SimulationMode;
  running: boolean;
  switchOn: boolean;
  error: string;
  result: SimulationResult | null;
}