import { describe, expect, it } from "vitest";
import type { CircuitDefinition, Component, ComponentType, Connection } from "../circuitGraph";
import { createTerminalId, type TerminalType } from "../circuitGraph";
import { solveCircuit } from "../circuitSolver";
import { generateGraphsFromMeasurements } from "../graphData";
import {
  buildFrequencyList,
  runFrequencySweep,
} from "../frequencySweepAnalysis";
import { filterPaletteEntries } from "../../paletteCatalog";

function comp(
  id: string,
  type: ComponentType,
  properties: Component["properties"],
  terminals: TerminalType[],
): Component {
  return {
    id,
    type,
    label: id,
    position: { x: 0, y: 0 },
    rotation: 0,
    properties,
    terminals: terminals.map((t) => ({
      id: createTerminalId(id, t),
      type: t,
      componentId: id,
    })),
  };
}

function wire(id: string, from: string, to: string): Connection {
  return { id, from, to };
}

const T = createTerminalId;

/** Series RLC driven by sine AC source (infrastructure fixture — not Exp 20). */
function seriesRlcAc(R: number, L: number, C: number, amp: number): CircuitDefinition {
  return {
    components: [
      comp(
        "V1",
        "voltage_source",
        {
          voltage: amp,
          amplitude: amp,
          frequency: 1000,
          phase: 0,
          waveform: "sine",
          acMode: true,
        },
        ["positive", "negative"],
      ),
      comp("R1", "resistor", { resistance: R }, ["A", "B"]),
      comp("L1", "inductor", { inductance: L }, ["A", "B"]),
      comp("C1", "capacitor", { capacitance: C }, ["A", "B"]),
      comp("GND1", "ground", {}, ["ground"]),
      comp("VM1", "voltmeter", {}, ["positive", "negative"]),
    ],
    connections: [
      wire("W1", T("V1", "positive"), T("R1", "A")),
      wire("W2", T("R1", "B"), T("L1", "A")),
      wire("W3", T("L1", "B"), T("C1", "A")),
      wire("W4", T("C1", "B"), T("GND1", "ground")),
      wire("W5", T("V1", "negative"), T("GND1", "ground")),
      wire("W6", T("VM1", "positive"), T("C1", "A")),
      wire("W7", T("VM1", "negative"), T("GND1", "ground")),
    ],
  };
}

describe("frequency list / step resolution", () => {
  it("builds a linear step list from frequency-step", () => {
    const freqs = buildFrequencyList({ fStart: 100, fStop: 500, step: 100 });
    expect(freqs).toEqual([100, 200, 300, 400, 500]);
  });

  it("builds a log-spaced point list", () => {
    const freqs = buildFrequencyList({
      fStart: 100,
      fStop: 10000,
      points: 5,
      scale: "log",
    });
    expect(freqs).toHaveLength(5);
    expect(freqs[0]).toBeCloseTo(100, 6);
    expect(freqs[4]).toBeCloseTo(10000, 3);
  });
});

describe("frequency sweep from circuit model (no hard-coded resonance)", () => {
  it("peaks |I| near 1/(2π√LC) derived from the circuit L and C", () => {
    const R = 50;
    const L = 100e-3;
    const C = 10e-6;
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const circuit = seriesRlcAc(R, L, C, 5);

    const sweep = runFrequencySweep(circuit, {
      fStart: f0 / 5,
      fStop: f0 * 5,
      points: 61,
      scale: "log",
    });
    expect(sweep).not.toBeNull();
    expect(sweep!.response.length).toBeGreaterThanOrEqual(20);
    expect(sweep!.peakCurrentFrequency).not.toBeNull();

    // Peak must land near model f0 (within ~8% — log bin resolution, not a constant).
    const relErr = Math.abs(sweep!.peakCurrentFrequency! - f0) / f0;
    expect(relErr).toBeLessThan(0.08);
  });

  it("moves the |I| peak when L changes (proves no fixed resonance curve)", () => {
    const R = 50;
    const C = 10e-6;
    const L1 = 100e-3;
    const L2 = 400e-3;
    const f1 = 1 / (2 * Math.PI * Math.sqrt(L1 * C));
    const f2 = 1 / (2 * Math.PI * Math.sqrt(L2 * C));

    const s1 = runFrequencySweep(seriesRlcAc(R, L1, C, 5), {
      fStart: Math.min(f1, f2) / 5,
      fStop: Math.max(f1, f2) * 5,
      points: 81,
      scale: "log",
    })!;
    const s2 = runFrequencySweep(seriesRlcAc(R, L2, C, 5), {
      fStart: Math.min(f1, f2) / 5,
      fStop: Math.max(f1, f2) * 5,
      points: 81,
      scale: "log",
    })!;

    expect(s1.peakCurrentFrequency!).toBeGreaterThan(s2.peakCurrentFrequency! * 1.5);
    expect(Math.abs(s1.peakCurrentFrequency! - f1) / f1).toBeLessThan(0.1);
    expect(Math.abs(s2.peakCurrentFrequency! - f2) / f2).toBeLessThan(0.1);
  });

  it("solveCircuit attaches frequencySweep measurements and graphs", () => {
    const L = 100e-3;
    const C = 10e-6;
    const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const circuit = seriesRlcAc(50, L, C, 5);

    const result = solveCircuit(circuit, {
      frequencySweep: {
        fStart: f0 / 4,
        fStop: f0 * 4,
        points: 31,
        scale: "log",
      },
      transient: false,
    });
    expect(result.status).toBe("completed");
    expect(result.measurements?.frequencySweep).toBeDefined();
    expect(result.measurements!.frequencySweep!.response.length).toBeGreaterThanOrEqual(10);

    const graphs = generateGraphsFromMeasurements(result.measurements!, circuit);
    const fr = graphs.find((g) => g.id === "frequency_response");
    expect(fr).toBeDefined();
    expect(fr!.series[0].points.length).toBeGreaterThanOrEqual(10);
    expect(fr!.metadata?.source).toBe("ac_frequency_sweep");
  });
});

describe("component search recognizes AC / function generator terms", () => {
  it.each(["AC", "source", "function generator", "sine", "generator"])(
    "finds Function Generator for %s",
    (q) => {
      const hits = filterPaletteEntries(q);
      expect(hits.some((h) => h.id === "function_generator")).toBe(true);
    },
  );
});
