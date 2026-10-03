/**
 * Single-frequency AC (phasor) MNA solver.
 * Uses the electrical netlist — no hard-coded resonance curves.
 */

import type { CircuitDefinition } from './circuitGraph';
import { buildElectricalNodes, hasGround } from './circuitGraphBuilder';
import { validateCircuit } from './circuitValidator';
import {
  c,
  cAbs,
  cAdd,
  cArgDeg,
  cFromPolar,
  cMul,
  cScale,
  solveComplexLinearSystem,
  type Complex,
  C0,
} from './complexLinearAlgebra';
import type { ErrorCode } from './errors';
import {
  GROUND_NET,
  allTerminalsWired,
  buildNetlist,
  potentiometerArmResistances,
  sourceLoopIsWired,
  type Netlist,
} from './netlist';

const VOLTMETER_CONDUCTANCE = 1e-12;

export interface AcComponentResult {
  componentId: string;
  /** Peak phasor voltage magnitude (V). */
  voltageMag: number;
  voltagePhaseDeg: number;
  /** Peak phasor current magnitude (A). */
  currentMag: number;
  currentPhaseDeg: number;
  /** |Z| = |V|/|I| when I ≠ 0. */
  impedanceMag?: number;
}

export interface AcResult {
  frequency: number;
  omega: number;
  nodeVoltages: Map<string, Complex>;
  branchCurrents: Map<string, Complex>;
  componentResults: Map<string, AcComponentResult>;
  /** Source current phasor (delivered out of + terminal). */
  sourceCurrent: Complex;
  sourceVoltage: Complex;
  success: boolean;
  error?: string;
  errorCode?: ErrorCode;
}

export interface AcSolveOptions {
  /** Drive frequency in Hz (overrides source.frequency when set). */
  frequency: number;
}

function fail(error: string, errorCode: ErrorCode, frequency: number): AcResult {
  return {
    frequency,
    omega: 2 * Math.PI * frequency,
    nodeVoltages: new Map(),
    branchCurrents: new Map(),
    componentResults: new Map(),
    sourceCurrent: C0,
    sourceVoltage: C0,
    success: false,
    error,
    errorCode,
  };
}

/** Peak amplitude for a sine AC voltage source (falls back to `voltage`). */
export function acSourceAmplitude(props: {
  amplitude?: number;
  voltage?: number;
}): number {
  if (typeof props.amplitude === 'number' && Number.isFinite(props.amplitude)) {
    return props.amplitude;
  }
  return props.voltage ?? 0;
}

export function isAcVoltageSource(props: {
  frequency?: number;
  waveform?: string | number | boolean;
  acMode?: string | number | boolean;
}): boolean {
  const f = props.frequency;
  if (typeof f !== 'number' || !(f > 0)) return false;
  if (props.acMode === true || props.acMode === 1) return true;
  if (typeof props.waveform === 'string' && props.waveform.toLowerCase() === 'sine') {
    return true;
  }
  // frequency > 0 alone is enough to treat as AC drive
  return true;
}

interface VoltageUnknown {
  id: string;
  nPos: string;
  nNeg: string;
  voltage: Complex;
}

function stampY(
  Y: Complex[][],
  indexOf: Map<string, number>,
  n1: string,
  n2: string,
  y: Complex,
): void {
  if ((y.re === 0 && y.im === 0) || n1 === n2) return;
  const i = indexOf.get(n1);
  const j = indexOf.get(n2);
  if (i !== undefined) Y[i][i] = cAdd(Y[i][i], y);
  if (j !== undefined) Y[j][j] = cAdd(Y[j][j], y);
  if (i !== undefined && j !== undefined) {
    Y[i][j] = cAdd(Y[i][j], cScale(y, -1));
    Y[j][i] = cAdd(Y[j][i], cScale(y, -1));
  }
}

function stampCurrent(
  J: Complex[],
  indexOf: Map<string, number>,
  nPos: string,
  nNeg: string,
  current: Complex,
): void {
  const i = indexOf.get(nPos);
  const j = indexOf.get(nNeg);
  if (i !== undefined) J[i] = cAdd(J[i], current);
  if (j !== undefined) J[j] = cAdd(J[j], cScale(current, -1));
}

