/**
 * Electrical netlist — topology only.
 * Visual coordinates never enter this model.
 */

import type { CircuitDefinition, Component, ElectricalNode } from './circuitGraph';
import { getNodeIdForTerminal } from './circuitGraphBuilder';

export const GROUND_NET = '__gnd__';

export type NetlistElement =
  | { kind: 'resistor'; id: string; n1: string; n2: string; resistance: number }
  | { kind: 'capacitor'; id: string; n1: string; n2: string; capacitance: number }
  | { kind: 'inductor'; id: string; n1: string; n2: string; inductance: number }
  | { kind: 'voltage_source'; id: string; nPos: string; nNeg: string; voltage: number }
  | { kind: 'current_source'; id: string; nPos: string; nNeg: string; current: number }
  | { kind: 'diode'; id: string; nAnode: string; nCathode: string; vf: number }
  | { kind: 'led'; id: string; nAnode: string; nCathode: string; vf: number }
  | { kind: 'switch'; id: string; n1: string; n2: string; closed: boolean }
  | { kind: 'voltmeter'; id: string; nPos: string; nNeg: string }
  | { kind: 'ammeter'; id: string; n1: string; n2: string };

export interface Netlist {
  /** Collapsed electrical nets (all schematic grounds share GROUND_NET). */
  elements: NetlistElement[];
  groundNet: string;
  nets: string[];
  /** Original electrical-node id → collapsed net id */
  netOfNode: Map<string, string>;
  /** Terminal id → collapsed net id */
  netOfTerminal: Map<string, string>;
  errors: string[];
}

function remapGrounds(nodes: ElectricalNode[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of nodes) {
    map.set(node.id, node.isGround ? GROUND_NET : node.id);
  }
  return map;
}

function twoTerminalNets(
  component: Component,
  aType: string,
  bType: string,
  netOfTerminal: Map<string, string>,
  errors: string[],
): { n1: string; n2: string } | null {
  const a = component.terminals.find((t) => t.type === aType);
  const b = component.terminals.find((t) => t.type === bType);
  if (!a || !b) {
    errors.push(`Component ${component.id} is missing terminals`);
    return null;
  }
  const n1 = netOfTerminal.get(a.id);
  const n2 = netOfTerminal.get(b.id);
  if (!n1 || !n2) {
    errors.push(`Component ${component.id} is not on an electrical net`);
    return null;
  }
  return { n1, n2 };
}

