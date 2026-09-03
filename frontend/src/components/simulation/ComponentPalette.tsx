/**
 * Component palette: drag-and-drop (or click) to add components to the canvas.
 */
import type { ComponentType } from "../editorTypes";

interface ComponentPaletteProps {
  onSelectType: (type: ComponentType) => void;
  selectedType: ComponentType | null;
}

const COMPONENTS: { type: ComponentType; label: string; icon: string }[] = [
  { type: "resistor", label: "Resistor", icon: "R" },
  { type: "capacitor", label: "Capacitor", icon: "C" },
  { type: "inductor", label: "Inductor", icon: "L" },
  { type: "diode", label: "Diode", icon: "D" },
  { type: "led", label: "LED", icon: "LED" },
  { type: "switch", label: "Switch", icon: "SW" },
  { type: "voltage_source", label: "Voltage Source", icon: "V" },
  { type: "current_source", label: "Current Source", icon: "I" },
  { type: "ground", label: "Ground", icon: "GND" },
  { type: "voltmeter", label: "Voltmeter", icon: "VM" },
  { type: "ammeter", label: "Ammeter", icon: "AM" },
];

function ComponentPalette({ onSelectType, selectedType }: ComponentPaletteProps) {
  return (
    <div className="sim-palette">
      <h4 className="sim-palette-title">Components</h4>
      <div className="sim-palette-grid">
        {COMPONENTS.map((comp) => (
          <button
            key={comp.type}
            className={`sim-palette-item ${selectedType === comp.type ? "sim-palette-item--selected" : ""}`}
            onClick={() => onSelectType(comp.type)}
            title={comp.label}
          >
            <span className="sim-palette-icon">{comp.icon}</span>
            <span className="sim-palette-label">{comp.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ComponentPalette;