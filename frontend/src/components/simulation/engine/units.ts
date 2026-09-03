/**
 * Unit normalization for EngineerOS Simulation Engine
 * Person 1: Simulation Engine
 * All values stored internally in SI base units
 */

export type Unit = 'V' | 'A' | 'Ω' | 'F' | 'H' | 'W' | 's';

export interface UnitValue {
  value: number;
  unit: Unit;
}

/**
 * Normalize a value to SI base unit
 * Example: 1kΩ → 1000 Ω
 */
export function normalizeResistance(value: number, prefix?: string): number {
  const multipliers: Record<string, number> = {
    '': 1,
    'k': 1e3,
    'M': 1e6,
    'm': 1e-3,
    'µ': 1e-6,
    'n': 1e-9,
  };
  return value * (multipliers[prefix || ''] || 1);
}

/**
 * Normalize voltage value
 */
export function normalizeVoltage(value: number, prefix?: string): number {
  const multipliers: Record<string, number> = {
    '': 1,
    'k': 1e3,
    'M': 1e6,
    'm': 1e-3,
    'µ': 1e-6,
  };
  return value * (multipliers[prefix || ''] || 1);
}

/**
 * Normalize current value
 */
export function normalizeCurrent(value: number, prefix?: string): number {
  const multipliers: Record<string, number> = {
    '': 1,
    'k': 1e3,
    'M': 1e6,
    'm': 1e-3,
    'µ': 1e-6,
  };
  return value * (multipliers[prefix || ''] || 1);
}

/**
 * Normalize capacitance value
 */
export function normalizeCapacitance(value: number, prefix?: string): number {
  const multipliers: Record<string, number> = {
    '': 1,
    'm': 1e-3,
    'µ': 1e-6,
    'n': 1e-9,
    'p': 1e-12,
  };
  return value * (multipliers[prefix || ''] || 1);
}

/**
 * Normalize inductance value
 */
export function normalizeInductance(value: number, prefix?: string): number {
  const multipliers: Record<string, number> = {
    '': 1,
    'm': 1e-3,
    'µ': 1e-6,
    'n': 1e-9,
  };
  return value * (multipliers[prefix || ''] || 1);
}

/**
 * Format a value with appropriate SI prefix
 * Example: 1000 → 1 k
 */
export function formatWithPrefix(value: number, baseUnit: string): string {
  const prefixes = [
    { prefix: 'M', divisor: 1e6 },
    { prefix: 'k', divisor: 1e3 },
    { prefix: '', divisor: 1 },
    { prefix: 'm', divisor: 1e-3 },
    { prefix: 'µ', divisor: 1e-6 },
    { prefix: 'n', divisor: 1e-9 },
  ];

  for (const p of prefixes) {
    const scaled = value / p.divisor;
    if (Math.abs(scaled) >= 1 && Math.abs(scaled) < 1000) {
      return `${scaled.toFixed(3)} ${p.prefix}${baseUnit}`;
    }
  }
  return `${value.toFixed(6)} ${baseUnit}`;
}

/**
 * Tolerance for floating-point comparisons
 */
export const NUMERICAL_TOLERANCE = {
  absolute: 1e-9,
  relative: 1e-6,
};

export function areEqual(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  const maxAbs = Math.max(Math.abs(a), Math.abs(b));
  return diff <= NUMERICAL_TOLERANCE.absolute || 
         diff <= NUMERICAL_TOLERANCE.relative * maxAbs;
}