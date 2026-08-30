/**
 * Resistor Analysis
 * Person 1: Simulation Engine
 * Calculates resistor behavior in DC circuits
 */

export interface ResistorResult {
  resistance: number; // Ω
  voltage: number; // V
  current: number; // A
  power: number; // W
  tolerance?: number; // percentage
}

/**
 * Calculate resistor behavior
 */
export function analyzeResistor(
  resistance: number,
  voltage?: number,
  current?: number
): ResistorResult {
  let v = voltage || 0;
  let i = current || 0;
  
  // Calculate missing values using Ohm's Law
  if (voltage !== undefined && current !== undefined) {
    // Both provided, just calculate power
  } else if (voltage !== undefined) {
    // V = IR => I = V/R
    if (resistance > 0) {
      i = voltage / resistance;
    }
  } else if (current !== undefined) {
    // V = IR => V = I * R
    v = current * resistance;
  } else {
    throw new Error('Either voltage or current must be provided');
  }

  const power = v * i;

  return {
    resistance,
    voltage: v,
    current: i,
    power,
  };
}

/**
 * Calculate equivalent resistance for series resistors
 * Req = R1 + R2 + R3 + ...
 */
export function seriesResistance(resistances: number[]): number {
  return resistances.reduce((sum, r) => sum + r, 0);
}

/**
 * Calculate equivalent resistance for parallel resistors
 * 1/Req = 1/R1 + 1/R2 + 1/R3 + ...
 */
export function parallelResistance(resistances: number[]): number {
  if (resistances.length === 0) return 0;
  
  const reciprocalSum = resistances.reduce((sum, r) => {
    if (r === 0) return Infinity;
    return sum + (1 / r);
  }, 0);
  
  return reciprocalSum > 0 ? 1 / reciprocalSum : 0;
}

/**
 * Calculate voltage divider output
 * Vout = Vin * (R2 / (R1 + R2))
 */
export function voltageDivider(
  vin: number,
  r1: number,
  r2: number
): { vout: number; current: number; powerR1: number; powerR2: number } {
  const totalResistance = r1 + r2;
  const current = vin / totalResistance;
  const vout = vin * (r2 / totalResistance);
  
  return {
    vout,
    current,
    powerR1: current * current * r1,
    powerR2: current * current * r2,
  };
}

/**
 * Calculate current divider output
 * Iout = Iin * (R_total / R_branch)
 */
export function currentDivider(
  iin: number,
  totalResistance: number,
  branchResistance: number
): number {
  if (branchResistance === 0) return Infinity;
  return iin * (totalResistance / branchResistance);
}

/**
 * Calculate resistor color code (for educational purposes)
 * Returns approximate resistance value from color bands
 */
export function colorCodeToResistance(
  color1: string,
  color2: string,
  multiplier: string,
  tolerance?: string
): { resistance: number; tolerance: number } {
  const colorValues: Record<string, number> = {
    black: 0, brown: 1, red: 2, orange: 3, yellow: 4,
    green: 5, blue: 6, violet: 7, grey: 8, white: 9,
  };
  
  const multipliers: Record<string, number> = {
    black: 1, brown: 10, red: 100, orange: 1000,
    yellow: 10000, green: 100000, blue: 1000000,
    gold: 0.1, silver: 0.01,
  };
  
  const tolerances: Record<string, number> = {
    brown: 1, red: 2, green: 0.5, blue: 0.25,
    violet: 0.1, gold: 5, silver: 10,
  };

  const val1 = colorValues[color1] || 0;
  const val2 = colorValues[color2] || 0;
  const mult = multipliers[multiplier] || 1;
  
  const resistance = (val1 * 10 + val2) * mult;
  const toleranceValue = tolerance ? (tolerances[tolerance] || 20) : 20;

  return {
    resistance,
    tolerance: toleranceValue,
  };
}

/**
 * Calculate resistor power rating requirement
 * Returns minimum power rating needed
 */
export function requiredPowerRating(current: number, resistance: number): number {
  return current * current * resistance;
}

/**
 * Check if resistor value is standard (E-series)
 */
export function isStandardValue(resistance: number): boolean {
  const standardValues = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  const magnitude = Math.pow(10, Math.floor(Math.log10(resistance)));
  const normalized = resistance / magnitude;
  
  return standardValues.some(val => Math.abs(normalized - val) < 0.01);
}