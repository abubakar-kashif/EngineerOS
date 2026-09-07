/**
 * Component Models - Main Export
 * Person 1: Simulation Engine
 * Aggregates all component models
 */

// Static ES imports (no require)
import { analyzeResistor, type ResistorResult } from './resistorAnalysis';
import { analyzeCapacitorDC, type CapacitorResult } from './capacitorAnalysis';
import { analyzeInductorDC, type InductorResult } from './inductorAnalysis';
import { analyzeDiode, analyzeLED, type DiodeResult, type LEDResult } from './diodeAnalysis';

type AnalyzeParams = Record<string, number | boolean | undefined>;
type AnalyzeResult = ResistorResult | CapacitorResult | InductorResult | DiodeResult | LEDResult;

/**
 * Component model interface
 */
export interface ComponentModel {
  type: string;
  analyze: (params: AnalyzeParams) => AnalyzeResult;
}

export const componentModels: Record<string, ComponentModel> = {
  resistor: {
    type: 'resistor',
    analyze: (params) => {
      return analyzeResistor(
        Number(params.resistance),
        params.voltage === undefined ? undefined : Number(params.voltage),
        params.current === undefined ? undefined : Number(params.current),
      );
    },
  },
  capacitor: {
    type: 'capacitor',
    analyze: (params) => {
      return analyzeCapacitorDC(Number(params.capacitance), Number(params.voltage));
    },
  },
  inductor: {
    type: 'inductor',
    analyze: (params) => {
      return analyzeInductorDC(Number(params.inductance), Number(params.current));
    },
  },
  diode: {
    type: 'diode',
    analyze: (params) => {
      return analyzeDiode(
        Number(params.sourceVoltage),
        Number(params.forwardVoltage),
        Number(params.resistance),
        Boolean(params.reverseBiased),
      );
    },
  },
  led: {
    type: 'led',
    analyze: (params) => {
      return analyzeLED(
        Number(params.sourceVoltage),
        Number(params.ledForwardVoltage),
        Number(params.resistance),
        params.maxCurrent === undefined ? undefined : Number(params.maxCurrent),
      );
    },
  },
};
