/**
 * RC low-pass starter (Experiment rc-low-pass-filter).
 *
 *   V1(sine)+ ── R1 ── C1 ── GND
 *   V1− ───────────────┘
 *              VM1 across C1  (Vout)
 *
 * R = 1 kΩ, C = 100 nF → fc = 1/(2πRC) ≈ 1.591 kHz.
 * Drive at 500 Hz so the scope shows a passband sine, not a hardcoded curve.
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

export const RC_LOW_PASS_EXPERIMENT_ID = "rc-low-pass-filter";

function component(
  id: string,
  type: ComponentType,
  x: number,
  y: number,
  properties: ComponentInstance["properties"],
): ComponentInstance {
  return {
    id,
    type,
    label: id,
    x,
    y,
    rotation: 0,
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

export function createRcLowPassStarter(): EditorCircuit {
  const Vin = 5;
  const R = 1000;
  const C = 100e-9;
  const frequency = 500;

  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 80, 160, {
      ...AC_FUNCTION_GENERATOR_DEFAULTS,
      voltage: Vin,
      amplitude: Vin,
      frequency,
      phase: 0,
      waveform: "sine",
      acMode: true,
    }),
    component("R1", "resistor", 240, 160, { resistance: R }),
    component("C1", "capacitor", 420, 160, { capacitance: C }),
    component("GND1", "ground", 80, 320, {}),
    component("VM1", "voltmeter", 420, 280, {}),
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
      "w_r_c",
      "net_out",
      { componentId: "R1", terminalId: "B" },
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
      "net_out",
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
