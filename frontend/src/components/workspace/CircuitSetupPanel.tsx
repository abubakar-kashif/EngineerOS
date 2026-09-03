import { Zap, Circle, Minus } from "lucide-react";
import Card from "../ui/Card";
import type { SimulationMode } from "../../types/simulation";

interface CircuitSetupPanelProps {
  mode: SimulationMode;
  voltage: string;
  r1: string;
  r2: string;
  onVoltageChange: (v: string) => void;
  onR1Change: (v: string) => void;
  onR2Change: (v: string) => void;
  onModeChange: (m: SimulationMode) => void;
}

const componentIcons: Record<string, typeof Zap> = {
  voltage_source: Zap,
  resistor: Minus,
  ground: Circle,
};

function CircuitSetupPanel({
  mode,
  voltage,
  r1,
  r2,
  onVoltageChange,
  onR1Change,
  onR2Change,
  onModeChange,
}: CircuitSetupPanelProps) {
  const components = [
    { id: "voltage_source", label: "Voltage Source", icon: componentIcons.voltage_source, value: voltage, unit: "V" },
    { id: "r1", label: "Resistor R1", icon: componentIcons.resistor, value: r1, unit: "Ω" },
    ...(mode === "parallel"
      ? [{ id: "r2", label: "Resistor R2", icon: componentIcons.resistor, value: r2, unit: "Ω" }]
      : []),
    { id: "ground", label: "Ground", icon: componentIcons.ground, value: "0", unit: "V" },
  ];

  return (
    <div className="ws-setup">
      {/* Mode selector */}
      <Card className="ws-setup-card">
        <div className="ws-setup-section">
          <p className="eyebrow">CIRCUIT MODE</p>
          <h3 className="ws-setup-title">Select Configuration</h3>
          <div className="ws-setup-modes" role="group" aria-label="Circuit mode">
            <button
              className={`ws-mode-btn ${mode === "series" ? "ws-mode-btn--active" : ""}`}
              onClick={() => onModeChange("series")}
              aria-pressed={mode === "series"}
            >
              Series
            </button>
            <button
              className={`ws-mode-btn ${mode === "parallel" ? "ws-mode-btn--active" : ""}`}
              onClick={() => onModeChange("parallel")}
              aria-pressed={mode === "parallel"}
            >
              Parallel
            </button>
          </div>
        </div>
      </Card>

      {/* Component cards */}
      <Card className="ws-setup-card">
        <div className="ws-setup-section">
          <p className="eyebrow">CIRCUIT COMPONENTS</p>
          <h3 className="ws-setup-title">Configure Parameters</h3>

          <div className="ws-comp-cards">
            {components.map((comp) => {
              const Icon = comp.icon;
              const isEditable = comp.id !== "ground";
              const setter =
                comp.id === "voltage_source"
                  ? onVoltageChange
                  : comp.id === "r1"
                    ? onR1Change
                    : comp.id === "r2"
                      ? onR2Change
                      : undefined;

              return (
                <div key={comp.id} className="ws-comp-card">
                  <div className="ws-comp-card-header">
                    <Icon size={16} className="ws-comp-icon" />
                    <span className="ws-comp-label">{comp.label}</span>
                  </div>
                  {isEditable ? (
                    <div className="ws-comp-input-wrap">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        className="ws-comp-input"
                        value={comp.value}
                        onChange={(e) => setter?.(e.target.value)}
                        aria-label={`${comp.label} value in ${comp.unit}`}
                      />
                      <span className="ws-comp-unit">{comp.unit}</span>
                    </div>
                  ) : (
                    <div className="ws-comp-static">
                      <span>{comp.value}</span>
                      <span className="ws-comp-unit">{comp.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Flow hint */}
      <div className="ws-setup-flow">
        <span className="ws-flow-step">Components</span>
        <span className="ws-flow-arrow">→</span>
        <span className="ws-flow-step">Parameters</span>
        <span className="ws-flow-arrow">→</span>
        <span className="ws-flow-step">Connections</span>
        <span className="ws-flow-arrow">→</span>
        <span className="ws-flow-step ws-flow-step--highlight">Ready to simulate</span>
      </div>
    </div>
  );
}

export default CircuitSetupPanel;
