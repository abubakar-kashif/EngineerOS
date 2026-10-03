/**
 * Phase 9 — RL transient response experiment.
 */
import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createRlCircuitStarter } from "../../starters/rlCircuit";
import { chargingCurrentRL } from "../inductorAnalysis";
import { solveCircuit } from "../circuitSolver";
import { getGraphById } from "../graphData";
import {
  detectRlMode,
  extractRlCircuitMetrics,
  prepareRlTransientCircuit,
} from "../rlCircuitAnalysis";

function loadRl(mode: "energizing" | "deenergizing" = "energizing") {
  const circuit = toEngineCircuit(createRlCircuitStarter());
  circuit.experimentId = "rl-circuit";
  if (mode === "deenergizing") {
    const sw = circuit.components.find((c) => c.type === "switch")!;
    sw.properties = { ...sw.properties, state: "open" };
  }
  return circuit;
}

function iLAt(
  series: { t: number; values: Record<string, number> }[],
  t: number,
): number {
  let best = series[0];
  let bestDt = Math.abs(series[0].t - t);
  for (const s of series) {
    const d = Math.abs(s.t - t);
    if (d < bestDt) {
      best = s;
      bestDt = d;
    }
  }
  return best.values.I_L1 ?? NaN;
}

describe("RL transient experiment", () => {
  it("starter uses recommended Vin=5 V, R=100 Ω, L=100 mH", () => {
    const circuit = toEngineCircuit(createRlCircuitStarter());
    expect(circuit.components.find((c) => c.id === "V1")!.properties.voltage).toBe(5);
    expect(circuit.components.find((c) => c.id === "R1")!.properties.resistance).toBe(100);
    expect(circuit.components.find((c) => c.id === "L1")!.properties.inductance).toBeCloseTo(
      0.1,
      12,
    );
    expect(circuit.components.some((c) => c.type === "switch")).toBe(true);
    expect(circuit.components.some((c) => c.type === "ammeter")).toBe(true);
    expect(circuit.components.some((c) => c.type === "voltmeter")).toBe(true);
  });

  it("energizes with actual iL growth and τ ≈ L/R", () => {
    const circuit = loadRl("energizing");
    expect(detectRlMode(circuit)).toBe("energizing");

    const R = 100;
    const L = 0.1;
    const Vin = 5;
    const tau = L / R;

    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.measurements?.timeSeries?.length).toBeGreaterThan(20);

    const rl = result.measurements!.rl!;
    expect(rl.mode).toBe("energizing");
    expect(rl.R).toBe(100);
    expect(rl.L).toBeCloseTo(0.1, 12);
    expect(rl.Vin).toBe(5);
    expect(rl.tauTheoretical).toBeCloseTo(0.001, 9);
    expect(rl.tauSimulated).not.toBeNull();
    expect(rl.tauSimulated!).toBeCloseTo(0.001, 2);
    expect(rl.tauErrorPercent!).toBeLessThan(20);
    expect(rl.Ifinal).toBeCloseTo(0.05, 6);
    expect(rl.iL).toBeGreaterThan(0.95 * 0.05);

    const atTau = iLAt(result.measurements!.timeSeries!, tau);
    expect(atTau).toBeCloseTo(chargingCurrentRL(Vin, R, L, tau), 2);
  });

  it("de-energizes when SW1 is open (I0 defaults to Vin/R)", () => {
    const circuit = loadRl("deenergizing");
    expect(detectRlMode(circuit)).toBe("deenergizing");
    const prepared = prepareRlTransientCircuit(circuit);
    expect(prepared.I0).toBeCloseTo(0.05, 9);

    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    const rl = result.measurements!.rl!;
    expect(rl.mode).toBe("deenergizing");
    expect(result.measurements!.timeSeries![0].values.I_L1).toBeCloseTo(0.05, 2);
    expect(rl.iL).toBeLessThan(0.01);
    expect(rl.tauSimulated).not.toBeNull();
    expect(rl.tauSimulated!).toBeCloseTo(0.001, 2);
  });

  it("emits Time vs Inductor Current and Time vs Resistor Voltage", () => {
    const result = solveCircuit(loadRl("energizing"));
    const il = getGraphById(result.graphs!, "rl_current_time");
    const vr = getGraphById(result.graphs!, "rl_resistor_voltage_time");
    expect(il).toBeDefined();
    expect(vr).toBeDefined();
    expect(il!.series[0].points.length).toBeGreaterThan(10);
    expect(vr!.series[0].points.length).toBeGreaterThan(10);
    expect(il!.metadata?.tauTheoretical).toBeCloseTo(0.001, 9);
    expect(vr!.series[0].points[0].y).toBeLessThan(1);
    expect(vr!.series[0].points.at(-1)!.y).toBeCloseTo(5, 1);
  });

  it("reports theoretical vs simulated τ, final current, and error", () => {
    const circuit = loadRl("energizing");
    const result = solveCircuit(circuit);
    const metrics = extractRlCircuitMetrics(circuit, result.measurements);
    expect(metrics).not.toBeNull();
    expect(metrics!.tauTheoretical).toBeCloseTo(metrics!.L / metrics!.R, 12);
    expect(metrics!.Ifinal).toBeCloseTo(0.05, 6);
    expect(metrics!.tauErrorPercent).not.toBeNull();
    expect(result.metadata?.rl).toMatchObject({
      mode: "energizing",
      tauTheoretical: expect.any(Number),
      tauSimulated: expect.any(Number),
      Ifinal: expect.any(Number),
    });
  });
});
