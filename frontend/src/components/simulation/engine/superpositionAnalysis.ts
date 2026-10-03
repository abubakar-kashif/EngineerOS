/**
 * Superposition theorem: solve full circuit and each single-source contribution
 * with other independent sources deactivated (VS → short/V=0, CS → open/I=0).
 */
import type { CircuitDefinition, Component } from "./circuitGraph";
import type { DCResult } from "./dcSolver";
import { solveDC } from "./dcSolver";

export interface SuperpositionSource {
  id: string;
  kind: "voltage_source" | "current_source";
  value: number;
}

export interface SuperpositionStateResult {
  label: string;
  /** Source ids left active (others deactivated). */
  activeSourceIds: string[];
  vout: number;
  iLoad: number;
}

export interface SuperpositionMetrics {
  sources: SuperpositionSource[];
  loadId: string;
  quantity: "voltage";
  full: SuperpositionStateResult;
  contributions: SuperpositionStateResult[];
  sumContributions: number;
  difference: number;
  errorPercent: number;
}

function isIndependentSource(c: Component): boolean {
  return c.type === "voltage_source" || c.type === "current_source";
}

export function findIndependentSources(circuit: CircuitDefinition): SuperpositionSource[] {
  return circuit.components
    .filter(isIndependentSource)
    .map((c) => {
      if (c.type === "voltage_source") {
        const v = c.properties.voltage;
        return {
          id: c.id,
          kind: "voltage_source" as const,
          value: typeof v === "number" ? v : 0,
        };
      }
      const i = c.properties.current;
      return {
        id: c.id,
        kind: "current_source" as const,
        value: typeof i === "number" ? i : 0,
      };
    });
}

/** Prefer RL / load designators; else last resistor in the circuit. */
export function findLoadResistorId(circuit: CircuitDefinition): string | null {
  const byName = circuit.components.find(
    (c) =>
      c.type === "resistor" &&
      (/^RL$/i.test(c.id) ||
        /^RL$/i.test(c.label ?? "") ||
        /load/i.test(c.id) ||
        /load/i.test(c.label ?? "")),
  );
  if (byName) return byName.id;

  const resistors = circuit.components.filter((c) => c.type === "resistor");
  return resistors.length ? resistors[resistors.length - 1].id : null;
}

/**
 * Deactivate all independent sources except those in `activeIds`.
 * Ideal VS → voltage 0 (short). Ideal CS → current 0 (open).
 */
export function deactivateSourcesExcept(
  circuit: CircuitDefinition,
  activeIds: ReadonlySet<string>,
): CircuitDefinition {
  return {
    ...circuit,
    components: circuit.components.map((c) => {
      if (!isIndependentSource(c)) return c;
      if (activeIds.has(c.id)) return c;
      if (c.type === "voltage_source") {
        return { ...c, properties: { ...c.properties, voltage: 0 } };
      }
      return { ...c, properties: { ...c.properties, current: 0 } };
    }),
  };
}

function readLoadQuantity(
  circuit: CircuitDefinition,
  dc: DCResult,
  loadId: string,
): { vout: number; iLoad: number } | null {
  if (!dc.success) return null;

  let vout: number | null = null;
  const vm = circuit.components.find((c) => c.type === "voltmeter");
  if (vm) {
    const vmResult = dc.componentResults.get(vm.id);
    if (vmResult && Number.isFinite(vmResult.voltage)) vout = vmResult.voltage;
  }
  const loadResult = dc.componentResults.get(loadId);
  if (vout == null && loadResult && Number.isFinite(loadResult.voltage)) {
    vout = loadResult.voltage;
  }
  if (vout == null || !loadResult || !Number.isFinite(loadResult.current)) return null;
  return { vout, iLoad: loadResult.current };
}

export function extractSuperpositionMetrics(
  circuit: CircuitDefinition,
): SuperpositionMetrics | null {
  const sources = findIndependentSources(circuit);
  if (sources.length < 2) return null;

  const loadId = findLoadResistorId(circuit);
  if (!loadId) return null;

  const fullDc = solveDC(circuit);
  const fullQ = readLoadQuantity(circuit, fullDc, loadId);
  if (!fullQ) return null;

  const full: SuperpositionStateResult = {
    label: "Full circuit (all sources)",
    activeSourceIds: sources.map((s) => s.id),
    vout: fullQ.vout,
    iLoad: fullQ.iLoad,
  };

  const contributions: SuperpositionStateResult[] = [];
  for (const src of sources) {
    const variant = deactivateSourcesExcept(circuit, new Set([src.id]));
    const dc = solveDC(variant);
    const q = readLoadQuantity(variant, dc, loadId);
    if (!q) return null;
    contributions.push({
      label: `${src.id} contribution`,
      activeSourceIds: [src.id],
      vout: q.vout,
      iLoad: q.iLoad,
    });
  }

  const sumContributions = contributions.reduce((s, c) => s + c.vout, 0);
  const difference = full.vout - sumContributions;
  const errorPercent =
    Math.abs(full.vout) < 1e-12
      ? Math.abs(difference) < 1e-9
        ? 0
        : 100
      : (Math.abs(difference) / Math.abs(full.vout)) * 100;

  return {
    sources,
    loadId,
    quantity: "voltage",
    full,
    contributions,
    sumContributions,
    difference,
    errorPercent,
  };
}

/** VS deactivation sets voltage to 0 (ideal short for superposition). */
export function deactivatedVoltageSourceIsShort(
  circuit: CircuitDefinition,
  sourceId: string,
): boolean {
  const src = circuit.components.find((c) => c.id === sourceId);
  if (!src || src.type !== "voltage_source") return false;
  const deactivated = deactivateSourcesExcept(circuit, new Set());
  const component = deactivated.components.find((c) => c.id === sourceId);
  return component?.properties.voltage === 0;
}

/** CS deactivation sets current to 0 (ideal open for superposition). */
export function deactivatedCurrentSourceIsOpen(
  circuit: CircuitDefinition,
  sourceId: string,
): boolean {
  const src = circuit.components.find((c) => c.id === sourceId);
  if (!src || src.type !== "current_source") return false;
  const deactivated = deactivateSourcesExcept(circuit, new Set());
  const component = deactivated.components.find((c) => c.id === sourceId);
  return component?.properties.current === 0;
}
