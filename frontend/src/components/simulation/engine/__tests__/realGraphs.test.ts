/**
 * Phase 4: graphs come from SimulationRun measurements only.
 * No synthetic Ohm/RC sweeps. Missing data → "No measurement data available".
 */
import { describe, expect, it } from "vitest";
import { solveCircuit } from "../circuitSolver";
import {
  generateAllGraphs,
  generateGraphsFromMeasurements,
  getGraphById,
  NO_MEASUREMENT_DATA,
  validateGraphData,
} from "../graphData";
import { displayableSimulationResult } from "../electricalSnapshot";
import {
  ohmsLaw,
  seriesParallel12V,
  seriesRC,
  voltageDivider12V,
} from "./circuitFixtures";

describe("real measurement graphs", () => {
  it("Ohm's Law, divider, KCL, and KVL use the known 12 V / 1 kΩ / 4 kΩ solve", () => {
    const circuit = voltageDivider12V();
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    const graphs = result.graphs!;

    const ohms = getGraphById(graphs, "ohms_law")!;
    expect(ohms.unavailableReason).toBeUndefined();
    expect(ohms.series[0].points).toHaveLength(1);
    expect(ohms.series[0].points[0].x).toBeCloseTo(12, 6);
    expect(ohms.series[0].points[0].y).toBeCloseTo(0.0024, 6);
    expect(validateGraphData(ohms)).toBe(true);

    const divider = getGraphById(graphs, "voltage_divider")!;
    expect(divider.series[0].points).toHaveLength(1);
    expect(divider.series[0].points[0].x).toBeCloseTo(4000, 6);
    expect(divider.series[0].points[0].y).toBeCloseTo(9.6, 6);

    const kcl = getGraphById(graphs, "current_signals")!;
    expect(kcl.metadata?.labels).toEqual(["I1", "I2", "ΣI"]);
    expect(kcl.metadata?.labels).not.toContain("I3");
    expect(kcl.series[0].points.map((p) => p.y)).toEqual([
      expect.closeTo(0.0024, 6),
      expect.closeTo(0.0024, 6),
      expect.closeTo(0.0024, 6),
    ]);

    const kvl = getGraphById(graphs, "voltage_signals")!;
    expect(kvl.metadata?.labels).toEqual(["Vs", "VR1", "VR2", "ΣV"]);
    expect(kvl.series[0].points.map((p) => p.y)).toEqual([
      expect.closeTo(12, 6),
      expect.closeTo(2.4, 6),
      expect.closeTo(9.6, 6),
      expect.closeTo(12, 6),
    ]);
  });

  it("does not invent I3 when only two branch currents exist", () => {
    const graphs = solveCircuit(voltageDivider12V()).graphs!;
    const labels = getGraphById(graphs, "current_signals")?.metadata?.labels as string[];
    expect(labels.filter((l) => /^I\d+$/.test(l))).toHaveLength(2);
  });

  it("KCL includes I1–I3 when three physical branches exist", () => {
    const graphs = solveCircuit(seriesParallel12V()).graphs!;
    const labels = getGraphById(graphs, "current_signals")?.metadata?.labels as string[];
    expect(labels).toEqual(["I1", "I2", "I3", "ΣI"]);
  });

  it("RC and power vs time are empty on a DC run (no synthetic charging curve)", () => {
    const result = solveCircuit(seriesRC());
    expect(result.graphs?.some((g) => g.id === "rc_charging")).toBe(false);

    const rc = getGraphById(result.graphs!, "rc_time")!;
    expect(rc.unavailableReason).toBe(NO_MEASUREMENT_DATA);
    expect(rc.series[0].points).toEqual([]);
    expect(validateGraphData(rc)).toBe(true);

    const power = getGraphById(result.graphs!, "power_time")!;
    expect(power.unavailableReason).toBe(NO_MEASUREMENT_DATA);
    expect(power.series[0].points).toEqual([]);
  });

  it("voltage divider slot is empty when R2 is missing", () => {
    const graphs = solveCircuit(ohmsLaw(5, 1000)).graphs!;
    const divider = getGraphById(graphs, "voltage_divider")!;
    expect(divider.unavailableReason).toBe(NO_MEASUREMENT_DATA);
    expect(divider.series[0].points).toEqual([]);
  });

  it("changing the circuit changes graph points", () => {
    const first = solveCircuit(voltageDivider12V());
    const nextCircuit = voltageDivider12V();
    const r2 = nextCircuit.components.find((c) => c.id === "R2")!;
    r2.properties = { resistance: 2000 };
    const second = solveCircuit(nextCircuit);

    const v1 = getGraphById(first.graphs!, "voltage_divider")!.series[0].points[0];
    const v2 = getGraphById(second.graphs!, "voltage_divider")!.series[0].points[0];
    expect(v1.x).toBeCloseTo(4000, 6);
    expect(v1.y).toBeCloseTo(9.6, 6);
    expect(v2.x).toBeCloseTo(2000, 6);
    expect(v2.y).toBeCloseTo(8, 6);
    expect(v1.y).not.toBeCloseTo(v2.y, 6);
  });

  it("stale graphs are not displayable after a circuit edit", () => {
    const circuit = voltageDivider12V();
    const result = solveCircuit(circuit);
    expect(displayableSimulationResult(result, circuit)?.graphs?.length).toBeGreaterThan(0);

    const edited = voltageDivider12V();
    const r2 = edited.components.find((c) => c.id === "R2")!;
    r2.properties = { resistance: 2000 };
    expect(displayableSimulationResult(result, edited)).toBeNull();
  });

  it("generateAllGraphs invents nothing without measurements", () => {
    expect(
      generateAllGraphs(voltageDivider12V(), {
        success: true,
        nodeVoltages: new Map(),
        componentResults: new Map(),
      } as never),
    ).toEqual([]);
  });

  it("plots RC time series only when the run actually recorded samples", () => {
    const circuit = seriesRC();
    const result = solveCircuit(circuit);
    const withTime = generateGraphsFromMeasurements(
      {
        ...result.measurements!,
        timeSeries: [
          { t: 0, values: { V_C1: 0, P_total: 0 } },
          { t: 0.01, values: { V_C1: 2.5, P_total: 0.001 } },
          { t: 0.02, values: { V_C1: 4, P_total: 0.0004 } },
        ],
      },
      circuit,
    );
    const rc = getGraphById(withTime, "rc_time")!;
    expect(rc.unavailableReason).toBeUndefined();
    expect(rc.series[0].points).toEqual([
      { x: 0, y: 0 },
      { x: 0.01, y: 2.5 },
      { x: 0.02, y: 4 },
    ]);
    const power = getGraphById(withTime, "power_time")!;
    expect(power.series[0].points).toHaveLength(3);
  });
});
