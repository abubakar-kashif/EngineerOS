/**
 * Auto-assign unique reference designators (R1, R2, C1, LED1, …) to components.
 * No two components of the same type share a designator.
 */
import type { ComponentType } from "./types";

/** Prefix map for reference designators */
const PREFIX: Record<ComponentType, string> = {
  voltage_source: "V",
  current_source: "I",
  resistor: "R",
  capacitor: "C",
  inductor: "L",
  diode: "D",
  led: "LED",
  switch: "SW",
  ground: "GND",
  voltmeter: "VM",
  ammeter: "AM",
};

/** Generate the next available reference designator for a given type */
export function nextDesignator(
  type: ComponentType,
  existingLabels: Set<string>,
): string {
  const prefix = PREFIX[type];
  let n = 1;
  while (existingLabels.has(`${prefix}${n}`)) {
    n++;
  }
  return `${prefix}${n}`;
}

/** Assign reference designators to all components that lack one */
export function assignDesignators(
  components: { type: ComponentType; label: string }[],
): void {
  const used = new Set<string>();
  // First pass: collect existing labels
  for (const c of components) {
    if (c.label) used.add(c.label);
  }
  // Second pass: assign missing labels
  for (const c of components) {
    if (!c.label || c.label === c.type) {
      c.label = nextDesignator(c.type, used);
      used.add(c.label);
    }
  }
}

/** Get the prefix for a component type */
export function getPrefix(type: ComponentType): string {
  return PREFIX[type];
}
