/**
 * Phase 2 — topology + MNA solver on known circuits.
 * Geometry must not affect electrical results.
 */

import { solveDC } from '../dcSolver';
import { solveCircuit } from '../circuitSolver';
import { validateCircuit } from '../circuitValidator';
import { buildElectricalNodes } from '../circuitGraphBuilder';
import { buildNetlist } from '../netlist';
import {
  currentDivider,
  ohmsLaw,
  openCircuitMissingReturn,
  parallel5VTwo1k,
  reverseDiode,
  series5VTwo1k,
  seriesDiode,
  seriesParallel12V,
  seriesRC,
  shortedSource,
  voltageDivider12V,
} from './circuitFixtures';

const ABS = 1e-9;
const REL = 1e-6;

function close(actual: number | undefined, expected: number) {
  expect(actual).toBeDefined();
  expect(actual!).toBeCloseTo(expected, 6);
}

describe('Phase 2 topology solver', () => {
  it('12 V, 1 kΩ + 4 kΩ divider: 2.4 mA, 2.4 V, 9.6 V', () => {
    const circuit = voltageDivider12V();
    const result = solveCircuit(circuit);
    expect(result.status).toBe('completed');
    close(result.measurements?.totalCurrent, 0.0024);
    close(result.measurements?.equivalentResistance, 5000);
    const r1 = result.measurements?.componentMeasurements.find((m) => m.componentId === 'R1');
    const r2 = result.measurements?.componentMeasurements.find((m) => m.componentId === 'R2');
    close(r1?.voltage, 2.4);
    close(r1?.current, 0.0024);
    close(r2?.voltage, 9.6);
    close(r2?.current, 0.0024);
    close(r1!.voltage + r2!.voltage, 12);
  });

  it('does not use component x/y for solving', () => {
    const a = voltageDivider12V();
    const b = voltageDivider12V();
    b.components.forEach((c, i) => {
      c.position = { x: 900 + i * 50, y: -400 };
    });
    const ra = solveDC(a);
    const rb = solveDC(b);
    expect(ra.success).toBe(true);
    expect(rb.totalCurrent).toBeCloseTo(ra.totalCurrent, 12);
    expect(rb.componentResults.get('R1')?.voltage).toBeCloseTo(
      ra.componentResults.get('R1')?.voltage ?? NaN,
      12,
    );
  });

  it('netlist contains no geometry', () => {
    const circuit = voltageDivider12V();
    const graph = buildElectricalNodes(circuit);
    const netlist = buildNetlist(circuit, graph.nodes);
    const dumped = JSON.stringify(netlist.elements);
    expect(dumped).not.toMatch(/"x"/);
    expect(netlist.elements.some((e) => e.kind === 'resistor')).toBe(true);
  });

  it('Ohm\'s law', () => {
    const result = solveDC(ohmsLaw(12, 2000));
    expect(result.success).toBe(true);
    close(result.totalCurrent, 0.006);
    close(result.componentResults.get('R1')?.voltage, 12);
  });

  it('series: equal current, KVL', () => {
    const result = solveDC(series5VTwo1k());
    expect(result.success).toBe(true);
    close(result.totalCurrent, 0.0025);
    const r1 = result.componentResults.get('R1')!;
    const r2 = result.componentResults.get('R2')!;
    expect(r1.current).toBeCloseTo(r2.current, 12);
    expect(r1.voltage + r2.voltage).toBeCloseTo(5, 9);
  });

  it('parallel: equal voltage, KCL', () => {
    const result = solveDC(parallel5VTwo1k());
    expect(result.success).toBe(true);
    close(result.totalCurrent, 0.01);
    close(result.equivalentResistance, 500);
    const r1 = result.componentResults.get('R1')!;
    const r2 = result.componentResults.get('R2')!;
    expect(r1.voltage).toBeCloseTo(r2.voltage, 12);
    expect(r1.current + r2.current).toBeCloseTo(result.totalCurrent, 9);
  });

  it('series-parallel mixed network', () => {
    const result = solveDC(seriesParallel12V());
    expect(result.success).toBe(true);
    close(result.equivalentResistance, 2000);
    close(result.totalCurrent, 0.006);
    close(result.componentResults.get('R1')?.voltage, 6);
    close(result.componentResults.get('R2')?.voltage, 6);
    close(result.componentResults.get('R3')?.voltage, 6);
    close(result.componentResults.get('R2')?.current, 0.003);
    close(result.componentResults.get('R3')?.current, 0.003);
  });

  it('current divider 1 kΩ || 3 kΩ at 12 V', () => {
    const result = solveDC(currentDivider());
    expect(result.success).toBe(true);
    close(result.componentResults.get('R1')?.current, 0.012);
    close(result.componentResults.get('R2')?.current, 0.004);
    close(result.totalCurrent, 0.016);
  });

  it('open circuit returns structured OPEN_CIRCUIT (no fake current)', () => {
    const circuit = openCircuitMissingReturn();
    const validation = validateCircuit(circuit);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.code === 'OPEN_CIRCUIT')).toBe(true);
    const solved = solveCircuit(circuit);
    expect(solved.status).toBe('invalid');
    expect(solved.measurements).toBeUndefined();
    expect(solved.dcResult).toBeUndefined();
  });

  it('shorted source returns structured SHORT_CIRCUIT', () => {
    const circuit = shortedSource();
    const validation = validateCircuit(circuit);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.code === 'SHORT_CIRCUIT')).toBe(true);
    const solved = solveCircuit(circuit);
    expect(solved.status).toBe('invalid');
    expect(solved.measurements).toBeUndefined();
  });

  it('invalid circuit without ground', () => {
    const circuit = ohmsLaw(5, 1000);
    circuit.components = circuit.components.filter((c) => c.type !== 'ground');
    circuit.connections = circuit.connections.filter((c) => !c.to.includes('GND') && !c.from.includes('GND'));
    const solved = solveCircuit(circuit);
    expect(solved.status).toBe('invalid');
    expect(solved.validation?.errors.some((e) => e.code === 'MISSING_GROUND')).toBe(true);
  });

  it('RC DC steady state: capacitor open, Vc = Vs, I = 0', () => {
    const result = solveDC(seriesRC());
    expect(result.success).toBe(true);
    close(result.totalCurrent, 0);
    close(result.componentResults.get('R1')?.voltage, 0);
    close(result.componentResults.get('C1')?.voltage, 5);
    close(result.componentResults.get('C1')?.current, 0);
  });

  it('forward diode: Vf drop and (Vs-Vf)/R current', () => {
    const result = solveDC(seriesDiode());
    expect(result.success).toBe(true);
    close(result.componentResults.get('D1')?.voltage, 0.7);
    close(result.componentResults.get('D1')?.current, 0.0043);
    close(result.componentResults.get('R1')?.voltage, 4.3);
  });

  it('reverse diode: blocks; does not invent current', () => {
    const result = solveDC(reverseDiode());
    expect(result.success).toBe(true);
    close(result.componentResults.get('D1')?.current, 0);
    close(result.totalCurrent, 0);
  });

  it('KCL at the divider tap', () => {
    const result = solveDC(voltageDivider12V());
    const i1 = result.componentResults.get('R1')!.current;
    const i2 = result.componentResults.get('R2')!.current;
    expect(Math.abs(i1 - i2)).toBeLessThan(ABS + REL * Math.abs(i1));
  });
});
