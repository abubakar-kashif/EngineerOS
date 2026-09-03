/**
 * Measurements panel: displays global and component measurements from simulation result.
 */
import type { SimulationResult } from "./engine";

interface MeasurementsPanelProps {
  result: SimulationResult | null;
}

function MeasurementsPanel({ result }: MeasurementsPanelProps) {
  if (!result) return <p className="sim-measurements-empty">Run simulation to see measurements.</p>;
  const measurements = result.measurements;
  if (!measurements) return <p className="sim-measurements-empty">No measurements available.</p>;

  const globalRows = [
    { label: "Total Voltage", value: `${measurements.totalVoltage.toFixed(3)} V` },
    { label: "Total Current", value: `${measurements.totalCurrent.toFixed(4)} A` },
    { label: "Total Power", value: `${measurements.totalPower.toFixed(4)} W` },
    { label: "Equivalent Resistance", value: `${measurements.equivalentResistance.toFixed(2)} Ω` },
  ];

  return (
    <div className="sim-measurements-panel">
      <h4>Global Measurements</h4>
      <div className="sim-measurements-grid">
        {globalRows.map((row) => (
          <div key={row.label} className="sim-measurement-row">
            <span className="sim-measurement-label">{row.label}</span>
            <span className="sim-measurement-value">{row.value}</span>
          </div>
        ))}
      </div>

      <h4 style={{ marginTop: 16 }}>Component Measurements</h4>
      {measurements.componentMeasurements.length === 0 ? (
        <p>No component measurements.</p>
      ) : (
        <div className="sim-component-measurements">
          {measurements.componentMeasurements.map((comp: any) => (
            <div key={comp.componentId} className="sim-comp-measurement">
              <span className="sim-comp-id">{comp.componentId}</span>
              <span className="sim-comp-values">
                {comp.voltage.toFixed(3)} V &nbsp; {comp.current.toFixed(4)} A &nbsp; {comp.power.toFixed(4)} W
                {comp.resistance !== undefined && ` (${comp.resistance.toFixed(2)} Ω)`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MeasurementsPanel;