/**
 * Tests for DC Solver
 * Person 1: Simulation Engine
 */

import {
  solveDC,
} from '../dcSolver';

import {
  CircuitDefinition,
  createTerminalId,
} from '../circuitGraph';

describe('DC Solver', () => {
  describe('Ohm\'s Law', () => {
    it('should solve simple resistor circuit (5V, 1kΩ)', () => {
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

      const result = solveDC(circuit);
      
      expect(result.success).toBe(true);
      expect(result.totalCurrent).toBeCloseTo(0.005, 6); // 5 mA
      expect(result.totalPower).toBeCloseTo(0.025, 6); // 25 mW
      expect(result.equivalentResistance).toBeCloseTo(1000, 6);
      
      // Check resistor result
      const r1Result = result.componentResults.get('R1');
      expect(r1Result).toBeDefined();
      expect(r1Result?.voltage).toBeCloseTo(5, 6);
      expect(r1Result?.current).toBeCloseTo(0.005, 6);
      expect(r1Result?.power).toBeCloseTo(0.025, 6);
    });

    it('should solve 12V with 2kΩ', () => {
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
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 100, y: 0 },
            rotation: 0,
            properties: { resistance: 2000 },
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

      const result = solveDC(circuit);
      
      expect(result.success).toBe(true);
      expect(result.totalCurrent).toBeCloseTo(0.006, 6); // 6 mA
      expect(result.totalPower).toBeCloseTo(0.072, 6); // 72 mW
    });
  });

  describe('Series Circuits', () => {
    it('should solve series circuit (5V, 1kΩ + 1kΩ)', () => {
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

      const result = solveDC(circuit);
      
      expect(result.success).toBe(true);
      expect(result.totalCurrent).toBeCloseTo(0.0025, 6); // 2.5 mA
      expect(result.equivalentResistance).toBeCloseTo(2000, 6);
      
      // Check resistor results
      const r1Result = result.componentResults.get('R1');
      const r2Result = result.componentResults.get('R2');
      
      expect(r1Result?.voltage).toBeCloseTo(2.5, 6);
      expect(r2Result?.voltage).toBeCloseTo(2.5, 6);
    });
  });

  describe('Parallel Circuits', () => {
    it('should solve parallel circuit (5V, 1kΩ || 1kΩ)', () => {
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
            position: { x: 100, y: -50 },
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
            position: { x: 100, y: 50 },
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

      const result = solveDC(circuit);
      
      expect(result.success).toBe(true);
      expect(result.totalCurrent).toBeCloseTo(0.01, 6); // 10 mA
      expect(result.equivalentResistance).toBeCloseTo(500, 6);
      
      // Check resistor results
      const r1Result = result.componentResults.get('R1');
      const r2Result = result.componentResults.get('R2');
      
      expect(r1Result?.current).toBeCloseTo(0.005, 6); // 5 mA
      expect(r2Result?.current).toBeCloseTo(0.005, 6); // 5 mA
    });
  });

  describe('Invalid Circuits', () => {
    it('should return error for circuit without ground', () => {
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

      const result = solveDC(circuit);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ground');
    });
  });
});