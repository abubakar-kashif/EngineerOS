/**
 * Half-wave rectifier starter (Experiment half-wave-rectifier).
 *
 *   V1(AC)+ ── D1 ── mid ── RL ── GND
 *   V1− ─────────────────────────┘
 *              VM_in across V1; VM_out across RL
 *
 * sine 50 Hz, Vin peak = 10 V, RL = 1 kΩ, Vf = 0.7 V
 */
import type {
  ComponentInstance,
  ComponentType,
  EditorCircuit,
  WireSegment,
} from "../editorTypes";
import { DEFAULT_TERMINALS } from "../editorTypes";
import { getTerminalWorldPosition } from "../editorUtils";
import { normalizeEditorCircuit } from "../wireTopology";
import { AC_FUNCTION_GENERATOR_DEFAULTS } from "../paletteCatalog";

export const HALF_WAVE_RECTIFIER_EXPERIMENT_ID = "half-wave-rectifier";

function component(
  id: string,
  type: ComponentType,
  x: number,
  y: number,
  properties: ComponentInstance["properties"],
  rotation = 0,
): ComponentInstance {
  return {
    id,
    type,
    label: id,
    x,
    y,
    rotation,
    properties,
    terminals: [...DEFAULT_TERMINALS[type]],
  };
}

function wireBetween(
  id: string,
  netId: string,
  a: { componentId: string; terminalId: string },
  b: { componentId: string; terminalId: string },
  components: ComponentInstance[],
): WireSegment {
  const ca = components.find((c) => c.id === a.componentId)!;
  const cb = components.find((c) => c.id === b.componentId)!;
  const pa = getTerminalWorldPosition(ca, a.terminalId);
  const pb = getTerminalWorldPosition(cb, b.terminalId);
  const points =
    Math.abs(pa.x - pb.x) < 0.5 || Math.abs(pa.y - pb.y) < 0.5
      ? [pa, pb]
      : [pa, { x: pb.x, y: pa.y }, pb];
  return {
    id,
    netId,
    points,
    a: { kind: "terminal", componentId: a.componentId, terminalId: a.terminalId },
    b: { kind: "terminal", componentId: b.componentId, terminalId: b.terminalId },
  };
}

export function createHalfWaveRectifierStarter(): EditorCircuit {
  const VinPeak = 10;
  const f = 50;
  const RL = 1000;
  const Vf = 0.7;

  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 60, 160, {
      ...AC_FUNCTION_GENERATOR_DEFAULTS,
      voltage: VinPeak,
      amplitude: VinPeak,
      frequency: f,
      phase: 0,
      waveform: "sine",
      acMode: true,
    }),
    component("D1", "diode", 220, 160, { forwardVoltage: Vf }),
    component("RL", "resistor", 400, 160, { resistance: RL }),
    component("GND1", "ground", 60, 300, {}),
    component("VM_in", "voltmeter", 60, 280, {}),
    component("VM_out", "voltmeter", 400, 280, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_v_d",
      "net_src",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "D1", terminalId: "anode" },
      components,
    ),
    wireBetween(
      "w_d_r",
      "net_mid",
      { componentId: "D1", terminalId: "cathode" },
      { componentId: "RL", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_r_gnd",
      "net_gnd",
      { componentId: "RL", terminalId: "B" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_v_gnd",
      "net_gnd",
      { componentId: "V1", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_vmin_pos",
      "net_src",
      { componentId: "VM_in", terminalId: "positive" },
      { componentId: "V1", terminalId: "positive" },
      components,
    ),
    wireBetween(
      "w_vmin_neg",
      "net_gnd",
      { componentId: "VM_in", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_vmout_pos",
      "net_mid",
      { componentId: "VM_out", terminalId: "positive" },
      { componentId: "RL", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_vmout_neg",
      "net_gnd",
      { componentId: "VM_out", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
  ];

  return normalizeEditorCircuit({ components, wires, connections: [] });
}
