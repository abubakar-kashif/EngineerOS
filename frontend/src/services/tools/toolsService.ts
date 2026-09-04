import type { Formula, FormulaCategory, ToolEntry, UnitCategory } from "../../types/tools";

/* ── Tool catalog (landing page cards) ────────────────── */

export const TOOLS: ToolEntry[] = [
  {
    id: "calculator",
    title: "Scientific Calculator",
    description:
      "Everyday arithmetic plus trig, roots, logs and powers — with full keyboard support.",
    path: "/tools/calculator",
    icon: "calculator",
  },
  {
    id: "engineering-calculators",
    title: "Engineering Calculators",
    description:
      "Ohm's Law, dividers, time constants, resonance and more — solve for any variable, not just plug-and-chug.",
    path: "/tools/engineering-calculators",
    icon: "calculator",
  },
  {
    id: "unit-converter",
    title: "Unit Converter",
    description:
      "Two-way conversions across length, voltage, current, resistance, power, energy, frequency, temperature and time.",
    path: "/tools/unit-converter",
    icon: "converter",
  },
  {
    id: "formula-reference",
    title: "Formula Reference",
    description:
      "Searchable electrical engineering formulas with variable legends you can copy into your notes.",
    path: "/tools/formulas",
    icon: "formula",
  },
];

/* ── Formula reference library ────────────────────────── */

