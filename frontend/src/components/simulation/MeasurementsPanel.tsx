import { Activity } from "lucide-react";
import Card from "../ui/Card";
import type { SimulationResult, SimulationStatus } from "../../types/simulation";

interface MeasurementsPanelProps {
  result: SimulationResult | null;
  status: SimulationStatus;
}

function formatValue(value: number, unit: string): string {
  if (unit === "A" && value < 1) {
    return `${(value * 1000).toFixed(2)} mA`;
  }
  if (unit === "W" && value < 1) {
    return `${(value * 1000).toFixed(2)} mW`;
  }
  return `${value.toFixed(3)} ${unit}`;
}

function MeasurementsPanel({ result, status }: MeasurementsPanelProps) {
  const isActive = status === "running" || status === "completed";

  const measurements = result
    ? [
        { label: "Voltage", value: result.current * result.totalResistance, unit: "V" },
        { label: "Current", value: result.current, unit: "A" },
        { label: "Resistance", value: result.totalResistance, unit: "Ω" },
        { label: "Power", value: result.power, unit: "W" },
      ]
    : [];

  return (
    <Card className="sim-measurements">
      <div className="sim-measurements-inner">
        <div className="sim-measurements-header">
          <Activity size={16} />
          <span>Measurements</span>
        </div>

        {!result && (
          <p className="sim-measurements-empty">
            {status === "ready"
              ? "Run the simulation to see measurements."
              : status === "error"
                ? "Unable to compute measurements."
                : "Waiting for results..."}
          </p>
        )}

        {result && (
          <div className="sim-measurements-list">
            {measurements.map((m) => (
              <div key={m.label} className="sim-measurement-row">
                <span className="sim-measurement-label">{m.label}</span>
                <span className={`sim-measurement-value ${isActive ? "sim-measurement-value--active" : ""}`}>
                  {formatValue(m.value, m.unit)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default MeasurementsPanel;
