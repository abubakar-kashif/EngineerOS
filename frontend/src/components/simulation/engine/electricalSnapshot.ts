/**
 * Bind measurements to the solved electrical topology of one SimulationRun.
 * Geometry (x/y/rotation) is excluded so a visual nudge is not a new circuit,
 * but any electrical edit produces a new fingerprint.
 */
import type { CircuitDefinition, Connection } from './circuitGraph';
import type { Netlist, NetlistElement } from './netlist';
import type { SimulationResult } from './types';

const ELECTRICAL_KEYS = [
  'resistance',
  'voltage',
  'current',
  'capacitance',
  'inductance',
  'forwardVoltage',
  'state',
] as const;

export interface NetlistSnapshotElement {
  kind: NetlistElement['kind'];
  id: string;
  nets: string[];
  value?: number | boolean;
}

export interface NetlistSnapshot {
  groundNet: string;
  elements: NetlistSnapshotElement[];
}

function connectionKey(conn: Connection): string {
  return [conn.from, conn.to].sort().join('--');
}

export function electricalFingerprint(circuit: CircuitDefinition): string {
  const components = [...(circuit.components ?? [])]
    .map((c) => {
      const raw = c.properties ?? {};
      const props: Record<string, string | number | boolean> = {};
      for (const key of ELECTRICAL_KEYS) {
        const v = raw[key];
        if (v !== undefined) props[key] = v as string | number | boolean;
      }
      return { id: c.id, type: c.type, properties: props };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const connections = [...(circuit.connections ?? []).map(connectionKey)].sort();
  return JSON.stringify({ components, connections });
}

export function serializeNetlistSnapshot(netlist: Netlist): NetlistSnapshot {
  const elements: NetlistSnapshotElement[] = netlist.elements.map((el) => {
    switch (el.kind) {
      case 'resistor':
        return { kind: el.kind, id: el.id, nets: [el.n1, el.n2], value: el.resistance };
      case 'capacitor':
        return { kind: el.kind, id: el.id, nets: [el.n1, el.n2], value: el.capacitance };
      case 'inductor':
        return { kind: el.kind, id: el.id, nets: [el.n1, el.n2], value: el.inductance };
      case 'voltage_source':
        return { kind: el.kind, id: el.id, nets: [el.nPos, el.nNeg], value: el.voltage };
      case 'current_source':
        return { kind: el.kind, id: el.id, nets: [el.nPos, el.nNeg], value: el.current };
      case 'diode':
      case 'led':
        return { kind: el.kind, id: el.id, nets: [el.nAnode, el.nCathode], value: el.vf };
      case 'switch':
        return { kind: el.kind, id: el.id, nets: [el.n1, el.n2], value: el.closed };
      case 'voltmeter':
        return { kind: el.kind, id: el.id, nets: [el.nPos, el.nNeg] };
      case 'ammeter':
        return { kind: el.kind, id: el.id, nets: [el.n1, el.n2] };
      default:
        return { kind: 'resistor', id: 'unknown', nets: [] };
    }
  });
  return { groundNet: netlist.groundNet, elements };
}

export function resultIsBoundToCircuit(
  result: SimulationResult | null | undefined,
  circuit: CircuitDefinition,
): boolean {
  if (!result) return false;
  const fp = result.metadata?.solvedCircuitFingerprint;
  if (typeof fp !== 'string' || fp.length === 0) return false;
  return fp === electricalFingerprint(circuit);
}

/** UI must not show a run whose topology no longer matches the editor. */
export function displayableSimulationResult(
  result: SimulationResult | null,
  liveCircuit: CircuitDefinition,
): SimulationResult | null {
  if (!result) return null;
  if (!resultIsBoundToCircuit(result, liveCircuit)) return null;
  return result;
}
