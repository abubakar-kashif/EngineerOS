/**
 * Engineering unit formatting utilities.
 */

/** Format a numeric value with an appropriate SI prefix and unit symbol */
export function formatValue(value: number, unit: string): string {
  const abs = Math.abs(value);
  if (abs === 0) return `0 ${unit}`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)} G${unit}`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)} M${unit}`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)} k${unit}`;
  if (abs >= 1) return `${value.toFixed(2)} ${unit}`;
  if (abs >= 1e-3) return `${(value * 1e3).toFixed(2)} m${unit}`;
  if (abs >= 1e-6) return `${(value * 1e6).toFixed(2)} μ${unit}`;
  if (abs >= 1e-9) return `${(value * 1e9).toFixed(2)} n${unit}`;
  return `${value.toExponential(2)} ${unit}`;
}

/** Format voltage */
export function formatVoltage(v: number): string {
  return formatValue(v, "V");
}

/** Format current */
export function formatCurrent(i: number): string {
  return formatValue(i, "A");
}

/** Format resistance */
export function formatResistance(r: number): string {
  return formatValue(r, "Ω");
}

/** Format power */
export function formatPower(p: number): string {
  return formatValue(p, "W");
}

/** Format capacitance */
export function formatCapacitance(c: number): string {
  return formatValue(c, "F");
}

/** Format inductance */
export function formatInductance(l: number): string {
  return formatValue(l, "H");
}

/** Get the base SI unit label for a component property */
export function unitForProperty(_type: string, prop: string): string {
  if (prop === "voltage") return "V";
  if (prop === "current") return "A";
  if (prop === "resistance" || prop === "internalResistance") return "Ω";
  if (prop === "capacitance") return "F";
  if (prop === "inductance") return "H";
  if (prop === "power" || prop === "powerRating") return "W";
  if (prop === "forwardVoltage") return "V";
  if (prop === "forwardCurrent" || prop === "maxCurrent") return "A";
  if (prop === "tolerance") return "%";
  return "";
}
