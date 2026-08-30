/**
 * Tests for Component Models
 * Person 1: Simulation Engine
 */

import {
  analyzeResistor,
  seriesResistance,
  parallelResistance,
  voltageDivider,
} from '../resistorAnalysis';

import {
  timeConstant,
  chargingVoltage,
  dischargingVoltage,
  storedEnergy,
} from '../capacitorAnalysis';

import {
  timeConstantRL,
  chargingCurrentRL,
  storedEnergyInductor,
} from '../inductorAnalysis';

import {
  analyzeDiode,
  analyzeLED,
  calculateLEDResistor,
  hasCurrentLimiting,
} from '../diodeAnalysis';

describe('Component Models', () => {
  describe('Resistor Analysis', () => {
    it('should calculate Ohm\'s Law correctly', () => {
      const result = analyzeResistor(1000, 5);
      expect(result.current).toBeCloseTo(0.005, 6);
      expect(result.power).toBeCloseTo(0.025, 6);
    });

    it('should calculate series resistance correctly', () => {
      const result = seriesResistance([1000, 2000, 3000]);
      expect(result).toBe(6000);
    });

    it('should calculate parallel resistance correctly', () => {
      const result = parallelResistance([1000, 1000]);
      expect(result).toBe(500);
    });

    it('should calculate voltage divider correctly', () => {
      const result = voltageDivider(10, 1000, 1000);
      expect(result.vout).toBe(5);
      expect(result.current).toBeCloseTo(0.005, 6);
    });
  });

  describe('Capacitor Analysis', () => {
    it('should calculate RC time constant correctly', () => {
      const tau = timeConstant(1000, 0.000001); // 1kΩ * 1µF
      expect(tau).toBe(0.001); // 1ms
    });

    it('should calculate charging voltage correctly', () => {
      const vc = chargingVoltage(5, 1000, 0.000001, 0.001);
      expect(vc).toBeCloseTo(5 * (1 - Math.exp(-1)), 6);
    });

    it('should calculate stored energy correctly', () => {
      const energy = storedEnergy(0.000001, 5); // 1µF at 5V
      expect(energy).toBe(0.0000125); // 12.5µJ
    });
  });

  describe('Inductor Analysis', () => {
    it('should calculate RL time constant correctly', () => {
      const tau = timeConstantRL(0.001, 1000); // 1mH / 1kΩ
      expect(tau).toBe(0.000001); // 1µs
    });

    it('should calculate charging current correctly', () => {
      const current = chargingCurrentRL(5, 1000, 0.001, 0.000001);
      expect(current).toBeCloseTo(0.005 * (1 - Math.exp(-1)), 6);
    });

    it('should calculate stored energy correctly', () => {
      const energy = storedEnergyInductor(0.001, 0.005); // 1mH at 5mA
      expect(energy).toBe(0.0000000125); // 12.5nJ
    });
  });

  describe('Diode and LED Analysis', () => {
    it('should analyze forward biased diode correctly', () => {
      const result = analyzeDiode(5, 0.7, 1000);
      expect(result.isForwardBiased).toBe(true);
      expect(result.current).toBeCloseTo(0.0043, 6);
      expect(result.voltageDrop).toBe(0.7);
    });

    it('should analyze reverse biased diode correctly', () => {
      const result = analyzeDiode(5, 0.7, 1000, true);
      expect(result.isForwardBiased).toBe(false);
      expect(result.current).toBe(0);
    });

    it('should analyze LED correctly with resistor', () => {
      const result = analyzeLED(12, 2, 1000);
      expect(result.isOn).toBe(true);
      expect(result.current).toBeCloseTo(0.01, 6); // 10mA
      expect(result.brightness).toBeGreaterThan(0);
    });

    it('should detect LED without current limiting', () => {
      const result = analyzeLED(12, 2, 0);
      expect(result.current).toBe(Infinity);
      expect(result.isOn).toBe(false);
    });

    it('should calculate LED resistor correctly', () => {
      const resistor = calculateLEDResistor(5, 2, 0.02);
      expect(resistor).toBe(150); // (5-2)/0.02 = 150Ω
    });

    it('should check current limiting correctly', () => {
      const result = hasCurrentLimiting(5, 2, 150);
      expect(result).toBe(true);
      
      const result2 = hasCurrentLimiting(5, 2, 0);
      expect(result2).toBe(false);
    });
  });
});