export const FORMULA_LIBRARY: Formula[] = [
  // Circuits
  {
    id: "ohms-law",
    name: "Ohm's Law",
    expression: "V = I × R",
    category: "Circuits",
    variables: [
      { symbol: "V", name: "Voltage (volts)" },
      { symbol: "I", name: "Current (amperes)" },
      { symbol: "R", name: "Resistance (ohms)" },
    ],
  },
  {
    id: "series-resistance",
    name: "Series Resistance",
    expression: "R_total = R₁ + R₂ + ⋯ + Rₙ",
    category: "Circuits",
    variables: [
      { symbol: "R_total", name: "Equivalent resistance" },
      { symbol: "R₁…Rₙ", name: "Individual resistances" },
    ],
  },
  {
    id: "parallel-resistance",
    name: "Parallel Resistance",
    expression: "1/R_total = 1/R₁ + 1/R₂ + ⋯ + 1/Rₙ",
    category: "Circuits",
    variables: [
      { symbol: "R_total", name: "Equivalent resistance" },
      { symbol: "R₁…Rₙ", name: "Individual resistances" },
    ],
  },
  {
    id: "kvl",
    name: "Kirchhoff's Voltage Law",
    expression: "ΣV = 0",
    category: "Circuits",
    variables: [{ symbol: "ΣV", name: "Sum of voltages around a loop" }],
  },
  {
    id: "kcl",
    name: "Kirchhoff's Current Law",
    expression: "ΣI_in = ΣI_out",
    category: "Circuits",
    variables: [
      { symbol: "ΣI_in", name: "Current entering a node" },
      { symbol: "ΣI_out", name: "Current leaving the node" },
    ],
  },
  {
    id: "voltage-divider",
    name: "Voltage Divider",
    expression: "V_out = V_in × R₂ / (R₁ + R₂)",
    category: "Circuits",
    variables: [
      { symbol: "V_out", name: "Output voltage" },
      { symbol: "V_in", name: "Supply voltage" },
      { symbol: "R₁, R₂", name: "Divider resistances" },
    ],
  },
  {
    id: "current-divider",
    name: "Current Divider",
    expression: "I₁ = I_total × R_total / R₁",
    category: "Circuits",
    variables: [
      { symbol: "I₁", name: "Current through R₁" },
      { symbol: "I_total", name: "Total current" },
      { symbol: "R_total", name: "Equivalent resistance" },
    ],
  },

  // DC
  {
    id: "electrical-power",
    name: "Electrical Power",
    expression: "P = V × I",
    category: "DC",
    variables: [
      { symbol: "P", name: "Power (watts)" },
      { symbol: "V", name: "Voltage (volts)" },
      { symbol: "I", name: "Current (amperes)" },
    ],
  },
  {
    id: "joules-law",
    name: "Joule's Law",
    expression: "P = I² × R",
    category: "DC",
    variables: [
      { symbol: "P", name: "Power dissipated (watts)" },
      { symbol: "I", name: "Current (amperes)" },
      { symbol: "R", name: "Resistance (ohms)" },
    ],
  },
  {
    id: "capacitor-charge",
    name: "Capacitor Charge",
    expression: "Q = C × V",
    category: "DC",
    variables: [
      { symbol: "Q", name: "Charge (coulombs)" },
      { symbol: "C", name: "Capacitance (farads)" },
      { symbol: "V", name: "Voltage (volts)" },
    ],
  },
  {
    id: "capacitor-energy",
    name: "Capacitor Energy",
    expression: "E = ½ × C × V²",
    category: "DC",
    variables: [
      { symbol: "E", name: "Stored energy (joules)" },
      { symbol: "C", name: "Capacitance (farads)" },
      { symbol: "V", name: "Voltage (volts)" },
    ],
  },
  {
    id: "capacitors-parallel",
    name: "Capacitors in Parallel",
    expression: "C_total = C₁ + C₂ + ⋯ + Cₙ",
    category: "DC",
    variables: [
      { symbol: "C_total", name: "Equivalent capacitance" },
      { symbol: "C₁…Cₙ", name: "Individual capacitances" },
    ],
  },

  // AC
  {
    id: "rms-voltage",
    name: "RMS Voltage",
    expression: "V_rms = V_peak / √2",
    category: "AC",
    variables: [
      { symbol: "V_rms", name: "Root-mean-square voltage" },
      { symbol: "V_peak", name: "Peak voltage" },
    ],
  },
  {
    id: "inductive-reactance",
    name: "Inductive Reactance",
    expression: "X_L = 2πfL",
    category: "AC",
    variables: [
      { symbol: "X_L", name: "Inductive reactance (ohms)" },
      { symbol: "f", name: "Frequency (hertz)" },
      { symbol: "L", name: "Inductance (henries)" },
    ],
  },
  {
    id: "capacitive-reactance",
    name: "Capacitive Reactance",
    expression: "X_C = 1 / (2πfC)",
    category: "AC",
    variables: [
      { symbol: "X_C", name: "Capacitive reactance (ohms)" },
      { symbol: "f", name: "Frequency (hertz)" },
      { symbol: "C", name: "Capacitance (farads)" },
    ],
  },
  {
    id: "impedance-rlc",
    name: "RLC Impedance",
    expression: "Z = √(R² + (X_L − X_C)²)",
    category: "AC",
    variables: [
      { symbol: "Z", name: "Impedance (ohms)" },
      { symbol: "R", name: "Resistance (ohms)" },
      { symbol: "X_L", name: "Inductive reactance" },
      { symbol: "X_C", name: "Capacitive reactance" },
    ],
  },
  {
    id: "resonant-frequency",
    name: "Resonant Frequency",
    expression: "f₀ = 1 / (2π√(LC))",
    category: "AC",
    variables: [
      { symbol: "f₀", name: "Resonant frequency (hertz)" },
      { symbol: "L", name: "Inductance (henries)" },
      { symbol: "C", name: "Capacitance (farads)" },
    ],
  },

  // Power
  {
    id: "power-factor",
    name: "Power Factor",
    expression: "PF = cos φ = P / S",
    category: "Power",
    variables: [
      { symbol: "PF", name: "Power factor (0 to 1)" },
      { symbol: "φ", name: "Phase angle" },
      { symbol: "P", name: "Real power (watts)" },
      { symbol: "S", name: "Apparent power (volt-amperes)" },
    ],
  },
  {
    id: "apparent-power",
    name: "Apparent Power",
    expression: "S = V_rms × I_rms",
    category: "Power",
    variables: [
      { symbol: "S", name: "Apparent power (VA)" },
      { symbol: "V_rms", name: "RMS voltage" },
      { symbol: "I_rms", name: "RMS current" },
    ],
  },
  {
    id: "energy-consumed",
    name: "Energy Consumed",
    expression: "E = P × t",
    category: "Power",
    variables: [
      { symbol: "E", name: "Energy (watt-hours)" },
      { symbol: "P", name: "Power (watts)" },
      { symbol: "t", name: "Time (hours)" },
    ],
  },
  {
    id: "three-phase-power",
    name: "Three-Phase Power",
    expression: "P = √3 × V_L × I_L × cos φ",
    category: "Power",
    variables: [
      { symbol: "P", name: "Real power (watts)" },
      { symbol: "V_L", name: "Line voltage" },
      { symbol: "I_L", name: "Line current" },
      { symbol: "φ", name: "Phase angle between V and I" },
    ],
  },

  // Signals
  {
    id: "frequency-period",
    name: "Frequency & Period",
    expression: "f = 1 / T",
    category: "Signals",
    variables: [
      { symbol: "f", name: "Frequency (hertz)" },
      { symbol: "T", name: "Period (seconds)" },
    ],
  },
  {
    id: "angular-frequency",
    name: "Angular Frequency",
    expression: "ω = 2πf",
    category: "Signals",
    variables: [
      { symbol: "ω", name: "Angular frequency (rad/s)" },
      { symbol: "f", name: "Frequency (hertz)" },
    ],
  },
  {
    id: "rc-time-constant",
    name: "RC Time Constant",
    expression: "τ = R × C",
    category: "Signals",
    variables: [
      { symbol: "τ", name: "Time constant (seconds)" },
      { symbol: "R", name: "Resistance (ohms)" },
      { symbol: "C", name: "Capacitance (farads)" },
    ],
  },
  {
    id: "decibel-gain",
    name: "Decibel Gain",
    expression: "A_dB = 20 × log₁₀(V_out / V_in)",
    category: "Signals",
    variables: [
      { symbol: "A_dB", name: "Voltage gain (decibels)" },
      { symbol: "V_out", name: "Output voltage" },
      { symbol: "V_in", name: "Input voltage" },
    ],
  },

  // Electronics
  {
    id: "led-series-resistor",
    name: "LED Series Resistor",
    expression: "R = (V_supply − V_LED) / I_LED",
    category: "Electronics",
    variables: [
      { symbol: "R", name: "Series resistance (ohms)" },
      { symbol: "V_supply", name: "Supply voltage" },
      { symbol: "V_LED", name: "LED forward voltage" },
      { symbol: "I_LED", name: "LED current (amperes)" },
    ],
  },
  {
    id: "transistor-gain",
    name: "Transistor Current Gain",
    expression: "I_C = β × I_B",
    category: "Electronics",
    variables: [
      { symbol: "I_C", name: "Collector current" },
      { symbol: "β", name: "Current gain (hFE)" },
      { symbol: "I_B", name: "Base current" },
    ],
  },
  {
    id: "zener-resistor",
    name: "Zener Resistor",
    expression: "R_S = (V_in − V_Z) / I_Z",
    category: "Electronics",
    variables: [
      { symbol: "R_S", name: "Series resistance (ohms)" },
      { symbol: "V_in", name: "Input voltage" },
      { symbol: "V_Z", name: "Zener voltage" },
      { symbol: "I_Z", name: "Zener current (amperes)" },
    ],
  },

  // Machines
  {
    id: "dc-motor-back-emf",
    name: "DC Motor Back EMF",
    expression: "E_b = k × Φ × ω",
    category: "Machines",
    variables: [
      { symbol: "E_b", name: "Back EMF (volts)" },
      { symbol: "k", name: "Machine constant" },
      { symbol: "Φ", name: "Magnetic flux (webers)" },
      { symbol: "ω", name: "Angular speed (rad/s)" },
    ],
  },
  {
    id: "dc-motor-torque",
    name: "DC Motor Torque",
    expression: "T = k × Φ × I_a",
    category: "Machines",
    variables: [
      { symbol: "T", name: "Torque (newton-metres)" },
      { symbol: "k", name: "Machine constant" },
      { symbol: "Φ", name: "Magnetic flux (webers)" },
      { symbol: "I_a", name: "Armature current (amperes)" },
    ],
  },
  {
    id: "synchronous-speed",
    name: "Synchronous Speed",
    expression: "N_s = 120 × f / P",
    category: "Machines",
    variables: [
      { symbol: "N_s", name: "Synchronous speed (RPM)" },
      { symbol: "f", name: "Supply frequency (hertz)" },
      { symbol: "P", name: "Number of poles" },
    ],
  },
  {
    id: "transformer-ratio",
    name: "Transformer Turns Ratio",
    expression: "V₁ / V₂ = N₁ / N₂",
    category: "Machines",
    variables: [
      { symbol: "V₁, V₂", name: "Primary and secondary voltages" },
      { symbol: "N₁, N₂", name: "Primary and secondary turns" },
    ],
  },

  // Control
  {
    id: "pid-controller",
    name: "PID Controller",
    expression: "u(t) = K_p e(t) + K_i ∫e(t)dt + K_d de(t)/dt",
    category: "Control",
    variables: [
      { symbol: "u(t)", name: "Controller output" },
      { symbol: "e(t)", name: "Error signal" },
      { symbol: "K_p, K_i, K_d", name: "Proportional, integral, derivative gains" },
    ],
  },
  {
    id: "first-order-system",
    name: "First-Order System",
    expression: "G(s) = K / (τs + 1)",
    category: "Control",
    variables: [
      { symbol: "G(s)", name: "Transfer function" },
      { symbol: "K", name: "Steady-state gain" },
      { symbol: "τ", name: "Time constant (seconds)" },
      { symbol: "s", name: "Laplace variable" },
    ],
  },
  {
    id: "second-order-system",
    name: "Second-Order System",
    expression: "G(s) = ω_n² / (s² + 2ζω_n s + ω_n²)",
    category: "Control",
    variables: [
      { symbol: "ω_n", name: "Natural frequency (rad/s)" },
      { symbol: "ζ", name: "Damping ratio" },
      { symbol: "s", name: "Laplace variable" },
    ],
  },
  {
    id: "steady-state-error",
    name: "Steady-State Error (Type 0)",
    expression: "e_ss = 1 / (1 + K_p)",
    category: "Control",
    variables: [
      { symbol: "e_ss", name: "Steady-state error" },
      { symbol: "K_p", name: "Position error constant" },
    ],
  },
];

