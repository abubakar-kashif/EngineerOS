/**
 * Core circuit graph definitions for EngineerOS Simulation Engine
 * Person 1: Simulation Engine
 * Independent of UI — positions are for editor only
 */

export type ComponentType =
  | 'voltage_source'
  | 'current_source'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'diode'
  | 'led'
  | 'switch'
  | 'ground'
  | 'voltmeter'
  | 'ammeter';

export type TerminalType =
  | 'A'
  | 'B'
  | 'positive'
  | 'negative'
  | 'anode'
  | 'cathode'
  | 'ground'
  | 'input'
  | 'output';

export type SwitchState = 'open' | 'closed';

export interface Position {
  x: number;
  y: number;
}

export interface ComponentProperties {
  resistance?: number;      // Ω
  voltage?: number;         // V
  current?: number;         // A
  capacitance?: number;     // F
  inductance?: number;      // H
  forwardVoltage?: number;  // V
  state?: SwitchState;
  [key: string]: string | number | boolean | SwitchState | undefined;
}

export interface Terminal {
  id: string;
  type: TerminalType;
  componentId: string;
  label?: string;
}

export interface Component {
  id: string;
  type: ComponentType;
  label: string;
  position: Position;
  rotation: number; // degrees
  properties: ComponentProperties;
  terminals: Terminal[];
  metadata?: Record<string, unknown>;
}

export interface Connection {
  id: string;
  from: string; // terminal ID
  to: string;   // terminal ID
}

export interface ElectricalNode {
  id: string;
  terminals: string[]; // terminal IDs
  voltage: number | null; // V (null if not solved)
  isGround: boolean;
}

export interface CircuitDefinition {
  id?: string;
  name?: string;
  experimentId?: string;
  components: Component[];
  connections: Connection[];
  nodes?: ElectricalNode[];
}

/**
 * Helper functions for circuit graph
 */
export function createTerminalId(componentId: string, terminalType: TerminalType): string {
  return `${componentId}.${terminalType}`;
}

export function getComponentTerminals(component: Component): string[] {
  return component.terminals.map(t => t.id);
}

export function findComponent(circuit: CircuitDefinition, id: string): Component | undefined {
  return circuit.components.find(c => c.id === id);
}

export function findTerminal(circuit: CircuitDefinition, terminalId: string): Terminal | undefined {
  for (const comp of circuit.components) {
    const terminal = comp.terminals.find(t => t.id === terminalId);
    if (terminal) return terminal;
  }
  return undefined;
}

export function findComponentByTerminal(circuit: CircuitDefinition, terminalId: string): Component | undefined {
  for (const comp of circuit.components) {
    if (comp.terminals.some(t => t.id === terminalId)) {
      return comp;
    }
  }
  return undefined;
}

export function getConnectionsForTerminal(
  circuit: CircuitDefinition,
  terminalId: string
): Connection[] {
  return circuit.connections.filter(
    c => c.from === terminalId || c.to === terminalId
  );
}

export function getTerminalsForComponent(component: Component): string[] {
  return component.terminals.map(t => t.id);
}

export function getComponentIds(circuit: CircuitDefinition): string[] {
  return circuit.components.map(c => c.id);
}

/**
 * Component type to terminal mapping
 */
export const ComponentTerminals: Record<ComponentType, TerminalType[]> = {
  resistor: ['A', 'B'],
  capacitor: ['A', 'B'],
  inductor: ['A', 'B'],
  diode: ['anode', 'cathode'],
  led: ['anode', 'cathode'],
  switch: ['A', 'B'],
  voltage_source: ['positive', 'negative'],
  current_source: ['positive', 'negative'],
  ground: ['ground'],
  voltmeter: ['positive', 'negative'],
  ammeter: ['input', 'output'],
};