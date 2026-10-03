/**
 * Transient simulation — fixed-step backward-Euler companion MNA.
 *
 * Reuses the DC netlist / linear algebra path. Capacitors and inductors are
 * replaced each step by resistive companion models (no invented waveforms).
 *
 * Capacitor (BE): G = C/Δt, Ieq = G · v_c(t−Δt)
 * Inductor  (BE): G = Δt/L, Ieq = i_L(t−Δt)
 */
import type { CircuitDefinition } from "./circuitGraph";
import { buildElectricalNodes, hasGround } from "./circuitGraphBuilder";
import { validateCircuit } from "./circuitValidator";
import { solveLinearSystem } from "./linearAlgebra";
import {
  GROUND_NET,
  allTerminalsWired,
  buildNetlist,
  potentiometerArmResistances,
  sourceLoopIsWired,
  type Netlist,
  type NetlistElement,
} from "./netlist";
import type { ErrorCode } from "./errors";
import type { TimeSeriesSample } from "./types";
import { timeConstant } from "./capacitorAnalysis";

export interface TransientOptions {
  /** Total simulation window (seconds). */
  duration: number;
  /** Fixed integration step Δt (seconds). */
  timeStep: number;
  /** Start time (default 0). */
  t0?: number;
  /** Capacitor voltages at t0 (componentId → V). */
  capacitorVoltage?: Record<string, number>;
  /** Inductor currents at t0 (componentId → A). */
  inductorCurrent?: Record<string, number>;
}

export interface TransientResult {
  success: boolean;
  timeSeries: TimeSeriesSample[];
  duration: number;
  timeStep: number;
  steps: number;
  error?: string;
  errorCode?: ErrorCode;
}

interface DynamicState {
  /** Capacitor voltages v(n1)−v(n2). */
  vc: Map<string, number>;
  /** Inductor currents leaving n1 toward n2. */
  il: Map<string, number>;
}

const VOLTMETER_CONDUCTANCE = 1e-12;
const MAX_STEPS = 200_000;

function fail(error: string, errorCode: ErrorCode = "SOLVER_FAILED"): TransientResult {
  return {
    success: false,
    timeSeries: [],
    duration: 0,
    timeStep: 0,
    steps: 0,
    error,
    errorCode,
  };
}

function stampConductance(
  G: number[][],
  indexOf: Map<string, number>,
  n1: string,
  n2: string,
  g: number,
): void {
  if (!Number.isFinite(g) || g === 0 || n1 === n2) return;
  const i = indexOf.get(n1);
  const j = indexOf.get(n2);
  if (i !== undefined) G[i][i] += g;
  if (j !== undefined) G[j][j] += g;
  if (i !== undefined && j !== undefined) {
    G[i][j] -= g;
    G[j][i] -= g;
  }
}

function stampCurrent(
  J: number[],
  indexOf: Map<string, number>,
  nPos: string,
  nNeg: string,
  current: number,
): void {
  const i = indexOf.get(nPos);
  const j = indexOf.get(nNeg);
  if (i !== undefined) J[i] += current;
  if (j !== undefined) J[j] -= current;
}

function netV(voltages: Map<string, number>, net: string): number {
  return voltages.get(net) ?? 0;
}

function collectVoltageSources(
  netlist: Netlist,
  skipIds: Set<string>,
): { id: string; nPos: string; nNeg: string; voltage: number }[] {
  const list: { id: string; nPos: string; nNeg: string; voltage: number }[] = [];
  for (const el of netlist.elements) {
    if (skipIds.has(el.id)) continue;
    if (el.kind === "voltage_source") {
      list.push({ id: el.id, nPos: el.nPos, nNeg: el.nNeg, voltage: el.voltage });
    } else if (el.kind === "switch" && el.closed) {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: 0 });
    } else if (el.kind === "ammeter") {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: 0 });
    }
    // Inductors use companion stamps — not ideal shorts.
  }
  return list;
}

function activeNets(netlist: Netlist, skipIds: Set<string>): string[] {
  const nets = new Set<string>();
  const add = (...ids: string[]) => {
    for (const id of ids) nets.add(id);
  };
  for (const el of netlist.elements) {
    if (skipIds.has(el.id)) continue;
    switch (el.kind) {
      case "resistor":
      case "inductor":
      case "capacitor":
      case "ammeter":
        add(el.n1, el.n2);
        break;
      case "potentiometer":
        add(el.nA, el.nW, el.nB);
        break;
      case "switch":
        if (el.closed) add(el.n1, el.n2);
        break;
      case "voltage_source":
      case "current_source":
      case "voltmeter":
        add(el.nPos, el.nNeg);
        break;
      case "diode":
      case "led":
        add(el.nAnode, el.nCathode);
        break;
      default:
        break;
    }
  }
  return [...nets].filter((n) => n !== netlist.groundNet);
}

