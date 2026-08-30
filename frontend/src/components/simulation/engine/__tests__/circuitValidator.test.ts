/**
 * Tests for Circuit Validator
 * Person 1: Simulation Engine
 */

import {
  validateCircuit,
} from '../circuitValidator';

import {
  CircuitDefinition,
  createTerminalId,
} from '../circuitGraph';

describe('Circuit Validator', () => {
  describe('Structural Validation', () => {
    it('should detect empty circuit', () => {
      const circuit: CircuitDefinition = {
        components: [],
        connections: [],
      };

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_COMPONENT_ID')).toBe(true);
    });

    it('should detect invalid component type', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'X1',
            type: 'invalid_type' as any,
            label: 'X1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: {},
            terminals: [],
          },
        ],
        connections: [],
      };

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'UNSUPPORTED_COMPONENT')).toBe(true);
    });

    it('should detect missing terminals', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              // Missing B terminal
            ],
          },
        ],
        connections: [],
      };

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_TERMINAL_ID')).toBe(true);
    });
  });

  describe('Electrical Validation', () => {
    it('should detect missing ground', () => {
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

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'MISSING_GROUND')).toBe(true);
    });

    it('should detect LED without current limit', () => {
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

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'LED_NO_CURRENT_LIMIT')).toBe(true);
    });

    it('should pass valid LED circuit with resistor', () => {
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
            properties: { resistance: 1000 },
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
          {
            id: 'LED1',
            type: 'led',
            label: 'LED1',
            position: { x: 200, y: 0 },
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
          { id: 'W2', from: createTerminalId('R1', 'B'), to: createTerminalId('LED1', 'anode') },
          { id: 'W3', from: createTerminalId('LED1', 'cathode'), to: createTerminalId('GND1', 'ground') },
        ],
      };

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate resistor value', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'R1',
            type: 'resistor',
            label: 'R1',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: { resistance: -100 }, // Negative resistance
            terminals: [
              { id: createTerminalId('R1', 'A'), type: 'A', componentId: 'R1' },
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
        ],
        connections: [],
      };

      const result = validateCircuit(circuit);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_COMPONENT_VALUE')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle circuits with only ground', () => {
      const circuit: CircuitDefinition = {
        components: [
          {
            id: 'GND1',
            type: 'ground',
            label: 'GND',
            position: { x: 0, y: 0 },
            rotation: 0,
            properties: {},
            terminals: [
              { id: createTerminalId('GND1', 'ground'), type: 'ground', componentId: 'GND1' },
            ],
          },
        ],
        connections: [],
      };

      const result = validateCircuit(circuit);
      // A circuit with only ground is valid structurally
      expect(result.valid).toBe(true);
    });
  });
});