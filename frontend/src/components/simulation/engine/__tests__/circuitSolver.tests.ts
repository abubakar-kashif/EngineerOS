/**
 * Tests for Circuit Solver (Main Interface)
 * Person 1: Simulation Engine
 * Tests validation + solving integration
 */

import {
  solveCircuit,
  SimulationResult,
} from '../circuitSolver';

import {
  CircuitDefinition,
  createTerminalId,
} from '../circuitGraph';

describe('Circuit Solver', () => {
  describe('Valid Circuits', () => {
    it('should solve simple Ohm\'s Law circuit', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            label: 'V1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { voltage: 5 },
            terminals: [
              { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
              { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
            ],
          },
          {
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 100, y: 0 },
            rotation: 0,
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
          {
            id: 'GND1',
            type: 'ground',
            label: 'GND',
            position: { x: 200, y: 0 },
            rotation: 0,
            properties: {},
            terminals: [
              { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
            ],
          },
        ],
        connections: [
          { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
          { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('GND1', 'ground') },
        ],
      };

      const result = solveCircuit(circuit);
      
      expect(result.status).toBe('completed');
      expect(result.validation?.valid).toBe(true);
      expect(result.dcResult?.success).toBe(true);
      expect(result.measurements).toBeDefined();
      expect(result.measurements?.totalCurrent).toBeCloseTo(0.005, 6);
      expect(result.measurements?.totalVoltage).toBe(5);
    });

    it('should solve series circuit', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            label: 'V1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { voltage: 5 },
            terminals: [
              { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
              { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
            ],
          },
          {
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 100, y: 0 },
            rotation: 0,
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
          {
            id: 'R2',
            type: 'resistor',
            label: 'R2',
            position: { x: 200, y: 0 },
            rotation: 0,
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R2', 'A'), type: 'A', componentId: 'R2' },
              { id: createTerminalId('R2', 'B'), type: 'B', componentId: 'R2' },
            ],
          },
          {
            id: 'GND1',
            type: 'ground',
            label: 'GND',
            position: { x: 300, y: 0 },
            rotation: 0,
            properties: {},
            terminals: [
              { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
            ],
          },
        ],
        connections: [
          { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
          { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('R2', 'A') },
          { id: 'W3', from: createTerminalId('R2', 'B'), to: createTerminalId('GND1', 'ground') },
        ],
      };

      const result = solveCircuit(circuit);
      
      expect(result.status).toBe('completed');
      expect(result.measurements?.totalCurrent).toBeCloseTo(0.0025, 6);
      expect(result.measurements?.equivalentResistance).toBeCloseTo(2000, 6);
      
      // Check component measurements
      const measurements = result.measurements?.componentMeasurements;
      expect(measurements).toBeDefined();
      
      const r1Meas = measurements?.find(m => m.componentId === 'R1');
      const r2Meas = measurements?.find(m => m.componentId === 'R2');
      
      expect(r1Meas?.voltage).toBeCloseTo(2.5, 6);
      expect(r2Meas?.voltage).toBeCloseTo(2.5, 6);
    });
  });

  describe('Invalid Circuits', () => {
    it('should return invalid status for circuit without ground', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            label: 'V1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { voltage: 5 },
            terminals: [
              { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
              { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
            ],
          },
          {
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 100, y: 0 },
            rotation: 0,
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
        ],
        connections: [
          { id: 'W1', from: createTerminalId('V1', 'positive'), to: createTerminalId('R1', 'A') },
        ],
      };

      const result = solveCircuit(circuit);
      
      expect(result.status).toBe('invalid');
      expect(result.validation?.valid).toBe(false);
      expect(result.dcResult).toBeUndefined();
      expect(result.error).toBe('Circuit validation failed');
    });

    it('should return invalid status for LED without resistor', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            label: 'V1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { voltage: 12 },
            terminals: [
              { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
              { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
            ],
          },
          {
            id: 'LED1',
            type: 'led',
            label: 'LED1',
            position: { x: 100, y: 0 },
            rotation: 0,
            properties: { forwardVoltage: 2 },
            terminals: [
              { id: createTerminalId('LED1', 'anode'), type: 'anode', componentId: 'LED1' },
              { id: createTerminalId('LED1', 'cathode'), type: 'cathode', componentId: 'LED1' },
            ],
          },
          {
            id: 'GND1',
            type: 'ground',
            label: 'GND',
            position: { x: 200, y: 0 },
            rotation: 0,
            properties: {},
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
      expect(result.validation?.valid).toBe(false);
      expect(result.validation?.errors.some(e => e.code === 'LED_NO_CURRENT_LIMIT')).toBe(true);
    });

    it('should return invalid status for empty circuit', () => {
      const circuit: CircuitDefinition = {
        components: [],
        connections: [],
      };

      const result = solveCircuit(circuit);
      
      expect(result.status).toBe('invalid');
      expect(result.validation?.valid).toBe(false);
      expect(result.error).toBe('Circuit validation failed');
    });
  });

  describe('Component Measurements', () => {
    it('should include measurements for all components', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'V1',
            type: 'voltage_source',
            label: 'V1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { voltage: 10 },
            terminals: [
              { id: createTerminalId('V1', 'positive'), type: 'positive', componentId: 'V1' },
              { id: createTerminalId('V1', 'negative'), type: 'negative', componentId: 'V1' },
            ],
          },
          {
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 100, y: -30 },
            rotation: 0,
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
          {
            id: 'R2',
            type: 'resistor',
            label: 'R2',
            position: { x: 100, y: 30 },
            rotation: 0,
            properties: { resistance: 2000 },
            terminals: [
              { id: createTerminalId('R2', 'A'), type: 'A', componentId: 'R2' },
              { id: createTerminalId('R2', 'B'), type: 'B', componentId: 'R2' },
            ],
          },
          {
            id: 'GND1',
            type: 'ground',
            label: 'GND',
            position: { x: 200, y: 0 },
            rotation: 0,
            properties: {},
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
        ],
      };

      const result = solveCircuit(circuit);
      
      expect(result.status).toBe('completed');
      expect(result.measurements?.componentMeasurements).toHaveLength(3); // V1, R1, R2
      
      const r1Meas = result.measurements?.componentMeasurements.find(m => m.componentId === 'R1');
      const r2Meas = result.measurements?.componentMeasurements.find(m => m.componentId === 'R2');
      
      expect(r1Meas?.current).toBeCloseTo(0.01, 6); // 10 mA (10V / 1000Ω)
      expect(r2Meas?.current).toBeCloseTo(0.005, 6); // 5 mA (10V / 2000Ω)
    });
  });
});