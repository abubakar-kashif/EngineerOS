/**
 * Component palette: click to enter placement mode for the freeform canvas.
 * Search recognizes AC / source / function generator / sine / generator aliases.
 */
import { useMemo, useState } from "react";
import type { ComponentProperties, ComponentType } from "./editorTypes";

interface ComponentPaletteProps {
  onSelectType: (type: ComponentType, propertyOverrides?: ComponentProperties) => void;
  selectedType: ComponentType | null;
}

/** Default properties when placing a sine AC / function-generator source. */
export const AC_FUNCTION_GENERATOR_DEFAULTS: ComponentProperties = {
  voltage: 5,
  amplitude: 5,
  frequency: 1000,
  phase: 0,
  waveform: "sine",
  acMode: true,
};

interface PaletteEntry {
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
    keywords: ["pot", "divider", "wiper"],
  },
  { id: "capacitor", type: "capacitor", label: "Capacitor", icon: "C", keywords: ["c", "cap"] },
  { id: "inductor", type: "inductor", label: "Inductor", icon: "L", keywords: ["l", "coil"] },
  { id: "diode", type: "diode", label: "Diode", icon: "D", keywords: ["d"] },
  { id: "led", type: "led", label: "LED", icon: "LED", keywords: ["light"] },
  { id: "ground", type: "ground", label: "Ground", icon: "GND", keywords: ["gnd", "earth"] },
  { id: "switch", type: "switch", label: "Switch", icon: "SW", keywords: ["sw"] },
  { id: "voltmeter", type: "voltmeter", label: "Voltmeter", icon: "VM", keywords: ["meter", "vm"] },
  { id: "ammeter", type: "ammeter", label: "Ammeter", icon: "AM", keywords: ["meter", "am"] },
];

function matchesQuery(entry: PaletteEntry, q: string): boolean {
  if (!q) return true;
  const hay = [entry.label, entry.type, entry.id, ...entry.keywords]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

/** Exported for tests — same keyword matching as the palette search box. */
export function filterPaletteEntries(query: string): PaletteEntry[] {
  const q = query.trim().toLowerCase();
  return COMPONENTS.filter((c) => matchesQuery(c, q));
}

function ComponentPalette({ onSelectType, selectedType }: ComponentPaletteProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterPaletteEntries(query), [query]);

  return (
    <div className="sim-palette">
      <h4 className="sim-palette-title">Components</h4>
      <input
        type="search"
        className="sim-palette-search"
        placeholder="Search (AC, generator…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search components"
      />
      <div className="sim-palette-items">
        {visible.length === 0 ? (
          <p className="sim-palette-empty">No components match.</p>
        ) : (
          visible.map((comp) => (
            <button
              key={comp.id}
              type="button"
              className={`sim-palette-item ${
                selectedType === comp.type ? "sim-palette-item--active" : ""
              }`}
              onClick={() => onSelectType(comp.type, comp.propertyOverrides)}
              title={comp.label}
              aria-label={comp.label}
              aria-pressed={selectedType === comp.type}
            >
              <span className="sim-palette-symbol">{comp.icon}</span>
              <span className="sim-palette-label">{comp.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default ComponentPalette;
