/**
 * DC solver — modified nodal analysis on the electrical netlist.
 * Visual geometry is never used.
 */

import type { CircuitDefinition, ElectricalNode } from './circuitGraph';
import {
  buildElectricalNodes,
  hasGround,
} from './circuitGraphBuilder';
import { validateCircuit } from './circuitValidator';
import { solveLinearSystem } from './linearAlgebra';
import {
  GROUND_NET,
  buildNetlist,
  sourceLoopIsWired,
  type Netlist,
  type NetlistElement,
} from './netlist';
import type { ErrorCode } from './errors';

export interface DCResult {
  nodeVoltages: Map<string, number>;
  branchCurrents: Map<string, number>;
  componentResults: Map<string, ComponentResult>;
  totalCurrent: number;
  totalPower: number;
  equivalentResistance: number;
  success: boolean;
  error?: string;
  errorCode?: ErrorCode;
}

export interface ComponentResult {
  componentId: string;
  voltage: number;
  current: number;
  power: number;
  resistance?: number;
}

const VOLTMETER_CONDUCTANCE = 1e-12;
const DIODE_MAX_ITERS = 16;

function fail(error: string, errorCode: ErrorCode): DCResult {
  return {
    nodeVoltages: new Map(),
    branchCurrents: new Map(),
    componentResults: new Map(),
    totalCurrent: 0,
    totalPower: 0,
    equivalentResistance: 0,
    success: false,
    error,
    errorCode,
  };
}

export function solveDC(circuit: CircuitDefinition): DCResult {
  const validation = validateCircuit(circuit);
  if (!validation.valid) {
    const first = validation.errors[0];
    return fail(
      `Validation failed: ${first?.message || 'Unknown error'}`,
      first?.code ?? 'SOLVER_FAILED',
    );
  }

  const graphResult = buildElectricalNodes(circuit);
  const fatalErrors = graphResult.errors.filter(
    (e) => e.includes('has no connections') || e.includes('No components with terminals found'),
  );
  if (fatalErrors.length > 0) {
    return fail(`Graph error: ${fatalErrors[0]}`, 'OPEN_CIRCUIT');
  }
  if (!hasGround(graphResult.nodes)) {
    return fail('No ground found in circuit', 'MISSING_GROUND');
  }

  const netlist = buildNetlist(circuit, graphResult.nodes);
  if (netlist.errors.length > 0) {
    return fail(netlist.errors[0], 'SOLVER_FAILED');
  }

  const loop = sourceLoopIsWired(netlist);
  if (loop.shorted) {
    return fail(
      `Short circuit: source ${loop.sourceId} has both terminals on the same net`,
      'SHORT_CIRCUIT',
    );
  }
  if (!loop.wired) {
    return fail(
      `Open circuit: source ${loop.sourceId ?? ''} has no wired path to complete a loop`.trim(),
      'OPEN_CIRCUIT',
    );
  }

  return solveNetlist(circuit, graphResult.nodes, netlist);
}

interface VoltageUnknown {
  id: string;
  nPos: string;
  nNeg: string;
  voltage: number;
}

interface DiodeState {
  id: string;
  on: boolean;
  kind: 'diode' | 'led';
  nAnode: string;
  nCathode: string;
  vf: number;
}

function collectVoltageUnknowns(
  netlist: Netlist,
  diodes: DiodeState[],
): VoltageUnknown[] {
  const list: VoltageUnknown[] = [];
  for (const el of netlist.elements) {
    if (el.kind === 'voltage_source') {
      list.push({ id: el.id, nPos: el.nPos, nNeg: el.nNeg, voltage: el.voltage });
    } else if (el.kind === 'inductor') {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: 0 });
    } else if (el.kind === 'switch' && el.closed) {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: 0 });
    } else if (el.kind === 'ammeter') {
      list.push({ id: el.id, nPos: el.n1, nNeg: el.n2, voltage: 0 });
    }
  }
  for (const d of diodes) {
    if (d.on) {
      list.push({ id: d.id, nPos: d.nAnode, nNeg: d.nCathode, voltage: d.vf });
    }
  }
  return list;
}

function nonGroundNets(netlist: Netlist): string[] {
  return netlist.nets.filter((n) => n !== netlist.groundNet);
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
  // Current source: I leaves nPos into the network (injected at nPos).
  const i = indexOf.get(nPos);
  const j = indexOf.get(nNeg);
  if (i !== undefined) J[i] += current;
  if (j !== undefined) J[j] -= current;
}

