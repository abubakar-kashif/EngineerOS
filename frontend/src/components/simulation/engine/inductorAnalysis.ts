/**
 * Inductor Analysis
 * Person 1: Simulation Engine
 */

export interface InductorResult {
  inductance: number;
  voltage: number;
  current: number;
  energy: number;
}

export function analyzeInductorDC(
  inductance: number,
  current: number
): InductorResult {
  const voltage = 0;
  const energy = 0.5 * inductance * current * current;

  return {
    inductance,
    voltage,
    current,
    energy,
  };
}

export function timeConstantRL(inductance: number, resistance: number): number {
  if (resistance === 0) return Infinity;
  return inductance / resistance;
}

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

export function storedEnergyInductor(inductance: number, current: number): number {
  return 0.5 * inductance * current * current;
}

export function inductiveReactance(inductance: number, frequency: number): number {
  return 2 * Math.PI * frequency * inductance;
}

export function inductorVoltage(inductance: number, currentChange: number, timeChange: number): number {
  if (timeChange === 0) return 0;
  return inductance * (currentChange / timeChange);
}