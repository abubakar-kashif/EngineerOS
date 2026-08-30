/**
 * Tests for Circuit Graph Builder
 * Person 1: Simulation Engine
 */

import {
  buildElectricalNodes,
  hasGround,
  findGroundNode,
} from '../circuitGraphBuilder';

import {
  type CircuitDefinition,
  createTerminalId,
} from '../circuitGraph';

describe('Circuit Graph Builder', () => {
  describe('buildElectricalNodes', () => {
    it('should create a single node for series circuit', () => {
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

      const result = buildElectricalNodes(circuit);
      
      expect(result.nodes).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
    });

    it('should identify ground node', () => {
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

      const result = buildElectricalNodes(circuit);
      
      expect(hasGround(result.nodes)).toBe(true);
      const groundNode = findGroundNode(result.nodes);
      expect(groundNode).toBeDefined();
      expect(groundNode?.isGround).toBe(true);
    });

    it('should detect dangling terminals', () => {
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
              { id: createTerminalId('R1', 'B'), type: 'B', componentId: 'R1' },
            ],
          },
        ],
        connections: [],
      };

      const result = buildElectricalNodes(circuit);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Dangling terminal'))).toBe(true);
    });
  });
});