/**
 * Utility functions for editor UI.
 * Terminal local offsets must match ComponentNodes lead ends.
 */
import type { ComponentInstance, ComponentType, TerminalType } from './editorTypes';

/** Local (unrotated) terminal offsets relative to the component origin. */
const TERMINAL_LOCAL_OFFSETS: Record<ComponentType, Partial<Record<TerminalType, { x: number; y: number }>>> = {
  resistor: { A: { x: -30, y: 0 }, B: { x: 30, y: 0 } },
  capacitor: { A: { x: -20, y: 0 }, B: { x: 20, y: 0 } },
  inductor: { A: { x: -30, y: 0 }, B: { x: 30, y: 0 } },
  diode: { anode: { x: -20, y: 0 }, cathode: { x: 20, y: 0 } },
  led: { anode: { x: -20, y: 0 }, cathode: { x: 20, y: 0 } },
  switch: { A: { x: -20, y: 0 }, B: { x: 20, y: 0 } },
  voltage_source: { positive: { x: 0, y: -20 }, negative: { x: 0, y: 20 } },
  current_source: { positive: { x: 0, y: -20 }, negative: { x: 0, y: 20 } },
  ground: { ground: { x: 0, y: -15 } },
  voltmeter: { positive: { x: -20, y: 0 }, negative: { x: 20, y: 0 } },
  ammeter: { input: { x: -20, y: 0 }, output: { x: 20, y: 0 } },
};

export function getTerminalLocalOffset(
  type: ComponentType,
  terminalId: string,
): { x: number; y: number } {
  return TERMINAL_LOCAL_OFFSETS[type]?.[terminalId as TerminalType] ?? { x: 0, y: 0 };
}

/** Apply component rotation (degrees) to a local offset. */
export function rotateLocalOffset(
  local: { x: number; y: number },
  rotationDeg: number,
): { x: number; y: number } {
  const rad = ((rotationDeg % 360) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: local.x * cos - local.y * sin,
    y: local.x * sin + local.y * cos,
  };
}

/**
 * World-space terminal position for wire start/end and hit alignment.
 * Matches SVG: translate(comp) then rotate(comp.rotation) applied to local offsets.
 */
export function getTerminalWorldPosition(
  component: ComponentInstance,
  terminalId: string,
): { x: number; y: number } {
  const local = getTerminalLocalOffset(component.type, terminalId);
  const rotated = rotateLocalOffset(local, component.rotation ?? 0);
  return {
    x: component.x + rotated.x,
    y: component.y + rotated.y,
  };
}

/** Orthogonal rubber-band path from start → cursor (replace, never append). */
export function buildOrthogonalPreview(
  start: { x: number; y: number },
  cursor: { x: number; y: number },
): { x: number; y: number }[] {
  const dx = cursor.x - start.x;
  const dy = cursor.y - start.y;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
    return [start, cursor];
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return [start, { x: cursor.x, y: start.y }, cursor];
  }
  return [start, { x: start.x, y: cursor.y }, cursor];
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
