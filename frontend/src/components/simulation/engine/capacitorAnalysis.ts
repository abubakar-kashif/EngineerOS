/**
 * Capacitor Analysis
 * Person 1: Simulation Engine
 */

export interface CapacitorResult {
  capacitance: number;
  voltage: number;
  current: number;
  energy: number;
  charge: number;
}

export function analyzeCapacitorDC(
  capacitance: number,
  voltage: number
): CapacitorResult {
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

export function timeConstant(resistance: number, capacitance: number): number {
  return resistance * capacitance;
}

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

export function storedEnergy(capacitance: number, voltage: number): number {
  return 0.5 * capacitance * voltage * voltage;
}

export function storedCharge(capacitance: number, voltage: number): number {
  return capacitance * voltage;
}

export function capacitiveReactance(capacitance: number, frequency: number): number {
  if (frequency === 0) return Infinity;
  return 1 / (2 * Math.PI * frequency * capacitance);
}