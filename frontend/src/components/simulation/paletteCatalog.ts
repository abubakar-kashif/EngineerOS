/**
 * Palette catalog and search. Kept out of the component module so the
 * palette file only exports a component.
 */
import type { ComponentProperties, ComponentType } from "./editorTypes";

/** Default properties when placing a sine AC / function-generator source. */
export const AC_FUNCTION_GENERATOR_DEFAULTS: ComponentProperties = {
  voltage: 5,
  amplitude: 5,
  frequency: 1000,
  phase: 0,
  waveform: "sine",
  acMode: true,
};

export interface PaletteEntry {
  /** Stable UI key (type may repeat for aliases). */
  id: string;
  type: ComponentType;
  label: string;
  icon: string;
  keywords: string[];
  propertyOverrides?: ComponentProperties;
}

const COMPONENTS: PaletteEntry[] = [
  {
    id: "voltage_source",
    type: "voltage_source",
    label: "Voltage Source",
    icon: "V",
    keywords: ["ac", "source", "voltage", "dc", "battery", "supply"],
  },
  {
    id: "function_generator",
    type: "voltage_source",
    label: "Function Generator",
    icon: "FG",
    keywords: [
      "ac",
      "source",
      "function generator",
      "function",
      "sine",
      "square",
      "triangle",
      "generator",
      "sine wave",
      "waveform",
      "fg",
    ],
    propertyOverrides: AC_FUNCTION_GENERATOR_DEFAULTS,
  },
  {
    id: "current_source",
    type: "current_source",
    label: "Current Source",
    icon: "I",
    keywords: ["source", "current", "ac"],
  },
  { id: "resistor", type: "resistor", label: "Resistor", icon: "R", keywords: ["r", "ohm"] },
  {
    id: "potentiometer",
    type: "potentiometer",
    label: "Potentiometer",
    icon: "POT",
    keywords: ["pot", "potentiometer", "divider", "wiper", "variable", "variable resistor"],
  },
  { id: "capacitor", type: "capacitor", label: "Capacitor", icon: "C", keywords: ["c", "cap"] },
  { id: "inductor", type: "inductor", label: "Inductor", icon: "L", keywords: ["l", "coil"] },
  { id: "diode", type: "diode", label: "Diode", icon: "D", keywords: ["d"] },
  { id: "led", type: "led", label: "LED", icon: "LED", keywords: ["light"] },
  { id: "ground", type: "ground", label: "Ground", icon: "GND", keywords: ["gnd", "earth"] },
  { id: "switch", type: "switch", label: "Switch", icon: "SW", keywords: ["sw"] },
  {
    id: "voltmeter",
    type: "voltmeter",
    label: "Voltmeter",
    icon: "VM",
    keywords: ["meter", "vm", "voltage", "scope", "oscilloscope", "dmm", "multimeter"],
  },
  { id: "ammeter", type: "ammeter", label: "Ammeter", icon: "AM", keywords: ["meter", "am"] },
];

/** Placeable palette entries the solver actually accepts. */
export const PALETTE_ENTRY_COUNT = COMPONENTS.length;

function matchesQuery(entry: PaletteEntry, q: string): boolean {
  if (!q) return true;
  const hay = [entry.label, entry.type, entry.id, ...entry.keywords]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/** Same keyword matching as the palette search box. */
export function filterPaletteEntries(query: string): PaletteEntry[] {
  const q = query.trim().toLowerCase();
  return COMPONENTS.filter((c) => matchesQuery(c, q));
}
