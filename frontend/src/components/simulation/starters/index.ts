import type { EditorCircuit } from "../editorTypes";
import {
  createWheatstoneBridgeStarter,
  WHEATSTONE_BRIDGE_EXPERIMENT_ID,
} from "./wheatstoneBridge";
import {
  createPotentiometerStarter,
  POTENTIOMETER_EXPERIMENT_ID,
} from "./potentiometer";
import {
  createSuperpositionTheoremStarter,
  SUPERPOSITION_THEOREM_EXPERIMENT_ID,
} from "./superpositionTheorem";
import {
  createTheveninTheoremStarter,
  THEVENIN_THEOREM_EXPERIMENT_ID,
} from "./theveninTheorem";
import {
  createNortonTheoremStarter,
  NORTON_THEOREM_EXPERIMENT_ID,
} from "./nortonTheorem";
import {
  createMaxPowerTransferStarter,
  MAX_POWER_TRANSFER_EXPERIMENT_ID,
} from "./maxPowerTransfer";
import {
  createRcCircuitStarter,
  RC_CIRCUIT_EXPERIMENT_ID,
  CAPACITOR_CHARGING_EXPERIMENT_ID,
} from "./rcCircuit";
import {
  createRlCircuitStarter,
  RL_CIRCUIT_EXPERIMENT_ID,
} from "./rlCircuit";
import {
  createRlcCircuitStarter,
  RLC_CIRCUIT_EXPERIMENT_ID,
} from "./rlcCircuit";
import {
  createSeriesResonanceStarter,
  SERIES_RESONANCE_EXPERIMENT_ID,
} from "./seriesResonance";
import {
  createHalfWaveRectifierStarter,
  HALF_WAVE_RECTIFIER_EXPERIMENT_ID,
} from "./halfWaveRectifier";
import {
  createFullWaveBridgeStarter,
  FULL_WAVE_BRIDGE_EXPERIMENT_ID,
} from "./fullWaveBridge";
import {
  createRcLowPassStarter,
  RC_LOW_PASS_EXPERIMENT_ID,
} from "./rcLowPass";

/** Experiment id → starter editor circuit factory. */
const STARTERS: Record<string, () => EditorCircuit> = {
  [WHEATSTONE_BRIDGE_EXPERIMENT_ID]: createWheatstoneBridgeStarter,
  [POTENTIOMETER_EXPERIMENT_ID]: createPotentiometerStarter,
  [SUPERPOSITION_THEOREM_EXPERIMENT_ID]: createSuperpositionTheoremStarter,
  [THEVENIN_THEOREM_EXPERIMENT_ID]: createTheveninTheoremStarter,
  [NORTON_THEOREM_EXPERIMENT_ID]: createNortonTheoremStarter,
  [MAX_POWER_TRANSFER_EXPERIMENT_ID]: createMaxPowerTransferStarter,
  [RC_CIRCUIT_EXPERIMENT_ID]: createRcCircuitStarter,
  [CAPACITOR_CHARGING_EXPERIMENT_ID]: createRcCircuitStarter,
  [RL_CIRCUIT_EXPERIMENT_ID]: createRlCircuitStarter,
  [RLC_CIRCUIT_EXPERIMENT_ID]: createRlcCircuitStarter,
  [SERIES_RESONANCE_EXPERIMENT_ID]: createSeriesResonanceStarter,
  [HALF_WAVE_RECTIFIER_EXPERIMENT_ID]: createHalfWaveRectifierStarter,
  [FULL_WAVE_BRIDGE_EXPERIMENT_ID]: createFullWaveBridgeStarter,
  [RC_LOW_PASS_EXPERIMENT_ID]: createRcLowPassStarter,
};

export function getExperimentStarterCircuit(experimentId: string): EditorCircuit | null {
  const factory = STARTERS[experimentId];
  return factory ? factory() : null;
}

export function hasExperimentStarter(experimentId: string): boolean {
  return experimentId in STARTERS;
}

export {
  createWheatstoneBridgeStarter,
  WHEATSTONE_BRIDGE_EXPERIMENT_ID,
  createPotentiometerStarter,
  POTENTIOMETER_EXPERIMENT_ID,
  createSuperpositionTheoremStarter,
  SUPERPOSITION_THEOREM_EXPERIMENT_ID,
  createTheveninTheoremStarter,
  THEVENIN_THEOREM_EXPERIMENT_ID,
  createNortonTheoremStarter,
  NORTON_THEOREM_EXPERIMENT_ID,
  createMaxPowerTransferStarter,
  MAX_POWER_TRANSFER_EXPERIMENT_ID,
  createRcCircuitStarter,
  RC_CIRCUIT_EXPERIMENT_ID,
  CAPACITOR_CHARGING_EXPERIMENT_ID,
  createRlCircuitStarter,
  RL_CIRCUIT_EXPERIMENT_ID,
  createRlcCircuitStarter,
  RLC_CIRCUIT_EXPERIMENT_ID,
  createSeriesResonanceStarter,
  SERIES_RESONANCE_EXPERIMENT_ID,
  createHalfWaveRectifierStarter,
  HALF_WAVE_RECTIFIER_EXPERIMENT_ID,
  createFullWaveBridgeStarter,
  FULL_WAVE_BRIDGE_EXPERIMENT_ID,
  createRcLowPassStarter,
  RC_LOW_PASS_EXPERIMENT_ID,
};
