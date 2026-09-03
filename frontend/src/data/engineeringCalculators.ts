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
      if (solveFor === "V") return k.I * k.R;
      if (solveFor === "I") return k.V / k.R;
      return k.V / k.I;
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
      if (solveFor === "Rtotal") return k.R1 + k.R2;
      if (solveFor === "R1") return k.Rtotal - k.R2;
      return k.Rtotal - k.R1;
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
      if (solveFor === "Rtotal") return (k.R1 * k.R2) / (k.R1 + k.R2);
      if (solveFor === "R1") return (k.Rtotal * k.R2) / (k.R2 - k.Rtotal);
      return (k.Rtotal * k.R1) / (k.R1 - k.Rtotal);
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
      if (solveFor === "Vout") return (k.Vin * k.R2) / (k.R1 + k.R2);
      if (solveFor === "Vin") return (k.Vout * (k.R1 + k.R2)) / k.R2;
      if (solveFor === "R1") return (k.R2 * (k.Vin - k.Vout)) / k.Vout;
      return (k.Vout * k.R1) / (k.Vin - k.Vout);
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
      if (solveFor === "I1") return (k.Itotal * k.R2) / (k.R1 + k.R2);
      if (solveFor === "Itotal") return (k.I1 * (k.R1 + k.R2)) / k.R2;
      if (solveFor === "R2") return (k.I1 * k.R1) / (k.Itotal - k.I1);
      return (k.R2 * (k.Itotal - k.I1)) / k.I1;
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
      if (solveFor === "P") return k.V * k.I;
      if (solveFor === "V") return k.P / k.I;
      return k.P / k.V;
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
      if (solveFor === "E") return k.P * k.t;
      if (solveFor === "P") return k.E / k.t;
      return k.E / k.P;
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
      if (solveFor === "tau") return k.R * k.C;
      if (solveFor === "R") return k.tau / k.C;
      return k.tau / k.R;
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
      if (solveFor === "tau") return k.L / k.R;
      if (solveFor === "L") return k.tau * k.R;
      return k.L / k.tau;
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
      if (solveFor === "XL") return 2 * Math.PI * k.f * k.L;
      if (solveFor === "f") return k.XL / (2 * Math.PI * k.L);
      return k.XL / (2 * Math.PI * k.f);
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
      if (solveFor === "XC") return 1 / (2 * Math.PI * k.f * k.C);
      if (solveFor === "f") return 1 / (2 * Math.PI * k.XC * k.C);
      return 1 / (2 * Math.PI * k.f * k.XC);
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
      if (solveFor === "f0") return 1 / (2 * Math.PI * Math.sqrt(k.L * k.C));
      if (solveFor === "L") return 1 / (k.C * Math.pow(2 * Math.PI * k.f0, 2));
      return 1 / (k.L * Math.pow(2 * Math.PI * k.f0, 2));
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
      if (solveFor === "PF") return k.P / k.S;
      if (solveFor === "P") return k.PF * k.S;
      return k.P / k.PF;
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
      if (solveFor === "P") return root3 * k.VL * k.IL * k.PF;
      if (solveFor === "VL") return k.P / (root3 * k.IL * k.PF);
      if (solveFor === "IL") return k.P / (root3 * k.VL * k.PF);
      return k.P / (root3 * k.VL * k.IL);
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
      if (solveFor === "V1") return (k.V2 * k.N1) / k.N2;
      if (solveFor === "V2") return (k.V1 * k.N2) / k.N1;
      if (solveFor === "N1") return (k.V1 * k.N2) / k.V2;
      return (k.V2 * k.N1) / k.V1;
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