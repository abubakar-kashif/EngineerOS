import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createHalfWaveRectifierStarter } from "../../starters/halfWaveRectifier";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import { QUIZ_BANK } from "../../../../data/quiz/quizBank";

describe("Half-wave rectifier experiment", () => {
  it("starter is AC sine + diode + 1 kΩ load", () => {
    const circuit = toEngineCircuit(createHalfWaveRectifierStarter());
    const vs = circuit.components.find((c) => c.id === "V1")!;
    const d = circuit.components.find((c) => c.id === "D1")!;
    const rl = circuit.components.find((c) => c.id === "RL")!;
    expect(vs.properties.acMode).toBe(true);
    expect(vs.properties.frequency).toBe(50);
    expect(vs.properties.amplitude).toBe(10);
    expect(d.properties.forwardVoltage).toBe(0.7);
    expect(rl.properties.resistance).toBe(1000);
  });

  it("produces a real half-wave from diode switching (not a fake math curve)", () => {
    const circuit = toEngineCircuit(createHalfWaveRectifierStarter());
    circuit.experimentId = "half-wave-rectifier";
    const result = solveCircuit(circuit, { frequencySweep: false });
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries?.length).toBeGreaterThan(50);

    const hw = result.measurements!.halfWaveRectifier!;
    expect(hw).toBeDefined();
    expect(hw.VinPeak).toBeGreaterThan(9);
    // Peak out ≈ VinPeak − Vf ≈ 9.3 V
    expect(hw.VoutPeak).toBeGreaterThan(8.5);
    expect(hw.VoutPeak).toBeLessThan(hw.VinPeak);
    expect(hw.averageOutput).toBeGreaterThan(2);
    expect(hw.averageOutput).toBeLessThan(hw.VoutPeak);
    expect(hw.inputFrequency).toBeCloseTo(50, 0);
    // Half-wave pulse rate ≈ line frequency
    expect(hw.rippleFrequency).not.toBeNull();
    expect(Math.abs(hw.rippleFrequency! - 50) / 50).toBeLessThan(0.15);

    // Negative half: output near zero while input goes negative
    const series = result.measurements!.timeSeries!;
    let sawBlocked = false;
    for (const s of series) {
      const vin = s.values.V_V1 ?? s.values.vin ?? 0;
      const vout = s.values.V_VM_out ?? s.values.vout ?? 0;
      if (vin < -2 && vout < 0.5) {
        sawBlocked = true;
        break;
      }
    }
    expect(sawBlocked).toBe(true);

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const scope = graphs.find((g) => g.id === "half_wave_rectifier_scope");
    expect(scope).toBeDefined();
    expect(scope!.series).toHaveLength(2);
    expect(scope!.series[0].name).toMatch(/Channel A/i);
    expect(scope!.series[1].name).toMatch(/Channel B/i);
  });

  it("has at least 40 quiz questions", () => {
    expect((QUIZ_BANK["half-wave-rectifier"] ?? []).length).toBeGreaterThanOrEqual(40);
  });
});