function solveCompanionStep(
  netlist: Netlist,
  skipIds: Set<string>,
  state: DynamicState,
  dt: number,
):
  | {
      voltages: Map<string, number>;
      extraCurrent: Map<string, number>;
      branchCurrent: Map<string, number>;
    }
  | { error: string } {
  const voltageSources = collectVoltageSources(netlist, skipIds);
  const nodes = activeNets(netlist, skipIds);
  const n = nodes.length;
  const m = voltageSources.length;
  const dim = n + m;
  if (dim === 0) {
    return {
      voltages: new Map([[GROUND_NET, 0]]),
      extraCurrent: new Map(),
      branchCurrent: new Map(),
    };
  }

  const indexOf = new Map<string, number>();
  nodes.forEach((id, i) => indexOf.set(id, i));
  const A = Array.from({ length: dim }, () => new Array<number>(dim).fill(0));
  const rhs = new Array<number>(dim).fill(0);

  const stampG = (n1: string, n2: string, g: number) =>
    stampConductance(A as unknown as number[][], indexOf, n1, n2, g);

  for (const el of netlist.elements) {
    if (skipIds.has(el.id)) continue;
    if (el.kind === "resistor") {
      stampG(el.n1, el.n2, 1 / el.resistance);
    } else if (el.kind === "potentiometer") {
      const { rAw, rWb } = potentiometerArmResistances(el.resistance, el.wiperPosition);
      stampG(el.nA, el.nW, 1 / rAw);
      stampG(el.nW, el.nB, 1 / rWb);
    } else if (el.kind === "voltmeter") {
      stampG(el.nPos, el.nNeg, VOLTMETER_CONDUCTANCE);
    } else if (el.kind === "current_source") {
      stampCurrent(rhs, indexOf, el.nPos, el.nNeg, el.current);
    } else if (el.kind === "capacitor") {
      const g = el.capacitance / dt;
      const vcPrev = state.vc.get(el.id) ?? 0;
      stampG(el.n1, el.n2, g);
      // i = G·v − G·v_prev  → RHS += G·v_prev at n1
      stampCurrent(rhs, indexOf, el.n1, el.n2, g * vcPrev);
    } else if (el.kind === "inductor") {
      const g = dt / el.inductance;
      const ilPrev = state.il.get(el.id) ?? 0;
      stampG(el.n1, el.n2, g);
      // i = G·v + i_prev  → Ieq = −i_prev in (G·v − Ieq) form
      stampCurrent(rhs, indexOf, el.n1, el.n2, -ilPrev);
    }
  }

  for (let k = 0; k < voltageSources.length; k++) {
    const vs = voltageSources[k];
    const col = n + k;
    const iPos = indexOf.get(vs.nPos);
    const iNeg = indexOf.get(vs.nNeg);
    if (iPos !== undefined) A[iPos][col] += 1;
    if (iNeg !== undefined) A[iNeg][col] -= 1;
    if (iPos !== undefined) A[col][iPos] += 1;
    if (iNeg !== undefined) A[col][iNeg] -= 1;
    rhs[col] = vs.voltage;
  }

  const solved = solveLinearSystem(A, rhs);
  if ("singular" in solved) {
    return {
      error:
        "Singular transient matrix — check topology, time step, or dynamic element values",
    };
  }

  const voltages = new Map<string, number>();
  voltages.set(GROUND_NET, 0);
  for (const [id, idx] of indexOf) {
    voltages.set(id, solved.x[idx]);
  }
  const extraCurrent = new Map<string, number>();
  for (let k = 0; k < voltageSources.length; k++) {
    extraCurrent.set(voltageSources[k].id, solved.x[n + k]);
  }

  const branchCurrent = new Map<string, number>();
  for (const el of netlist.elements) {
    if (el.kind === "capacitor") {
      const g = el.capacitance / dt;
      const vcPrev = state.vc.get(el.id) ?? 0;
      const v = netV(voltages, el.n1) - netV(voltages, el.n2);
      branchCurrent.set(el.id, g * (v - vcPrev));
    } else if (el.kind === "inductor") {
      const g = dt / el.inductance;
      const ilPrev = state.il.get(el.id) ?? 0;
      const v = netV(voltages, el.n1) - netV(voltages, el.n2);
      branchCurrent.set(el.id, g * v + ilPrev);
    } else if (el.kind === "resistor") {
      const v = netV(voltages, el.n1) - netV(voltages, el.n2);
      branchCurrent.set(el.id, v / el.resistance);
    }
  }

  return { voltages, extraCurrent, branchCurrent };
}