function solveStamps(
  netlist: Netlist,
  diodes: DiodeState[],
): { voltages: Map<string, number>; extraCurrent: Map<string, number> } | { error: string } {
  const voltageUnknowns = collectVoltageUnknowns(netlist, diodes);
  const nodes = nonGroundNets(netlist);
  const n = nodes.length;
  const m = voltageUnknowns.length;
  const dim = n + m;
  if (dim === 0) {
    return { voltages: new Map([[GROUND_NET, 0]]), extraCurrent: new Map() };
  }

  const indexOf = new Map<string, number>();
  nodes.forEach((id, i) => indexOf.set(id, i));

  const A = Array.from({ length: dim }, () => new Array<number>(dim).fill(0));
  const rhs = new Array<number>(dim).fill(0);

  const stampG = (n1: string, n2: string, g: number) => {
    stampConductance(A as unknown as number[][], indexOf, n1, n2, g);
  };

  for (const el of netlist.elements) {
    if (el.kind === 'resistor') {
      stampG(el.n1, el.n2, 1 / el.resistance);
    } else if (el.kind === 'voltmeter') {
      stampG(el.nPos, el.nNeg, VOLTMETER_CONDUCTANCE);
    } else if (el.kind === 'current_source') {
      stampCurrent(rhs, indexOf, el.nPos, el.nNeg, el.current);
    }
    // capacitors / open switches / off diodes: DC open, no stamp
  }

  for (let k = 0; k < voltageUnknowns.length; k++) {
    const vs = voltageUnknowns[k];
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
  if ('singular' in solved) {
    return { error: 'Singular circuit matrix — shorted source, floating node, or unsupported topology' };
  }

  const voltages = new Map<string, number>();
  voltages.set(GROUND_NET, 0);
  for (const [id, idx] of indexOf) {
    voltages.set(id, solved.x[idx]);
  }
  const extraCurrent = new Map<string, number>();
  for (let k = 0; k < voltageUnknowns.length; k++) {
    extraCurrent.set(voltageUnknowns[k].id, solved.x[n + k]);
  }
  return { voltages, extraCurrent };
}

function netVoltage(voltages: Map<string, number>, net: string): number {
  return voltages.get(net) ?? 0;
}

function iterateDiodes(
  netlist: Netlist,
): { voltages: Map<string, number>; extraCurrent: Map<string, number> } | { error: string } {
  const diodes: DiodeState[] = netlist.elements
    .filter((e): e is Extract<NetlistElement, { kind: 'diode' | 'led' }> =>
      e.kind === 'diode' || e.kind === 'led',
    )
    .map((e) => ({
      id: e.id,
      on: false,
      kind: e.kind,
      nAnode: e.nAnode,
      nCathode: e.nCathode,
      vf: e.vf,
    }));

  let last = solveStamps(netlist, diodes);
  if ('error' in last) return last;

  for (let iter = 0; iter < DIODE_MAX_ITERS; iter++) {
    let changed = false;
    for (const d of diodes) {
      const vak =
        netVoltage(last.voltages, d.nAnode) - netVoltage(last.voltages, d.nCathode);
      if (!d.on && vak > d.vf - 1e-9) {
        d.on = true;
        changed = true;
      } else if (d.on) {
        const i = last.extraCurrent.get(d.id) ?? 0;
        // i leaves anode into the Vf branch (forward current anode → cathode)
        if (i < -1e-12) {
          d.on = false;
          changed = true;
        }
      }
    }
    last = solveStamps(netlist, diodes);
    if ('error' in last) return last;
    if (!changed) break;
    if (iter === DIODE_MAX_ITERS - 1) {
      return { error: 'Diode model did not converge' };
    }
  }
  return last;
}

function solveNetlist(
  _circuit: CircuitDefinition,
  nodes: ElectricalNode[],
  netlist: Netlist,
): DCResult {
  const solved = iterateDiodes(netlist);
  if ('error' in solved) {
    return fail(solved.error, 'SOLVER_FAILED');
  }

  const { voltages, extraCurrent } = solved;
  const nodeVoltages = new Map<string, number>();
  const componentResults = new Map<string, ComponentResult>();
  const branchCurrents = new Map<string, number>();

  for (const node of nodes) {
    const net = node.isGround ? GROUND_NET : node.id;
    const v = netVoltage(voltages, net);
    nodeVoltages.set(node.id, v);
    for (const t of node.terminals) {
      nodeVoltages.set(t, v);
    }
  }
  nodeVoltages.set(GROUND_NET, 0);

  const vDrop = (n1: string, n2: string) =>
    netVoltage(voltages, n1) - netVoltage(voltages, n2);

  let totalPower = 0;
  let sourceDeliveredCurrent = 0;
  let sourceVoltage = 0;
  let sourceCount = 0;

  for (const el of netlist.elements) {
    if (el.kind === 'resistor') {
      const voltage = vDrop(el.n1, el.n2);
      const current = voltage / el.resistance;
      const power = current * current * el.resistance;
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: Math.abs(voltage),
        current: Math.abs(current),
        power,
        resistance: el.resistance,
      });
      branchCurrents.set(el.id, current);
      totalPower += power;
    } else if (el.kind === 'capacitor') {
      const voltage = vDrop(el.n1, el.n2);
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: Math.abs(voltage),
        current: 0,
        power: 0,
      });
      branchCurrents.set(el.id, 0);
    } else if (el.kind === 'inductor') {
      const i = extraCurrent.get(el.id) ?? 0;
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: 0,
        current: Math.abs(i),
        power: 0,
      });
      branchCurrents.set(el.id, i);
    } else if (el.kind === 'voltage_source') {
      const iMna = extraCurrent.get(el.id) ?? 0;
      const delivered = -iMna;
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: el.voltage,
        current: delivered,
        power: el.voltage * delivered,
      });
      branchCurrents.set(el.id, delivered);
      sourceDeliveredCurrent += delivered;
      sourceVoltage += el.voltage;
      sourceCount += 1;
    } else if (el.kind === 'current_source') {
      const voltage = vDrop(el.nPos, el.nNeg);
      componentResults.set(el.id, {
        componentId: el.id,
        voltage,
        current: el.current,
        power: voltage * el.current,
      });
      branchCurrents.set(el.id, el.current);
      sourceDeliveredCurrent += el.current;
      sourceCount += 1;
    } else if (el.kind === 'diode' || el.kind === 'led') {
      const vak = vDrop(el.nAnode, el.nCathode);
      const iMna = extraCurrent.get(el.id);
      const on = iMna !== undefined;
      const iAc = on ? (iMna ?? 0) : 0;
      const voltage = on ? el.vf : Math.abs(vak);
      const current = Math.max(iAc, 0);
      componentResults.set(el.id, {
        componentId: el.id,
        voltage,
        current,
        power: voltage * current,
      });
      branchCurrents.set(el.id, current);
      totalPower += voltage * current;
    } else if (el.kind === 'switch') {
      const voltage = vDrop(el.n1, el.n2);
      const i = extraCurrent.get(el.id) ?? 0;
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: el.closed ? 0 : Math.abs(voltage),
        current: el.closed ? Math.abs(i) : 0,
        power: 0,
      });
    } else if (el.kind === 'voltmeter') {
      const voltage = vDrop(el.nPos, el.nNeg);
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: Math.abs(voltage),
        current: 0,
        power: 0,
      });
    } else if (el.kind === 'ammeter') {
      const i = extraCurrent.get(el.id) ?? 0;
      componentResults.set(el.id, {
        componentId: el.id,
        voltage: 0,
        current: Math.abs(i),
        power: 0,
      });
    }
  }

  const totalCurrent = sourceDeliveredCurrent;
  let equivalentResistance = 0;
  if (sourceCount === 1 && sourceVoltage > 0 && Math.abs(totalCurrent) > 1e-15) {
    equivalentResistance = sourceVoltage / totalCurrent;
  } else if (sourceCount === 1 && sourceVoltage > 0 && Math.abs(totalCurrent) <= 1e-15) {
    equivalentResistance = 0;
  }

  return {
    nodeVoltages,
    branchCurrents,
    componentResults,
    totalCurrent,
    totalPower: sourceVoltage !== 0 ? Math.abs(sourceVoltage * totalCurrent) : totalPower,
    equivalentResistance,
    success: true,
  };
}
