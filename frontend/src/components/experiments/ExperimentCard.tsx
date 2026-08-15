import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import type { Experiment } from "../../types/experiment";

type ExperimentCardProps = {
  experiment: Experiment;
};

function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <Link
      to={`/experiments/${experiment.id}`}
      className="experiment-card-link"
    >
      <Card className="experiment-card">
        <div className="feature-icon">
          <FlaskConical size={24} />
        </div>

        <h3>{experiment.title}</h3>

        <p>{experiment.short_description}</p>

        <div className="experiment-meta">
          <Badge variant="default">{experiment.difficulty}</Badge>

          <span>{experiment.duration_minutes} min</span>
        </div>
      </Card>
    </Link>
  );
}

export default ExperimentCard;