/**
 * RL transient starter (Experiment rl-circuit).
 *
 *   V1+ ── SW1 ── R1 ── AM1 ── mid ── L1 ── GND
 *   V1− ──────────────────────────────┘
 *                              VM1 across R1
 *
 * Recommended: Vin = 5 V, R = 100 Ω, L = 100 mH (τ = L/R = 1 ms).
 * SW1 closed → energizing (iL starts at 0).
 * SW1 open  → de-energizing (solver zeros Vin; iL(0) = Vin/R).
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

export const RL_CIRCUIT_EXPERIMENT_ID = "rl-circuit";

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

export function createRlCircuitStarter(): EditorCircuit {
  const Vin = 5;
  const R = 100;
  const L = 100e-3;

  const components: ComponentInstance[] = [
    component("V1", "voltage_source", 80, 160, { voltage: Vin }),
    component("SW1", "switch", 180, 160, { state: "closed" }),
    component("R1", "resistor", 300, 160, { resistance: R }),
    component("AM1", "ammeter", 400, 160, {}),
    component("L1", "inductor", 520, 160, {
      inductance: L,
      initialCurrent: 0,
    }),
    component("GND1", "ground", 80, 300, {}),
    component("VM1", "voltmeter", 300, 280, {}),
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
      "w_r_am",
      "net_r",
      { componentId: "R1", terminalId: "B" },
      { componentId: "AM1", terminalId: "input" },
      components,
    ),
    wireBetween(
      "w_am_l",
      "net_mid",
      { componentId: "AM1", terminalId: "output" },
      { componentId: "L1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_l_gnd",
      "net_gnd",
      { componentId: "L1", terminalId: "B" },
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
      "net_sw",
      { componentId: "VM1", terminalId: "positive" },
      { componentId: "R1", terminalId: "A" },
      components,
    ),
    wireBetween(
      "w_vm_neg",
      "net_r",
      { componentId: "VM1", terminalId: "negative" },
      { componentId: "R1", terminalId: "B" },
      components,
    ),
  ];

  return normalizeEditorCircuit({ components, wires, connections: [] });
}
