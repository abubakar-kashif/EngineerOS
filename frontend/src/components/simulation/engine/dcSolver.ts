/**
 * DC circuit solver.
 *
 * Runs standard nodal analysis on the circuit's electrical nets (see
 * circuitGraph.computeNets): each net becomes one node, ground nets are
 * fixed at 0V, and every component is "stamped" into a conductance matrix
 * (G) and current-injection vector (I) using standard companion models.
 * Diodes/LEDs are nonlinear, so the solve is repeated a handful of times,
 * flipping each one ON/OFF based on the voltage across it, until the
 * states settle (or the iteration cap is hit).
 *
 * This is intentionally a "good enough for teaching" solver: it handles
 * arbitrary series/parallel resistive networks with switches, sources,
 * diodes and LEDs, but does not attempt transient (time-domain) analysis —
 * capacitors are treated as open circuits and inductors as short circuits,
 * which is the correct DC steady-state approximation.
 */
import type {
  CircuitDefinition,
  ComponentInstance,
  ComponentResult,
  ComponentState,
  GlobalMeasurements,
  SimulationOutput,
} from "./types";
import { makeTerminalRef } from "./types";
import { computeNets, getComponentsByType } from "./circuitGraph";

// ── Numerical constants for companion models ──
const G_SHORT = 1e6; // conductance (S) standing in for a zero-resistance path
const G_OPEN = 1e-12; // conductance (S) standing in for an open path
const G_LEAK = 1e-9; // tiny leak added to every node so isolated nodes don't singular the matrix
const R_FLOOR = 1e-6; // Ω floor used instead of a literal 0 (avoids divide-by-zero)
const DIODE_ON_RESISTANCE = 1; // Ω, forward "on" resistance in the diode companion model
const MAX_DIODE_ITERATIONS = 8;
const ZERO_EPSILON = 1e-9;

