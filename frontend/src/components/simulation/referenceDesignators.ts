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

const counters: Record<string, number> = {};

export function nextDesignator(type: ComponentType): string {
  const prefix = prefixMap[type] || 'X';
  if (!counters[prefix]) counters[prefix] = 0;
  counters[prefix] += 1;
  return `${prefix}${counters[prefix]}`;
}

export function resetDesignators(): void {
  for (const key in counters) counters[key] = 0;
}