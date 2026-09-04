/**
 * Block 7 — unit converter, scientific calculator, engineering calculators.
 */
import { describe, expect, it } from "vitest";
import {
  convertUnit,
  evaluateExpression,
} from "../services/tools/toolsService";
import { CALCULATORS } from "../data/engineeringCalculators";

describe("Unit converter (both directions)", () => {
  const cases: Array<{
    category: string;
    from: string;
    to: string;
    value: number;
    expected: number;
  }> = [
    { category: "length", from: "m", to: "cm", value: 1, expected: 100 },
    { category: "voltage", from: "v", to: "mv", value: 1, expected: 1000 },
    { category: "current", from: "a", to: "ma", value: 1, expected: 1000 },
    { category: "resistance", from: "kohm", to: "ohm", value: 1, expected: 1000 },
    { category: "power", from: "kw", to: "w", value: 1, expected: 1000 },
    { category: "energy", from: "kwh", to: "j", value: 1, expected: 3_600_000 },
    { category: "frequency", from: "meghz", to: "hz", value: 1, expected: 1_000_000 },
    { category: "temperature", from: "c", to: "f", value: 0, expected: 32 },
    { category: "temperature", from: "c", to: "k", value: 0, expected: 273.15 },
    { category: "time", from: "h", to: "s", value: 1, expected: 3600 },
  ];

  it.each(cases)("$value $from → $expected $to", ({ category, from, to, value, expected }) => {
    expect(convertUnit(value, category, from, to)).toBeCloseTo(expected, 8);
    expect(convertUnit(expected, category, to, from)).toBeCloseTo(value, 8);
  });

  it("rejects mixing incompatible categories", () => {
    expect(() => convertUnit(1, "length", "m", "v")).toThrow();
    expect(() => convertUnit(1, "voltage", "v", "ohm")).toThrow();
  });
});

describe("Scientific calculator", () => {
  it("evaluates arithmetic and functions", () => {
    expect(evaluateExpression("2 + 3")).toBe(5);
    expect(evaluateExpression("10 / 2")).toBe(5);
    expect(evaluateExpression("2^3")).toBe(8);
    expect(evaluateExpression("sqrt(16)")).toBe(4);
    expect(evaluateExpression("2 + 3 * 4")).toBe(14);
    expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
    expect(evaluateExpression("sin(90)", "deg")).toBeCloseTo(1, 10);
    expect(evaluateExpression("cos(0)", "deg")).toBeCloseTo(1, 10);
    expect(evaluateExpression("tan(45)", "deg")).toBeCloseTo(1, 10);
    expect(evaluateExpression("ln(e)")).toBeCloseTo(1, 10);
    expect(evaluateExpression("log(100)")).toBeCloseTo(2, 10);
    expect(evaluateExpression("-3 + 5")).toBe(2);
    expect(evaluateExpression("pi", "rad")).toBeCloseTo(Math.PI, 10);
  });

  it("throws on invalid / undefined expressions", () => {
    expect(() => evaluateExpression("")).toThrow(/empty/i);
    expect(() => evaluateExpression("1 / 0")).toThrow();
    expect(() => evaluateExpression("(2 + 3")).toThrow();
    expect(() => evaluateExpression("foo(1)")).toThrow();
    expect(() => evaluateExpression("sqrt(-1)")).toThrow();
    expect(() => evaluateExpression("log(0)")).toThrow();
  });
});

