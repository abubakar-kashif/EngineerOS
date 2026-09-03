/** Tool cards listed on the /tools landing page. */
export interface ToolEntry {
  id: string;
  title: string;
  description: string;
  /** Route the card links to. */
  path: string;
  icon: "calculator" | "converter" | "formula";
}

/** Topic groups used to filter the formula reference. */
export type FormulaCategory =
  | "Circuits"
  | "AC"
  | "DC"
  | "Power"
  | "Signals"
  | "Electronics"
  | "Machines"
  | "Control";

export const FORMULA_CATEGORIES: FormulaCategory[] = [
  "Circuits",
  "AC",
  "DC",
  "Power",
  "Signals",
  "Electronics",
  "Machines",
  "Control",
];

export interface FormulaVariable {
  symbol: string;
  name: string;
}

/** One entry in the formula reference library. */
export interface Formula {
  id: string;
  name: string;
  /** Rendered expression, e.g. "V = I × R". */
  expression: string;
  category: FormulaCategory;
  /** "Where" legend entries. */
  variables: FormulaVariable[];
}

/** A single convertible unit within a category. */
export interface Unit {
  id: string;
  label: string;
  symbol: string;
  /**
   * Value of 1 unit expressed in the category's base unit.
   * Null for offset-based units (temperature), which use dedicated conversion.
   */
  factor: number | null;
}

/** A measurement family such as Length, Voltage or Temperature. */
export interface UnitCategory {
  id: string;
  label: string;
  /** Symbol of the unit every factor is relative to. */
  base_unit: string;
  units: Unit[];
}
