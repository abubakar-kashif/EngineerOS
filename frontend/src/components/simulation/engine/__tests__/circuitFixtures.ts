import type { CircuitDefinition, Component, ComponentType, Connection } from '../circuitGraph';
import { createTerminalId, type TerminalType } from '../circuitGraph';

function comp(
  id: string,
  type: ComponentType,
  properties: Component['properties'],
  terminals: TerminalType[],
  position = { x: 0, y: 0 },
): Component {
  return {
    id,
    type,
    label: id,
    position,
    rotation: 0,
    properties,
    terminals: terminals.map((t) => ({
      id: createTerminalId(id, t),
      type: t,
      componentId: id,
    })),
  };
}

function wire(id: string, from: string, to: string): Connection {
  return { id, from, to };
}

const T = createTerminalId;

/** 12 V, R1=1 kΩ, R2=4 kΩ series voltage divider (grounded source). */
export function voltageDivider12V(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 12 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('R2', 'resistor', { resistance: 4000 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('R2', 'A')),
      wire('W3', T('R2', 'B'), T('GND1', 'ground')),
      wire('W4', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function series5VTwo1k(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 5 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('R2', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('R2', 'A')),
      wire('W3', T('R2', 'B'), T('GND1', 'ground')),
      wire('W4', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function parallel5VTwo1k(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 5 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('R2', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('V1', 'positive'), T('R2', 'A')),
      wire('W3', T('R1', 'B'), T('GND1', 'ground')),
      wire('W4', T('R2', 'B'), T('GND1', 'ground')),
      wire('W5', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

/** V — R1 — (R2 || R3) — GND */
export function seriesParallel12V(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 12 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('R2', 'resistor', { resistance: 2000 }, ['A', 'B']),
      comp('R3', 'resistor', { resistance: 2000 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('R2', 'A')),
      wire('W3', T('R1', 'B'), T('R3', 'A')),
      wire('W4', T('R2', 'B'), T('GND1', 'ground')),
      wire('W5', T('R3', 'B'), T('GND1', 'ground')),
      wire('W6', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function ohmsLaw(v: number, r: number): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: v }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: r }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('GND1', 'ground')),
      wire('W3', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function openCircuitMissingReturn(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 12 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('GND1', 'ground')),
    ],
  };
}

export function shortedSource(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 12 }, ['positive', 'negative']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('V1', 'negative')),
      wire('W2', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function seriesRC(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 5 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 10000 }, ['A', 'B']),
      comp('C1', 'capacitor', { capacitance: 1e-6 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('C1', 'A')),
      wire('W3', T('C1', 'B'), T('GND1', 'ground')),
      wire('W4', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function seriesDiode(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 5 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('D1', 'diode', { forwardVoltage: 0.7 }, ['anode', 'cathode']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('D1', 'anode')),
      wire('W3', T('D1', 'cathode'), T('GND1', 'ground')),
      wire('W4', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function reverseDiode(): CircuitDefinition {
  const c = seriesDiode();
  return {
    ...c,
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('R1', 'B'), T('D1', 'cathode')),
      wire('W3', T('D1', 'anode'), T('GND1', 'ground')),
      wire('W4', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}

export function currentDivider(): CircuitDefinition {
  return {
    components: [
      comp('V1', 'voltage_source', { voltage: 12 }, ['positive', 'negative']),
      comp('R1', 'resistor', { resistance: 1000 }, ['A', 'B']),
      comp('R2', 'resistor', { resistance: 3000 }, ['A', 'B']),
      comp('GND1', 'ground', {}, ['ground']),
    ],
    connections: [
      wire('W1', T('V1', 'positive'), T('R1', 'A')),
      wire('W2', T('V1', 'positive'), T('R2', 'A')),
      wire('W3', T('R1', 'B'), T('GND1', 'ground')),
      wire('W4', T('R2', 'B'), T('GND1', 'ground')),
      wire('W5', T('V1', 'negative'), T('GND1', 'ground')),
    ],
  };
}
