/**
 * UX grouping for real Phase 6 graph data. Does not invent measurements.
 */
import {
  buildGraphFromSignals,
  selectableGraphs,
  type GraphData,
  type MeasurementSignal,
} from "./engine/graphData";
import type { CircuitDefinition } from "./engine/circuitGraph";
import type { Measurements } from "./engine/types";

export const RUN_SIMULATION_FOR_GRAPHS = "Run the simulation to generate graph data.";

export type GraphSelectorGroupId = "voltage" | "current" | "power" | "analysis";

export interface GraphSelectorOption {
  id: string;
  kind: "preset" | "signal";
  graphId?: string;
  signalId?: string;
  label: string;
  group: GraphSelectorGroupId;
}

export interface GraphSelectorGroup {
  id: GraphSelectorGroupId;
  label: string;
  options: GraphSelectorOption[];
}

const GROUP_ORDER: GraphSelectorGroupId[] = ["voltage", "current", "power", "analysis"];

const GROUP_TITLES: Record<GraphSelectorGroupId, string> = {
  voltage: "Voltage",
  current: "Current",
  power: "Power",
  analysis: "Analysis",
};

const ANALYSIS_LABELS: Record<string, string> = {
  ohms_law: "Ohm's Law",
  voltage_divider: "Voltage Divider",
  potentiometer_wiper: "Wiper position vs Vout",
  wheatstone_bridge: "Wheatstone bridge",
  wheatstone_bridge_nodes: "Wheatstone node voltages",
  superposition_comparison: "Full vs contributions",
  thevenin_comparison: "Original vs Thévenin",
  norton_comparison: "Original vs Norton",
  max_power_transfer: "Load resistance vs load power",
  frequency_response: "Frequency vs Circuit Current",
  frequency_response_gain: "Frequency vs voltage gain",
  rc_low_pass_phase: "Phase vs frequency",
  half_wave_rectifier_scope: "Oscilloscope (Vin / Vout)",
  full_wave_bridge_scope: "Oscilloscope (Vin / Vout)",
  function_generator_scope: "Oscilloscope",
  rc_time: "Time vs Vc",
  rc_current_time: "Time vs Ic",
  rl_current_time: "Time vs Inductor Current",
  rl_resistor_voltage_time: "Time vs Resistor Voltage",
  rlc_current_time: "Current vs Time",
  rlc_capacitor_voltage_time: "Capacitor Voltage vs Time",
  power_time: "Power vs time",
  current_signals: "KCL currents",
  voltage_signals: "KVL voltages",
  component_voltages: "Component voltages",
  component_currents: "Component currents",
  component_power: "Component power",
  measured_vi: "Measured V–I",
};

function nameFromSignalLabel(signal: MeasurementSignal): string {
  const wrapped = signal.label.match(/^[VIPR]\((.+)\)$/);
  if (wrapped?.[1]) return wrapped[1];
  return signal.label;
}

export function buildGraphSelectorGroups(
  graphs: GraphData[] | null | undefined,
  signals: MeasurementSignal[],
): GraphSelectorGroup[] {
  const voltage: GraphSelectorOption[] = [];
  const current: GraphSelectorOption[] = [];
  const power: GraphSelectorOption[] = [];

  for (const signal of signals) {
    if (!signal.available) continue;
    if (signal.id.startsWith("V_")) {
      voltage.push({
        id: `signal:${signal.id}`,
        kind: "signal",
        signalId: signal.id,
        label: `Voltage — ${nameFromSignalLabel(signal)}`,
        group: "voltage",
      });
    } else if (signal.id.startsWith("I_")) {
      current.push({
        id: `signal:${signal.id}`,
        kind: "signal",
        signalId: signal.id,
        label: `Current — ${nameFromSignalLabel(signal)}`,
        group: "current",
      });
    } else if (signal.id.startsWith("P_")) {
      power.push({
        id: `signal:${signal.id}`,
        kind: "signal",
        signalId: signal.id,
        label: `Power — ${nameFromSignalLabel(signal)}`,
        group: "power",
      });
    }
  }

  const analysis: GraphSelectorOption[] = selectableGraphs(graphs).map((graph) => ({
    id: `preset:${graph.id}`,
    kind: "preset" as const,
    graphId: graph.id,
    label: ANALYSIS_LABELS[graph.id] ?? graph.title,
    group: "analysis" as const,
  }));

  const buckets: Record<GraphSelectorGroupId, GraphSelectorOption[]> = {
    voltage,
    current,
    power,
    analysis,
  };

  return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: GROUP_TITLES[id],
    options: buckets[id],
  }));
}

export function flattenSelectorOptions(groups: GraphSelectorGroup[]): GraphSelectorOption[] {
  return groups.flatMap((group) => group.options);
}

/** Time or frequency plots that describe the lab, ahead of a generic DC chart. */
const PREFERRED_GRAPH_IDS = [
  "frequency_response_gain",
  "rc_low_pass_phase",
  "frequency_response",
  "half_wave_rectifier_scope",
  "full_wave_bridge_scope",
  "function_generator_scope",
  "rc_time",
  "rl_current_time",
  "rlc_current_time",
  "wheatstone_bridge",
  "thevenin_comparison",
  "norton_comparison",
  "max_power_transfer",
  "superposition_comparison",
  "potentiometer_wiper",
  "voltage_divider",
];

/** Prefer the lab's own waveform or sweep; otherwise keep the first analysis plot. */
export function defaultSelectorOptionId(groups: GraphSelectorGroup[]): string {
  const options = flattenSelectorOptions(groups);
  for (const graphId of PREFERRED_GRAPH_IDS) {
    const match = options.find((option) => option.graphId === graphId);
    if (match) return match.id;
  }
  const analysis = groups.find((group) => group.id === "analysis");
  if (analysis?.options[0]) return analysis.options[0].id;
  return groups[0]?.options[0]?.id ?? "";
}

export function findSelectorOption(
  groups: GraphSelectorGroup[],
  optionId: string,
): GraphSelectorOption | undefined {
  return flattenSelectorOptions(groups).find((option) => option.id === optionId);
}

export function graphForSelectorOption(
  option: GraphSelectorOption,
  presets: GraphData[],
  measurements: Measurements | undefined,
  circuit?: CircuitDefinition | null,
): { graph: GraphData | null; unavailableReason?: string } {
  if (option.kind === "preset") {
    const graph = presets.find((item) => item.id === option.graphId) ?? null;
    return { graph };
  }
  if (!measurements || !option.signalId) {
    return { graph: null, unavailableReason: RUN_SIMULATION_FOR_GRAPHS };
  }
  const built = buildGraphFromSignals(
    measurements,
    "index",
    [option.signalId],
    circuit ?? undefined,
  );
  if (!built.graph) return built;
  return {
    graph: {
      ...built.graph,
      title: option.label,
    },
  };
}
