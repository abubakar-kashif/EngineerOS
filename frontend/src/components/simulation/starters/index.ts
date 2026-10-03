import type { EditorCircuit } from "../editorTypes";
import {
  createWheatstoneBridgeStarter,
  WHEATSTONE_BRIDGE_EXPERIMENT_ID,
} from "./wheatstoneBridge";
import {
  createPotentiometerStarter,
  POTENTIOMETER_EXPERIMENT_ID,
} from "./potentiometer";

/** Experiment id → starter editor circuit factory. */
const STARTERS: Record<string, () => EditorCircuit> = {
  [WHEATSTONE_BRIDGE_EXPERIMENT_ID]: createWheatstoneBridgeStarter,
  [POTENTIOMETER_EXPERIMENT_ID]: createPotentiometerStarter,
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
};
