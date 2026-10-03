/**
 * Phase 7 — transient simulation infrastructure.
 * Real BE companion solves only; no synthetic charging curves.
 */
import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createRcCircuitStarter } from "../../starters/rcCircuit";
import { chargingVoltage } from "../capacitorAnalysis";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements, getGraphById } from "../graphData";
import {
  inferTransientOptions,
  solveTransient,
} from "../transientSolver";
import { seriesRC } from "./circuitFixtures";

function vcAt(series: { t: number; values: Record<string, number> }[], t: number): number {
  let best = series[0];
  let bestDt = Math.abs(series[0].t - t);
  for (const s of series) {
    const d = Math.abs(s.t - t);
    if (d < bestDt) {
      best = s;
      bestDt = d;
    }
  }
  return best.values.V_C1 ?? best.values.vc ?? best.values.capacitorVoltage ?? NaN;
}

describe("transientSolver — RC infrastructure", () => {
  it("charges series RC from Vc(0)=0 toward Vs without inventing samples", () => {
    const circuit = seriesRC();
    const R = 10_000;
    const C = 1e-6;
    const Vs = 5;
    const tau = R * C;
    const result = solveTransient(circuit, {
      duration: 5 * tau,
      timeStep: tau / 50,
      capacitorVoltage: { C1: 0 },
    });

    expect(result.success).toBe(true);
    expect(result.timeSeries.length).toBeGreaterThan(10);
    expect(result.timeSeries[0].t).toBe(0);
    expect(result.timeSeries[0].values.V_C1).toBeCloseTo(0, 6);

    const atTau = vcAt(result.timeSeries, tau);
    const analytic = chargingVoltage(Vs, R, C, tau);
    expect(atTau).toBeCloseTo(analytic, 1);

    const last = result.timeSeries[result.timeSeries.length - 1];
    expect(last.values.V_C1).toBeGreaterThan(0.95 * Vs);
    expect(last.values.V_C1).toBeLessThanOrEqual(Vs * 1.02);
  });

  it("honors capacitor initial conditions (precharged stays near Vs)", () => {
    const circuit = seriesRC();
    const result = solveTransient(circuit, {
      duration: 0.05,
      timeStep: 0.001,
      capacitorVoltage: { C1: 5 },
    });
    expect(result.success).toBe(true);
    for (const sample of result.timeSeries) {
      expect(sample.values.V_C1).toBeCloseTo(5, 2);
    }
  });

  it("discharges when source is 0 V and capacitor starts charged", () => {
    const circuit = seriesRC();
    const v1 = circuit.components.find((c) => c.id === "V1")!;
    v1.properties = { voltage: 0 };
    const R = 10_000;
    const C = 1e-6;
    const tau = R * C;
    const result = solveTransient(circuit, {
      duration: 5 * tau,
      timeStep: tau / 50,
      capacitorVoltage: { C1: 5 },
    });
    expect(result.success).toBe(true);
    expect(result.timeSeries[0].values.V_C1).toBeCloseTo(5, 6);
    const atTau = vcAt(result.timeSeries, tau);
    expect(atTau).toBeCloseTo(5 * Math.exp(-1), 1);
    const last = result.timeSeries[result.timeSeries.length - 1];
    expect(last.values.V_C1).toBeLessThan(0.1);
  });

  it("remains numerically stable (finite, monotonic charging)", () => {
    const circuit = seriesRC();
    const tau = 0.01;
    const result = solveTransient(circuit, {
      duration: 5 * tau,
      timeStep: tau / 20,
    });
    expect(result.success).toBe(true);
    let prev = -Infinity;
    for (const sample of result.timeSeries) {
      const v = sample.values.V_C1!;
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(-1e-9);
      expect(v).toBeLessThanOrEqual(5.05);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it("smaller time step yields denser series and closer analytic match", () => {
    const circuit = seriesRC();
    const R = 10_000;
    const C = 1e-6;
    const Vs = 5;
    const tau = R * C;
    const tProbe = tau;
    const analytic = chargingVoltage(Vs, R, C, tProbe);

    const coarse = solveTransient(circuit, {
      duration: 3 * tau,
      timeStep: tau / 10,
    });
    const fine = solveTransient(circuit, {
      duration: 3 * tau,
      timeStep: tau / 100,
    });
    expect(coarse.success && fine.success).toBe(true);
    expect(fine.timeSeries.length).toBeGreaterThan(coarse.timeSeries.length);

    const errCoarse = Math.abs(vcAt(coarse.timeSeries, tProbe) - analytic);
    const errFine = Math.abs(vcAt(fine.timeSeries, tProbe) - analytic);
    expect(errFine).toBeLessThan(errCoarse);
  });

  it("inferTransientOptions scales duration and Δt from RC", () => {
    const opts = inferTransientOptions(seriesRC());
    expect(opts).not.toBeNull();
    expect(opts!.duration).toBeCloseTo(0.05, 6);
    expect(opts!.timeStep).toBeGreaterThan(0);
    expect(opts!.timeStep).toBeLessThanOrEqual(opts!.duration);
  });

  it("solveCircuit DC path stays silent for seriesRC without opt-in", () => {
    const result = solveCircuit(seriesRC());
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries).toBeUndefined();
  });

  it("solveCircuit with transient:true attaches real timeSeries + graphs", () => {
    const result = solveCircuit(seriesRC(), { transient: true });
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries?.length).toBeGreaterThan(10);
    const graphs = generateGraphsFromMeasurements(result.measurements!, seriesRC());
    const rc = getGraphById(graphs, "rc_time");
    expect(rc).toBeDefined();
    expect(rc!.series[0].points.length).toBeGreaterThan(10);
    expect(rc!.series[0].points[0]).toEqual({ x: 0, y: 0 });
    expect(getGraphById(graphs, "power_time")).toBeDefined();
  });

  it("rc-circuit experiment auto-runs transient and matches catalog τ=RC", () => {
    const circuit = toEngineCircuit(createRcCircuitStarter());
    circuit.experimentId = "rc-circuit";
    const R = 10_000;
    const C = 100e-6;
    const Vs = 9;
    const tau = R * C;

    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries?.length).toBeGreaterThan(10);
    expect(result.metadata?.transient).toMatchObject({
      requested: true,
      success: true,
    });

    const series = result.measurements!.timeSeries!;
    const atTau = vcAt(series, tau);
    expect(atTau).toBeCloseTo(Vs * (1 - Math.exp(-1)), 0);

    const graphs = result.graphs!;
    expect(getGraphById(graphs, "rc_time")).toBeDefined();
    expect(getGraphById(graphs, "power_time")).toBeDefined();
  });
});