/** Case-insensitive search across name, expression and category. */
export function searchFormulas(query: string, category: FormulaCategory | "all"): Formula[] {
  const term = query.trim().toLowerCase();
  return FORMULA_LIBRARY.filter((formula) => {
    if (category !== "all" && formula.category !== category) return false;
    if (!term) return true;
    return (
      formula.name.toLowerCase().includes(term) ||
      formula.expression.toLowerCase().includes(term) ||
      formula.category.toLowerCase().includes(term) ||
      formula.variables.some((variable) => variable.name.toLowerCase().includes(term))
    );
  });
}

/* ── Unit conversion ──────────────────────────────────── */

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: "length",
    label: "Length",
    base_unit: "m",
    units: [
      { id: "mm", label: "Millimetre", symbol: "mm", factor: 0.001 },
      { id: "cm", label: "Centimetre", symbol: "cm", factor: 0.01 },
      { id: "m", label: "Metre", symbol: "m", factor: 1 },
      { id: "km", label: "Kilometre", symbol: "km", factor: 1000 },
      { id: "in", label: "Inch", symbol: "in", factor: 0.0254 },
      { id: "ft", label: "Foot", symbol: "ft", factor: 0.3048 },
      { id: "mi", label: "Mile", symbol: "mi", factor: 1609.344 },
    ],
  },
  {
    id: "voltage",
    label: "Voltage",
    base_unit: "V",
    units: [
      { id: "uv", label: "Microvolt", symbol: "µV", factor: 0.000001 },
      { id: "mv", label: "Millivolt", symbol: "mV", factor: 0.001 },
      { id: "v", label: "Volt", symbol: "V", factor: 1 },
      { id: "kv", label: "Kilovolt", symbol: "kV", factor: 1000 },
      { id: "megv", label: "Megavolt", symbol: "MV", factor: 1000000 },
    ],
  },
  {
    id: "current",
    label: "Current",
    base_unit: "A",
    units: [
      { id: "ua", label: "Microampere", symbol: "µA", factor: 0.000001 },
      { id: "ma", label: "Milliampere", symbol: "mA", factor: 0.001 },
      { id: "a", label: "Ampere", symbol: "A", factor: 1 },
      { id: "ka", label: "Kiloampere", symbol: "kA", factor: 1000 },
    ],
  },
  {
    id: "resistance",
    label: "Resistance",
    base_unit: "Ω",
    units: [
      { id: "mohm", label: "Milliohm", symbol: "mΩ", factor: 0.001 },
      { id: "ohm", label: "Ohm", symbol: "Ω", factor: 1 },
      { id: "kohm", label: "Kilohm", symbol: "kΩ", factor: 1000 },
      { id: "megohm", label: "Megohm", symbol: "MΩ", factor: 1000000 },
      { id: "gohm", label: "Gigohm", symbol: "GΩ", factor: 1000000000 },
    ],
  },
  {
    id: "power",
    label: "Power",
    base_unit: "W",
    units: [
      { id: "mw", label: "Milliwatt", symbol: "mW", factor: 0.001 },
      { id: "w", label: "Watt", symbol: "W", factor: 1 },
      { id: "kw", label: "Kilowatt", symbol: "kW", factor: 1000 },
      { id: "megw", label: "Megawatt", symbol: "MW", factor: 1000000 },
      { id: "hp", label: "Horsepower", symbol: "hp", factor: 745.699872 },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    base_unit: "J",
    units: [
      { id: "j", label: "Joule", symbol: "J", factor: 1 },
      { id: "kj", label: "Kilojoule", symbol: "kJ", factor: 1000 },
      { id: "wh", label: "Watt-hour", symbol: "Wh", factor: 3600 },
      { id: "kwh", label: "Kilowatt-hour", symbol: "kWh", factor: 3600000 },
      { id: "cal", label: "Calorie", symbol: "cal", factor: 4.184 },
      { id: "btu", label: "BTU", symbol: "BTU", factor: 1055.06 },
    ],
  },
  {
    id: "frequency",
    label: "Frequency",
    base_unit: "Hz",
    units: [
      { id: "mhz", label: "Millihertz", symbol: "mHz", factor: 0.001 },
      { id: "hz", label: "Hertz", symbol: "Hz", factor: 1 },
      { id: "khz", label: "Kilohertz", symbol: "kHz", factor: 1000 },
      { id: "meghz", label: "Megahertz", symbol: "MHz", factor: 1000000 },
      { id: "ghz", label: "Gigahertz", symbol: "GHz", factor: 1000000000 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    base_unit: "°C",
    units: [
      { id: "c", label: "Celsius", symbol: "°C", factor: null },
      { id: "f", label: "Fahrenheit", symbol: "°F", factor: null },
      { id: "k", label: "Kelvin", symbol: "K", factor: null },
    ],
  },
  {
    id: "time",
    label: "Time",
    base_unit: "s",
    units: [
      { id: "ms", label: "Millisecond", symbol: "ms", factor: 0.001 },
      { id: "s", label: "Second", symbol: "s", factor: 1 },
      { id: "min", label: "Minute", symbol: "min", factor: 60 },
      { id: "h", label: "Hour", symbol: "h", factor: 3600 },
      { id: "d", label: "Day", symbol: "d", factor: 86400 },
    ],
  },
];

/** Converts temperature units through a Celsius pivot. */
function toCelsius(value: number, unitId: string): number {
  switch (unitId) {
    case "f":
      return (value - 32) * (5 / 9);
    case "k":
      return value - 273.15;
    default:
      return value;
  }
}

function fromCelsius(value: number, unitId: string): number {
  switch (unitId) {
    case "f":
      return value * (9 / 5) + 32;
    case "k":
      return value + 273.15;
    default:
      return value;
  }
}

/** Two-way unit conversion inside one category. Throws on unknown ids. */
export function convertUnit(
  value: number,
  categoryId: string,
  fromUnitId: string,
  toUnitId: string,
): number {
  const category = UNIT_CATEGORIES.find((entry) => entry.id === categoryId);
  if (!category) throw new Error(`Unknown category: ${categoryId}`);

  const from = category.units.find((unit) => unit.id === fromUnitId);
  const to = category.units.find((unit) => unit.id === toUnitId);
  if (!from || !to) throw new Error("Unknown unit");

  if (from.factor === null || to.factor === null) {
    return fromCelsius(toCelsius(value, from.id), to.id);
  }

  return (value * from.factor) / to.factor;
}

/** Human-friendly number formatting for converter/calculator output. */
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

/* ── Calculator expression evaluator ──────────────────── */

export type AngleMode = "deg" | "rad";

type Token =
  | { kind: "number"; value: number }
  | { kind: "operator"; value: "+" | "-" | "*" | "/" | "^" | "u-" }
  | { kind: "function"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" };

const FUNCTIONS: Record<string, (x: number, mode: AngleMode) => number> = {
  sin: (x, mode) => Math.sin(mode === "deg" ? (x * Math.PI) / 180 : x),
  cos: (x, mode) => Math.cos(mode === "deg" ? (x * Math.PI) / 180 : x),
  tan: (x, mode) => Math.tan(mode === "deg" ? (x * Math.PI) / 180 : x),
  sqrt: (x) => Math.sqrt(x),
  log: (x) => Math.log10(x),
  ln: (x) => Math.log(x),
  neg: (x) => -x,
};

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "^": 3,
  "u-": 4,
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === " ") {
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let number = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        number += input[i];
        i += 1;
      }
      const value = Number(number);
      if (Number.isNaN(value)) throw new Error("Invalid number");
      tokens.push({ kind: "number", value });
      continue;
    }

    if (char === "π") {
      tokens.push({ kind: "number", value: Math.PI });
      i += 1;
      continue;
    }

    if (/[a-z]/i.test(char)) {
      let name = "";
      while (i < input.length && /[a-z]/i.test(input[i])) {
        name += input[i].toLowerCase();
        i += 1;
      }
      if (name === "pi") {
        tokens.push({ kind: "number", value: Math.PI });
      } else if (name === "e") {
        tokens.push({ kind: "number", value: Math.E });
      } else if (name in FUNCTIONS && name !== "neg") {
        tokens.push({ kind: "function", value: name });
      } else {
        throw new Error(`Unknown name: ${name}`);
      }
      continue;
    }

    if (char === "+" || char === "-" || char === "*" || char === "/" || char === "^") {
      tokens.push({ kind: "operator", value: char });
      i += 1;
      continue;
    }

    if (char === "(") {
      tokens.push({ kind: "lparen" });
      i += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ kind: "rparen" });
      i += 1;
      continue;
    }

    if (char === "×") {
      tokens.push({ kind: "operator", value: "*" });
      i += 1;
      continue;
    }

    if (char === "÷") {
      tokens.push({ kind: "operator", value: "/" });
      i += 1;
      continue;
    }

    if (char === "−") {
      tokens.push({ kind: "operator", value: "-" });
      i += 1;
      continue;
    }

    if (char === "√") {
      tokens.push({ kind: "function", value: "sqrt" });
      i += 1;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  return tokens;
}

