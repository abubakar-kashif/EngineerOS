/**
 * Series resonance starter (Experiment series-resonance).
 *
 *   V1(AC)+ ── R1 ── L1 ── AM1 ── C1 ── GND
 *   V1− ─────────────────────────────┘
 *                         VM1 across C1
 *
 * R = 100 Ω, L = 100 mH, C = 10 µF → f0 ≈ 159.15 Hz
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
import { AC_FUNCTION_GENERATOR_DEFAULTS } from "../ComponentPalette";

export const SERIES_RESONANCE_EXPERIMENT_ID = "series-resonance";

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

export function createSeriesResonanceStarter(): EditorCircuit {
  const Vin = 5;
  const R = 100;
  const L = 100e-3;
  const C = 10e-6;
  /** Drive near resonance so a single-frequency AC solve is also meaningful. */
  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));

  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 60, 160, {
      ...AC_FUNCTION_GENERATOR_DEFAULTS,
      voltage: Vin,
      amplitude: Vin,
      frequency: f0,
      phase: 0,
      waveform: "sine",
      acMode: true,
    }),
    component("R1", "resistor", 200, 160, { resistance: R }),
    component("L1", "inductor", 320, 160, { inductance: L }),
    component("AM1", "ammeter", 440, 160, {}),
    component("C1", "capacitor", 560, 160, { capacitance: C }),
    component("GND1", "ground", 60, 300, {}),
    component("VM1", "voltmeter", 560, 280, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_v_r",
      "net_src",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "R1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_r_l",
      "net_rl",
      { componentId: "R1", terminalId: "B" },
      { componentId: "L1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_l_am",
      "net_la",
      { componentId: "L1", terminalId: "B" },
      { componentId: "AM1", terminalId: "input" },
      components,
    ),
    wireBetween(
      "w_am_c",
      "net_mid",
      { componentId: "AM1", terminalId: "output" },
      { componentId: "C1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_c_gnd",
      "net_gnd",
      { componentId: "C1", terminalId: "B" },
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
      "w_vm_pos",
      "net_mid",
      { componentId: "VM1", terminalId: "positive" },
      { componentId: "C1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_vm_neg",
      "net_gnd",
      { componentId: "VM1", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
  ];

  return normalizeEditorCircuit({ components, wires, connections: [] });
}
