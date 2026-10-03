import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createRcLowPassStarter } from "../../starters/rcLowPass";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import { theoreticalRcCutoffHz } from "../rcLowPassAnalysis";
import { countSeedQuestionsByDifficulty } from "../../../../data/quiz/quizBank";

function peakOf(samples: { t: number; values: Record<string, number> }[], key: string): number {
  let peak = 0;
  for (const sample of samples) {
    const value = sample.values[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      peak = Math.max(peak, Math.abs(value));
    }
  }
  return peak;
}

describe("RC low-pass filter experiment", () => {
  it("starter is a series RC sine filter with Vout across the capacitor", () => {
    const circuit = toEngineCircuit(createRcLowPassStarter());
    const resistor = circuit.components.find((c) => c.id === "R1")!;
    const capacitor = circuit.components.find((c) => c.id === "C1")!;
    const source = circuit.components.find((c) => c.id === "V1")!;
    expect(resistor.properties.resistance).toBe(1000);
    expect(capacitor.properties.capacitance).toBeCloseTo(100e-9, 15);
    expect(source.properties.acMode).toBe(true);
    expect(source.properties.waveform).toBe("sine");
    expect(source.properties.frequency).toBe(500);
    expect(source.properties.amplitude).toBe(5);
    expect(circuit.components.some((c) => c.type === "inductor")).toBe(false);
  });

  it("sweep cutoff tracks 1/(2πRC) and a higher frequency attenuates Vout", () => {
    const circuit = toEngineCircuit(createRcLowPassStarter());
    circuit.experimentId = "rc-low-pass-filter";
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    const lp = result.measurements?.rcLowPass;
    expect(lp).toBeDefined();
    const fc = theoreticalRcCutoffHz(lp!.R, lp!.C);
    expect(lp!.fcTheoretical).toBeCloseTo(fc, 4);
    expect(lp!.fcSimulated).not.toBeNull();
    expect(Math.abs(lp!.fcSimulated! - fc) / fc).toBeLessThan(0.08);
    expect(lp!.gainAtDrive).not.toBeNull();
    expect(lp!.gainAtDrive!).toBeGreaterThan(0.9);

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    expect(graphs.some((graph) => graph.id === "frequency_response_gain")).toBe(true);
    expect(graphs.some((graph) => graph.id === "rc_low_pass_phase")).toBe(true);
    expect(graphs.some((graph) => graph.id === "function_generator_scope")).toBe(true);
    const gain = graphs.find((graph) => graph.id === "frequency_response_gain")!;
    expect(gain.series.some((series) => series.name.startsWith("Simulated"))).toBe(true);
    expect(gain.series.some((series) => series.name.startsWith("Theoretical"))).toBe(true);

    const low = result;
    const highCircuit = toEngineCircuit(createRcLowPassStarter());
    const source = highCircuit.components.find((c) => c.id === "V1")!;
    source.properties.frequency = fc * 8;
    highCircuit.experimentId = "rc-low-pass-filter";
    const high = solveCircuit(highCircuit);
    expect(high.measurements?.rcLowPass?.gainAtDrive).not.toBeNull();
    expect(high.measurements!.rcLowPass!.gainAtDrive!).toBeLessThan(0.2);
    expect(high.measurements!.rcLowPass!.gainAtDrive!).toBeLessThan(low.measurements!.rcLowPass!.gainAtDrive!);

    const lowPeak = peakOf(low.measurements!.timeSeries ?? [], "V_VM1");
    const highPeak = peakOf(high.measurements!.timeSeries ?? [], "V_VM1");
    expect(lowPeak).toBeGreaterThan(1);
    expect(highPeak).toBeLessThan(lowPeak);
  });

  it("changing R moves the simulated cutoff", () => {
    const larger = toEngineCircuit(createRcLowPassStarter());
    const resistor = larger.components.find((c) => c.id === "R1")!;
    resistor.properties.resistance = 4000;
    larger.experimentId = "rc-low-pass-filter";
    const solved = solveCircuit(larger, { transient: false });
    const lp = solved.measurements?.rcLowPass;
    expect(lp).toBeDefined();
    expect(lp!.fcTheoretical).toBeCloseTo(theoreticalRcCutoffHz(4000, 100e-9), 3);
    expect(lp!.fcSimulated).not.toBeNull();
    expect(lp!.fcSimulated!).toBeLessThan(theoreticalRcCutoffHz(1000, 100e-9));
  });

  it("has enough questions in each difficulty for 10, 20, and 40 attempts", () => {
    const counts = countSeedQuestionsByDifficulty("rc-low-pass-filter");
    expect(counts.easy).toBeGreaterThanOrEqual(40);
    expect(counts.medium).toBeGreaterThanOrEqual(40);
    expect(counts.hard).toBeGreaterThanOrEqual(40);
  });
});
