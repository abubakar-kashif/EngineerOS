/**
 * Editor-specific types for the simulation canvas and UI.
 * These are separate from the simulation engine's core types.
 */

import type { ComponentType, TerminalType, Position, ComponentProperties } from './engine';
import { ComponentTerminals as EngineComponentTerminals } from './engine/circuitGraph';

// Re-export engine's ComponentType for convenience
export type { ComponentType, TerminalType, Position };

/**
 * Editor representation of a component on the canvas.
 * Uses separate x/y fields for simplicity in drag/move operations.
 */
export interface ComponentInstance {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
  rotation: number;
  properties: ComponentProperties;
  terminals: TerminalType[];
  metadata?: Record<string, unknown>;
}

/**
 * Visual wire segment (set of points for drawing).
 */
export interface WireSegment {
  id: string;
  points: { x: number; y: number }[];
}

/**
 * Electrical connection between two component terminals.
 * Format: "componentId:terminalId"
 */
export interface WireConnection {
  from: string; // e.g., "R1:A"
  to: string;   // e.g., "C1:positive"
}

/**
 * Editor circuit state, including visual wires and junctions.
 */
export interface EditorCircuit {
  components: ComponentInstance[];
  wires: WireSegment[];
  connections: WireConnection[];
  junctions?: { x: number; y: number }[];
}

/**
 * Default terminal names per component type (editor-side).
 * Reuse engine's ComponentTerminals.
 */
export const DEFAULT_TERMINALS: Record<ComponentType, TerminalType[]> = {
  ...EngineComponentTerminals,
};

/**
 * Default properties for each component type (editor initialization).
 */
export const DEFAULT_PROPERTIES: Record<ComponentType, ComponentProperties> = {
  resistor: { resistance: 1000 },
  capacitor: { capacitance: 1e-6 },
  inductor: { inductance: 1e-3 },
  diode: { forwardVoltage: 0.7 },
  led: { forwardVoltage: 2.0 },
  switch: { state: 'open' },
  voltage_source: { voltage: 5 },
  current_source: { current: 0.01 },
  ground: {},
  voltmeter: {},
  ammeter: {},
};