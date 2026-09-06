/**
 * Phase 3 — measurements from the solved netlist / SimulationRun snapshot.
 */
import { solveCircuit } from '../circuitSolver';
import {
  displayableSimulationResult,
  electricalFingerprint,
  resultIsBoundToCircuit,
} from '../electricalSnapshot';
import { voltageDivider12V, voltageDivider12VWithMeters } from './circuitFixtures';
import { createTerminalId } from '../circuitGraph';
import type { CircuitDefinition } from '../circuitGraph';

describe('Phase 3 measurements from solved topology', () => {
  it('voltmeter reads node voltage difference, not a nearby resistor heuristic', () => {
    const result = solveCircuit(voltageDivider12VWithMeters());
    expect(result.status).toBe('completed');
    const vm = result.measurements?.componentMeasurements.find((m) => m.componentId === 'VM1');
    expect(vm?.type).toBe('voltmeter');
    expect(vm?.voltage).toBeCloseTo(9.6, 6);
    expect(vm?.current).toBeCloseTo(0, 9);
    expect(vm?.power).toBeCloseTo(0, 9);
  });

  it('ammeter reads current through its own branch', () => {
    const result = solveCircuit(voltageDivider12VWithMeters());
    const am = result.measurements?.componentMeasurements.find((m) => m.componentId === 'AM1');
    expect(am?.type).toBe('ammeter');
    expect(am?.current).toBeCloseTo(0.0024, 6);
    expect(am?.voltage).toBeCloseTo(0, 6);
  });

  it('power is V·I from the same solve', () => {
    const result = solveCircuit(voltageDivider12VWithMeters());
    const r1 = result.measurements?.componentMeasurements.find((m) => m.componentId === 'R1');
    expect(r1?.power).toBeCloseTo(2.4 * 0.0024, 6);
    const r2 = result.measurements?.componentMeasurements.find((m) => m.componentId === 'R2');
    expect(r2?.power).toBeCloseTo(9.6 * 0.0024, 6);
    expect(result.measurements?.totalPower).toBeCloseTo(12 * 0.0024, 6);
  });

  it('disconnected instrument produces no invented reading', () => {
    const circuit: CircuitDefinition = {
      ...voltageDivider12V(),
      components: [
        ...voltageDivider12V().components,
        {
          id: 'VM1',
          type: 'voltmeter',
          label: 'VM1',
          position: { x: 0, y: 0 },
          rotation: 0,
          properties: {},
          terminals: [
            { id: createTerminalId('VM1', 'positive'), type: 'positive', componentId: 'VM1' },
            { id: createTerminalId('VM1', 'negative'), type: 'negative', componentId: 'VM1' },
          ],
        },
      ],
    };
    const result = solveCircuit(circuit);
    expect(result.status).toBe('completed');
    const vm = result.measurements?.componentMeasurements.find((m) => m.componentId === 'VM1');
    expect(vm).toBeUndefined();
    expect(result.measurements?.totalCurrent).toBeCloseTo(0.0024, 6);
  });

  it('binds measurements to a netlist snapshot of the solved circuit', () => {
    const circuit = voltageDivider12V();
    const result = solveCircuit(circuit);
    expect(result.metadata?.solvedCircuitFingerprint).toBe(electricalFingerprint(circuit));
    expect(result.metadata?.netlistSnapshot).toBeDefined();
    const snap = result.metadata?.netlistSnapshot as { elements?: { id: string }[] };
    expect(snap.elements?.some((e) => e.id === 'R1')).toBe(true);
    expect(resultIsBoundToCircuit(result, circuit)).toBe(true);
  });

  it('changing the circuit invalidates the previous run (stale-result prevention)', () => {
    const first = voltageDivider12V();
    const result = solveCircuit(first);
    const changed = voltageDivider12V();
    const r2 = changed.components.find((c) => c.id === 'R2');
    if (r2) r2.properties = { resistance: 2000 };
    expect(resultIsBoundToCircuit(result, changed)).toBe(false);
    expect(displayableSimulationResult(result, changed)).toBeNull();
    expect(displayableSimulationResult(result, first)?.measurements?.totalCurrent).toBeCloseTo(
      0.0024,
      6,
    );
  });

  it('rerun after change yields a fresh bound result', () => {
    const first = solveCircuit(voltageDivider12V());
    const nextCircuit = voltageDivider12V();
    const r2 = nextCircuit.components.find((c) => c.id === 'R2');
    if (r2) r2.properties = { resistance: 2000 };
    const second = solveCircuit(nextCircuit);
    expect(second.status).toBe('completed');
    expect(second.metadata?.solvedCircuitFingerprint).not.toBe(
      first.metadata?.solvedCircuitFingerprint,
    );
    expect(resultIsBoundToCircuit(second, nextCircuit)).toBe(true);
    expect(second.measurements?.totalCurrent).toBeCloseTo(12 / 3000, 6);
    expect(second.measurements?.componentMeasurements.find((m) => m.componentId === 'R2')?.voltage).toBeCloseTo(
      8,
      6,
    );
  });
});