function collectVoltageUnknowns(
  netlist: Netlist,
  circuit: CircuitDefinition,
  frequency: number,
  skipIds: Set<string>,
): VoltageUnknown[] {
  const list: VoltageUnknown[] = [];
  for (const el of netlist.elements) {
    if (skipIds.has(el.id)) continue;
    if (el.kind === 'voltage_source') {
      const comp = circuit.components.find((c) => c.id === el.id);
      const amp = acSourceAmplitude(comp?.properties ?? { voltage: el.voltage });
      const phase =
        typeof comp?.properties.phase === 'number' ? comp.properties.phase : 0;
      // When sweeping, `frequency` argument is the drive; amplitude from props.
      list.push({
        id: el.id,
        nPos: el.nPos,
        nNeg: el.nNeg,
        voltage: cFromPolar(amp, phase),
      });
    } else if (el.kind === 'switch' && el.closed) {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: C0 });
    } else if (el.kind === 'ammeter') {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: C0 });
    }
    // Inductors use admittance stamps in AC (not V=0 branches).
  }
  void frequency;
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
      case 'resistor':
      case 'inductor':
      case 'capacitor':
      case 'ammeter':
        add(el.n1, el.n2);
        break;
      case 'potentiometer':
        add(el.nA, el.nW, el.nB);
        break;
      case 'switch':
        if (el.closed) add(el.n1, el.n2);
        break;
      case 'voltage_source':
      case 'current_source':
      case 'voltmeter':
        add(el.nPos, el.nNeg);
        break;
      case 'diode':
      case 'led':
        // Nonlinear devices: open for linear AC phasor solve
        break;
      default:
        break;
    }
  }
  return [...nets].filter((n) => n !== netlist.groundNet);
}