/** Close any unclosed "(" so keypad sequences like sin(90)= still evaluate. */
function autoCloseParentheses(expression: string): string {
  let depth = 0;
  for (const char of expression) {
    if (char === "(") depth += 1;
    else if (char === ")") depth = Math.max(0, depth - 1);
  }
  return depth > 0 ? expression + ")".repeat(depth) : expression;
}

/** Insert × between adjacent values: 2π, 2sin(30), (1+2)(3+4). */
function withImplicitMultiplication(tokens: Token[]): Token[] {
  const output: Token[] = [];
  for (const token of tokens) {
    const prev = output[output.length - 1];
    if (prev) {
      const prevAtom = prev.kind === "number" || prev.kind === "rparen";
      const nextAtom =
        token.kind === "number" || token.kind === "lparen" || token.kind === "function";
      if (prevAtom && nextAtom) {
        output.push({ kind: "operator", value: "*" });
      }
    }
    output.push(token);
  }
  return output;
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];
  let previous: Token | null = null;

  for (const token of tokens) {
    switch (token.kind) {
      case "number":
        output.push(token);
        break;
      case "function":
        stack.push(token);
        break;
      case "operator": {
        let operator = token.value;
        if (
          operator === "-" &&
          (!previous ||
            previous.kind === "operator" ||
            previous.kind === "function" ||
            previous.kind === "lparen")
        ) {
          operator = "u-";
        }

        while (stack.length > 0) {
          const top = stack[stack.length - 1];
          if (top.kind === "lparen") break;
          if (top.kind === "function") {
            output.push(stack.pop() as Token);
            continue;
          }
          if (top.kind !== "operator") break;

          const topPrecedence = PRECEDENCE[top.value];
          const currentPrecedence = PRECEDENCE[operator];
          const shouldPop =
            operator === "^"
              ? currentPrecedence < topPrecedence
              : currentPrecedence <= topPrecedence;
          if (!shouldPop) break;
          output.push(stack.pop() as Token);
        }

        stack.push({ kind: "operator", value: operator });
        break;
      }
      case "lparen":
        stack.push(token);
        break;
      case "rparen": {
        let foundParen = false;
        while (stack.length > 0) {
          const top = stack.pop() as Token;
          if (top.kind === "lparen") {
            foundParen = true;
            break;
          }
          output.push(top);
        }
        if (!foundParen) throw new Error("Mismatched parentheses");
        if (stack.length > 0 && stack[stack.length - 1].kind === "function") {
          output.push(stack.pop() as Token);
        }
        break;
      }
    }
    if (token.kind !== "rparen") previous = token;
  }

  // Auto-close leftover "(" from incomplete keypad entry (e.g. sin(90)
  while (stack.length > 0 && stack[stack.length - 1].kind === "lparen") {
    stack.pop();
    if (stack.length > 0 && stack[stack.length - 1].kind === "function") {
      output.push(stack.pop() as Token);
    }
  }

  while (stack.length > 0) {
    const top = stack.pop() as Token;
    if (top.kind === "lparen") throw new Error("Mismatched parentheses");
    output.push(top);
  }

  return output;
}

