/**
 * Balanced Wheatstone bridge starter circuit for Experiment 11.
 *
 * Topology (all resistors 1 kΩ, Vin = 10 V):
 *   V1+ ──┬── R1 ── left mid ── R2 ──┬── GND
 *         │                          │
 *         └── R3 ── right mid ─ R4 ──┘
 *                   VM1 across midpoints (Vout)
 *
 * Balance: R1/R2 = R3/R4 ⇒ Vout ≈ 0.
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

export const WHEATSTONE_BRIDGE_EXPERIMENT_ID = "wheatstone-bridge";

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

/** Initial balanced Wheatstone bridge (editor circuit). */
export function createWheatstoneBridgeStarter(): EditorCircuit {
  const Vin = 10;
  const R = 1000;

  // Vertical resistors (rotation 90): A = top, B = bottom.
  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 100, 200, { voltage: Vin }),
    component("R1", "resistor", 240, 120, { resistance: R }, 90),
    component("R2", "resistor", 240, 280, { resistance: R }, 90),
    component("R3", "resistor", 400, 120, { resistance: R }, 90),
    component("R4", "resistor", 400, 280, { resistance: R }, 90),
    component("GND1", "ground", 100, 360, {}),
    component("VM1", "voltmeter", 320, 200, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_top_v_r1",
      "net_top",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "R1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_top_r1_r3",
      "net_top",
      { componentId: "R1", terminalId: "A" },
      { componentId: "R3", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_bot_v_gnd",
      "net_bot",
      { componentId: "V1", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_bot_r2_gnd",
      "net_bot",
      { componentId: "R2", terminalId: "B" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_bot_r4_gnd",
      "net_bot",
      { componentId: "R4", terminalId: "B" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_mid_l",
      "net_mid_l",
      { componentId: "R1", terminalId: "B" },
      { componentId: "R2", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_vm_pos",
      "net_mid_l",
      { componentId: "R2", terminalId: "A" },
      { componentId: "VM1", terminalId: "positive" },
      components,
    ),
    wireBetween(
      "w_mid_r",
      "net_mid_r",
      { componentId: "R3", terminalId: "B" },
      { componentId: "R4", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_vm_neg",
      "net_mid_r",
      { componentId: "R4", terminalId: "A" },
      { componentId: "VM1", terminalId: "negative" },
      components,
    ),
  ];

  return normalizeEditorCircuit({
    components,
    wires,
    connections: [],
    junctions: [],
  });
}
