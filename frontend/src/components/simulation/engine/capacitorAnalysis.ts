/**
 * Capacitor Analysis
 * Person 1: Simulation Engine
 * Calculates capacitor behavior in DC circuits
 */

export interface CapacitorResult {
  capacitance: number; // F
  voltage: number; // V
  current: number; // A
  energy: number; // J (joules)
  charge: number; // C (coulombs)
}

/**
 * Analyze capacitor in DC steady state
 * In DC steady state, capacitor behaves as open circuit
 */
export function analyzeCapacitorDC(
  capacitance: number,
  voltage: number
): CapacitorResult {
  // In DC steady state, current through capacitor is 0
  const current = 0;
  const energy = 0.5 * capacitance * voltage * voltage;
  const charge = capacitance * voltage;

  return {
    capacitance,
    voltage,
    current,
    energy,
    charge,
  };
}

/**
 * Calculate RC time constant
 * τ = R * C
 */
export function timeConstant(resistance: number, capacitance: number): number {
  return resistance * capacitance;
}

/**
 * Calculate capacitor charging voltage at time t
 * Vc(t) = V * (1 - e^(-t/RC))
 */
export function chargingVoltage(
  sourceVoltage: number,
  resistance: number,
  capacitance: number,
  time: number
): number {
  const tau = timeConstant(resistance, capacitance);
  if (tau === 0) return sourceVoltage;
  return sourceVoltage * (1 - Math.exp(-time / tau));
}

/**
 * Calculate capacitor charging current at time t
 * Ic(t) = (V / R) * e^(-t/RC)
 */
export function chargingCurrent(
  sourceVoltage: number,
  resistance: number,
  capacitance: number,
  time: number
): number {
  const tau = timeConstant(resistance, capacitance);
  if (tau === 0) return 0;
  return (sourceVoltage / resistance) * Math.exp(-time / tau);
}

/**
 * Calculate capacitor discharging voltage at time t
 * Vc(t) = V0 * e^(-t/RC)
 */
export function dischargingVoltage(
  initialVoltage: number,
  resistance: number,
  capacitance: number,
  time: number
): number {
  const tau = timeConstant(resistance, capacitance);
  if (tau === 0) return 0;
  return initialVoltage * Math.exp(-time / tau);
}

/**
 * Calculate capacitor discharging current at time t
 * Ic(t) = (V0 / R) * e^(-t/RC)
 */
export function dischargingCurrent(
  initialVoltage: number,
  resistance: number,
  capacitance: number,
  time: number
): number {
  const tau = timeConstant(resistance, capacitance);
  if (tau === 0) return 0;
  return (initialVoltage / resistance) * Math.exp(-time / tau);
}

/**
 * Calculate time to reach a specific voltage during charging
 * t = -RC * ln(1 - Vc/V)
 */
export function timeToCharge(
  sourceVoltage: number,
  targetVoltage: number,
  resistance: number,
  capacitance: number
): number {
  if (targetVoltage >= sourceVoltage) return Infinity;
  const tau = timeConstant(resistance, capacitance);
  if (tau === 0) return 0;
  return -tau * Math.log(1 - (targetVoltage / sourceVoltage));
}

/**
 * Calculate energy stored in capacitor
 * E = 0.5 * C * V^2
 */
export function storedEnergy(capacitance: number, voltage: number): number {
  return 0.5 * capacitance * voltage * voltage;
}

/**
 * Calculate charge stored in capacitor
 * Q = C * V
 */
export function storedCharge(capacitance: number, voltage: number): number {
  return capacitance * voltage;
}

/**
 * Calculate capacitive reactance at frequency f
 * Xc = 1 / (2 * π * f * C)
 */
export function capacitiveReactance(capacitance: number, frequency: number): number {
  if (frequency === 0) return Infinity;
  return 1 / (2 * Math.PI * frequency * capacitance);
}