function solveAcNetlist(
  circuit: CircuitDefinition,
  netlist: Netlist,
  frequency: number,
  skipIds: Set<string>,
): AcResult {
  const omega = 2 * Math.PI * frequency;
  if (!(frequency > 0) || !Number.isFinite(omega)) {
    return fail('AC solve requires a positive frequency', 'SOLVER_FAILED', frequency);
  }

  const voltageUnknowns = collectVoltageUnknowns(netlist, circuit, frequency, skipIds);
  const nodes = activeNets(netlist, skipIds);
  const n = nodes.length;
  const m = voltageUnknowns.length;
  const dim = n + m;
  if (dim === 0) {
    return fail('Empty AC system', 'SOLVER_FAILED', frequency);
  }

  const indexOf = new Map<string, number>();
  nodes.forEach((id, i) => indexOf.set(id, i));

  const Y: Complex[][] = Array.from({ length: dim }, () =>
    Array.from({ length: dim }, () => ({ re: 0, im: 0 })),
  );
  const rhs: Complex[] = Array.from({ length: dim }, () => ({ re: 0, im: 0 }));

  for (const el of netlist.elements) {
    if (skipIds.has(el.id)) continue;
    if (el.kind === 'resistor') {
      stampY(Y, indexOf, el.n1, el.n2, c(1 / el.resistance, 0));
    } else if (el.kind === 'potentiometer') {
      const { rAw, rWb } = potentiometerArmResistances(el.resistance, el.wiperPosition);
      stampY(Y, indexOf, el.nA, el.nW, c(1 / rAw, 0));
      stampY(Y, indexOf, el.nW, el.nB, c(1 / rWb, 0));
    } else if (el.kind === 'capacitor') {
      if (el.capacitance > 0) {
        stampY(Y, indexOf, el.n1, el.n2, c(0, omega * el.capacitance));
      }
    } else if (el.kind === 'inductor') {
      if (el.inductance > 0) {
        // Y = 1/(jωL) = −j/(ωL)
        stampY(Y, indexOf, el.n1, el.n2, c(0, -1 / (omega * el.inductance)));
      }
    } else if (el.kind === 'voltmeter') {
      stampY(Y, indexOf, el.nPos, el.nNeg, c(VOLTMETER_CONDUCTANCE, 0));
    } else if (el.kind === 'current_source') {
      const comp = circuit.components.find((c) => c.id === el.id);
      const amp =
        typeof comp?.properties.amplitude === 'number'
          ? comp.properties.amplitude
          : el.current;
      const phase =
        typeof comp?.properties.phase === 'number' ? comp.properties.phase : 0;
      stampCurrent(rhs, indexOf, el.nPos, el.nNeg, cFromPolar(amp, phase));
    }
  }

  for (let k = 0; k < voltageUnknowns.length; k++) {
    const vs = voltageUnknowns[k];
    const col = n + k;
    const iPos = indexOf.get(vs.nPos);
    const iNeg = indexOf.get(vs.nNeg);
    const one = c(1, 0);
    const minus = c(-1, 0);
    if (iPos !== undefined) {
      Y[iPos][col] = cAdd(Y[iPos][col], one);
      Y[col][iPos] = cAdd(Y[col][iPos], one);
    }
    if (iNeg !== undefined) {
      Y[iNeg][col] = cAdd(Y[iNeg][col], minus);
      Y[col][iNeg] = cAdd(Y[col][iNeg], minus);
    }
    rhs[col] = vs.voltage;
  }

  const solved = solveComplexLinearSystem(Y, rhs);
  if ('singular' in solved) {
    return fail(
      'Singular AC matrix — check topology or frequency',
      'SOLVER_FAILED',
      frequency,
    );
  }

  const voltages = new Map<string, Complex>();
  voltages.set(GROUND_NET, C0);
  for (const [id, idx] of indexOf) {
    voltages.set(id, solved.x[idx]);
  }
  const extraCurrent = new Map<string, Complex>();
  for (let k = 0; k < voltageUnknowns.length; k++) {
    extraCurrent.set(voltageUnknowns[k].id, solved.x[n + k]);
  }

  const vDrop = (n1: string, n2: string): Complex => {
    const a = voltages.get(n1) ?? C0;
    const b = voltages.get(n2) ?? C0;
    return { re: a.re - b.re, im: a.im - b.im };
  };

  const componentResults = new Map<string, AcComponentResult>();
  const branchCurrents = new Map<string, Complex>();
  let sourceCurrent = C0;
  let sourceVoltage = C0;

  for (const el of netlist.elements) {
    if (skipIds.has(el.id)) continue;
    if (el.kind === 'resistor') {
      const v = vDrop(el.n1, el.n2);
      const i = cScale(v, 1 / el.resistance);
      branchCurrents.set(el.id, i);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: cAbs(v),
        voltagePhaseDeg: cArgDeg(v),
        currentMag: cAbs(i),
        currentPhaseDeg: cArgDeg(i),
        impedanceMag: el.resistance,
      });
    } else if (el.kind === 'capacitor') {
      const v = vDrop(el.n1, el.n2);
      const y = c(0, omega * el.capacitance);
      const i = cMul(y, v);
      branchCurrents.set(el.id, i);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: cAbs(v),
        voltagePhaseDeg: cArgDeg(v),
        currentMag: cAbs(i),
        currentPhaseDeg: cArgDeg(i),
        impedanceMag: el.capacitance > 0 ? 1 / (omega * el.capacitance) : undefined,
      });
    } else if (el.kind === 'inductor') {
      const v = vDrop(el.n1, el.n2);
      const y = c(0, -1 / (omega * el.inductance));
      const i = cMul(y, v);
      branchCurrents.set(el.id, i);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: cAbs(v),
        voltagePhaseDeg: cArgDeg(v),
        currentMag: cAbs(i),
        currentPhaseDeg: cArgDeg(i),
        impedanceMag: omega * el.inductance,
      });
    } else if (el.kind === 'voltage_source') {
      const iMna = extraCurrent.get(el.id) ?? C0;
      const delivered = cScale(iMna, -1);
      const vs = voltageUnknowns.find((u) => u.id === el.id)?.voltage ?? C0;
      branchCurrents.set(el.id, delivered);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: cAbs(vs),
        voltagePhaseDeg: cArgDeg(vs),
        currentMag: cAbs(delivered),
        currentPhaseDeg: cArgDeg(delivered),
      });
      sourceCurrent = cAdd(sourceCurrent, delivered);
      sourceVoltage = vs;
    } else if (el.kind === 'ammeter') {
      const i = extraCurrent.get(el.id) ?? C0;
      branchCurrents.set(el.id, i);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: 0,
        voltagePhaseDeg: 0,
        currentMag: cAbs(i),
        currentPhaseDeg: cArgDeg(i),
      });
    } else if (el.kind === 'voltmeter') {
      const v = vDrop(el.nPos, el.nNeg);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: cAbs(v),
        voltagePhaseDeg: cArgDeg(v),
        currentMag: 0,
        currentPhaseDeg: 0,
      });
    } else if (el.kind === 'potentiometer') {
      const { rAw, rWb } = potentiometerArmResistances(el.resistance, el.wiperPosition);
      const vAw = vDrop(el.nA, el.nW);
      const iAw = cScale(vAw, 1 / rAw);
      const vout = vDrop(el.nW, el.nB);
      branchCurrents.set(el.id, iAw);
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: cAbs(vout),
        voltagePhaseDeg: cArgDeg(vout),
        currentMag: cAbs(iAw),
        currentPhaseDeg: cArgDeg(iAw),
        impedanceMag: el.resistance,
      });
      void rWb;
    } else if (el.kind === 'switch') {
      const v = vDrop(el.n1, el.n2);
      const i = el.closed ? (extraCurrent.get(el.id) ?? C0) : C0;
      componentResults.set(el.id, {
        componentId: el.id,
        voltageMag: el.closed ? 0 : cAbs(v),
        voltagePhaseDeg: el.closed ? 0 : cArgDeg(v),
        currentMag: cAbs(i),
        currentPhaseDeg: cArgDeg(i),
      });
    }
  }

  const nodeVoltages = new Map<string, Complex>();
  nodeVoltages.set(GROUND_NET, C0);
  for (const [id, v] of voltages) {
    nodeVoltages.set(id, v);
  }

  return {
    frequency,
    omega,
    nodeVoltages,
    branchCurrents,
    componentResults,
    sourceCurrent,
    sourceVoltage,
    success: true,
  };
}