describe("Engineering calculators — all solve directions", () => {
  const required = [
    "ohms-law",
    "voltage-divider",
    "current-divider",
    "power",
    "energy",
    "rc-time-constant",
    "rl-time-constant",
    "resonance",
    "power-factor",
    "three-phase-power",
  ];

  it("exposes every required calculator", () => {
    for (const id of required) {
      expect(CALCULATORS.find((c) => c.id === id)).toBeTruthy();
    }
  });

  it("Ohm's Law all directions", () => {
    const calc = CALCULATORS.find((c) => c.id === "ohms-law")!;
    expect(calc.compute({ I: 0.01, R: 1000 }, "V")).toBeCloseTo(10);
    expect(calc.compute({ V: 10, R: 1000 }, "I")).toBeCloseTo(0.01);
    expect(calc.compute({ V: 10, I: 0.01 }, "R")).toBeCloseTo(1000);
  });

  it("Voltage divider all directions", () => {
    const calc = CALCULATORS.find((c) => c.id === "voltage-divider")!;
    expect(calc.compute({ Vin: 12, R1: 1000, R2: 2000 }, "Vout")).toBeCloseTo(8);
    expect(calc.compute({ Vout: 8, R1: 1000, R2: 2000 }, "Vin")).toBeCloseTo(12);
    expect(calc.compute({ Vin: 12, Vout: 8, R2: 2000 }, "R1")).toBeCloseTo(1000);
    expect(calc.compute({ Vin: 12, Vout: 8, R1: 1000 }, "R2")).toBeCloseTo(2000);
  });

  it("Current divider all directions", () => {
    const calc = CALCULATORS.find((c) => c.id === "current-divider")!;
    // I1 = Itotal * R2 / (R1+R2)
    expect(calc.compute({ Itotal: 0.03, R1: 1000, R2: 2000 }, "I1")).toBeCloseTo(0.02);
    expect(calc.compute({ I1: 0.02, R1: 1000, R2: 2000 }, "Itotal")).toBeCloseTo(0.03);
  });

  it("Power / Energy / RC / RL / Resonance / PF / 3-phase one solve each direction", () => {
    const power = CALCULATORS.find((c) => c.id === "power")!;
    expect(power.compute({ V: 10, I: 2 }, "P")).toBeCloseTo(20);
    expect(power.compute({ P: 20, I: 2 }, "V")).toBeCloseTo(10);
    expect(power.compute({ P: 20, V: 10 }, "I")).toBeCloseTo(2);

    const energy = CALCULATORS.find((c) => c.id === "energy")!;
    expect(energy.compute({ P: 10, t: 5 }, "E")).toBeCloseTo(50);
    expect(energy.compute({ E: 50, t: 5 }, "P")).toBeCloseTo(10);
    expect(energy.compute({ E: 50, P: 10 }, "t")).toBeCloseTo(5);

    const rc = CALCULATORS.find((c) => c.id === "rc-time-constant")!;
    expect(rc.compute({ R: 1000, C: 1e-6 }, "tau")).toBeCloseTo(0.001);
    expect(rc.compute({ tau: 0.001, C: 1e-6 }, "R")).toBeCloseTo(1000);
    expect(rc.compute({ tau: 0.001, R: 1000 }, "C")).toBeCloseTo(1e-6);

    const rl = CALCULATORS.find((c) => c.id === "rl-time-constant")!;
    expect(rl.compute({ L: 0.01, R: 10 }, "tau")).toBeCloseTo(0.001);
    expect(rl.compute({ tau: 0.001, R: 10 }, "L")).toBeCloseTo(0.01);
    expect(rl.compute({ tau: 0.001, L: 0.01 }, "R")).toBeCloseTo(10);

    const res = CALCULATORS.find((c) => c.id === "resonance")!;
    const f0 = res.compute({ L: 1e-3, C: 1e-6 }, "f0");
    expect(f0).toBeCloseTo(1 / (2 * Math.PI * Math.sqrt(1e-3 * 1e-6)), 6);
    expect(res.compute({ f0, C: 1e-6 }, "L")).toBeCloseTo(1e-3, 6);
    expect(res.compute({ f0, L: 1e-3 }, "C")).toBeCloseTo(1e-6, 6);

    const pf = CALCULATORS.find((c) => c.id === "power-factor")!;
    expect(pf.compute({ P: 80, S: 100 }, "PF")).toBeCloseTo(0.8);
    expect(pf.compute({ PF: 0.8, S: 100 }, "P")).toBeCloseTo(80);
    expect(pf.compute({ PF: 0.8, P: 80 }, "S")).toBeCloseTo(100);

    const tp = CALCULATORS.find((c) => c.id === "three-phase-power")!;
    // P = √3 * VL * IL * PF
    const P = tp.compute({ VL: 400, IL: 10, PF: 0.8 }, "P");
    expect(P).toBeCloseTo(Math.sqrt(3) * 400 * 10 * 0.8, 6);
    expect(tp.compute({ P, IL: 10, PF: 0.8 }, "VL")).toBeCloseTo(400, 4);
    expect(tp.compute({ P, VL: 400, PF: 0.8 }, "IL")).toBeCloseTo(10, 4);
    expect(tp.compute({ P, VL: 400, IL: 10 }, "PF")).toBeCloseTo(0.8, 4);
  });
});
