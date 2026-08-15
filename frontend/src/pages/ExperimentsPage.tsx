import { useEffect, useState } from "react";
import SectionHeading from "../components/ui/SectionHeading";
import ExperimentCard from "../components/experiments/ExperimentCard";
import { getExperiments } from "../services/experimentService";
import type { Experiment } from "../types/experiment";

function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExperiments() {
      const data = await getExperiments();
      setExperiments(data);
      setLoading(false);
    }

    loadExperiments();
  }, []);

  return (
    <div className="page-container">
      <SectionHeading
        eyebrow="EXPERIMENTS"
        title="Explore electrical engineering experiments"
        description="Learn concepts by working through practical electrical engineering experiments."
      />

      {loading ? (
        <p>Loading experiments...</p>
      ) : (
        <div className="feature-grid">
          {experiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExperimentsPage;