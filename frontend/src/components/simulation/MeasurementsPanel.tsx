/**
 * Measurements panel: simulation status + global / per-component readings.
 * Values come only from SimulationResult.measurements.
 */
import type { SimulationResult } from "./engine";

interface MeasurementsPanelProps {
  result: SimulationResult | null;
}

function formatCurrent(a: number): string {
  if (Math.abs(a) < 0.001) return `${(a * 1e6).toFixed(2)} µA`;
  if (Math.abs(a) < 1) return `${(a * 1000).toFixed(2)} mA`;
  return `${a.toFixed(4)} A`;
}

function friendlyComponentName(componentId: string, type: string): string {
  if (componentId.startsWith("__")) {
    return type.replace(/_/g, " ");
  }
  // Prefer short editor ids like R1 / V1 when present; otherwise type + short suffix.
  if (/^[A-Za-z]+\d+$/.test(componentId)) return componentId;
  const short = componentId.replace(/^comp_[a-z0-9]+_/i, "").slice(-6);
  const kind = type.replace(/_/g, " ");
  return short ? `${kind} (${short})` : kind;
}

function MeasurementsPanel({ result }: MeasurementsPanelProps) {
  if (!result) {
    return <p className="sim-measurements-empty">Run simulation to see measurements.</p>;
  }

  const statusLabel = result.status.toUpperCase();
  const measurements = result.measurements;

  if (!measurements) {
    return (
      <div className="sim-measurements-panel">
        <div className="sim-measurement-row">
          <span className="sim-measurement-label">Simulation Status</span>
          <span className="sim-measurement-value">{statusLabel}</span>
        </div>
        {result.error && <p className="sim-instrument-error">{result.error}</p>}
        {result.validation?.errors?.[0] && (
          <p className="sim-instrument-error" role="alert">
            {result.validation.errors[0].code}: {result.validation.errors[0].message}
          </p>
        )}
        <p className="sim-measurements-empty">No measurements available.</p>
      </div>
    );
  }

  const physical = measurements.componentMeasurements.filter(
    (c) => !c.componentId.startsWith("__"),
  );

  const globalRows = [
    { label: "Simulation Status", value: statusLabel },
    { label: "Total Voltage", value: `${measurements.totalVoltage.toFixed(3)} V` },
    { label: "Total Current", value: formatCurrent(measurements.totalCurrent) },
    { label: "Total Power", value: `${measurements.totalPower.toFixed(4)} W` },
    {
      label: "Equivalent Resistance",
      value: `${measurements.equivalentResistance.toFixed(2)} Ω`,
    },
  ];

  return (
    <div className="sim-measurements-panel">
      <div className="sim-measurements-block">
        <h4 className="sim-measurements-block-title">Totals</h4>
        <div className="sim-measurements-grid">
          {globalRows.map((row) => (
            <div key={row.label} className="sim-measurement-row">
              <span className="sim-measurement-label">{row.label}</span>
              <span className="sim-measurement-value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sim-measurements-block">
        <h4 className="sim-measurements-block-title">Component Measurements</h4>
        {physical.length === 0 ? (
          <p className="sim-measurements-empty">No component measurements.</p>
        ) : (
          <div className="sim-component-measurements">
            <div className="sim-comp-measurement sim-comp-measurement--head">
              <span>Component</span>
              <span>V</span>
              <span>I</span>
              <span>P</span>
              <span>R</span>
            </div>
            {physical.map((comp) => (
              <div key={comp.componentId} className="sim-comp-measurement">
                <span className="sim-comp-id" title={comp.componentId}>
                  {friendlyComponentName(comp.componentId, comp.type)}
                </span>
                <span>{comp.voltage.toFixed(3)} V</span>
                <span>{formatCurrent(comp.current)}</span>
                <span>{comp.power.toFixed(4)} W</span>
                <span>
                  {comp.resistance !== undefined ? `${comp.resistance.toFixed(2)} Ω` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeasurementsPanel;
