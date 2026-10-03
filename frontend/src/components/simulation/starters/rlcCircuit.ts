/**
 * Series RLC starter (Experiment rlc-circuit).
 *
 *   V1+ ── SW1 ── R1 ── L1 ── mid ── C1 ── GND
 *   V1− ─────────────────────────────┘
 *                         AM1 in series; VM1 across C1
 *
 * Suggested: R = 100 Ω, L = 100 mH, C = 10 µF, Vin = 5 V
 * (underdamped natural response for a clear second-order waveform).
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

export const RLC_CIRCUIT_EXPERIMENT_ID = "rlc-circuit";

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

export function createRlcCircuitStarter(): EditorCircuit {
  const Vin = 5;
  const R = 100;
  const L = 100e-3;
  const C = 10e-6;

  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 60, 160, { voltage: Vin }),
    component("SW1", "switch", 150, 160, { state: "closed" }),
    component("R1", "resistor", 250, 160, { resistance: R }),
    component("L1", "inductor", 360, 160, {
      inductance: L,
      initialCurrent: 0,
    }),
    component("AM1", "ammeter", 460, 160, {}),
    component("C1", "capacitor", 560, 160, {
      capacitance: C,
      initialVoltage: 0,
    }),
    component("GND1", "ground", 60, 300, {}),
    component("VM1", "voltmeter", 560, 280, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_v_sw",
      "net_src",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "SW1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_sw_r",
      "net_sw",
      { componentId: "SW1", terminalId: "B" },
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
