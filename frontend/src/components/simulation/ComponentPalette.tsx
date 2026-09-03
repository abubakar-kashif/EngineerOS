/**
 * Component palette: categorized list of available circuit components.
 * User clicks a category to expand, then clicks a component to select it for placement.
 */
import { useState } from "react";
import type { ComponentType } from "./engine/types";

interface PaletteItem {
  type: ComponentType;
  label: string;
  symbol: string;
}

const CATEGORIES: { name: string; items: PaletteItem[] }[] = [
  {
    name: "Sources",
    items: [
      { type: "voltage_source", label: "DC Voltage", symbol: "V" },
      { type: "current_source", label: "Current", symbol: "I" },
    ],
  },
  {
    name: "Passive",
    items: [
      { type: "resistor", label: "Resistor", symbol: "R" },
      { type: "capacitor", label: "Capacitor", symbol: "C" },
      { type: "inductor", label: "Inductor", symbol: "L" },
    ],
  },
  {
    name: "Semiconductors",
    items: [
      { type: "diode", label: "Diode", symbol: "D" },
      { type: "led", label: "LED", symbol: "LED" },
    ],
  },
  {
    name: "Control",
    items: [
      { type: "switch", label: "Switch", symbol: "SW" },
    ],
  },
  {
    name: "Reference",
    items: [
      { type: "ground", label: "Ground", symbol: "GND" },
    ],
  },
  {
    name: "Measurement",
    items: [
      { type: "voltmeter", label: "Voltmeter", symbol: "V" },
      { type: "ammeter", label: "Ammeter", symbol: "A" },
    ],
  },
];

interface ComponentPaletteProps {
  selectedType: ComponentType | null;
  onSelect: (type: ComponentType) => void;
}

function ComponentPalette({ selectedType, onSelect }: ComponentPaletteProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Sources", "Passive", "Semiconductors", "Control", "Reference", "Measurement"]));

  function toggleCategory(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="sim-palette">
      <p className="eyebrow">COMPONENT LIBRARY</p>
      {CATEGORIES.map((cat) => (
        <div key={cat.name} className="sim-palette-cat">
          <button
            className="sim-palette-cat-btn"
            onClick={() => toggleCategory(cat.name)}
          >
            <span>{cat.name}</span>
            <span className="sim-palette-arrow">{expanded.has(cat.name) ? "▾" : "▸"}</span>
          </button>
          {expanded.has(cat.name) && (
            <div className="sim-palette-items">
              {cat.items.map((item) => (
                <button
                  key={item.type}
                  className={`sim-palette-item ${selectedType === item.type ? "sim-palette-item--active" : ""}`}
                  onClick={() => onSelect(item.type)}
                >
                  <span className="sim-palette-symbol">{item.symbol}</span>
                  <span className="sim-palette-label">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ComponentPalette;