/** Solve the DC operating point of a circuit. */
export function solveDC(circuit: CircuitDefinition): SimulationOutput {
  const nets = computeNets(circuit);

  // ── 1. Assign every terminal a node index (terminals in the same net share a node) ──
  const netIdForTerminal = new Map<string, number>();
  for (const net of nets) {
    for (const ref of net.terminals) netIdForTerminal.set(ref, net.id);
  }

  let syntheticNetId = -1;
  const nodeIndexByNetId = new Map<number, number>();
  let nodeCount = 0;

  function nodeForTerminal(ref: string): number {
    let netId = netIdForTerminal.get(ref);
    if (netId === undefined) {
      // Floating terminal — not part of any wired net. Give it its own node
      // so the solver stays stable (validateCircuit already warns about this).
      netId = syntheticNetId--;
      netIdForTerminal.set(ref, netId);
    }
    let idx = nodeIndexByNetId.get(netId);
    if (idx === undefined) {
      idx = nodeCount++;
      nodeIndexByNetId.set(netId, idx);
    }
    return idx;
  }

  // Pre-register every terminal so nodeCount is final before we build matrices.
  for (const comp of circuit.components) {
    for (const term of comp.terminals) {
      nodeForTerminal(makeTerminalRef(comp.id, term.id));
    }
  }

  // ── 2. Ground nodes are fixed at 0V and excluded from the unknown vector ──
  const groundNodes = new Set<number>();
  for (const gnd of getComponentsByType(circuit, "ground")) {
    const term = gnd.terminals[0];
    if (term) groundNodes.add(nodeForTerminal(makeTerminalRef(gnd.id, term.id)));
  }
  // No ground found — shouldn't normally happen (validateCircuit blocks this
  // case) — fall back to node 0 as the reference so the solver still runs.
  if (groundNodes.size === 0) groundNodes.add(0);

  const unknownNodes = [...Array(nodeCount).keys()].filter((n) => !groundNodes.has(n));
  const unknownIndex = new Map<number, number>();
  unknownNodes.forEach((n, i) => unknownIndex.set(n, i));
  const size = unknownNodes.length;

  // ── 3. Diode/LED state, solved iteratively (piecewise-linear model) ──
  const diodeOn = new Map<string, boolean>();
  for (const comp of circuit.components) {
    if (comp.type === "diode" || comp.type === "led") diodeOn.set(comp.id, false);
  }

  let nodeVoltages: number[] = new Array(nodeCount).fill(0);

  for (let iteration = 0; iteration < MAX_DIODE_ITERATIONS; iteration++) {
    const G: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
    const I: number[] = new Array(size).fill(0);

    const stampConductance = (nodeA: number, nodeB: number, g: number) => {
      const a = unknownIndex.get(nodeA);
      const b = unknownIndex.get(nodeB);
      if (a !== undefined) G[a][a] += g;
      if (b !== undefined) G[b][b] += g;
      if (a !== undefined && b !== undefined) {
        G[a][b] -= g;
        G[b][a] -= g;
      }
    };
    const stampCurrent = (nodeInto: number, nodeOutOf: number, current: number) => {
      const into = unknownIndex.get(nodeInto);
      const outOf = unknownIndex.get(nodeOutOf);
      if (into !== undefined) I[into] += current;
      if (outOf !== undefined) I[outOf] -= current;
    };

    // Tiny leak to ground on every node — keeps the matrix solvable even
    // when part of the circuit is floating/disconnected.
    for (let i = 0; i < size; i++) G[i][i] += G_LEAK;

    for (const comp of circuit.components) {
      const t = comp.terminals;
      switch (comp.type) {
        case "resistor": {
          const r = Math.max(Number(comp.properties.resistance) || 0, R_FLOOR);
          stampConductance(nodeForTerminal(makeTerminalRef(comp.id, t[0].id)), nodeForTerminal(makeTerminalRef(comp.id, t[1].id)), 1 / r);
          break;
        }
        case "inductor": {
          // DC steady state: a short, through its own series resistance if any.
          const r = Math.max(Number(comp.properties.resistance) || 0, R_FLOOR);
          stampConductance(nodeForTerminal(makeTerminalRef(comp.id, t[0].id)), nodeForTerminal(makeTerminalRef(comp.id, t[1].id)), 1 / r);
          break;
        }
        case "capacitor":
          break; // DC steady state: open circuit — no stamp
        case "switch": {
          const closed = Boolean(comp.properties.closed);
          stampConductance(nodeForTerminal(makeTerminalRef(comp.id, t[0].id)), nodeForTerminal(makeTerminalRef(comp.id, t[1].id)), closed ? G_SHORT : G_OPEN);
          break;
        }
        case "ammeter":
          // Ideal ammeter: a short, so it doesn't disturb the circuit.
          stampConductance(nodeForTerminal(makeTerminalRef(comp.id, t[0].id)), nodeForTerminal(makeTerminalRef(comp.id, t[1].id)), G_SHORT);
          break;
        case "voltmeter":
          break; // Ideal voltmeter: infinite resistance — draws no current
        case "voltage_source": {
          const v = Number(comp.properties.voltage) || 0;
          const rInt = Math.max(Number(comp.properties.internalResistance) || 0, R_FLOOR);
          const pos = nodeForTerminal(makeTerminalRef(comp.id, "pos"));
          const neg = nodeForTerminal(makeTerminalRef(comp.id, "neg"));
          // Norton equivalent: conductance in parallel with an injected current.
          stampConductance(pos, neg, 1 / rInt);
          stampCurrent(pos, neg, v / rInt);
          break;
        }
        case "current_source": {
          const i = Number(comp.properties.current) || 0;
          const pos = nodeForTerminal(makeTerminalRef(comp.id, "pos"));
          const neg = nodeForTerminal(makeTerminalRef(comp.id, "neg"));
          stampCurrent(pos, neg, i);
          break;
        }
        case "diode":
        case "led": {
          const vf = Number(comp.properties.forwardVoltage) || 0.7;
          const anode = nodeForTerminal(makeTerminalRef(comp.id, "anode"));
          const cathode = nodeForTerminal(makeTerminalRef(comp.id, "cathode"));
          if (diodeOn.get(comp.id)) {
            stampConductance(anode, cathode, 1 / DIODE_ON_RESISTANCE);
            stampCurrent(anode, cathode, vf / DIODE_ON_RESISTANCE);
          } else {
            stampConductance(anode, cathode, G_OPEN);
          }
          break;
        }
        case "ground":
          break; // reference only
      }
    }

    const x = gaussianSolve(G, I);
    nodeVoltages = new Array(nodeCount).fill(0);
    unknownNodes.forEach((n, i) => (nodeVoltages[n] = x[i]));

    // ── Re-check diode states; stop once nothing changes ──
    let changed = false;
    for (const comp of circuit.components) {
      if (comp.type !== "diode" && comp.type !== "led") continue;
      const vf = Number(comp.properties.forwardVoltage) || 0.7;
      const va = nodeVoltages[nodeForTerminal(makeTerminalRef(comp.id, "anode"))];
      const vc = nodeVoltages[nodeForTerminal(makeTerminalRef(comp.id, "cathode"))];
      const shouldBeOn = va - vc > vf * 0.98; // small margin avoids state chatter
      if (shouldBeOn !== diodeOn.get(comp.id)) {
        diodeOn.set(comp.id, shouldBeOn);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // ── 4. Per-component results ──
  const components: ComponentResult[] = circuit.components
    .filter((c) => c.type !== "ground")
    .map((comp) => buildComponentResult(comp, nodeVoltages, nodeForTerminal, diodeOn));

  // ── 5. Global measurements, taken from the primary source ──
  const voltageSources = getComponentsByType(circuit, "voltage_source");
  const currentSources = getComponentsByType(circuit, "current_source");
  const primaryVSource = voltageSources[0];
  const primaryCSource = currentSources[0];

  let sourceVoltage = 0;
  let totalCurrent = 0;

  if (primaryVSource) {
    sourceVoltage = Number(primaryVSource.properties.voltage) || 0;
    const rInt = Math.max(Number(primaryVSource.properties.internalResistance) || 0, R_FLOOR);
    const pos = nodeVoltages[nodeForTerminal(makeTerminalRef(primaryVSource.id, "pos"))];
    const neg = nodeVoltages[nodeForTerminal(makeTerminalRef(primaryVSource.id, "neg"))];
    totalCurrent = (sourceVoltage - (pos - neg)) / rInt;
  } else if (primaryCSource) {
    totalCurrent = Number(primaryCSource.properties.current) || 0;
    const pos = nodeVoltages[nodeForTerminal(makeTerminalRef(primaryCSource.id, "pos"))];
    const neg = nodeVoltages[nodeForTerminal(makeTerminalRef(primaryCSource.id, "neg"))];
    sourceVoltage = pos - neg;
  }

  const totalPower = sourceVoltage * totalCurrent;
  const totalResistance = Math.abs(totalCurrent) > ZERO_EPSILON ? sourceVoltage / totalCurrent : Infinity;

  const global: GlobalMeasurements = {
    sourceVoltage: clean(sourceVoltage),
    totalResistance,
    totalCurrent: clean(totalCurrent),
    totalPower: clean(totalPower),
  };

  return {
    global,
    components,
    nets,
    timestamp: new Date().toISOString(),
  };
}

/** Compute voltage/current/power/state for a single component from the solved node voltages. */
function buildComponentResult(
  comp: ComponentInstance,
  nodeVoltages: number[],
  nodeForTerminal: (ref: string) => number,
  diodeOn: Map<string, boolean>,
): ComponentResult {
  const t = comp.terminals;
  const va = t[0] ? nodeVoltages[nodeForTerminal(makeTerminalRef(comp.id, t[0].id))] : 0;
  const vb = t[1] ? nodeVoltages[nodeForTerminal(makeTerminalRef(comp.id, t[1].id))] : 0;
  const voltage = clean(va - vb);

  let current = 0;
  let state: ComponentState = "inactive";

  switch (comp.type) {
    case "resistor":
    case "inductor": {
      const r = Math.max(Number(comp.properties.resistance) || 0, R_FLOOR);
      current = clean(voltage / r);
      state = Math.abs(current) > ZERO_EPSILON ? "active" : "inactive";
      break;
    }
    case "capacitor":
      current = 0; // no current flows at DC steady state
      state = Math.abs(voltage) > ZERO_EPSILON ? "active" : "inactive";
      break;
    case "switch": {
      const closed = Boolean(comp.properties.closed);
      current = closed ? clean(voltage * G_SHORT) : 0;
      state = closed ? "closed" : "open";
      break;
    }
    case "ammeter":
      current = clean(voltage * G_SHORT);
      state = "active";
      break;
    case "voltmeter":
      current = 0;
      state = "active";
      break;
    case "voltage_source": {
      const rInt = Math.max(Number(comp.properties.internalResistance) || 0, R_FLOOR);
      const v = Number(comp.properties.voltage) || 0;
      current = clean((v - voltage) / rInt);
      state = Math.abs(current) > ZERO_EPSILON ? "active" : "inactive";
      break;
    }
    case "current_source":
      current = Number(comp.properties.current) || 0;
      state = Math.abs(current) > ZERO_EPSILON ? "active" : "inactive";
      break;
    case "diode":
    case "led": {
      const on = diodeOn.get(comp.id) ?? false;
      const vf = Number(comp.properties.forwardVoltage) || 0.7;
      current = on ? clean((voltage - vf) / DIODE_ON_RESISTANCE) : 0;
      state = on ? "forward" : voltage < 0 ? "reverse" : "blocking";
      break;
    }
    default:
      break;
  }

  const power = clean(voltage * current);
  return { componentId: comp.id, voltage, current, power, state };
}

/** Solve a linear system Ax = b with Gaussian elimination + partial pivoting. */
function gaussianSolve(A: number[][], b: number[]): number[] {
  const n = b.length;
  if (n === 0) return [];
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivotRow][col])) pivotRow = row;
    }
    [M[col], M[pivotRow]] = [M[pivotRow], M[col]];

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-15) continue; // regularized by G_LEAK above; shouldn't happen

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / pivot;
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) M[row][c] -= factor * M[col][c];
    }
  }

  return M.map((row, i) => (Math.abs(row[i]) < 1e-15 ? 0 : row[n] / row[i]));
}

/** Round tiny numerical noise down to a clean 0. */
function clean(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) < ZERO_EPSILON) return 0;
  return value;
}