/**
 * Solve the circuit in the frequency domain at one drive frequency.
 */
export function solveAC(circuit: CircuitDefinition, options: AcSolveOptions): AcResult {
  const frequency = options.frequency;
  const validation = validateCircuit(circuit);
  if (!validation.valid) {
    const first = validation.errors[0];
    return fail(
      `Validation failed: ${first?.message || 'Unknown error'}`,
      first?.code ?? 'SOLVER_FAILED',
      frequency,
    );
  }

  const graphResult = buildElectricalNodes(circuit);
  const fatalErrors = graphResult.errors.filter(
    (e) => e.includes('has no connections') || e.includes('No components with terminals found'),
  );
  if (fatalErrors.length > 0) {
    return fail(`Graph error: ${fatalErrors[0]}`, 'OPEN_CIRCUIT', frequency);
  }
  if (!hasGround(graphResult.nodes)) {
    return fail('No ground found in circuit', 'MISSING_GROUND', frequency);
  }

  const netlist = buildNetlist(circuit, graphResult.nodes);
  if (netlist.errors.length > 0) {
    return fail(netlist.errors[0], 'SOLVER_FAILED', frequency);
  }

  const loop = sourceLoopIsWired(netlist);
  if (loop.shorted) {
    return fail(
      `Short circuit: source ${loop.sourceId} has both terminals on the same net`,
      'SHORT_CIRCUIT',
      frequency,
    );
  }
  if (!loop.wired) {
    return fail(
      `Open circuit: source ${loop.sourceId ?? ''} has no wired path to complete a loop`.trim(),
      'OPEN_CIRCUIT',
      frequency,
    );
  }

  const skipIds = new Set(
    circuit.components
      .filter(
        (c) =>
          (c.type === 'voltmeter' || c.type === 'ammeter') &&
          !allTerminalsWired(circuit, c),
      )
      .map((c) => c.id),
  );

  return solveAcNetlist(circuit, netlist, frequency, skipIds);
}
