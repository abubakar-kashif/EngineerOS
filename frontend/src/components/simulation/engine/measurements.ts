/**
 * Extract engineering measurements from simulation results.
 */
import type {
  CircuitDefinition,
  ComponentResult,
  GlobalMeasurements,
  SimulationOutput,
} from "./types";
import { formatVoltage, formatCurrent, formatResistance, formatPower } from "./units";

export interface MeasurementRow {
  label: string;
  value: string;
  raw: number;
}

/** Extract global measurements as display-ready rows */
export function globalMeasurementRows(g: GlobalMeasurements): MeasurementRow[] {
  return [
    { label: "Source Voltage", value: formatVoltage(g.sourceVoltage), raw: g.sourceVoltage },
    { label: "Total Resistance", value: formatResistance(g.totalResistance), raw: g.totalResistance },
    { label: "Total Current", value: formatCurrent(g.totalCurrent), raw: g.totalCurrent },
    { label: "Total Power", value: formatPower(g.totalPower), raw: g.totalPower },
  ];
}

/** Extract per-component measurements as display-ready rows */
export function componentMeasurementRows(
  circuit: CircuitDefinition,
  results: ComponentResult[],
  componentId: string,
): MeasurementRow[] {
  const comp = circuit.components.find((c) => c.id === componentId);
  const result = results.find((r) => r.componentId === componentId);
  if (!comp || !result) return [];

  const rows: MeasurementRow[] = [
    { label: "Voltage", value: formatVoltage(result.voltage), raw: result.voltage },
    { label: "Current", value: formatCurrent(result.current), raw: result.current },
    { label: "Power", value: formatPower(result.power), raw: result.power },
  ];

  if (comp.type === "diode" || comp.type === "led") {
    rows.push({ label: "State", value: result.state, raw: 0 });
  }
  if (comp.type === "switch") {
    rows.push({ label: "State", value: result.state, raw: 0 });
  }

  return rows;
}

/** Build all measurements from a simulation output */
export function allMeasurements(
  circuit: CircuitDefinition,
  output: SimulationOutput,
): Map<string, MeasurementRow[]> {
  const map = new Map<string, MeasurementRow[]>();
  for (const comp of circuit.components) {
    if (comp.type === "ground") continue;
    const rows = componentMeasurementRows(circuit, output.components, comp.id);
    if (rows.length > 0) {
      map.set(comp.id, rows);
    }
  }
  return map;
}
