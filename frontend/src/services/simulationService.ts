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

function validatePositiveFinite(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than 0.`);
  }
}

export function calculateSeriesCircuit(r1: number): number {
  validatePositiveFinite(r1, "R1");

  return r1;
}

export function calculateParallelCircuit(
  r1: number,
  r2: number
): number {
  validatePositiveFinite(r1, "R1");
  validatePositiveFinite(r2, "R2");

  const denominator = r1 + r2;

  if (!Number.isFinite(denominator) || denominator <= 0) {
    throw new Error("Invalid parallel resistance values.");
  }

  const totalResistance = (r1 * r2) / denominator;

  if (
    !Number.isFinite(totalResistance) ||
    totalResistance <= 0
  ) {
    throw new Error("Simulation produced an invalid resistance.");
  }

  return totalResistance;
}

export function calculateCurrent(
  voltage: number,
  totalResistance: number
): number {
  if (!Number.isFinite(voltage) || voltage < 0) {
    throw new Error("Voltage must be a valid non-negative number.");
  }

  validatePositiveFinite(totalResistance, "Total resistance");

  const current = voltage / totalResistance;

  if (!Number.isFinite(current)) {
    throw new Error("Simulation produced an invalid current.");
  }

  return current;
}

export function calculatePower(
  voltage: number,
  current: number
): number {
  if (
    !Number.isFinite(voltage) ||
    !Number.isFinite(current)
  ) {
    throw new Error("Invalid voltage or current.");
  }

  const power = voltage * current;

  if (!Number.isFinite(power)) {
    throw new Error("Simulation produced an invalid power value.");
  }

  return power;
}

export function runSimulation(
  input: SimulationInput
): SimulationResult {
  const {
    voltage,
    r1,
    r2,
    mode,
    switchOn,
  } = input;

  if (!Number.isFinite(voltage) || voltage < 0) {
    throw new Error("Please enter a valid voltage.");
  }

  validatePositiveFinite(r1, "R1");

  let totalResistance: number;

  if (mode === "series") {
    totalResistance = calculateSeriesCircuit(r1);
  } else {
    if (r2 === undefined) {
      throw new Error("R2 is required for parallel mode.");
    }

    totalResistance = calculateParallelCircuit(
      r1,
      r2
    );
  }

  if (!switchOn) {
    return {
      totalResistance,
      current: 0,
      power: 0,
    };
  }

  const current = calculateCurrent(
    voltage,
    totalResistance
  );

  const power = calculatePower(
    voltage,
    current
  );

  return {
    totalResistance,
    current,
    power,
  };
}