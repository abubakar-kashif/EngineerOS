import { describe, expect, it } from "vitest";
import { toEngineCircuit } from "../../editorAdapters";
import { createPotentiometerStarter } from "../../starters/potentiometer";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import {
  extractPotentiometerMetrics,
  potentiometerWiperSweep,
} from "../potentiometerAnalysis";
import { potentiometerArmResistances } from "../netlist";
import { solveDC } from "../dcSolver";
import { voltageDivider12V } from "./circuitFixtures";

describe("Potentiometer starter + DC solve", () => {
  it("preloads Vin=10 V, Rpot=10 kΩ, α=0.5 with Vout ≈ 5 V", () => {
    const editor = createPotentiometerStarter();
    expect(editor.components.map((c) => c.id).sort()).toEqual(
      ["GND1", "POT1", "V1", "VM1"].sort(),
    );

    const pot = editor.components.find((c) => c.id === "POT1")!;
    expect(pot.type).toBe("potentiometer");
    expect(pot.properties.resistance).toBe(10000);
    expect(pot.properties.wiperPosition).toBe(0.5);

    const circuit = toEngineCircuit(editor);
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.dcResult?.success).toBe(true);

    const metrics = extractPotentiometerMetrics(circuit, result.dcResult!);
    expect(metrics).not.toBeNull();
    expect(metrics!.vin).toBeCloseTo(10, 6);
    expect(metrics!.rpot).toBeCloseTo(10000, 6);
    expect(metrics!.wiperPosition).toBeCloseTo(0.5, 6);
    expect(metrics!.theoreticalVout).toBeCloseTo(5, 6);
    expect(metrics!.vout).toBeCloseTo(5, 2);
  });

  it("tracks Vout = α·Vin at several wiper positions", () => {
    const editor = createPotentiometerStarter();
    for (const alpha of [0.25, 0.75, 1]) {
      const pot = editor.components.find((c) => c.id === "POT1")!;
      pot.properties.wiperPosition = alpha;
      const circuit = toEngineCircuit(editor);
      const dc = solveDC(circuit);
      expect(dc.success).toBe(true);
      const metrics = extractPotentiometerMetrics(circuit, dc);
      expect(metrics).not.toBeNull();
      expect(metrics!.vout).toBeCloseTo(alpha * 10, 2);
      expect(metrics!.theoreticalVout).toBeCloseTo(alpha * 10, 6);
    }
  });

  it("keeps unloaded Vout ≈ α·Vin when Rpot changes", () => {
    const editor = createPotentiometerStarter();
    const pot = editor.components.find((c) => c.id === "POT1")!;
    pot.properties.resistance = 5000;
    pot.properties.wiperPosition = 0.5;

    const circuit = toEngineCircuit(editor);
    const metrics = extractPotentiometerMetrics(circuit, solveDC(circuit));
    expect(metrics).not.toBeNull();
    expect(metrics!.vout).toBeCloseTo(5, 2);
  });

  it("emits a real wiper-position vs Vout sweep graph", () => {
    const circuit = toEngineCircuit(createPotentiometerStarter());
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    expect(graphs.some((g) => g.id === "potentiometer_wiper")).toBe(true);

    const sweepGraph = graphs.find((g) => g.id === "potentiometer_wiper")!;
    expect(sweepGraph.series[0].points.length).toBeGreaterThanOrEqual(2);
    expect(sweepGraph.series[0].points[0].x).toBeCloseTo(0, 6);
    expect(sweepGraph.series[0].points.at(-1)!.x).toBeCloseTo(1, 6);

    const sweep = potentiometerWiperSweep(circuit, "POT1", 5);
    expect(sweep).toHaveLength(5);
    expect(sweep[2].vout).toBeCloseTo(5, 2);
  });

  it("models arms as R_Aw=(1−α)R and R_WB=αR", () => {
    const { rAw, rWb, alpha } = potentiometerArmResistances(10000, 0.25);
    expect(alpha).toBeCloseTo(0.25, 9);
    expect(rWb).toBeCloseTo(2500, 6);
    expect(rAw).toBeCloseTo(7500, 6);
  });
});

describe("Voltage divider baseline (extended by potentiometer)", () => {
  it("still solves the classic 12 V / 1 kΩ / 4 kΩ divider", () => {
    const circuit = voltageDivider12V();
    const result = solveCircuit(circuit);
    expect(result.status).toBe("completed");
    expect(result.dcResult?.success).toBe(true);
    expect(result.dcResult!.totalCurrent).toBeCloseTo(0.0024, 6);

    const r2 = result.dcResult!.componentResults.get("R2");
    expect(r2?.voltage).toBeCloseTo(9.6, 6);

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    expect(graphs.some((g) => g.id === "voltage_divider")).toBe(true);
  });
});
