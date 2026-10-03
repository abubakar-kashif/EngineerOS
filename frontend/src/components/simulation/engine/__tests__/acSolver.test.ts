import { describe, expect, it } from "vitest";
import type { CircuitDefinition, Component, ComponentType, Connection } from "../circuitGraph";
import { createTerminalId, type TerminalType } from "../circuitGraph";
import { solveAC } from "../acSolver";
import { capacitiveReactance } from "../capacitorAnalysis";
import { inductiveReactance } from "../inductorAnalysis";

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

/** Series AC: Vs — R — (C or L) — GND, Vs− to GND. */
function seriesRcAc(R: number, C: number, amp: number, f: number): CircuitDefinition {
  return {
    components: [
      comp(
        "V1",
        "voltage_source",
        { voltage: amp, amplitude: amp, frequency: f, phase: 0, waveform: "sine", acMode: true },
        ["positive", "negative"],
      ),
      comp("R1", "resistor", { resistance: R }, ["A", "B"]),
      comp("C1", "capacitor", { capacitance: C }, ["A", "B"]),
      comp("GND1", "ground", {}, ["ground"]),
    ],
    connections: [
      wire("W1", T("V1", "positive"), T("R1", "A")),
      wire("W2", T("R1", "B"), T("C1", "A")),
      wire("W3", T("C1", "B"), T("GND1", "ground")),
      wire("W4", T("V1", "negative"), T("GND1", "ground")),
    ],
  };
}

function seriesRlAc(R: number, L: number, amp: number, f: number): CircuitDefinition {
  return {
    components: [
      comp(
        "V1",
        "voltage_source",
        { voltage: amp, amplitude: amp, frequency: f, waveform: "sine" },
        ["positive", "negative"],
      ),
      comp("R1", "resistor", { resistance: R }, ["A", "B"]),
      comp("L1", "inductor", { inductance: L }, ["A", "B"]),
      comp("GND1", "ground", {}, ["ground"]),
    ],
    connections: [
      wire("W1", T("V1", "positive"), T("R1", "A")),
      wire("W2", T("R1", "B"), T("L1", "A")),
      wire("W3", T("L1", "B"), T("GND1", "ground")),
      wire("W4", T("V1", "negative"), T("GND1", "ground")),
    ],
  };
}

function pureR(R: number, amp: number, f: number): CircuitDefinition {
  return {
    components: [
      comp(
        "V1",
        "voltage_source",
        { voltage: amp, amplitude: amp, frequency: f, waveform: "sine" },
        ["positive", "negative"],
      ),
      comp("R1", "resistor", { resistance: R }, ["A", "B"]),
      comp("GND1", "ground", {}, ["ground"]),
    ],
    connections: [
      wire("W1", T("V1", "positive"), T("R1", "A")),
      wire("W2", T("R1", "B"), T("GND1", "ground")),
      wire("W3", T("V1", "negative"), T("GND1", "ground")),
    ],
  };
}

describe("AC phasor solver", () => {
  it("matches DC magnitude on a pure resistive load", () => {
    const amp = 10;
    const R = 1000;
    const ac = solveAC(pureR(R, amp, 1000), { frequency: 1000 });
    expect(ac.success).toBe(true);
    expect(ac.componentResults.get("R1")!.voltageMag).toBeCloseTo(amp, 6);
    expect(ac.componentResults.get("R1")!.currentMag).toBeCloseTo(amp / R, 9);
  });

  it("solves series RC |I| and |Vc| from the circuit model", () => {
    const R = 1000;
    const C = 1e-6;
    const amp = 5;
    const f = 1000;
    const Xc = capacitiveReactance(C, f);
    const Z = Math.hypot(R, Xc);
    const I = amp / Z;
    const Vc = I * Xc;

    const ac = solveAC(seriesRcAc(R, C, amp, f), { frequency: f });
    expect(ac.success).toBe(true);
    expect(ac.componentResults.get("R1")!.currentMag).toBeCloseTo(I, 5);
    expect(ac.componentResults.get("C1")!.voltageMag).toBeCloseTo(Vc, 4);
  });

  it("solves series RL |I| from the circuit model", () => {
    const R = 100;
    const L = 0.1;
    const amp = 5;
    const f = 500;
    const Xl = inductiveReactance(L, f);
    const I = amp / Math.hypot(R, Xl);

    const ac = solveAC(seriesRlAc(R, L, amp, f), { frequency: f });
    expect(ac.success).toBe(true);
    expect(ac.componentResults.get("L1")!.currentMag).toBeCloseTo(I, 5);
  });
});
