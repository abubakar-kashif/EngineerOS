/**
 * Utility functions for editor UI.
 */

import type { ComponentInstance } from './editorTypes';
import type { ComponentType } from './engine';

/**
 * Compute the world position of a component's terminal on the canvas.
 * This is a simple approximation; can be refined.
 */
export function getTerminalWorldPosition(
  component: ComponentInstance,
  terminalId: string // e.g., "A"
): { x: number; y: number } {
  // For now, return component position.
  // TODO: implement proper offset per component type.
  return { x: component.x, y: component.y };
}

/**
 * Return a human-readable unit for a property value.
 */
export function unitForProperty(property: string, type: ComponentType): string {
  switch (property) {
    case 'resistance': return 'Ω';
    case 'capacitance': return 'F';
    case 'inductance': return 'H';
    case 'voltage': return 'V';
    case 'current': return 'A';
    default: return '';
  }
}