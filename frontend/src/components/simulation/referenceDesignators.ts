/**
 * Generate reference designators (R1, R2, C1, ...) for components.
 * This is an editor concern.
 */

import type { ComponentType } from './engine';

const prefixMap: Record<ComponentType, string> = {
  resistor: 'R',
  capacitor: 'C',
  inductor: 'L',
  diode: 'D',
  led: 'LED',
  switch: 'SW',
  voltage_source: 'V',
  current_source: 'I',
  ground: 'GND',
  voltmeter: 'VM',
  ammeter: 'AM',
};

// Global counters (per prefix) – used if no existing labels provided
const counters: Record<string, number> = {};

/**
 * Generate the next designator for a given component type.
 * @param type - Component type
 * @param existingLabels - Optional set of already used labels to avoid collisions.
 *                         If not provided, uses a global counter (simpler but may collide on load).
 */
export function nextDesignator(type: ComponentType, existingLabels?: Set<string>): string {
  const prefix = prefixMap[type] || 'X';
  let counter = 1;

  if (existingLabels) {
    // Find the smallest positive integer not used in existing labels
    while (existingLabels.has(`${prefix}${counter}`)) {
      counter++;
    }
    return `${prefix}${counter}`;
  }

  // Fallback to global counter (less safe)
  if (!counters[prefix]) counters[prefix] = 0;
  counters[prefix] += 1;
  return `${prefix}${counters[prefix]}`;
}

export function resetDesignators(): void {
  for (const key in counters) counters[key] = 0;
}