function readInitialVoltage(
  circuit: CircuitDefinition,
  el: Extract<NetlistElement, { kind: "capacitor" }>,
  options: TransientOptions,
): number {
  if (options.capacitorVoltage && options.capacitorVoltage[el.id] != null) {
    return options.capacitorVoltage[el.id];
  }
  const comp = circuit.components.find((c) => c.id === el.id);
  const prop = comp?.properties.initialVoltage;
  return typeof prop === "number" && Number.isFinite(prop) ? prop : 0;
}

function readInitialCurrent(
  circuit: CircuitDefinition,
  el: Extract<NetlistElement, { kind: "inductor" }>,
  options: TransientOptions,
): number {
  if (options.inductorCurrent && options.inductorCurrent[el.id] != null) {
    return options.inductorCurrent[el.id];
  }
  const comp = circuit.components.find((c) => c.id === el.id);
  const prop = comp?.properties.initialCurrent;
  return typeof prop === "number" && Number.isFinite(prop) ? prop : 0;
}

function sampleValues(
  netlist: Netlist,
  voltages: Map<string, number>,
  branchCurrent: Map<string, number>,
  extraCurrent: Map<string, number>,
): Record<string, number> {
  const values: Record<string, number> = {};
  let pTotal = 0;

  for (const el of netlist.elements) {
    if (el.kind === "capacitor") {
      const v = netV(voltages, el.n1) - netV(voltages, el.n2);
      const i = branchCurrent.get(el.id) ?? 0;
      values[`V_${el.id}`] = v;
      values[`I_${el.id}`] = i;
      values.vc = v;
      values.capacitorVoltage = v;
      pTotal += v * i;
    } else if (el.kind === "inductor") {
      const v = netV(voltages, el.n1) - netV(voltages, el.n2);
      const i = branchCurrent.get(el.id) ?? 0;
      values[`V_${el.id}`] = v;
      values[`I_${el.id}`] = i;
      pTotal += v * i;
    } else if (el.kind === "resistor") {
      const v = netV(voltages, el.n1) - netV(voltages, el.n2);
      const i = branchCurrent.get(el.id) ?? 0;
      values[`V_${el.id}`] = v;
      values[`I_${el.id}`] = i;
      pTotal += v * i;
    } else if (el.kind === "voltage_source") {
      const iMna = extraCurrent.get(el.id) ?? 0;
      const delivered = -iMna;
      values[`V_${el.id}`] = el.voltage;
      values[`I_${el.id}`] = delivered;
    }
  }

  values.P_total = pTotal;
  values.power = pTotal;
  return values;
}

/** Infer a stable window from RC / RL / RLC dynamics. */
export function inferTransientOptions(circuit: CircuitDefinition): TransientOptions | null {
  const resistors = circuit.components.filter((c) => c.type === "resistor");
  const capacitors = circuit.components.filter((c) => c.type === "capacitor");
  const inductors = circuit.components.filter((c) => c.type === "inductor");
  if (capacitors.length === 0 && inductors.length === 0) return null;

  const rVals = resistors
    .map((r) => r.properties.resistance)
    .filter((x): x is number => typeof x === "number" && x > 0);
  const rEq = rVals.length ? Math.min(...rVals) : 1000;

  const cVals = capacitors
    .map((c) => c.properties.capacitance)
    .filter((x): x is number => typeof x === "number" && x > 0);
  const lVals = inductors
    .map((l) => l.properties.inductance)
    .filter((x): x is number => typeof x === "number" && x > 0);

  // Series RLC: window from natural period and damping envelope (not fabricated Q).
  if (cVals.length > 0 && lVals.length > 0) {
    const C = Math.min(...cVals);
    const L = Math.min(...lVals);
    const omega0 = 1 / Math.sqrt(L * C);
    const T0 = (2 * Math.PI) / omega0;
    const alpha = rEq / (2 * L);
    const settle = alpha > 1e-12 ? 8 / alpha : 10 * T0;
    const duration = Math.max(settle, 6 * T0);
    const timeStep = Math.min(T0 / 80, duration / 400);
    return {
      duration,
      timeStep: Math.max(timeStep, duration / 5000),
      t0: 0,
    };
  }

  let tau = 0;
  for (const cap of cVals) {
    tau = Math.max(tau, timeConstant(rEq, cap));
  }
  for (const ind of lVals) {
    tau = Math.max(tau, ind / rEq);
  }
  if (!(tau > 0)) {
    tau = 1e-3;
  }

  const duration = 5 * tau;
  const timeStep = Math.max(duration / 200, tau / 50);
  return { duration, timeStep, t0: 0 };
}

