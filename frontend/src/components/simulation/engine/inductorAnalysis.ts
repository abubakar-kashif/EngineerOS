/**
 * Inductor Analysis
 * Person 1: Simulation Engine
 * Calculates inductor behavior in DC circuits
 */

export interface InductorResult {
  inductance: number; // H
  voltage: number; // V
  current: number; // A
  energy: number; // J (joules)
}

/**
 * Analyze inductor in DC steady state
 * In DC steady state, inductor behaves as short circuit
 */
export function analyzeInductorDC(
  inductance: number,
  current: number
): InductorResult {
  // In DC steady state, voltage across inductor is 0
  const voltage = 0;
  const energy = 0.5 * inductance * current * current;

  return {
    inductance,
    voltage,
    current,
    energy,
  };
}

/**
 * Calculate RL time constant
 * τ = L / R
 */
export function timeConstantRL(inductance: number, resistance: number): number {
  if (resistance === 0) return Infinity;
  return inductance / resistance;
}

/**
 * Calculate inductor current during charging at time t
 * IL(t) = (V/R) * (1 - e^(-Rt/L))
 */
export function chargingCurrentRL(
  sourceVoltage: number,
  resistance: number,
  inductance: number,
  time: number
): number {
  const tau = timeConstantRL(inductance, resistance);
  if (tau === Infinity) return 0;
  return (sourceVoltage / resistance) * (1 - Math.exp(-time / tau));
}

/**
 * Calculate inductor voltage during charging at time t
 * VL(t) = V * e^(-Rt/L)
 */
export function chargingVoltageRL(
  sourceVoltage: number,
  resistance: number,
  inductance: number,
  time: number
): number {
  const tau = timeConstantRL(inductance, resistance);
  if (tau === Infinity) return sourceVoltage;
  return sourceVoltage * Math.exp(-time / tau);
}

/**
 * Calculate inductor current during discharging at time t
 * IL(t) = I0 * e^(-Rt/L)
 */
export function dischargingCurrentRL(
  initialCurrent: number,
  resistance: number,
  inductance: number,
  time: number
): number {
  const tau = timeConstantRL(inductance, resistance);
  if (tau === Infinity) return initialCurrent;
  return initialCurrent * Math.exp(-time / tau);
}

/**
 * Calculate time to reach a specific current during charging
 * t = -(L/R) * ln(1 - (I*R/V))
 */
export function timeToChargeRL(
  sourceVoltage: number,
  targetCurrent: number,
  resistance: number,
  inductance: number
): number {
  const maxCurrent = sourceVoltage / resistance;
  if (targetCurrent >= maxCurrent) return Infinity;
  const tau = timeConstantRL(inductance, resistance);
  if (tau === Infinity) return 0;
  return -tau * Math.log(1 - (targetCurrent / maxCurrent));
}

/**
 * Calculate energy stored in inductor
 * E = 0.5 * L * I^2
 */
export function storedEnergyInductor(inductance: number, current: number): number {
  return 0.5 * inductance * current * current;
}

/**
 * Calculate inductive reactance at frequency f
 * XL = 2 * π * f * L
 */
export function inductiveReactance(inductance: number, frequency: number): number {
  return 2 * Math.PI * frequency * inductance;
}

/**
 * Calculate voltage across inductor
 * V = L * di/dt
 */
export function inductorVoltage(inductance: number, currentChange: number, timeChange: number): number {
  if (timeChange === 0) return 0;
  return inductance * (currentChange / timeChange);
}