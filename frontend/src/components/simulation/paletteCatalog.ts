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
  /** Opens an instrument panel. These entries are not placed on the canvas. */
  instrument?: "oscilloscope" | "dmm";
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
  {
    id: "resistor",
    type: "resistor",
    label: "Resistor",
    icon: "R",
    keywords: ["r", "ohm", "res", "load", "load resistor"],
  },
  {
    id: "potentiometer",
    type: "potentiometer",
    label: "Potentiometer",
    icon: "POT",
    keywords: ["pot", "potentiometer", "divider", "wiper", "variable", "variable resistor"],
  },
  { id: "capacitor", type: "capacitor", label: "Capacitor", icon: "C", keywords: ["c", "cap"] },
  { id: "inductor", type: "inductor", label: "Inductor", icon: "L", keywords: ["l", "coil"] },
  {
    id: "diode",
    type: "diode",
    label: "Diode",
    icon: "D",
    keywords: ["d", "rectifier", "rectifier diode", "bridge"],
  },
  { id: "led", type: "led", label: "LED", icon: "LED", keywords: ["light"] },
  { id: "ground", type: "ground", label: "Ground", icon: "GND", keywords: ["gnd", "earth"] },
  { id: "switch", type: "switch", label: "Switch", icon: "SW", keywords: ["sw"] },
  {
    id: "voltmeter",
    type: "voltmeter",
    label: "Voltmeter",
    icon: "VM",
    keywords: ["meter", "vm", "voltage", "voltage probe", "probe"],
  },
  {
    id: "ammeter",
    type: "ammeter",
    label: "Ammeter",
    icon: "AM",
    keywords: ["meter", "am", "current probe", "current"],
  },
  {
    id: "oscilloscope",
    type: "voltmeter",
    label: "Oscilloscope",
    icon: "OSC",
    instrument: "oscilloscope",
    keywords: ["scope", "oscilloscope", "channel", "waveform", "probe"],
  },
  {
    id: "dmm",
    type: "voltmeter",
    label: "DMM",
    icon: "DMM",
    instrument: "dmm",
    keywords: ["dmm", "multimeter", "meter", "ohmmeter"],
  },
];

/** Labs whose palette should lead with the parts that circuit actually uses. */
const EXPERIMENT_ORDER: Record<string, readonly string[]> = {
  "rc-low-pass-filter": ["function_generator", "oscilloscope", "dmm", "resistor", "capacitor", "ground", "voltmeter"],
  "rc-circuit": ["voltage_source", "resistor", "capacitor", "switch", "oscilloscope", "ground", "voltmeter"],
  "capacitor-charging": ["voltage_source", "resistor", "capacitor", "switch", "oscilloscope", "ground"],
  "rl-circuit": ["voltage_source", "resistor", "inductor", "switch", "oscilloscope", "ground", "ammeter"],
  "rlc-circuit": ["voltage_source", "resistor", "inductor", "capacitor", "oscilloscope", "ground"],
  "series-resonance": ["function_generator", "resistor", "inductor", "capacitor", "oscilloscope", "dmm", "ground"],
  "half-wave-rectifier": ["function_generator", "diode", "resistor", "oscilloscope", "dmm", "ground"],
  "full-wave-bridge-rectifier": ["function_generator", "diode", "resistor", "oscilloscope", "dmm", "ground"],
  "diode-characteristics": ["voltage_source", "diode", "resistor", "ammeter", "voltmeter", "dmm"],
  "led-circuit": ["voltage_source", "led", "resistor", "ground"],
  "wheatstone-bridge": ["voltage_source", "resistor", "voltmeter", "dmm", "ground"],
  "thevenin-theorem": ["voltage_source", "resistor", "ammeter", "voltmeter", "ground"],
  "norton-theorem": ["current_source", "voltage_source", "resistor", "ammeter", "ground"],
  "superposition-theorem": ["voltage_source", "current_source", "resistor", "voltmeter"],
  "maximum-power-transfer": ["voltage_source", "resistor", "ammeter", "ground"],
  potentiometer: ["potentiometer", "voltage_source", "voltmeter", "ground"],
  "voltage-divider": ["voltage_source", "resistor", "voltmeter", "ground"],
  "current-divider": ["current_source", "voltage_source", "resistor", "ammeter"],
};

/** Placeable palette entries the solver actually accepts. */
export const PALETTE_ENTRY_COUNT = COMPONENTS.length;

function matchesQuery(entry: PaletteEntry, q: string): boolean {
  if (!q) return true;
  const hay = [entry.label, entry.type, entry.id, ...entry.keywords]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/** Same keyword matching as the palette search box. Relevant parts lead when a lab is open. */
export function filterPaletteEntries(query: string, experimentId?: string | null): PaletteEntry[] {
  const q = query.trim().toLowerCase();
  const matched = COMPONENTS.filter((c) => matchesQuery(c, q));
  const order = experimentId ? EXPERIMENT_ORDER[experimentId] : undefined;
  if (!order) return matched;
  return [...matched].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 100 : ia) - (ib === -1 ? 100 : ib);
  });
}
