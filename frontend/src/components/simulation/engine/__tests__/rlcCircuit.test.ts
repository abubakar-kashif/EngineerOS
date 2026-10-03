/**
 * Phase 10 — series RLC second-order transient.
 */
import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createRlcCircuitStarter } from "../../starters/rlcCircuit";
import { solveCircuit } from "../circuitSolver";
import { getGraphById } from "../graphData";
import { extractRlcCircuitMetrics } from "../rlcCircuitAnalysis";

function loadRlc() {
  const circuit = toEngineCircuit(createRlcCircuitStarter());
  circuit.experimentId = "rlc-circuit";
  return circuit;
}

describe("RLC series transient experiment", () => {
  it("starter uses suggested R=100 Ω, L=100 mH, C=10 µF, Vin=5 V", () => {
    const circuit = toEngineCircuit(createRlcCircuitStarter());
    expect(circuit.components.find((c) => c.id === "V1")!.properties.voltage).toBe(5);
    expect(circuit.components.find((c) => c.id === "R1")!.properties.resistance).toBe(100);
    expect(circuit.components.find((c) => c.id === "L1")!.properties.inductance).toBeCloseTo(
      0.1,
      12,
    );
    expect(circuit.components.find((c) => c.id === "C1")!.properties.capacitance).toBeCloseTo(
      10e-6,
      12,
    );
  });

  it("produces a meaningful second-order current and Vc waveform", () => {
    const result = solveCircuit(loadRlc());
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries?.length).toBeGreaterThan(50);

    const rlc = result.measurements!.rlc!;
    expect(rlc.R).toBe(100);
    expect(rlc.L).toBeCloseTo(0.1, 12);
    expect(rlc.C).toBeCloseTo(10e-6, 12);
    expect(rlc.Vin).toBe(5);
    expect(rlc.sampleCount).toBeGreaterThan(50);
    expect(rlc.iPeak).toBeGreaterThan(0);
    expect(rlc.vcPeak).toBeGreaterThan(0);
    // Underdamped starter should show current reversals.
    expect(rlc.zeroCrossings).toBeGreaterThan(1);
    // Settled: capacitor near Vin, current near 0.
    expect(Math.abs(rlc.Vc - 5)).toBeLessThan(0.5);
    expect(Math.abs(rlc.i)).toBeLessThan(0.01);
  });

  it("emits Current vs Time and Capacitor Voltage vs Time from real samples", () => {
    const result = solveCircuit(loadRlc());
    const iGraph = getGraphById(result.graphs!, "rlc_current_time");
    const vcGraph = getGraphById(result.graphs!, "rlc_capacitor_voltage_time");
    expect(iGraph).toBeDefined();
    expect(vcGraph).toBeDefined();
    expect(iGraph!.series[0].points.length).toBeGreaterThan(20);
    expect(vcGraph!.series[0].points.length).toBeGreaterThan(20);
    expect(getGraphById(result.graphs!, "rc_time")).toBeUndefined();
    expect(getGraphById(result.graphs!, "rl_current_time")).toBeUndefined();
  });

  it("report metrics are only from the solve (no fabricated Q/bandwidth)", () => {
    const circuit = loadRlc();
    const result = solveCircuit(circuit);
    const metrics = extractRlcCircuitMetrics(circuit, result.measurements, {
      duration: (result.metadata?.transient as { duration?: number })?.duration,
      timeStep: (result.metadata?.transient as { timeStep?: number })?.timeStep,
    });
    expect(metrics).not.toBeNull();
    expect(metrics).not.toHaveProperty("Q");
    expect(metrics).not.toHaveProperty("bandwidth");
    expect(metrics).not.toHaveProperty("dampingRatio");
    expect(metrics!.energyL).toBeGreaterThanOrEqual(0);
    expect(metrics!.energyC).toBeGreaterThanOrEqual(0);
    expect(result.metadata?.rlc).toMatchObject({
      R: 100,
      sampleCount: expect.any(Number),
      zeroCrossings: expect.any(Number),
    });
  });
});
