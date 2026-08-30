/**
 * Tests for Measurements
 * Person 1: Simulation Engine
 */

import {
  generateMeasurements,
  getMeasurement,
  getMeasurementsForComponent,
  getMeasurementsByType,
  formatMeasurement,
  CompleteMeasurements,
} from '../measurements';

import {
  CircuitDefinition,
  createTerminalId,
} from '../circuitGraph';

import {
  solveDC,
} from '../dcSolver';

describe('Measurements', () => {
  let circuit: CircuitDefinition;
  let measurements: CompleteMeasurements;

  beforeEach(() => {
    circuit = {
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

    const dcResult = solveDC(circuit);
    measurements = generateMeasurements(circuit, dcResult);
  });

  describe('generateMeasurements', () => {
    it('should generate source measurements', () => {
      expect(measurements.source.measurements).toBeDefined();
      expect(measurements.source.measurements.length).toBeGreaterThan(0);
      
      const voltageMeas = measurements.source.measurements.find(m => m.id === 'V1_voltage');
      expect(voltageMeas).toBeDefined();
      expect(voltageMeas?.value).toBe(5);
      expect(voltageMeas?.unit).toBe('V');
    });

    it('should generate component measurements', () => {
      expect(measurements.components.measurements).toBeDefined();
      expect(measurements.components.measurements.length).toBeGreaterThan(0);
      
      const r1Voltage = measurements.components.measurements.find(m => m.id === 'R1_voltage');
      expect(r1Voltage).toBeDefined();
      expect(r1Voltage?.value).toBeCloseTo(5, 6);
      
      const r1Current = measurements.components.measurements.find(m => m.id === 'R1_current');
      expect(r1Current).toBeDefined();
      expect(r1Current?.value).toBeCloseTo(0.005, 6);
      
      const r1Resistance = measurements.components.measurements.find(m => m.id === 'R1_resistance');
      expect(r1Resistance).toBeDefined();
      expect(r1Resistance?.value).toBe(1000);
    });

    it('should generate totals measurements', () => {
      expect(measurements.totals.measurements).toBeDefined();
      
      const totalVoltage = measurements.totals.measurements.find(m => m.id === 'total_voltage');
      expect(totalVoltage).toBeDefined();
      expect(totalVoltage?.value).toBe(5);
      
      const totalCurrent = measurements.totals.measurements.find(m => m.id === 'total_current');
      expect(totalCurrent).toBeDefined();
      expect(totalCurrent?.value).toBeCloseTo(0.005, 6);
      
      const equivalentResistance = measurements.totals.measurements.find(m => m.id === 'equivalent_resistance');
      expect(equivalentResistance).toBeDefined();
      expect(equivalentResistance?.value).toBeCloseTo(1000, 6);
    });

    it('should generate summary measurements', () => {
      expect(measurements.summary.measurements).toBeDefined();
      
      const componentCount = measurements.summary.measurements.find(m => m.id === 'component_count');
      expect(componentCount).toBeDefined();
      expect(componentCount?.value).toBe(3); // V1, R1, GND1
      
      const resistorCount = measurements.summary.measurements.find(m => m.id === 'resistor_count');
      expect(resistorCount).toBeDefined();
      expect(resistorCount?.value).toBe(1);
      
      const sourceCount = measurements.summary.measurements.find(m => m.id === 'source_count');
      expect(sourceCount).toBeDefined();
      expect(sourceCount?.value).toBe(1);
      
      const hasGround = measurements.summary.measurements.find(m => m.id === 'has_ground');
      expect(hasGround).toBeDefined();
      expect(hasGround?.value).toBe(1);
    });
  });

  describe('getMeasurement', () => {
    it('should find measurement by ID', () => {
      const measurement = getMeasurement(measurements, 'R1_voltage');
      expect(measurement).toBeDefined();
      expect(measurement?.id).toBe('R1_voltage');
      expect(measurement?.value).toBeCloseTo(5, 6);
    });

    it('should return undefined for non-existent ID', () => {
      const measurement = getMeasurement(measurements, 'non_existent');
      expect(measurement).toBeUndefined();
    });
  });

  describe('getMeasurementsForComponent', () => {
    it('should find all measurements for a component', () => {
      const r1Measurements = getMeasurementsForComponent(measurements, 'R1');
      expect(r1Measurements.length).toBeGreaterThan(0);
      
      const hasVoltage = r1Measurements.some(m => m.type === 'voltage');
      const hasCurrent = r1Measurements.some(m => m.type === 'current');
      const hasPower = r1Measurements.some(m => m.type === 'power');
      
      expect(hasVoltage).toBe(true);
      expect(hasCurrent).toBe(true);
      expect(hasPower).toBe(true);
    });
  });

  describe('getMeasurementsByType', () => {
    it('should find all voltage measurements', () => {
      const voltageMeas = getMeasurementsByType(measurements, 'voltage');
      expect(voltageMeas.length).toBeGreaterThan(0);
      
      const allAreVoltage = voltageMeas.every(m => m.type === 'voltage');
      expect(allAreVoltage).toBe(true);
    });

    it('should find all current measurements', () => {
      const currentMeas = getMeasurementsByType(measurements, 'current');
      expect(currentMeas.length).toBeGreaterThan(0);
      
      const allAreCurrent = currentMeas.every(m => m.type === 'current');
      expect(allAreCurrent).toBe(true);
    });
  });

  describe('formatMeasurement', () => {
    it('should format voltage correctly', () => {
      const measurement = getMeasurement(measurements, 'V1_voltage');
      if (measurement) {
        const formatted = formatMeasurement(measurement);
        expect(formatted).toContain('V');
      }
    });

    it('should format current correctly', () => {
      const measurement = getMeasurement(measurements, 'R1_current');
      if (measurement) {
        const formatted = formatMeasurement(measurement);
        expect(formatted).toContain('A');
      }
    });

    it('should format resistance correctly', () => {
      const measurement = getMeasurement(measurements, 'R1_resistance');
      if (measurement) {
        const formatted = formatMeasurement(measurement);
        expect(formatted).toContain('Ω');
      }
    });

    it('should handle special values', () => {
      // Test Infinity
      expect(formatMeasurement({ 
        id: 'test', 
        type: 'current', 
        value: Infinity, 
        unit: 'A', 
        label: 'Test' 
      })).toBe('∞');

      // Test NaN
      expect(formatMeasurement({ 
        id: 'test', 
        type: 'current', 
        value: NaN, 
        unit: 'A', 
        label: 'Test' 
      })).toBe('N/A');
    });
  });
});