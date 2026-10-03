/**
 * Potentiometer / variable voltage divider starter (Experiment 12).
 *
 * Vin — A(POT) … wiper → VM+ → Vout
 * GND — B(POT) ……… VM−
 *
 * Ideal unloaded: Vout = α · Vin
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

export const POTENTIOMETER_EXPERIMENT_ID = "potentiometer";

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

export function createPotentiometerStarter(): EditorCircuit {
  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 120, 160, { voltage: 10 }),
    component("POT1", "potentiometer", 280, 160, {
      resistance: 10000,
      wiperPosition: 0.5,
    }),
    component("GND1", "ground", 120, 280, {}),
    component("VM1", "voltmeter", 400, 200, {}),
  ];

  const wires: WireSegment[] = [
    wireBetween(
      "w_vin_a",
      "net_top",
      { componentId: "V1", terminalId: "positive" },
      { componentId: "POT1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_b_gnd",
      "net_bot",
      { componentId: "POT1", terminalId: "B" },
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
      "w_wiper_vm",
      "net_out",
      { componentId: "POT1", terminalId: "wiper" },
      { componentId: "VM1", terminalId: "positive" },
      components,
    ),
    wireBetween(
      "w_vm_gnd",
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