function evaluateRpn(rpn: Token[], mode: AngleMode): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (token.kind === "number") {
      stack.push(token.value);
    } else if (token.kind === "function") {
      const arg = stack.pop();
      if (arg === undefined) throw new Error("Invalid expression");
      stack.push(FUNCTIONS[token.value](arg, mode));
    } else if (token.kind === "operator") {
      if (token.value === "u-") {
        const arg = stack.pop();
        if (arg === undefined) throw new Error("Invalid expression");
        stack.push(-arg);
        continue;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("Invalid expression");
      switch (token.value) {
        case "+":
          stack.push(a + b);
          break;
        case "-":
          stack.push(a - b);
          break;
        case "*":
          stack.push(a * b);
          break;
        case "/":
          stack.push(a / b);
          break;
        case "^":
          stack.push(Math.pow(a, b));
          break;
      }
    }
  }

  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0];
}

export function evaluateExpression(expression: string, mode: AngleMode = "deg"): number {
  const trimmed = expression.trim();
  if (!trimmed) throw new Error("Empty expression");
  const closed = autoCloseParentheses(trimmed);
  const tokens = withImplicitMultiplication(tokenize(closed));
  const result = evaluateRpn(toRpn(tokens), mode);
  if (Number.isNaN(result)) throw new Error("Invalid expression");
  if (!Number.isFinite(result)) throw new Error("Result is undefined");
  return result;
}

