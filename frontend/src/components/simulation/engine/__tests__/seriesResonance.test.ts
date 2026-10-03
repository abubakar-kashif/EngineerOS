import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createSeriesResonanceStarter } from "../../starters/seriesResonance";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import {
  extractSeriesResonanceMetrics,
  theoreticalSeriesResonanceHz,
} from "../seriesResonanceAnalysis";
import { QUIZ_BANK } from "../../../../data/quiz/quizBank";

describe("Series resonance experiment", () => {
  it("starter uses R=100, L=100mH, C=10µF AC drive", () => {
    const circuit = toEngineCircuit(createSeriesResonanceStarter());
    const R = circuit.components.find((c) => c.id === "R1")!.properties.resistance;
    const L = circuit.components.find((c) => c.id === "L1")!.properties.inductance;
    const C = circuit.components.find((c) => c.id === "C1")!.properties.capacitance;
    const vs = circuit.components.find((c) => c.id === "V1")!;
    expect(R).toBe(100);
    expect(L).toBeCloseTo(0.1, 9);
    expect(C).toBeCloseTo(10e-6, 12);
    expect(vs.properties.acMode).toBe(true);
    expect(vs.properties.waveform).toBe("sine");
    expect(typeof vs.properties.frequency).toBe("number");
    expect(vs.properties.amplitude).toBe(5);
  });

  it("solveCircuit attaches seriesResonance metrics and Frequency vs Circuit Current graph", () => {
    const circuit = toEngineCircuit(createSeriesResonanceStarter());
    circuit.experimentId = "series-resonance";
    const result = solveCircuit(circuit, { transient: false });
    expect(result.status).toBe("completed");
    expect(result.measurements?.frequencySweep).toBeDefined();
    expect(result.measurements?.seriesResonance).toBeDefined();

    const sr = result.measurements!.seriesResonance!;
    const f0 = theoreticalSeriesResonanceHz(sr.L, sr.C);
    expect(sr.f0Theoretical).toBeCloseTo(f0, 4);
    expect(sr.f0Simulated).not.toBeNull();
    expect(Math.abs(sr.f0Simulated! - f0) / f0).toBeLessThan(0.08);
    expect(sr.errorPercent).not.toBeNull();
    expect(sr.errorPercent!).toBeLessThan(8);

    // With Q≈1 and 81-point log sweep, half-power flanks should resolve.
    expect(sr.bandwidth).not.toBeNull();
    expect(sr.Q).not.toBeNull();
    expect(sr.Q!).toBeGreaterThan(0.5);
    expect(sr.Q!).toBeLessThan(2);

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const fr = graphs.find((g) => g.id === "frequency_response");
    expect(fr).toBeDefined();
    expect(fr!.title).toBe("Frequency vs Circuit Current");
    expect(fr!.series[0].points.length).toBeGreaterThanOrEqual(20);
    expect(fr!.metadata?.f0Theoretical).toBeCloseTo(f0, 2);
  });

  it("moves simulated f0 when L changes (no hard-coded resonance)", () => {
    const editor = createSeriesResonanceStarter();
    const circuit = toEngineCircuit(editor);
    circuit.experimentId = "series-resonance";
    const base = extractSeriesResonanceMetrics(circuit)!;

    const L2 = 0.4;
    const variant = {
      ...circuit,
      components: circuit.components.map((c) =>
        c.id === "L1" ? { ...c, properties: { ...c.properties, inductance: L2 } } : c,
      ),
    };
    const moved = extractSeriesResonanceMetrics(variant)!;
    expect(moved.f0Simulated!).toBeLessThan(base.f0Simulated! * 0.7);
    expect(moved.f0Theoretical).toBeCloseTo(theoreticalSeriesResonanceHz(L2, moved.C), 4);
  });

  it("has at least 40 quiz questions", () => {
    expect((QUIZ_BANK["series-resonance"] ?? []).length).toBeGreaterThanOrEqual(40);
  });
});
