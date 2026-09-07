/**
 * Engineering Calculators — data and solve logic.
 * Self-contained: no dependency on the unit converter, scientific
 * calculator, or formula reference modules.
 */

export interface CalcField {
  id: string;
  label: string;
  symbol: string;
  unit: string;
}

export interface CalculatorDef {
  id: string;
  name: string;
  category: string;
  formula: string;
  fields: CalcField[];
  solvableFor: string[];
  compute: (known: Record<string, number>, solveFor: string) => number;
}

function div(numerator: number, denominator: number, label = "denominator"): number {
  if (!Number.isFinite(denominator) || denominator === 0) {
    throw new Error(`Invalid ${label}: cannot divide by zero`);
  }
  const value = numerator / denominator;
  if (!Number.isFinite(value)) throw new Error("Invalid result");
  return value;
}

function fin(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Invalid result");
  return value;
}

export const CALCULATORS: CalculatorDef[] = [
  {
    id: "ohms-law",
    name: "Ohm's Law",
    category: "Circuits",
    formula: "V = I × R",
    fields: [
      { id: "V", label: "Voltage", symbol: "V", unit: "V" },
      { id: "I", label: "Current", symbol: "I", unit: "A" },
      { id: "R", label: "Resistance", symbol: "R", unit: "Ω" },
    ],
    solvableFor: ["V", "I", "R"],
    compute: (k, solveFor) => {
      if (solveFor === "V") return fin(k.I * k.R);
      if (solveFor === "I") return div(k.V, k.R, "R");
      return div(k.V, k.I, "I");
    },
  },
  {
    id: "series-resistance",
    name: "Series Resistance",
    category: "Circuits",
    formula: "R_total = R1 + R2",
    fields: [
      { id: "R1", label: "R1", symbol: "R1", unit: "Ω" },
      { id: "R2", label: "R2", symbol: "R2", unit: "Ω" },
      { id: "Rtotal", label: "Total resistance", symbol: "R_total", unit: "Ω" },
    ],
    solvableFor: ["Rtotal", "R1", "R2"],
    compute: (k, solveFor) => {
      if (solveFor === "Rtotal") return fin(k.R1 + k.R2);
      if (solveFor === "R1") return fin(k.Rtotal - k.R2);
      return fin(k.Rtotal - k.R1);
    },
  },
  {
    id: "parallel-resistance",
    name: "Parallel Resistance",
    category: "Circuits",
    formula: "1/R_total = 1/R1 + 1/R2",
    fields: [
      { id: "R1", label: "R1", symbol: "R1", unit: "Ω" },
      { id: "R2", label: "R2", symbol: "R2", unit: "Ω" },
      { id: "Rtotal", label: "Total resistance", symbol: "R_total", unit: "Ω" },
    ],
    solvableFor: ["Rtotal", "R1", "R2"],
    compute: (k, solveFor) => {
      if (solveFor === "Rtotal") return div(k.R1 * k.R2, k.R1 + k.R2, "R1+R2");
      if (solveFor === "R1") return div(k.Rtotal * k.R2, k.R2 - k.Rtotal, "R2−Rtotal");
      return div(k.Rtotal * k.R1, k.R1 - k.Rtotal, "R1−Rtotal");
    },
  },
  {
    id: "voltage-divider",
    name: "Voltage Divider",
    category: "Circuits",
    formula: "V_out = V_in × R2 / (R1 + R2)",
    fields: [
      { id: "Vin", label: "Input voltage", symbol: "V_in", unit: "V" },
      { id: "R1", label: "R1", symbol: "R1", unit: "Ω" },
      { id: "R2", label: "R2", symbol: "R2", unit: "Ω" },
      { id: "Vout", label: "Output voltage", symbol: "V_out", unit: "V" },
    ],
    solvableFor: ["Vout", "Vin", "R1", "R2"],
    compute: (k, solveFor) => {
      if (solveFor === "Vout") return div(k.Vin * k.R2, k.R1 + k.R2, "R1+R2");
      if (solveFor === "Vin") return div(k.Vout * (k.R1 + k.R2), k.R2, "R2");
      if (solveFor === "R1") return div(k.R2 * (k.Vin - k.Vout), k.Vout, "Vout");
      return div(k.Vout * k.R1, k.Vin - k.Vout, "Vin−Vout");
    },
  },
  {
    id: "current-divider",
    name: "Current Divider",
    category: "Circuits",
    formula: "I1 = I_total × R2 / (R1 + R2)",
    fields: [
      { id: "Itotal", label: "Total current", symbol: "I_total", unit: "A" },
      { id: "R1", label: "R1", symbol: "R1", unit: "Ω" },
      { id: "R2", label: "R2", symbol: "R2", unit: "Ω" },
      { id: "I1", label: "Current through R1", symbol: "I1", unit: "A" },
    ],
    solvableFor: ["I1", "Itotal", "R1", "R2"],
    compute: (k, solveFor) => {
      if (solveFor === "I1") return div(k.Itotal * k.R2, k.R1 + k.R2, "R1+R2");
      if (solveFor === "Itotal") return div(k.I1 * (k.R1 + k.R2), k.R2, "R2");
      if (solveFor === "R2") return div(k.I1 * k.R1, k.Itotal - k.I1, "Itotal−I1");
      return div(k.R2 * (k.Itotal - k.I1), k.I1, "I1");
    },
  },
  {
    id: "power",
    name: "Power",
    category: "DC",
    formula: "P = V × I",
    fields: [
      { id: "V", label: "Voltage", symbol: "V", unit: "V" },
      { id: "I", label: "Current", symbol: "I", unit: "A" },
      { id: "P", label: "Power", symbol: "P", unit: "W" },
    ],
    solvableFor: ["P", "V", "I"],
    compute: (k, solveFor) => {
      if (solveFor === "P") return fin(k.V * k.I);
      if (solveFor === "V") return div(k.P, k.I, "I");
      return div(k.P, k.V, "V");
    },
  },
  {
    id: "energy",
    name: "Energy",
    category: "DC",
    formula: "E = P × t",
    fields: [
      { id: "P", label: "Power", symbol: "P", unit: "W" },
      { id: "t", label: "Time", symbol: "t", unit: "h" },
      { id: "E", label: "Energy", symbol: "E", unit: "Wh" },
    ],
    solvableFor: ["E", "P", "t"],
    compute: (k, solveFor) => {
      if (solveFor === "E") return fin(k.P * k.t);
      if (solveFor === "P") return div(k.E, k.t, "t");
      return div(k.E, k.P, "P");
    },
  },
  {
    id: "rc-time-constant",
    name: "RC Time Constant",
    category: "Signals",
    formula: "τ = R × C",
    fields: [
      { id: "R", label: "Resistance", symbol: "R", unit: "Ω" },
      { id: "C", label: "Capacitance", symbol: "C", unit: "F" },
      { id: "tau", label: "Time constant", symbol: "τ", unit: "s" },
    ],
    solvableFor: ["tau", "R", "C"],
    compute: (k, solveFor) => {
      if (solveFor === "tau") return fin(k.R * k.C);
      if (solveFor === "R") return div(k.tau, k.C, "C");
      return div(k.tau, k.R, "R");
    },
  },
  {
    id: "rl-time-constant",
    name: "RL Time Constant",
    category: "Signals",
    formula: "τ = L / R",
    fields: [
      { id: "L", label: "Inductance", symbol: "L", unit: "H" },
      { id: "R", label: "Resistance", symbol: "R", unit: "Ω" },
      { id: "tau", label: "Time constant", symbol: "τ", unit: "s" },
    ],
    solvableFor: ["tau", "L", "R"],
    compute: (k, solveFor) => {
      if (solveFor === "tau") return div(k.L, k.R, "R");
      if (solveFor === "L") return fin(k.tau * k.R);
      return div(k.L, k.tau, "τ");
    },
  },
  {
    id: "inductive-reactance",
    name: "Inductive Reactance",
    category: "AC",
    formula: "X_L = 2π × f × L",
    fields: [
      { id: "f", label: "Frequency", symbol: "f", unit: "Hz" },
      { id: "L", label: "Inductance", symbol: "L", unit: "H" },
      { id: "XL", label: "Inductive reactance", symbol: "X_L", unit: "Ω" },
    ],
    solvableFor: ["XL", "f", "L"],
    compute: (k, solveFor) => {
      if (solveFor === "XL") return fin(2 * Math.PI * k.f * k.L);
      if (solveFor === "f") return div(k.XL, 2 * Math.PI * k.L, "2πL");
      return div(k.XL, 2 * Math.PI * k.f, "2πf");
    },
  },
  {
    id: "capacitive-reactance",
    name: "Capacitive Reactance",
    category: "AC",
    formula: "X_C = 1 / (2π × f × C)",
    fields: [
      { id: "f", label: "Frequency", symbol: "f", unit: "Hz" },
      { id: "C", label: "Capacitance", symbol: "C", unit: "F" },
      { id: "XC", label: "Capacitive reactance", symbol: "X_C", unit: "Ω" },
    ],
    solvableFor: ["XC", "f", "C"],
    compute: (k, solveFor) => {
      if (solveFor === "XC") return div(1, 2 * Math.PI * k.f * k.C, "2πfC");
      if (solveFor === "f") return div(1, 2 * Math.PI * k.XC * k.C, "2πXC C");
      return div(1, 2 * Math.PI * k.f * k.XC, "2πf XC");
    },
  },
  {
    id: "resonance",
    name: "Resonant Frequency",
    category: "AC",
    formula: "f₀ = 1 / (2π√(LC))",
    fields: [
      { id: "L", label: "Inductance", symbol: "L", unit: "H" },
      { id: "C", label: "Capacitance", symbol: "C", unit: "F" },
      { id: "f0", label: "Resonant frequency", symbol: "f₀", unit: "Hz" },
    ],
    solvableFor: ["f0", "L", "C"],
    compute: (k, solveFor) => {
      if (k.L < 0 || k.C < 0) throw new Error("L and C must be non-negative");
      if (solveFor === "f0") {
        if (k.L === 0 || k.C === 0) throw new Error("L and C must be positive");
        return div(1, 2 * Math.PI * Math.sqrt(k.L * k.C), "2π√(LC)");
      }
      if (solveFor === "L") return div(1, k.C * Math.pow(2 * Math.PI * k.f0, 2), "C(2πf₀)²");
      return div(1, k.L * Math.pow(2 * Math.PI * k.f0, 2), "L(2πf₀)²");
    },
  },
  {
    id: "power-factor",
    name: "Power Factor",
    category: "Power",
    formula: "PF = P / S",
    fields: [
      { id: "P", label: "Real power", symbol: "P", unit: "W" },
      { id: "S", label: "Apparent power", symbol: "S", unit: "VA" },
      { id: "PF", label: "Power factor", symbol: "PF", unit: "" },
    ],
    solvableFor: ["PF", "P", "S"],
    compute: (k, solveFor) => {
      if (solveFor === "PF") return div(k.P, k.S, "S");
      if (solveFor === "P") return fin(k.PF * k.S);
      return div(k.P, k.PF, "PF");
    },
  },
  {
    id: "three-phase-power",
    name: "Three-Phase Power",
    category: "Power",
    formula: "P = √3 × V_L × I_L × PF",
    fields: [
      { id: "VL", label: "Line voltage", symbol: "V_L", unit: "V" },
      { id: "IL", label: "Line current", symbol: "I_L", unit: "A" },
      { id: "PF", label: "Power factor", symbol: "PF", unit: "" },
      { id: "P", label: "Real power", symbol: "P", unit: "W" },
    ],
    solvableFor: ["P", "VL", "IL", "PF"],
    compute: (k, solveFor) => {
      const root3 = Math.sqrt(3);
      if (solveFor === "P") return fin(root3 * k.VL * k.IL * k.PF);
      if (solveFor === "VL") return div(k.P, root3 * k.IL * k.PF, "√3·IL·PF");
      if (solveFor === "IL") return div(k.P, root3 * k.VL * k.PF, "√3·VL·PF");
      return div(k.P, root3 * k.VL * k.IL, "√3·VL·IL");
    },
  },
  {
    id: "transformer-ratio",
    name: "Transformer Turns Ratio",
    category: "Machines",
    formula: "V1 / V2 = N1 / N2",
    fields: [
      { id: "V1", label: "Primary voltage", symbol: "V1", unit: "V" },
      { id: "V2", label: "Secondary voltage", symbol: "V2", unit: "V" },
      { id: "N1", label: "Primary turns", symbol: "N1", unit: "turns" },
      { id: "N2", label: "Secondary turns", symbol: "N2", unit: "turns" },
    ],
    solvableFor: ["V1", "V2", "N1", "N2"],
    compute: (k, solveFor) => {
      if (solveFor === "V1") return div(k.V2 * k.N1, k.N2, "N2");
      if (solveFor === "V2") return div(k.V1 * k.N2, k.N1, "N1");
      if (solveFor === "N1") return div(k.V1 * k.N2, k.V2, "V2");
      return div(k.V2 * k.N1, k.V1, "V1");
    },
  },
];

/** Human-friendly number formatting for calculator output. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "Undefined";
  if (value === 0) return "0";

  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-9) {
    return value.toExponential(6).replace("e", " × 10^");
  }

  const rounded = Number(value.toPrecision(10));
  return String(rounded);
}