export function buildNetlist(
  circuit: CircuitDefinition,
  nodes: ElectricalNode[],
): Netlist {
  const netOfNode = remapGrounds(nodes);
  const netOfTerminal = new Map<string, string>();
  const errors: string[] = [];

  for (const node of nodes) {
    const net = netOfNode.get(node.id) ?? node.id;
    for (const terminalId of node.terminals) {
      netOfTerminal.set(terminalId, net);
    }
  }

  const elements: NetlistElement[] = [];

  for (const component of circuit.components) {
    switch (component.type) {
      case 'ground':
        break;
      case 'resistor': {
        const n = twoTerminalNets(component, 'A', 'B', netOfTerminal, errors);
        if (!n) break;
        const resistance = component.properties.resistance;
        if (resistance === undefined || resistance === null || resistance <= 0) {
          errors.push(`Resistor ${component.id} has no positive resistance`);
          break;
        }
        elements.push({ kind: 'resistor', id: component.id, ...n, resistance });
        break;
      }
      case 'capacitor': {
        const n = twoTerminalNets(component, 'A', 'B', netOfTerminal, errors);
        if (!n) break;
        elements.push({
          kind: 'capacitor',
          id: component.id,
          ...n,
          capacitance: component.properties.capacitance ?? 0,
        });
        break;
      }
      case 'inductor': {
        const n = twoTerminalNets(component, 'A', 'B', netOfTerminal, errors);
        if (!n) break;
        elements.push({
          kind: 'inductor',
          id: component.id,
          ...n,
          inductance: component.properties.inductance ?? 0,
        });
        break;
      }
      case 'voltage_source': {
        const n = twoTerminalNets(component, 'positive', 'negative', netOfTerminal, errors);
        if (!n) break;
        elements.push({
          kind: 'voltage_source',
          id: component.id,
          nPos: n.n1,
          nNeg: n.n2,
          voltage: component.properties.voltage ?? 0,
        });
        break;
      }
      case 'current_source': {
        const n = twoTerminalNets(component, 'positive', 'negative', netOfTerminal, errors);
        if (!n) break;
        elements.push({
          kind: 'current_source',
          id: component.id,
          nPos: n.n1,
          nNeg: n.n2,
          current: component.properties.current ?? 0,
        });
        break;
      }
      case 'diode':
      case 'led': {
        const n = twoTerminalNets(component, 'anode', 'cathode', netOfTerminal, errors);
        if (!n) break;
        const defaultVf = component.type === 'led' ? 2 : 0.7;
        elements.push({
          kind: component.type,
          id: component.id,
          nAnode: n.n1,
          nCathode: n.n2,
          vf: component.properties.forwardVoltage ?? defaultVf,
        });
        break;
      }
      case 'switch': {
        const n = twoTerminalNets(component, 'A', 'B', netOfTerminal, errors);
        if (!n) break;
        elements.push({
          kind: 'switch',
          id: component.id,
          ...n,
          closed: component.properties.state !== 'open',
        });
        break;
      }
      case 'voltmeter': {
        const n = twoTerminalNets(component, 'positive', 'negative', netOfTerminal, errors);
        if (!n) break;
        elements.push({ kind: 'voltmeter', id: component.id, nPos: n.n1, nNeg: n.n2 });
        break;
      }
      case 'ammeter': {
        const n = twoTerminalNets(component, 'input', 'output', netOfTerminal, errors);
        if (!n) break;
        elements.push({ kind: 'ammeter', id: component.id, n1: n.n1, n2: n.n2 });
        break;
      }
      default:
        errors.push(`Unsupported component type in netlist: ${(component as Component).type}`);
    }
  }

  const netSet = new Set<string>();
  for (const net of netOfNode.values()) netSet.add(net);
  if (nodes.some((n) => n.isGround)) netSet.add(GROUND_NET);

  return {
    elements,
    groundNet: GROUND_NET,
    nets: [...netSet],
    netOfNode,
    netOfTerminal,
    errors,
  };
}

export function netForTerminal(
  nodes: ElectricalNode[],
  terminalId: string,
): string | null {
  const raw = getNodeIdForTerminal(nodes, terminalId);
  if (!raw) return null;
  const node = nodes.find((n) => n.id === raw);
  return node?.isGround ? GROUND_NET : raw;
}

/** Topology edges used to decide whether a source loop is wired (not DC conductance). */
export function topologyNeighbors(netlist: Netlist): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (a === b) return;
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };

  for (const el of netlist.elements) {
    switch (el.kind) {
      case 'resistor':
      case 'capacitor':
      case 'inductor':
      case 'ammeter':
        link(el.n1, el.n2);
        break;
      case 'voltmeter':
        link(el.nPos, el.nNeg);
        break;
      case 'switch':
        if (el.closed) link(el.n1, el.n2);
        break;
      case 'diode':
      case 'led':
        link(el.nAnode, el.nCathode);
        break;
      case 'voltage_source':
      case 'current_source':
        break;
      default:
        break;
    }
  }
  return adj;
}

export function netsAreConnected(
  adj: Map<string, Set<string>>,
  from: string,
  to: string,
): boolean {
  if (from === to) return true;
  const seen = new Set<string>([from]);
  const queue = [from];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (seen.has(next)) continue;
      if (next === to) return true;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

export function sourceLoopIsWired(netlist: Netlist): {
  wired: boolean;
  shorted: boolean;
  sourceId?: string;
} {
  const adj = topologyNeighbors(netlist);
  const sources = netlist.elements.filter(
    (e) => e.kind === 'voltage_source' || e.kind === 'current_source',
  );
  if (sources.length === 0) {
    return { wired: false, shorted: false };
  }
  for (const src of sources) {
    if (src.kind !== 'voltage_source' && src.kind !== 'current_source') continue;
    if (src.nPos === src.nNeg) {
      return { wired: false, shorted: true, sourceId: src.id };
    }
    if (!netsAreConnected(adj, src.nPos, src.nNeg)) {
      return { wired: false, shorted: false, sourceId: src.id };
    }
  }
  return { wired: true, shorted: false };
}
