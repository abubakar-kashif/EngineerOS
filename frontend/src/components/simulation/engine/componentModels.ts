/**
 * Component Models - Main Export
 * Person 1: Simulation Engine
 * Aggregates all component models
 */

// Static ES imports (no require)
import { analyzeResistor } from './resistorAnalysis';
import { analyzeCapacitorDC } from './capacitorAnalysis';
import { analyzeInductorDC } from './inductorAnalysis';
import { analyzeDiode, analyzeLED } from './diodeAnalysis';

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
      return analyzeResistor(params.resistance, params.voltage, params.current);
    },
  },
  capacitor: {
    type: 'capacitor',
    analyze: (params: any) => {
      return analyzeCapacitorDC(params.capacitance, params.voltage);
    },
  },
  inductor: {
    type: 'inductor',
    analyze: (params: any) => {
      return analyzeInductorDC(params.inductance, params.current);
    },
  },
  diode: {
    type: 'diode',
    analyze: (params: any) => {
      return analyzeDiode(params.sourceVoltage, params.forwardVoltage, params.resistance, params.reverseBiased);
    },
  },
  led: {
    type: 'led',
    analyze: (params: any) => {
      return analyzeLED(params.sourceVoltage, params.ledForwardVoltage, params.resistance, params.maxCurrent);
    },
  },
};