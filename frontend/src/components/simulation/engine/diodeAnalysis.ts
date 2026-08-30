/**
 * Diode and LED Analysis
 * Person 1: Simulation Engine
 * Calculates diode/LED behavior in DC circuits
 */

export interface DiodeResult {
  forwardVoltage: number; // V
  current: number; // A
  power: number; // W
  isForwardBiased: boolean;
  voltageDrop: number; // V
}

export interface LEDResult extends DiodeResult {
  forwardVoltage: number; // V
  current: number; // A
  power: number; // W
  brightness?: number; // arbitrary units
  isOn: boolean;
}

/**
 * Analyze diode behavior
 * Uses simplified educational model
 */
export function analyzeDiode(
  sourceVoltage: number,
  forwardVoltage: number, // typically 0.7V for silicon diode
  resistance: number,
  reverseBiased: boolean = false
): DiodeResult {
  if (reverseBiased) {
    // Reverse biased: diode blocks current
    return {
      forwardVoltage,
      current: 0,
      power: 0,
      isForwardBiased: false,
      voltageDrop: sourceVoltage,
    };
  }

  // Forward biased: diode conducts
  const voltageDrop = forwardVoltage;
  const current = (sourceVoltage - forwardVoltage) / resistance;
  
  if (current < 0) {
    // Not enough voltage to forward bias
    return {
      forwardVoltage,
      current: 0,
      power: 0,
      isForwardBiased: false,
      voltageDrop: sourceVoltage,
    };
  }

  const power = current * voltageDrop;

  return {
    forwardVoltage,
    current,
    power,
    isForwardBiased: true,
    voltageDrop,
  };
}

/**
 * Analyze LED behavior
 * LED requires current limiting resistor
 */
export function analyzeLED(
  sourceVoltage: number,
  ledForwardVoltage: number, // typically 1.8V-3.3V
  resistance: number,
  maxCurrent?: number // typical max current for LED
): LEDResult {
  // Check if there's a current limiting resistor
  if (resistance === 0) {
    // No current limit - this should be caught by validator
    return {
      forwardVoltage: ledForwardVoltage,
      current: Infinity,
      power: Infinity,
      isForwardBiased: true,
      voltageDrop: ledForwardVoltage,
      isOn: false,
      brightness: 0,
    };
  }

  const voltageDrop = ledForwardVoltage;
  const current = (sourceVoltage - ledForwardVoltage) / resistance;
  
  if (current < 0) {
    // Not enough voltage to turn on LED
    return {
      forwardVoltage: ledForwardVoltage,
      current: 0,
      power: 0,
      isForwardBiased: false,
      voltageDrop: sourceVoltage,
      isOn: false,
      brightness: 0,
    };
  }

  const power = current * voltageDrop;
  
  // Check if current exceeds max
  const isOn = current > 0 && (maxCurrent === undefined || current <= maxCurrent);
  
  // Simple brightness model: normalized to 0-1 range
  const brightness = maxCurrent ? Math.min(current / maxCurrent, 1) : Math.min(current / 0.02, 1);

  return {
    forwardVoltage: ledForwardVoltage,
    current,
    power,
    isForwardBiased: true,
    voltageDrop,
    isOn,
    brightness,
  };
}

/**
 * Calculate series resistor for LED
 * R = (Vs - Vf) / If
 */
export function calculateLEDResistor(
  sourceVoltage: number,
  ledForwardVoltage: number,
  desiredCurrent: number // typically 10-20mA
): number {
  return (sourceVoltage - ledForwardVoltage) / desiredCurrent;
}

/**
 * Check if LED has proper current limiting
 */
export function hasCurrentLimiting(
  sourceVoltage: number,
  ledForwardVoltage: number,
  resistance: number,
  maxCurrent: number = 0.02 // 20mA typical
): boolean {
  if (resistance === 0) return false;
  const current = (sourceVoltage - ledForwardVoltage) / resistance;
  return current > 0 && current <= maxCurrent;
}

/**
 * Calculate diode current using ideal diode equation
 * Simplified version
 */
export function diodeCurrent(
  voltage: number,
  saturationCurrent: number = 1e-12,
  thermalVoltage: number = 0.026 // 26mV at room temperature
): number {
  return saturationCurrent * (Math.exp(voltage / thermalVoltage) - 1);
}

/**
 * Calculate voltage across diode for given current
 * Simplified version
 */
export function diodeVoltage(
  current: number,
  saturationCurrent: number = 1e-12,
  thermalVoltage: number = 0.026
): number {
  if (current <= 0) return 0;
  return thermalVoltage * Math.log(current / saturationCurrent + 1);
}