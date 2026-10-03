/**
 * Full-wave bridge rectifier starter.
 *
 *   AC+ (A) ── D1 ── V+ ── D2 ── AC− (B)     D1, D2 cathodes at V+
 *   AC+ (A) ── D3 ── GND ── D4 ── AC− (B)    D3, D4 anodes at GND
 *   RL from V+ to GND. Source floats between A and B.
 *
 * Positive half: D1 + D4 conduct. Negative half: D2 + D3 conduct.
 * sine 50 Hz, Vin peak = 10 V, RL = 1 kΩ, each Vf = 0.7 V.
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

export const FULL_WAVE_BRIDGE_EXPERIMENT_ID = "full-wave-bridge-rectifier";

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

export function createFullWaveBridgeStarter(): EditorCircuit {
  const VinPeak = 10;
  const f = 50;
  const RL = 1000;
  const Vf = 0.7;

  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 80, 200, {
      ...AC_FUNCTION_GENERATOR_DEFAULTS,
      voltage: VinPeak,
      amplitude: VinPeak,
      frequency: f,
      phase: 0,
      waveform: "sine",
      acMode: true,
    }),
    // D1: AC+ → V+
    component("D1", "diode", 220, 80, { forwardVoltage: Vf }),
    // D2: AC− → V+  (anode toward AC−, so rotate 180: cathode on the left)
    component("D2", "diode", 360, 80, { forwardVoltage: Vf }, 180),
    // D3: GND → AC+  (anode at bottom/left toward ground side)
    component("D3", "diode", 220, 280, { forwardVoltage: Vf }, 180),
    // D4: GND → AC−
    component("D4", "diode", 360, 280, { forwardVoltage: Vf }),
    component("RL", "resistor", 480, 180, { resistance: RL }, 90),
    component("GND1", "ground", 480, 340, {}),
    component("VM_in", "voltmeter", 80, 340, {}),
    component("VM_out", "voltmeter", 560, 180, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween("w_vp_d1a", "net_a", { componentId: "V1", terminalId: "positive" }, { componentId: "D1", terminalId: "anode" }, components),
    wireBetween("w_d1c_rl", "net_plus", { componentId: "D1", terminalId: "cathode" }, { componentId: "RL", terminalId: "A" }, components),
    wireBetween("w_vn_d2a", "net_b", { componentId: "V1", terminalId: "negative" }, { componentId: "D2", terminalId: "anode" }, components),
    wireBetween("w_d2c_rl", "net_plus", { componentId: "D2", terminalId: "cathode" }, { componentId: "RL", terminalId: "A" }, components),
    wireBetween("w_g_d3a", "net_gnd", { componentId: "GND1", terminalId: "ground" }, { componentId: "D3", terminalId: "anode" }, components),
    wireBetween("w_d3c_a", "net_a", { componentId: "D3", terminalId: "cathode" }, { componentId: "V1", terminalId: "positive" }, components),
    wireBetween("w_g_d4a", "net_gnd", { componentId: "GND1", terminalId: "ground" }, { componentId: "D4", terminalId: "anode" }, components),
    wireBetween("w_d4c_b", "net_b", { componentId: "D4", terminalId: "cathode" }, { componentId: "V1", terminalId: "negative" }, components),
    wireBetween("w_rl_g", "net_gnd", { componentId: "RL", terminalId: "B" }, { componentId: "GND1", terminalId: "ground" }, components),
    wireBetween("w_vmin_p", "net_a", { componentId: "VM_in", terminalId: "positive" }, { componentId: "V1", terminalId: "positive" }, components),
    wireBetween("w_vmin_n", "net_b", { componentId: "VM_in", terminalId: "negative" }, { componentId: "V1", terminalId: "negative" }, components),
    wireBetween("w_vmout_p", "net_plus", { componentId: "VM_out", terminalId: "positive" }, { componentId: "RL", terminalId: "A" }, components),
    wireBetween("w_vmout_n", "net_gnd", { componentId: "VM_out", terminalId: "negative" }, { componentId: "GND1", terminalId: "ground" }, components),
  ];

  return normalizeEditorCircuit({ components, wires, connections: [] });
}
