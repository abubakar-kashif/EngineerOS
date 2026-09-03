/**
 * Core type definitions for the circuit simulation engine.
 * Separated from UI types — the engine has no React dependency.
 */

// ── Component types ──

export type ComponentType =
  | "voltage_source"
  | "current_source"
  | "resistor"
  | "capacitor"
  | "inductor"
  | "diode"
  | "led"
  | "switch"
  | "ground"
  | "voltmeter"
  | "ammeter";

// ── Terminal ──

export interface TerminalDef {
  /** Unique within the component instance, e.g. "A", "B", "+", "-", "GND" */
  id: string;
  /** Display label */
  label: string;
  /** Position relative to component origin at (0, 0), before rotation */
  x: number;
  y: number;
}

// ── Component instance on the canvas ──

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  /** Auto-assigned reference designator: R1, C2, D1, LED1 … */
  label: string;
  /** Canvas position (grid-snapped) */
  x: number;
  y: number;
  /** Rotation in degrees */
  rotation: 0 | 90 | 180 | 270;
  /** Electrical properties — varies by type */
  properties: Record<string, number | string | boolean>;
  /** Terminal definitions for this component type */
  terminals: TerminalDef[];
}

// ── Wire ──

export interface WireSegment {
  id: string;
  /** Ordered waypoints (orthogonal routing) */
  points: { x: number; y: number }[];
}

export interface WireConnection {
  /** "componentId:terminalId" */
  from: string;
  /** "componentId:terminalId" or null if wire is dangling */
  to: string | null;
}

// ── Junction ──

export interface Junction {
  id: string;
  x: number;
  y: number;
}

// ── Full circuit definition (serializable / portable) ──

export interface CircuitDefinition {
  components: ComponentInstance[];
  wires: WireSegment[];
  connections: WireConnection[];
  junctions: Junction[];
}

// ── Net (group of electrically-connected terminals) ──

export interface Net {
  id: number;
  /** "componentId:terminalId" references */
  terminals: string[];
  /** Wire segment ids that belong to this net */
  wires: string[];
}

// ── Validation ──

export interface ValidationError {
  id: string;
  severity: "error" | "warning" | "info";
  /** Which component(s) are involved */
  componentIds: string[];
  title: string;
  message: string;
  suggestion: string;
}

// ── Component state (post-simulation) ──

export type ComponentState =
  | "active"
  | "inactive"
  | "forward"
  | "reverse"
  | "blocking"
  | "on"
  | "off"
  | "open"
  | "closed";

// ── Simulation results ──

export interface ComponentResult {
  componentId: string;
  voltage: number;
  current: number;
  power: number;
  state: ComponentState;
}

export interface GlobalMeasurements {
  sourceVoltage: number;
  totalResistance: number;
  totalCurrent: number;
  totalPower: number;
}

export interface SimulationOutput {
  global: GlobalMeasurements;
  components: ComponentResult[];
  nets: Net[];
  timestamp: string;
}

// ── Helpers ──

/** Parse "componentId:terminalId" */
export function parseTerminalRef(ref: string): { componentId: string; terminalId: string } {
  const idx = ref.lastIndexOf(":");
  return { componentId: ref.slice(0, idx), terminalId: ref.slice(idx + 1) };
}

/** Build "componentId:terminalId" */
export function makeTerminalRef(componentId: string, terminalId: string): string {
  return `${componentId}:${terminalId}`;
}

/** Rotate a point (dx, dy) around origin by degrees */
export function rotatePoint(dx: number, dy: number, degrees: number): { x: number; y: number } {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

/** Get the absolute canvas position of a terminal */
export function getTerminalWorldPosition(
  component: ComponentInstance,
  terminalId: string,
): { x: number; y: number } | null {
  const term = component.terminals.find((t) => t.id === terminalId);
  if (!term) return null;
  const rotated = rotatePoint(term.x, term.y, component.rotation);
  return { x: component.x + rotated.x, y: component.y + rotated.y };
}

// ── Default terminals per component type ──

export const DEFAULT_TERMINALS: Record<ComponentType, TerminalDef[]> = {
  voltage_source: [
    { id: "pos", label: "+", x: 0, y: -20 },
    { id: "neg", label: "−", x: 0, y: 20 },
  ],
  current_source: [
    { id: "pos", label: "+", x: 0, y: -20 },
    { id: "neg", label: "−", x: 0, y: 20 },
  ],
  resistor: [
    { id: "A", label: "A", x: -30, y: 0 },
    { id: "B", label: "B", x: 30, y: 0 },
  ],
  capacitor: [
    { id: "A", label: "A", x: -20, y: 0 },
    { id: "B", label: "B", x: 20, y: 0 },
  ],
  inductor: [
    { id: "A", label: "A", x: -30, y: 0 },
    { id: "B", label: "B", x: 30, y: 0 },
  ],
  diode: [
    { id: "anode", label: "A", x: -20, y: 0 },
    { id: "cathode", label: "K", x: 20, y: 0 },
  ],
  led: [
    { id: "anode", label: "A", x: -20, y: 0 },
    { id: "cathode", label: "K", x: 20, y: 0 },
  ],
  switch: [
    { id: "A", label: "A", x: -20, y: 0 },
    { id: "B", label: "B", x: 20, y: 0 },
  ],
  ground: [
    { id: "gnd", label: "GND", x: 0, y: -15 },
  ],
  voltmeter: [
    { id: "pos", label: "+", x: -20, y: 0 },
    { id: "neg", label: "−", x: 20, y: 0 },
  ],
  ammeter: [
    { id: "A", label: "A", x: -20, y: 0 },
    { id: "B", label: "B", x: 20, y: 0 },
  ],
};

/** Default property values per component type */
export const DEFAULT_PROPERTIES: Record<ComponentType, Record<string, number | string | boolean>> = {
  voltage_source: { voltage: 12, internalResistance: 0 },
  current_source: { current: 0.01 },
  resistor: { resistance: 1000, tolerance: 5, powerRating: 0.25 },
  capacitor: { capacitance: 0.0001, voltage: 0 },
  inductor: { inductance: 0.01, resistance: 0 },
  diode: { forwardVoltage: 0.7, maxCurrent: 1 },
  led: { forwardVoltage: 2.0, forwardCurrent: 0.02, color: "red" },
  switch: { closed: false },
  ground: {},
  voltmeter: {},
  ammeter: {},
};
