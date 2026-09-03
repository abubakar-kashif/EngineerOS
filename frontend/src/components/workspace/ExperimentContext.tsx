import Card from "../ui/Card";
import type { Experiment } from "../../types/experiment";

interface ExperimentContextProps {
  experiment: Experiment;
}

function ExperimentContext({ experiment }: ExperimentContextProps) {
  return (
    <Card className="ws-context-card">
      <div className="ws-context">
        <p className="eyebrow">OBJECTIVE</p>
        <p className="ws-context-text">
          {experiment.objective || "Explore this experiment through simulation."}
        </p>
      </div>
    </Card>
  );
}

export default ExperimentContext;
