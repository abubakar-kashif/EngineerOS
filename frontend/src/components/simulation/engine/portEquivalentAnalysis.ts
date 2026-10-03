/**
 * Shared open-circuit / short-circuit port analysis for Thévenin & Norton.
 *
 * For a network with a designated load RL between port terminals:
 *   Vth = Voc (RL → open)
 *   IN  = Isc (RL → short)
 *   Rth = RN = Voc / Isc  (when Isc ≠ 0)
 */
import type { CircuitDefinition } from "./circuitGraph";
import type { DCResult } from "./dcSolver";
import { solveDC } from "./dcSolver";
import { findIndependentSources } from "./superpositionAnalysis";

const OPEN_OHMS = 1e12;
const SHORT_OHMS = 1e-6;

/** Only an explicit load designator — avoids hijacking bridges / multi-source labs. */
function findExplicitLoadId(circuit: CircuitDefinition): string | null {
  const load = circuit.components.find(
    (c) =>
      c.type === "resistor" &&
      (/^RL$/i.test(c.id) ||
        /^RL$/i.test(c.label ?? "") ||
        /load/i.test(c.id) ||
        /load/i.test(c.label ?? "")),
  );
  return load?.id ?? null;
}

export interface PortEquivalentCore {
  loadId: string;
  rl: number;
  sourceVoltage: number | null;
  /** Original loaded network */
  originalVL: number;
  originalIL: number;
  /** Open-circuit voltage at the load port */
  voc: number;
  /** Short-circuit current at the load port */
  isc: number;
  vth: number;
  rth: number;
  inorton: number;
  rn: number;
}

function withLoadResistance(
  circuit: CircuitDefinition,
  loadId: string,
  resistance: number,
): CircuitDefinition {
  return {
    ...circuit,
    components: circuit.components.map((c) =>
      c.id === loadId
        ? { ...c, properties: { ...c.properties, resistance } }
        : c,
    ),
  };
}

function readLoadVI(
  circuit: CircuitDefinition,
  dc: DCResult,
  loadId: string,
): { v: number; i: number } | null {
  if (!dc.success) return null;
  const load = dc.componentResults.get(loadId);
  if (!load || !Number.isFinite(load.voltage) || !Number.isFinite(load.current)) {
    return null;
  }
  let v = load.voltage;
  const vm = circuit.components.find((c) => c.type === "voltmeter");
  if (vm) {
    const vmResult = dc.componentResults.get(vm.id);
    if (vmResult && Number.isFinite(vmResult.voltage)) v = vmResult.voltage;
  }
  return { v, i: load.current };
}

export function extractPortEquivalentCore(
  circuit: CircuitDefinition,
): PortEquivalentCore | null {
  // Thévenin/Norton labs use one independent source + an explicit RL.
  if (findIndependentSources(circuit).length !== 1) return null;

  const loadId = findExplicitLoadId(circuit);
  if (!loadId) return null;
  const loadComp = circuit.components.find((c) => c.id === loadId);
  const rl = loadComp?.properties.resistance;
  if (typeof rl !== "number" || !(rl > 0)) return null;

  const source = circuit.components.find((c) => c.type === "voltage_source");
  const sourceVoltage =
    typeof source?.properties.voltage === "number" ? source.properties.voltage : null;

  const originalDc = solveDC(circuit);
  const original = readLoadVI(circuit, originalDc, loadId);
  if (!original) return null;

  const openCircuit = withLoadResistance(circuit, loadId, OPEN_OHMS);
  const openDc = solveDC(openCircuit);
  const open = readLoadVI(openCircuit, openDc, loadId);
  if (!open) return null;

  const shortCircuit = withLoadResistance(circuit, loadId, SHORT_OHMS);
  const shortDc = solveDC(shortCircuit);
  const shorted = readLoadVI(shortCircuit, shortDc, loadId);
  if (!shorted) return null;

  const voc = open.v;
  const isc = Math.abs(shorted.i);
  if (!(isc > 1e-15) && Math.abs(voc) > 1e-12) return null;

  const rth = Math.abs(voc) < 1e-15 ? 0 : Math.abs(voc) / isc;
  const vth = voc;
  const inorton = isc;
  const rn = rth;

  return {
    loadId,
    rl,
    sourceVoltage,
    originalVL: original.v,
    originalIL: Math.abs(original.i),
    voc,
    isc,
    vth,
    rth,
    inorton,
    rn,
  };
}
