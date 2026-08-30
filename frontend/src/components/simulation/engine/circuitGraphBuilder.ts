/**
 * Circuit Graph Builder
 * Person 1: Simulation Engine
 * Builds electrical nodes from terminals and connections
 */

import {
  CircuitDefinition,
  ElectricalNode,
  Connection,
  Terminal,
  Component,
  findTerminal,
  getConnectionsForTerminal,
  findComponentByTerminal,
} from './circuitGraph';

export interface GraphBuilderResult {
  nodes: ElectricalNode[];
  errors: string[];
}

/**
 * Build electrical nodes from circuit connections
 * Groups connected terminals into electrical nodes
 */
export function buildElectricalNodes(circuit: CircuitDefinition): GraphBuilderResult {
  const nodes: ElectricalNode[] = [];
  const visitedTerminals = new Set<string>();
  const errors: string[] = [];

  // Get all terminal IDs from all components
  const allTerminals: string[] = [];
  for (const comp of circuit.components) {
    for (const term of comp.terminals) {
      allTerminals.push(term.id);
    }
  }

  // If no terminals, return empty result
  if (allTerminals.length === 0) {
    return { nodes: [], errors: ['No components with terminals found'] };
  }

  // Build adjacency list from connections
  const adjacency = buildAdjacencyList(circuit);

  // Find all connected groups (electrical nodes)
  for (const terminalId of allTerminals) {
    if (!visitedTerminals.has(terminalId)) {
      // BFS to find all connected terminals
      const connectedTerminals = findConnectedTerminals(terminalId, adjacency);
      
      // Mark all as visited
      for (const t of connectedTerminals) {
        visitedTerminals.add(t);
      }

      // Check if any terminal in this group is a ground
      const isGround = connectedTerminals.some(t => {
        const term = findTerminal(circuit, t);
        if (!term) return false;
        const comp = findComponentByTerminal(circuit, t);
        return comp?.type === 'ground';
      });

      // Create node
      const node: ElectricalNode = {
        id: `N${nodes.length + 1}`,
        terminals: connectedTerminals,
        voltage: null,
        isGround,
      };

      nodes.push(node);
    }
  }

  // Validate: Check for dangling terminals
  for (const terminalId of allTerminals) {
    const connections = getConnectionsForTerminal(circuit, terminalId);
    if (connections.length === 0) {
      const term = findTerminal(circuit, terminalId);
      if (term) {
        const comp = findComponentByTerminal(circuit, terminalId);
        // Don't warn for ground terminals (they are intentionally single)
        if (comp?.type !== 'ground') {
          errors.push(`Dangling terminal: ${terminalId} (component: ${comp?.id || 'unknown'})`);
        }
      }
    }
  }

  return { nodes, errors };
}

/**
 * Build adjacency list from connections
 */
function buildAdjacencyList(circuit: CircuitDefinition): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  for (const conn of circuit.connections) {
    // Add edge from -> to
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

/**
 * Find all terminals connected to a given terminal using BFS
 */
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

/**
 * Get node ID for a terminal
 */
export function getNodeIdForTerminal(nodes: ElectricalNode[], terminalId: string): string | null {
  for (const node of nodes) {
    if (node.terminals.includes(terminalId)) {
      return node.id;
    }
  }
  return null;
}

/**
 * Get all terminals in a node
 */
export function getTerminalsInNode(nodes: ElectricalNode[], nodeId: string): string[] {
  const node = nodes.find(n => n.id === nodeId);
  return node ? node.terminals : [];
}

/**
 * Find ground node
 */
export function findGroundNode(nodes: ElectricalNode[]): ElectricalNode | null {
  return nodes.find(n => n.isGround) || null;
}

/**
 * Validate that circuit has a ground
 */
export function hasGround(nodes: ElectricalNode[]): boolean {
  return nodes.some(n => n.isGround);
}