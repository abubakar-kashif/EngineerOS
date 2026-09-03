/**
 * Utility functions for editor UI.
 */
import type { ComponentInstance } from './editorTypes';

export function getTerminalWorldPosition(
  component: ComponentInstance,
  _terminalId: string  // prefix with underscore to indicate unused
): { x: number; y: number } {
  return { x: component.x, y: component.y };
}

export function unitForProperty(property: string): string {
  switch (property) {
    case 'resistance': return 'Ω';
    case 'capacitance': return 'F';
    case 'inductance': return 'H';
    case 'voltage': return 'V';
    case 'current': return 'A';
    default: return '';
  }
}