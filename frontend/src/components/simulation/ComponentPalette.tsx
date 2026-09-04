/**
 * Component palette: click to enter placement mode for the freeform canvas.
 */
import type { ComponentType } from "./editorTypes";

interface ComponentPaletteProps {
  onSelectType: (type: ComponentType) => void;
  selectedType: ComponentType | null;
}

const COMPONENTS: { type: ComponentType; label: string; icon: string }[] = [
  { type: "voltage_source", label: "Voltage Source", icon: "V" },
  { type: "current_source", label: "Current Source", icon: "I" },
  { type: "resistor", label: "Resistor", icon: "R" },
  { type: "capacitor", label: "Capacitor", icon: "C" },
  { type: "inductor", label: "Inductor", icon: "L" },
  { type: "diode", label: "Diode", icon: "D" },
  { type: "led", label: "LED", icon: "LED" },
  { type: "ground", label: "Ground", icon: "GND" },
  { type: "switch", label: "Switch", icon: "SW" },
  { type: "voltmeter", label: "Voltmeter", icon: "VM" },
  { type: "ammeter", label: "Ammeter", icon: "AM" },
];

function ComponentPalette({ onSelectType, selectedType }: ComponentPaletteProps) {
  return (
    <div className="sim-palette">
      <h4 className="sim-palette-title">Components</h4>
      <div className="sim-palette-items">
        {COMPONENTS.map((comp) => (
          <button
            key={comp.type}
            type="button"
            className={`sim-palette-item ${
              selectedType === comp.type ? "sim-palette-item--active" : ""
            }`}
            onClick={() => onSelectType(comp.type)}
            title={comp.label}
          >
            <span className="sim-palette-symbol">{comp.icon}</span>
            <span className="sim-palette-label">{comp.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ComponentPalette;
