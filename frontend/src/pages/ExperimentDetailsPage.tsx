import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import SectionHeading from "../components/ui/SectionHeading";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { getExperimentById } from "../services/experimentService";
import type { Experiment } from "../types/experiment";

function ExperimentDetailsPage() {
  const { experimentId } = useParams<{ experimentId: string }>();

  const [experiment, setExperiment] = useState<Experiment | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExperiment() {
      if (!experimentId) {
        setLoading(false);
        return;
      }

      const data = await getExperimentById(experimentId);
      setExperiment(data);
      setLoading(false);
    }

    loadExperiment();
  }, [experimentId]);

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading experiment...</p>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="page-container">
        <SectionHeading
          eyebrow="EXPERIMENT"
          title="Experiment not found"
          description="The experiment you are looking for does not exist."
        />

        <Link to="/experiments">
          <Button variant="secondary">Back to Experiments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <SectionHeading
        eyebrow={experiment.category}
        title={experiment.title}
        description={experiment.short_description}
      />

      <div className="experiment-details">
        <div className="experiment-details-meta">
          <Badge variant="default">{experiment.difficulty}</Badge>

          <span>{experiment.duration_minutes} minutes</span>
        </div>

        <div className="experiment-details-card">
          <h2>About this experiment</h2>

          <p>{experiment.short_description}</p>

          <p>
            This experiment will help you understand the key concepts behind{" "}
            {experiment.title}.
          </p>

          <Link to={`/experiments/${experiment.id}/workspace`}>
            <Button variant="primary">Open Workspace</Button>
          </Link>
        </div>

        <Link to="/experiments">
          <Button variant="ghost">← Back to Experiments</Button>
        </Link>
      </div>
    </div>
  );
}

export default ExperimentDetailsPage;