/**
 * Superposition theorem starter — two independent voltage sources
 * feeding a common load through series resistors.
 *
 *   V1+ — R1 —+— RL — GND
 *              |
 *   V2+ — R2 —+
 *   V1−, V2− — GND
 *   VM1 across RL (Vout)
 *
 * Defaults: V1=12 V, V2=6 V, R1=1 kΩ, R2=2 kΩ, RL=3 kΩ
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

export const SUPERPOSITION_THEOREM_EXPERIMENT_ID = "superposition-theorem";

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

export function createSuperpositionTheoremStarter(): EditorCircuit {
  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 100, 120, { voltage: 12 }),
    component("V2", "voltage_source", 100, 280, { voltage: 6 }),
    component("R1", "resistor", 240, 120, { resistance: 1000 }),
    component("R2", "resistor", 240, 280, { resistance: 2000 }),
    component("RL", "resistor", 400, 200, { resistance: 3000 }, 90),
    component("GND1", "ground", 100, 360, {}),
    component("VM1", "voltmeter", 480, 200, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_v1_r1",
      "net_v1",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "R1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_v2_r2",
      "net_v2",
      { componentId: "V2", terminalId: "positive" },
      { componentId: "R2", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_r1_mid",
      "net_mid",
      { componentId: "R1", terminalId: "B" },
      { componentId: "RL", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_r2_mid",
      "net_mid",
      { componentId: "R2", terminalId: "B" },
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
      "w_v1_gnd",
      "net_bot",
      { componentId: "V1", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_v2_gnd",
      "net_bot",
      { componentId: "V2", terminalId: "negative" },
      { componentId: "GND1", terminalId: "ground" },
      components,
    ),
    wireBetween(
      "w_vm_pos",
      "net_mid",
      { componentId: "RL", terminalId: "A" },
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
