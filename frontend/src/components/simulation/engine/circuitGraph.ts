/**
 * Circuit graph: builds a graph representation from a circuit definition.
 * Computes nets (electrically-connected groups of terminals) using union-find.
 */
import type {
  CircuitDefinition,
  ComponentInstance,
  Net,
} from "./types";
import { parseTerminalRef } from "./types";

// ── Union-Find ──

class UnionFind {
  private parent = new Map<string, string>();
  private rank = new Map<string, number>();

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  groups(): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      if (!map.has(root)) map.set(root, []);
      map.get(root)!.push(key);
    }
    return map;
  }
}

// ── Build nets ──

/**
 * From a CircuitDefinition, compute nets by merging terminals connected
 * by wires/connections using union-find.
 */
export function computeNets(circuit: CircuitDefinition): Net[] {
  const uf = new UnionFind();

  // Initialize every terminal as its own group
  for (const comp of circuit.components) {
    for (const term of comp.terminals) {
      uf.find(`${comp.id}:${term.id}`);
    }
  }

  // Merge terminals that are connected by wires
  for (const conn of circuit.connections) {
    if (conn.to) {
      uf.union(conn.from, conn.to);
    }
  }

  // Group into nets
  const groups = uf.groups();
  const nets: Net[] = [];
  let netId = 0;

  for (const [, terminals] of groups) {
    // Only create nets with at least one terminal
    if (terminals.length === 0) continue;
    nets.push({
      id: netId++,
      terminals,
      wires: [], // Wire association is done later if needed
    });
  }

  return nets;
}

// ── Graph helpers ──

/** Get all terminal refs connected to a given terminal */
export function getConnectedTerminals(
  circuit: CircuitDefinition,
  terminalRef: string,
): string[] {
  const connected: string[] = [];
  for (const conn of circuit.connections) {
    if (conn.from === terminalRef && conn.to) connected.push(conn.to);
    if (conn.to === terminalRef) connected.push(conn.from);
  }
  return connected;
}

/** Find the net that contains a specific terminal ref */
export function findNetForTerminal(nets: Net[], terminalRef: string): Net | undefined {
  return nets.find((n) => n.terminals.includes(terminalRef));
}

/** Check if a terminal is connected to anything */
export function isTerminalConnected(circuit: CircuitDefinition, terminalRef: string): boolean {
  return circuit.connections.some(
    (c) => c.from === terminalRef || c.to === terminalRef,
  );
}

/** Get all components connected to a specific component via wires */
export function getAdjacentComponents(
  circuit: CircuitDefinition,
  componentId: string,
): string[] {
  const adjacent = new Set<string>();
  for (const conn of circuit.connections) {
    const from = parseTerminalRef(conn.from);
    const to = conn.to ? parseTerminalRef(conn.to) : null;
    if (from.componentId === componentId && to && to.componentId !== componentId) {
      adjacent.add(to.componentId);
    }
    if (to && to.componentId === componentId && from.componentId !== componentId) {
      adjacent.add(from.componentId);
    }
  }
  return Array.from(adjacent);
}

/** Find the ground net (net containing any ground component's terminal) */
export function findGroundNet(
  circuit: CircuitDefinition,
  nets: Net[],
): Net | undefined {
  const ground = circuit.components.find((c) => c.type === "ground");
  if (!ground) return undefined;
  const termRef = `${ground.id}:${ground.terminals[0]?.id ?? "gnd"}`;
  return nets.find((n) => n.terminals.includes(termRef));
}

/** Count how many connections a terminal has */
export function countConnections(circuit: CircuitDefinition, terminalRef: string): number {
  let count = 0;
  for (const conn of circuit.connections) {
    if (conn.from === terminalRef) count++;
    if (conn.to === terminalRef) count++;
  }
  return count;
}

/** Get component by id */
export function getComponent(
  circuit: CircuitDefinition,
  id: string,
): ComponentInstance | undefined {
  return circuit.components.find((c) => c.id === id);
}

/** Get all components of a specific type */
export function getComponentsByType(
  circuit: CircuitDefinition,
  type: string,
): ComponentInstance[] {
  return circuit.components.filter((c) => c.type === type);
}
