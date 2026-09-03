import { History as HistoryIcon, CheckCircle2, XCircle, Circle } from "lucide-react";
import Card from "../ui/Card";
import type { SimulationRun } from "../../types/simulation";

interface SimulationHistoryProps {
  runs: SimulationRun[];
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 size={12} className="sim-hist-icon sim-hist-icon--ok" />;
  if (status === "error") return <XCircle size={12} className="sim-hist-icon sim-hist-icon--err" />;
  return <Circle size={12} className="sim-hist-icon" />;
}

function SimulationHistory({ runs }: SimulationHistoryProps) {
  return (
    <Card className="sim-history">
      <div className="sim-history-inner">
        <div className="sim-history-header">
          <HistoryIcon size={14} />
          <span>Previous Runs</span>
        </div>

        {runs.length === 0 ? (
          <p className="sim-history-empty">No previous runs yet.</p>
        ) : (
          <div className="sim-history-list">
            {runs.map((run) => (
              <div key={run.id} className="sim-history-row">
                <StatusIcon status={run.status} />
                <span className="sim-history-label">Run #{run.id}</span>
                <span className="sim-history-time">{run.timestamp}</span>
                {run.result && (
                  <span className="sim-history-value">
                    {run.result.current.toFixed(3)} A
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default SimulationHistory;
