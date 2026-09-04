/**
 * Display simulation results in a structured format.
 */
import type { SimulationResult } from "./engine";

interface SimulationResultsProps {
  result: SimulationResult | null;
}

function SimulationResults({ result }: SimulationResultsProps) {
  if (!result) return <p className="sim-results-empty">Run a simulation to see results.</p>;

  if (result.status === "invalid" || result.status === "failed") {
    return (
      <div className="sim-results-error">
        <h4>Simulation {result.status}</h4>
        <p>{result.error || "Invalid circuit or solver error."}</p>
        {result.validation && (
          <div className="sim-results-validation">
            <p>Validation errors: {result.validation.errors?.length || 0}</p>
          </div>
        )}
      </div>
    );
  }

  const measurements = result.measurements;
  if (!measurements) return <p className="sim-results-empty">No measurements returned.</p>;

  return (
    <div className="sim-results">
      <h4>Simulation Results</h4>
      <div className="sim-results-grid">
        <div className="sim-result-item">
          <span className="sim-result-label">Total Voltage</span>
          <span className="sim-result-value">{measurements.totalVoltage.toFixed(3)} V</span>
        </div>
        <div className="sim-result-item">
          <span className="sim-result-label">Total Current</span>
          <span className="sim-result-value">{measurements.totalCurrent.toFixed(4)} A</span>
        </div>
        <div className="sim-result-item">
          <span className="sim-result-label">Total Power</span>
          <span className="sim-result-value">{measurements.totalPower.toFixed(4)} W</span>
        </div>
        <div className="sim-result-item">
          <span className="sim-result-label">Equivalent Resistance</span>
          <span className="sim-result-value">{measurements.equivalentResistance.toFixed(2)} Ω</span>
        </div>
      </div>

      <h5 style={{ marginTop: 16 }}>Component Details</h5>
      <div className="sim-component-results">
        {measurements.componentMeasurements.map((comp) => (
          <div key={comp.componentId} className="sim-comp-result-row">
            <span className="sim-comp-name">{comp.componentId}</span>
            <span className="sim-comp-details">
              {comp.voltage.toFixed(3)} V &nbsp; {comp.current.toFixed(4)} A &nbsp; {comp.power.toFixed(4)} W
              {comp.resistance !== undefined && ` (${comp.resistance.toFixed(2)} Ω)`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SimulationResults;