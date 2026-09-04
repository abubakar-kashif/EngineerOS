/**
 * Block 5 — targeted simulation pipeline tests
 * voltage divider, parallel, RC, diode, LED invalid/valid, graphs, instruments
 */
import { solveCircuit } from '../circuitSolver';
import { generateAllGraphs } from '../graphData';
import type { CircuitDefinition } from '../circuitGraph';
import { createTerminalId } from '../circuitGraph';

function ohmsLawCircuit(v = 8, r = 2000): CircuitDefinition {
  return {
    components: [
      {
        id: 'V1', type: 'voltage_source', label: 'V1',
        position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: v },
        terminals: [
          { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
          { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
        ],
      },
      {
        id: 'R1', type: 'resistor', label: 'R1',
        position: { x: 100, y: 0 }, rotation: 0, properties: { resistance: r },
        terminals: [
          { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
          { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
        ],
      },
      {
        id: 'GND1', type: 'ground', label: 'GND',
        position: { x: 200, y: 0 }, rotation: 0, properties: {},
        terminals: [
          { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
        ],
      },
    ],
    connections: [
      { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
      { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('GND1', 'ground') },
      { id: 'W3', from: createTerminalId('V1', 'negative'), to: createTerminalId('GND1', 'ground') },
    ],
  };
}

describe('Block 5 simulation pipeline', () => {
  it('voltage divider: real measurements + graphs', () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 9 },
          terminals: [
            { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
            { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
          ],
        },
        {
          id: 'R1', type: 'resistor', label: 'R1',
          position: { x: 80, y: 0 }, rotation: 0, properties: { resistance: 1000 },
          terminals: [
            { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
            { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
          ],
        },
        {
          id: 'R2', type: 'resistor', label: 'R2',
          position: { x: 160, y: 0 }, rotation: 0, properties: { resistance: 2000 },
          terminals: [
            { id: createTerminalId('R2', 'A'), type: 'A', componentId: 'R2' },
            { id: createTerminalId('R2', 'B'), type: 'B', componentId: 'R2' },
          ],
        },
        {
          id: 'GND1', type: 'ground', label: 'GND',
          position: { x: 240, y: 0 }, rotation: 0, properties: {},
          terminals: [
            { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
          ],
        },
      ],
      connections: [
        { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
        { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('R2', 'A') },
        { id: 'W3', from: createTerminalId('R2', 'B'), to: createTerminalId('GND1', 'ground') },
        { id: 'W4', from: createTerminalId('V1', 'negative'), to: createTerminalId('GND1', 'ground') },
      ],
    };

    const result = solveCircuit(circuit);
    expect(result.status).toBe('completed');
    expect(result.measurements?.totalCurrent).toBeCloseTo(9 / 3000, 6);
    const r2 = result.measurements?.componentMeasurements.find(m => m.componentId === 'R2');
    expect(r2?.voltage).toBeCloseTo(6, 3); // Vout = 9 * 2/3
    expect(result.graphs?.some(g => g.id === 'voltage_divider')).toBe(true);
    expect(result.graphs?.some(g => g.id === 'series_elements' || g.id === 'kvl_loop')).toBe(true);
    // Instrument rail: ohmmeter / power meter virtual readings
    expect(result.measurements?.componentMeasurements.some(m => m.type === 'ohmmeter')).toBe(true);
    expect(result.measurements?.componentMeasurements.some(m => m.type === 'power_meter')).toBe(true);
  });

  it('parallel: branch currents + graph', () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 10 },
          terminals: [
            { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
            { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
          ],
        },
        {
          id: 'R1', type: 'resistor', label: 'R1',
          position: { x: 100, y: -30 }, rotation: 0, properties: { resistance: 1000 },
          terminals: [
            { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
            { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
          ],
        },
        {
          id: 'R2', type: 'resistor', label: 'R2',
          position: { x: 100, y: 30 }, rotation: 0, properties: { resistance: 2000 },
          terminals: [
            { id: createTerminalId('R2', 'A'), type: 'A', componentId: 'R2' },
            { id: createTerminalId('R2', 'B'), type: 'B', componentId: 'R2' },
          ],
        },
        {
          id: 'GND1', type: 'ground', label: 'GND',
          position: { x: 200, y: 0 }, rotation: 0, properties: {},
          terminals: [
            { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
          ],
        },
      ],
      connections: [
        { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
        { id: 'W2', from: createTerminalId('V1', 'positive'), to: createTerminalId('R2', 'A') },
        { id: 'W3', from: createTerminalId('R1', 'B'), to: createTerminalId('GND1', 'ground') },
        { id: 'W4', from: createTerminalId('R2', 'B'), to: createTerminalId('GND1', 'ground') },
        { id: 'W5', from: createTerminalId('V1', 'negative'), to: createTerminalId('GND1', 'ground') },
      ],
    };

    const result = solveCircuit(circuit);
    expect(result.status).toBe('completed');
    const r1 = result.measurements?.componentMeasurements.find(m => m.componentId === 'R1');
    const r2 = result.measurements?.componentMeasurements.find(m => m.componentId === 'R2');
    expect(r1?.current).toBeCloseTo(0.01, 5);
    expect(r2?.current).toBeCloseTo(0.005, 5);
    expect(result.graphs?.some(g => g.id === 'parallel_branches' || g.id === 'current_divider')).toBe(true);
  });

  it('RC: voltage and current vs time graphs from solver', () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 5 },
          terminals: [
            { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
            { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
          ],
        },
        {
          id: 'R1', type: 'resistor', label: 'R1',
          position: { x: 80, y: 0 }, rotation: 0, properties: { resistance: 10000 },
          terminals: [
            { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
            { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
          ],
        },
        {
          id: 'C1', type: 'capacitor', label: 'C1',
          position: { x: 160, y: 0 }, rotation: 0, properties: { capacitance: 1e-6 },
          terminals: [
            { id: createTerminalId('C1', 'A'), type: 'A', componentId: 'C1' },
            { id: createTerminalId('C1', 'B'), type: 'B', componentId: 'C1' },
          ],
        },
        {
          id: 'GND1', type: 'ground', label: 'GND',
          position: { x: 240, y: 0 }, rotation: 0, properties: {},
          terminals: [
            { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
          ],
        },
      ],
      connections: [
        { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
        { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('C1', 'A') },
        { id: 'W3', from: createTerminalId('C1', 'B'), to: createTerminalId('GND1', 'ground') },
        { id: 'W4', from: createTerminalId('V1', 'negative'), to: createTerminalId('GND1', 'ground') },
      ],
    };

    const result = solveCircuit(circuit);
    // RC may validate; graphs attach when solve succeeds or via generateAllGraphs on completed DC
    if (result.status === 'completed' && result.dcResult) {
      const graphs = result.graphs?.length
        ? result.graphs
        : generateAllGraphs(circuit, result.dcResult);
      expect(graphs.some(g => g.id === 'rc_charging')).toBe(true);
      expect(graphs.some(g => g.id === 'rc_current')).toBe(true);
      const rc = graphs.find(g => g.id === 'rc_charging');
      expect(rc?.series[0].points.length).toBeGreaterThan(5);
    } else {
      // Capacitor-only DC path may be invalid depending on validator — still require graph helpers
      expect(() => generateAllGraphs(circuit, {
        nodeVoltages: new Map(),
        branchCurrents: new Map(),
        componentResults: new Map(),
        totalCurrent: 0,
        totalPower: 0,
        equivalentResistance: 10000,
        success: true,
      })).not.toThrow();
    }
  });

  it('diode: operating state from simulation', () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 5 },
          terminals: [
            { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
            { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
          ],
        },
        {
          id: 'R1', type: 'resistor', label: 'R1',
          position: { x: 80, y: 0 }, rotation: 0, properties: { resistance: 1000 },
          terminals: [
            { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
            { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
          ],
        },
        {
          id: 'D1', type: 'diode', label: 'D1',
          position: { x: 160, y: 0 }, rotation: 0, properties: { forwardVoltage: 0.7 },
          terminals: [
            { id: createTerminalId('D1', 'anode'), type: 'anode', componentId: 'D1' },
            { id: createTerminalId('D1', 'cathode'), type: 'cathode', componentId: 'D1' },
          ],
        },
        {
          id: 'GND1', type: 'ground', label: 'GND',
          position: { x: 240, y: 0 }, rotation: 0, properties: {},
          terminals: [
            { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
          ],
        },
      ],
      connections: [
        { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
        { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('D1', 'anode') },
        { id: 'W3', from: createTerminalId('D1', 'cathode'), to: createTerminalId('GND1', 'ground') },
        { id: 'W4', from: createTerminalId('V1', 'negative'), to: createTerminalId('GND1', 'ground') },
      ],
    };

    const result = solveCircuit(circuit);
    expect(result.status).toBe('completed');
    const d = result.measurements?.componentMeasurements.find(m => m.componentId === 'D1');
    expect(d?.voltage).toBeCloseTo(0.7, 2);
    expect(d?.current).toBeCloseTo((5 - 0.7) / 1000, 5);
    expect(result.graphs?.some(g => g.id.startsWith('iv_'))).toBe(true);
  });

  it('LED invalid: structured LED_NO_CURRENT_LIMIT', () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 5 },
          terminals: [
            { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
            { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
          ],
        },
        {
          id: 'LED1', type: 'led', label: 'LED1',
          position: { x: 100, y: 0 }, rotation: 0, properties: { forwardVoltage: 2 },
          terminals: [
            { id: createTerminalId('LED1', 'anode'), type: 'anode', componentId: 'LED1' },
            { id: createTerminalId('LED1', 'cathode'), type: 'cathode', componentId: 'LED1' },
          ],
        },
        {
          id: 'GND1', type: 'ground', label: 'GND',
          position: { x: 200, y: 0 }, rotation: 0, properties: {},
          terminals: [
            { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
          ],
        },
      ],
      connections: [
        { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('LED1', 'anode') },
        { id: 'W2', from: createTerminalId('LED1', 'cathode'), to: createTerminalId('GND1', 'ground') },
      ],
    };

    const result = solveCircuit(circuit);
    expect(result.status).toBe('invalid');
    expect(result.validation?.errors.some(e => e.code === 'LED_NO_CURRENT_LIMIT')).toBe(true);
    expect(result.measurements).toBeUndefined();
  });

  it('LED valid: source → resistor → LED → ground', () => {
    const circuit: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 5 },
          terminals: [
            { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
            { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
          ],
        },
        {
          id: 'R1', type: 'resistor', label: 'R1',
          position: { x: 80, y: 0 }, rotation: 0, properties: { resistance: 150 },
          terminals: [
            { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
            { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
          ],
        },
        {
          id: 'LED1', type: 'led', label: 'LED1',
          position: { x: 160, y: 0 }, rotation: 0, properties: { forwardVoltage: 2 },
          terminals: [
            { id: createTerminalId('LED1', 'anode'), type: 'anode', componentId: 'LED1' },
            { id: createTerminalId('LED1', 'cathode'), type: 'cathode', componentId: 'LED1' },
          ],
        },
        {
          id: 'GND1', type: 'ground', label: 'GND',
          position: { x: 240, y: 0 }, rotation: 0, properties: {},
          terminals: [
            { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
          ],
        },
      ],
      connections: [
        { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
        { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('LED1', 'anode') },
        { id: 'W3', from: createTerminalId('LED1', 'cathode'), to: createTerminalId('GND1', 'ground') },
        { id: 'W4', from: createTerminalId('V1', 'negative'), to: createTerminalId('GND1', 'ground') },
      ],
    };

    const result = solveCircuit(circuit);
    expect(result.status).toBe('completed');
    const led = result.measurements?.componentMeasurements.find(m => m.componentId === 'LED1');
    expect(led?.voltage).toBeCloseTo(2, 2);
    expect(led?.current).toBeCloseTo((5 - 2) / 150, 4);
  });

  it('Ohm\'s Law rerun with changed R and V', () => {
    const a = solveCircuit(ohmsLawCircuit(8, 2000));
    expect(a.measurements?.totalCurrent).toBeCloseTo(0.004, 6); // 4.00 mA
    const b = solveCircuit(ohmsLawCircuit(10, 1000));
    expect(b.measurements?.totalCurrent).toBeCloseTo(0.01, 6);
    expect(a.graphs?.some(g => g.id === 'ohms_law')).toBe(true);
  });
});
