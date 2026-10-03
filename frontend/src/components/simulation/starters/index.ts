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

/** Experiment id → starter editor circuit factory. */
const STARTERS: Record<string, () => EditorCircuit> = {
  [WHEATSTONE_BRIDGE_EXPERIMENT_ID]: createWheatstoneBridgeStarter,
  [POTENTIOMETER_EXPERIMENT_ID]: createPotentiometerStarter,
  [SUPERPOSITION_THEOREM_EXPERIMENT_ID]: createSuperpositionTheoremStarter,
  [THEVENIN_THEOREM_EXPERIMENT_ID]: createTheveninTheoremStarter,
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
};
