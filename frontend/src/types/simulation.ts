export type SimulationMode = "series" | "parallel";

export type SimulationStatus =
  | "ready"
  | "running"
  | "completed"
  | "stopped"
  | "error";

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

/* ---- Phase 5 extensions ---- */

export type CircuitComponentType =
  | "voltage_source"
  | "current_source"
  | "resistor"
  | "capacitor"
  | "inductor"
  | "diode"
  | "ground";

export interface CircuitComponent {
  id: string;
  type: CircuitComponentType;
  label: string;
  value: number;
  unit: string;
}

export interface Measurement {
  label: string;
  value: number;
  unit: string;
}

export interface SimulationRun {
  id: number;
  timestamp: string;
  status: SimulationStatus;
  result: SimulationResult | null;
  mode: SimulationMode;
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export type WorkspaceTab = "overview" | "circuit-setup" | "simulation" | "results";
