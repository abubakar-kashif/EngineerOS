/**
 * Block 6 — AI ↔ simulation closed loop (targeted).
 * Voltage divider values, LED error loop, Mentor ask uses fresh run id.
 */
import { solveCircuit } from '../circuitSolver';
import type { CircuitDefinition } from '../circuitGraph';
import { createTerminalId } from '../circuitGraph';

function dividerCircuit(v: number, r1: number, r2: number): CircuitDefinition {
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
        position: { x: 80, y: 0 }, rotation: 0, properties: { resistance: r1 },
        terminals: [
          { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
          { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
        ],
      },
      {
        id: 'R2', type: 'resistor', label: 'R2',
        position: { x: 160, y: 0 }, rotation: 0, properties: { resistance: r2 },
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
}

describe('Block 6 closed-loop simulation facts', () => {
  it('voltage divider 12V / 1k / 2k → I=4mA, VR1=4V, VR2=8V', () => {
    const result = solveCircuit(dividerCircuit(12, 1000, 2000));
    expect(result.status).toBe('completed');
    expect(result.measurements?.totalCurrent).toBeCloseTo(0.004, 6);
    const r1 = result.measurements?.componentMeasurements.find(m => m.componentId === 'R1');
    const r2 = result.measurements?.componentMeasurements.find(m => m.componentId === 'R2');
    expect(r1?.voltage).toBeCloseTo(4, 3);
    expect(r2?.voltage).toBeCloseTo(8, 3); // Vout
  });

  it('after changing R2 to 4kΩ, Vout becomes 9.6V from the engine', () => {
    const first = solveCircuit(dividerCircuit(12, 1000, 2000));
    expect(first.measurements?.componentMeasurements.find(m => m.componentId === 'R2')?.voltage).toBeCloseTo(8, 3);

    const second = solveCircuit(dividerCircuit(12, 1000, 4000));
    expect(second.status).toBe('completed');
    expect(second.measurements?.totalCurrent).toBeCloseTo(12 / 5000, 6);
    const vout = second.measurements?.componentMeasurements.find(m => m.componentId === 'R2')?.voltage;
    expect(vout).toBeCloseTo(9.6, 3);
    // New result must differ from previous — Mentor must use this, not 8V
    expect(vout).not.toBeCloseTo(8, 2);
  });

  it('invalid LED → LED_NO_CURRENT_LIMIT; valid after series resistor', () => {
    const invalid: CircuitDefinition = {
      components: [
        {
          id: 'V1', type: 'voltage_source', label: 'V1',
          position: { x: 0, y: 0 }, rotation: 0, properties: { voltage: 12 },
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

    const bad = solveCircuit(invalid);
    expect(bad.status).toBe('invalid');
    expect(bad.validation?.errors.some(e => e.code === 'LED_NO_CURRENT_LIMIT')).toBe(true);

    const fixed: CircuitDefinition = {
      components: [
        ...invalid.components.filter(c => c.id !== 'LED1'),
        {
          id: 'R1', type: 'resistor', label: 'R1',
          position: { x: 60, y: 0 }, rotation: 0, properties: { resistance: 500 },
          terminals: [
            { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
            { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
          ],
        },
        {
          id: 'LED1', type: 'led', label: 'LED1',
          position: { x: 140, y: 0 }, rotation: 0, properties: { forwardVoltage: 2 },
          terminals: [
            { id: createTerminalId('LED1', 'anode'), type: 'anode', componentId: 'LED1' },
            { id: createTerminalId('LED1', 'cathode'), type: 'cathode', componentId: 'LED1' },
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

    const good = solveCircuit(fixed);
    expect(good.status).toBe('completed');
    expect(good.measurements?.componentMeasurements.some(m => m.componentId === 'LED1')).toBe(true);
  });
});
