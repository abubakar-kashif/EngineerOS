/**
 * Component Models - Main Export
 * Person 1: Simulation Engine
 * Aggregates all component models
 */

export * from './resistorAnalysis';
export * from './capacitorAnalysis';
export * from './inductorAnalysis';
export * from './diodeAnalysis';

/**
 * Component model interface
 */
export interface ComponentModel {
  type: string;
  analyze: (params: any) => any;
}

export const componentModels: Record<string, ComponentModel> = {
  resistor: {
    type: 'resistor',
    analyze: (params: any) => {
      const { analyzeResistor } = require('./resistorAnalysis');
      return analyzeResistor(params.resistance, params.voltage, params.current);
    },
  },
  capacitor: {
    type: 'capacitor',
    analyze: (params: any) => {
      const { analyzeCapacitorDC } = require('./capacitorAnalysis');
      return analyzeCapacitorDC(params.capacitance, params.voltage);
    },
  },
  inductor: {
    type: 'inductor',
    analyze: (params: any) => {
      const { analyzeInductorDC } = require('./inductorAnalysis');
      return analyzeInductorDC(params.inductance, params.current);
    },
  },
  diode: {
    type: 'diode',
    analyze: (params: any) => {
      const { analyzeDiode } = require('./diodeAnalysis');
      return analyzeDiode(params.sourceVoltage, params.forwardVoltage, params.resistance, params.reverseBiased);
    },
  },
  led: {
    type: 'led',
    analyze: (params: any) => {
      const { analyzeLED } = require('./diodeAnalysis');
      return analyzeLED(params.sourceVoltage, params.ledForwardVoltage, params.resistance, params.maxCurrent);
    },
  },
};