/**
 * Circuit Graph Builder
 * Person 1: Simulation Engine
 * Builds electrical nodes from terminals and connections
 */

import type {
  CircuitDefinition,
  ElectricalNode,
} from './circuitGraph';

import {
  findTerminal,
  getConnectionsForTerminal,
  findComponentByTerminal,
} from './circuitGraph';

export interface GraphBuilderResult {
  nodes: ElectricalNode[];
  errors: string[];
}

export function buildElectricalNodes(circuit: CircuitDefinition): GraphBuilderResult {
  const nodes: ElectricalNode[] = [];
  const visitedTerminals = new Set<string>();
  const errors: string[] = [];

  const allTerminals: string[] = [];
  for (const comp of circuit.components) {
    for (const term of comp.terminals) {
      allTerminals.push(term.id);
    }
  }

  if (allTerminals.length === 0) {
    return { nodes: [], errors: ['No components with terminals found'] };
  }

  const adjacency = buildAdjacencyList(circuit);

  for (const terminalId of allTerminals) {
    if (!visitedTerminals.has(terminalId)) {
      const connectedTerminals = findConnectedTerminals(terminalId, adjacency);
      
      for (const t of connectedTerminals) {
        visitedTerminals.add(t);
      }

      const isGround = connectedTerminals.some(t => {
        const term = findTerminal(circuit, t);
        if (!term) return false;
        const comp = findComponentByTerminal(circuit, t);
        return comp?.type === 'ground';
      });

      const node: ElectricalNode = {
        id: `N${nodes.length + 1}`,
        terminals: connectedTerminals,
        voltage: null,
        isGround,
      };

      nodes.push(node);
    }
  }

  for (const component of circuit.components) {
    let hasConnection = false;
    for (const terminal of component.terminals) {
      const connections = getConnectionsForTerminal(circuit, terminal.id);
      if (connections.length > 0) {
        hasConnection = true;
        break;
      }
    }
    if (!hasConnection && component.type !== 'ground') {
      errors.push(`Component ${component.id} has no connections`);
    }
  }

  for (const terminalId of allTerminals) {
    const connections = getConnectionsForTerminal(circuit, terminalId);
    if (connections.length === 0) {
      const term = findTerminal(circuit, terminalId);
      if (term) {
        const comp = findComponentByTerminal(circuit, terminalId);
        if (comp?.type !== 'ground') {
          const msg = `Dangling terminal: ${terminalId} (component: ${comp?.id || 'unknown'})`;
          if (!errors.includes(msg)) {
            errors.push(msg);
          }
        }
      }
    }
  }

  return { nodes, errors };
}

function buildAdjacencyList(circuit: CircuitDefinition): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  for (const conn of circuit.connections) {
    if (!adjacency.has(conn.from)) {
      adjacency.set(conn.from, new Set());
    }
    if (!adjacency.has(conn.to)) {
      adjacency.set(conn.to, new Set());
    }
    adjacency.get(conn.from)!.add(conn.to);
    adjacency.get(conn.to)!.add(conn.from);
  }

  return adjacency;
}

function findConnectedTerminals(
  startTerminal: string,
  adjacency: Map<string, Set<string>>
): string[] {
  const visited = new Set<string>();
  const queue: string[] = [startTerminal];
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    result.push(current);

    const neighbors = adjacency.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return result;
}

export function getNodeIdForTerminal(nodes: ElectricalNode[], terminalId: string): string | null {
  for (const node of nodes) {
    if (node.terminals.includes(terminalId)) {
      return node.id;
    }
  }
  return null;
}

export function getTerminalsInNode(nodes: ElectricalNode[], nodeId: string): string[] {
  const node = nodes.find(n => n.id === nodeId);
  return node ? node.terminals : [];
}

export function findGroundNode(nodes: ElectricalNode[]): ElectricalNode | null {
  return nodes.find(n => n.isGround) || null;
}

export function hasGround(nodes: ElectricalNode[]): boolean {
  return nodes.some(n => n.isGround);
}