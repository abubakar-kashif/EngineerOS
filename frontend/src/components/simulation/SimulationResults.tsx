import { CheckCircle2, AlertTriangle } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import type { SimulationResult as SimResultType, SimulationStatus } from "../../types/simulation";

type SimulationResultsProps = {
  result: SimResultType | null;
  status: SimulationStatus;
  error: string;
};

function SimulationResults({ result, status, error }: SimulationResultsProps) {
  const isActive = status === "running" || status === "completed";

  return (
    <Card className="sim-results-card">
      <div className="sim-results-header">
        <div>
          <h2 className="sim-results-title">Simulation Results</h2>
          <p className="sim-results-subtitle">Calculated electrical values</p>
        </div>
        <Badge variant={isActive ? "info" : "default"}>
          {isActive ? (status === "completed" ? "Completed" : "Running") : "Stopped"}
        </Badge>
      </div>

      {error && (
        <div className="sim-results-error" role="alert">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {result ? (
        <>
          <div className="sim-results-grid">
            <ResultItem label="Total Resistance" value={`${result.totalResistance.toFixed(3)} Ω`} />
            <ResultItem label="Current" value={`${result.current.toFixed(3)} A`} />
            <ResultItem label="Power" value={`${result.power.toFixed(3)} W`} />
          </div>

          <div className="sim-results-formula">
            <strong>Formula:</strong> I = V / R
          </div>

          {status === "completed" && (
            <div className="sim-results-status">
              <CheckCircle2 size={14} className="sim-results-ok-icon" />
              <span>Within expected range</span>
            </div>
          )}
        </>
      ) : (
        <p className="sim-results-empty">
          {status === "error"
            ? "Simulation could not be completed. Check your inputs and try again."
            : "Run the simulation to view calculated results."}
        </p>
      )}
    </Card>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="sim-result-item">
      <span className="sim-result-item-label">{label}</span>
      <strong className="sim-result-item-value">{value}</strong>
    </div>
  );
}

export default SimulationResults;
