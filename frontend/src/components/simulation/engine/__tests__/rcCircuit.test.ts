/**
 * Phase 8 — capacitor charging and discharging experiment.
 */
import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createRcCircuitStarter } from "../../starters/rcCircuit";
import { solveCircuit } from "../circuitSolver";
import { getGraphById } from "../graphData";
import {
  detectRcMode,
  extractRcCircuitMetrics,
  prepareRcTransientCircuit,
} from "../rcCircuitAnalysis";

function loadRc(mode: "charging" | "discharging" = "charging") {
  const circuit = toEngineCircuit(createRcCircuitStarter());
  circuit.experimentId = "rc-circuit";
  if (mode === "discharging") {
    const sw = circuit.components.find((c) => c.type === "switch")!;
    sw.properties = { ...sw.properties, state: "open", closed: false };
  }
  return circuit;
}

describe("RC charging / discharging experiment", () => {
  it("starter uses recommended Vin=5 V, R=10 kΩ, C=100 µF", () => {
    const circuit = toEngineCircuit(createRcCircuitStarter());
    expect(circuit.components.find((c) => c.id === "V1")!.properties.voltage).toBe(5);
    expect(circuit.components.find((c) => c.id === "R1")!.properties.resistance).toBe(10_000);
    expect(circuit.components.find((c) => c.id === "C1")!.properties.capacitance).toBeCloseTo(
      100e-6,
      12,
    );
    expect(circuit.components.some((c) => c.type === "switch")).toBe(true);
    expect(circuit.components.some((c) => c.type === "ammeter")).toBe(true);
    expect(circuit.components.some((c) => c.type === "voltmeter")).toBe(true);
  });

  it("charges with actual state evolution and τ ≈ RC", () => {
    const circuit = loadRc("charging");
    expect(detectRcMode(circuit)).toBe("charging");

    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries?.length).toBeGreaterThan(20);

    const rc = result.measurements!.rc!;
    expect(rc.mode).toBe("charging");
    expect(rc.R).toBe(10_000);
    expect(rc.C).toBeCloseTo(100e-6, 12);
    expect(rc.Vin).toBe(5);
    expect(rc.tauTheoretical).toBeCloseTo(1, 6);
    expect(rc.tauSimulated).not.toBeNull();
    expect(rc.tauSimulated!).toBeCloseTo(1, 0);
    expect(rc.tauErrorPercent!).toBeLessThan(15);
    expect(rc.Vc).toBeGreaterThan(0.95 * 5);
    expect(Math.abs(rc.Ic0)).toBeGreaterThan(0.0003);
  });

  it("discharges when SW1 is open (V0 defaults to Vin)", () => {
    const circuit = loadRc("discharging");
    expect(detectRcMode(circuit)).toBe("discharging");
    const prepared = prepareRcTransientCircuit(circuit);
    expect(prepared.mode).toBe("discharging");
    expect(prepared.V0).toBe(5);
    expect(
      prepared.circuit.components.find((c) => c.type === "voltage_source")!.properties.voltage,
    ).toBe(0);

    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    const rc = result.measurements!.rc!;
    expect(rc.mode).toBe("discharging");
    expect(rc.V0).toBe(5);
    expect(result.measurements!.timeSeries![0].values.V_C1).toBeCloseTo(5, 2);
    expect(rc.Vc).toBeLessThan(0.5);
    expect(rc.tauSimulated).not.toBeNull();
    expect(rc.tauSimulated!).toBeCloseTo(1, 0);
  });

  it("emits mandatory Time vs Vc and Time vs Ic graphs from real samples", () => {
    const result = solveCircuit(loadRc("charging"));
    const vc = getGraphById(result.graphs!, "rc_time");
    const ic = getGraphById(result.graphs!, "rc_current_time");
    expect(vc).toBeDefined();
    expect(ic).toBeDefined();
    expect(vc!.title).toMatch(/Time vs Vc/i);
    expect(ic!.title).toMatch(/Time vs Ic/i);
    expect(vc!.series[0].points.length).toBeGreaterThan(10);
    expect(ic!.series[0].points.length).toBeGreaterThan(10);
    expect(vc!.metadata?.tauTheoretical).toBeCloseTo(1, 6);
    expect(vc!.metadata?.tauSimulated).toEqual(expect.any(Number));
  });

  it("reports theoretical vs simulated time constant for the lab report", () => {
    const circuit = loadRc("charging");
    const result = solveCircuit(circuit);
    const metrics = extractRcCircuitMetrics(circuit, result.measurements);
    expect(metrics).not.toBeNull();
    expect(metrics!.tauTheoretical).toBeCloseTo(metrics!.R * metrics!.C, 12);
    expect(metrics!.tauErrorPercent).not.toBeNull();
    expect(result.metadata?.rc).toMatchObject({
      mode: "charging",
      tauTheoretical: expect.any(Number),
      tauSimulated: expect.any(Number),
    });
  });
});
