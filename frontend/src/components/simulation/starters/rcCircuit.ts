/**
 * RC circuit starter — series R–C charging (catalog Experiment rc-circuit).
 *
 *   V1+ ── R1 ── C1 ── GND
 *   V1− ──────────────┘
 *
 * Values match the published catalog: 9 V, 10 kΩ, 100 µF (τ = RC = 1 s).
 * Capacitor starts uncharged (Vc(0) = 0).
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

export const RC_CIRCUIT_EXPERIMENT_ID = "rc-circuit";

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

export function createRcCircuitStarter(): EditorCircuit {
  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 100, 160, { voltage: 9 }),
    component("R1", "resistor", 260, 160, { resistance: 10000 }),
    component("C1", "capacitor", 420, 160, {
      capacitance: 100e-6,
      initialVoltage: 0,
    }),
    component("GND1", "ground", 100, 300, {}),
    component("VM1", "voltmeter", 420, 260, {}),
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
      "net_mid",
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