export function circuitHasDynamicElements(circuit: CircuitDefinition): boolean {
  return circuit.components.some(
    (c) => c.type === "capacitor" || c.type === "inductor",
  );
}

export function solveTransient(
  circuit: CircuitDefinition,
  options: TransientOptions,
): TransientResult {
  const validation = validateCircuit(circuit);
  if (!validation.valid) {
    const first = validation.errors[0];
    return fail(
      `Validation failed: ${first?.message || "Unknown error"}`,
      first?.code ?? "SOLVER_FAILED",
    );
  }

  const { duration, timeStep } = options;
  if (!(duration > 0) || !(timeStep > 0)) {
    return fail("Transient duration and timeStep must be positive");
  }
  if (timeStep > duration) {
    return fail("timeStep must not exceed duration");
  }

  const steps = Math.min(Math.ceil(duration / timeStep), MAX_STEPS);
  if (steps < 1) return fail("Transient produced no steps");

  const graphResult = buildElectricalNodes(circuit);
  if (!hasGround(graphResult.nodes)) {
    return fail("No ground found in circuit", "MISSING_GROUND");
  }
  const netlist = buildNetlist(circuit, graphResult.nodes);
  if (netlist.errors.length > 0) {
    return fail(netlist.errors[0]);
  }
  const loop = sourceLoopIsWired(netlist);
  if (loop.shorted) {
    return fail(
      `Short circuit: source ${loop.sourceId} has both terminals on the same net`,
      "SHORT_CIRCUIT",
    );
  }
  if (!loop.wired) {
    return fail(
      `Open circuit: source ${loop.sourceId ?? ""} has no wired path to complete a loop`.trim(),
      "OPEN_CIRCUIT",
    );
  }

  const skipIds = new Set(
    circuit.components
      .filter(
        (c) =>
          (c.type === "voltmeter" || c.type === "ammeter") &&
          !allTerminalsWired(circuit, c),
      )
      .map((c) => c.id),
  );

  const state: DynamicState = { vc: new Map(), il: new Map() };
  for (const el of netlist.elements) {
    if (el.kind === "capacitor") {
      state.vc.set(el.id, readInitialVoltage(circuit, el, options));
    } else if (el.kind === "inductor") {
      state.il.set(el.id, readInitialCurrent(circuit, el, options));
    }
  }

  const t0 = options.t0 ?? 0;
  const timeSeries: TimeSeriesSample[] = [];

  // Sample initial conditions at t0 (before the first integration step).
  const initialValues: Record<string, number> = { P_total: 0, power: 0 };
  for (const el of netlist.elements) {
    if (el.kind === "capacitor") {
      const v = state.vc.get(el.id) ?? 0;
      initialValues[`V_${el.id}`] = v;
      initialValues[`I_${el.id}`] = 0;
      initialValues.vc = v;
      initialValues.capacitorVoltage = v;
    } else if (el.kind === "inductor") {
      const i = state.il.get(el.id) ?? 0;
      initialValues[`V_${el.id}`] = 0;
      initialValues[`I_${el.id}`] = i;
    }
  }
  timeSeries.push({ t: t0, values: initialValues });

  let tPrev = t0;
  for (let step = 1; step <= steps; step++) {
    const t = Math.min(t0 + step * timeStep, t0 + duration);
    const dt = Math.max(t - tPrev, timeStep * 1e-12);

    const solved = solveCompanionStep(netlist, skipIds, state, dt);
    if ("error" in solved) {
      return fail(solved.error);
    }

    for (const el of netlist.elements) {
      if (el.kind === "capacitor") {
        const v = netV(solved.voltages, el.n1) - netV(solved.voltages, el.n2);
        if (!Number.isFinite(v)) return fail("Non-finite capacitor voltage");
        state.vc.set(el.id, v);
      } else if (el.kind === "inductor") {
        const i = solved.branchCurrent.get(el.id) ?? 0;
        if (!Number.isFinite(i)) return fail("Non-finite inductor current");
        state.il.set(el.id, i);
      }
    }

    timeSeries.push({
      t,
      values: sampleValues(
        netlist,
        solved.voltages,
        solved.branchCurrent,
        solved.extraCurrent,
      ),
    });
    tPrev = t;
  }

  return {
    success: true,
    timeSeries,
    duration,
    timeStep,
    steps: timeSeries.length,
  };
}
