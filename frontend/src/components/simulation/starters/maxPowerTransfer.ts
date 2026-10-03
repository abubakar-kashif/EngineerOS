/**
 * Maximum power transfer starter — same Thévenin network with a variable load.
 *
 *   V1+ — R1 —+— R2 — GND
 *              |
 *             RL — GND
 *
 * Defaults: Vs=12 V, R1=R2=2 kΩ → Rth=1 kΩ, Vth=6 V
 * Operating RL starts at 500 Ω (off match) so the sweep peak is visible.
 * Pmax = Vth²/(4 Rth) = 9 mW at RL = Rth.
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

export const MAX_POWER_TRANSFER_EXPERIMENT_ID = "maximum-power-transfer";

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

export function createMaxPowerTransferStarter(): EditorCircuit {
  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 100, 160, { voltage: 12 }),
    component("R1", "resistor", 240, 120, { resistance: 2000 }),
    component("R2", "resistor", 400, 200, { resistance: 2000 }, 90),
    component("AM1", "ammeter", 320, 280, {}),
    component("RL", "resistor", 440, 280, { resistance: 500 }),
    component("GND1", "ground", 100, 360, {}),
    component("VM1", "voltmeter", 520, 200, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_v_r1",
      "net_top",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "R1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_r1_mid",
      "net_mid",
      { componentId: "R1", terminalId: "B" },
      { componentId: "R2", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_r2_gnd",
      "net_bot",
      { componentId: "R2", terminalId: "B" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_v_gnd",
      "net_bot",
      { componentId: "V1", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_mid_am",
      "net_mid",
      { componentId: "R1", terminalId: "B" },
      { componentId: "AM1", terminalId: "input" },
      components,
    ),
    wireBetween(
      "w_am_rl",
      "net_load",
      { componentId: "AM1", terminalId: "output" },
      { componentId: "RL", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_rl_gnd",
      "net_bot",
      { componentId: "RL", terminalId: "B" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_vm_pos",
      "net_mid",
      { componentId: "R2", terminalId: "A" },
      { componentId: "VM1", terminalId: "positive" },
      components,
    ),
    wireBetween(
      "w_vm_neg",
      "net_bot",
      { componentId: "VM1", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
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