/** True when a leading display "0" should be replaced (not kept as a literal digit). */
function replacesLeadingZero(token: string): boolean {
  if (/^[0-9.]/.test(token)) return true;
  if (token === "(") return true;
  if (token === "π" || token === "e") return true;
  if (token.startsWith("√")) return true;
  // Function keys: sin(, cos(, tan(, log(, ln(
  if (/^[a-zA-Z]/.test(token)) return true;
  return false;
}

function endsWithValueAtom(expression: string): boolean {
  if (!expression) return false;
  const last = expression[expression.length - 1];
  return /[0-9.)πe]/.test(last);
}

/**
 * Implicit × only between complete values — never between digits of one number.
 * Examples: 2π → 2×π, 2sin( → 2×sin(, )( → )×(
 * Not: sin(9 + 0 → sin(90
 */
function shouldInsertImplicitMultiply(current: string, token: string): boolean {
  if (!current || !endsWithValueAtom(current)) return false;

  const last = current[current.length - 1];

  // Digit / decimal keys continue the current number (or start an arg after "(").
  if (/^[0-9.]$/.test(token)) {
    //  π2, e2, )2  → multiply;  92, 9.2, sin(2  → append
    return /[)πe]/.test(last);
  }

  // Function / constant / group after a value: 2sin(, 2π, 2(, )sin(
  if (token === "(") return true;
  if (token === "π" || token === "e") return true;
  if (token.startsWith("√")) return true;
  if (/^[a-zA-Z]/.test(token)) return true;

  return false;
}

/**
 * Append a calculator key token to the current display expression.
 * Replaces the placeholder "0" for digits, constants, and functions so
 * pressing sin does not produce "0sin(".
 * Inserts × only between separate values (never between digits).
 */
export function appendCalculatorToken(current: string, token: string): string {
  if (current === "0" && replacesLeadingZero(token)) {
    return token;
  }
  if (shouldInsertImplicitMultiply(current, token)) {
    return `${current}×${token}`;
  }
  return current + token;
}

/* =========================================================
   ENGINEERING CALCULATORS
   ========================================================= */

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