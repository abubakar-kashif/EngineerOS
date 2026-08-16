import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";
import { getExperimentById } from "../services/experimentService";
import type { Experiment } from "../types/experiment";

function ExperimentDetailsPage() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExperiment() {
      if (!experimentId) {
        setLoading(false);
        setError("Experiment ID is missing.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getExperimentById(experimentId);

        if (!data) {
          setExperiment(null);
          return;
        }

        setExperiment(data);
      } catch {
        setExperiment(null);
        setError(
          "Unable to load this experiment. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadExperiment();
  }, [experimentId]);

  if (loading) {
    return (
      <main className="page-container">
        <LoadingState message="Loading experiment..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-container">
        <ErrorState message={error} />

        <div className="page-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  if (!experiment) {
    return (
      <main className="page-container">
        <section className="page-state">
          <p className="eyebrow">EXPERIMENT</p>

          <h1>Experiment Not Found</h1>

          <p>
            We could not find the experiment you are looking for.
          </p>

          <div className="page-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/experiments")}
            >
              Back to Experiments
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container">
      {/* BREADCRUMB */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/experiments">Experiments</Link>
        <span>/</span>
        <span>{experiment.title}</span>
      </nav>

      {/* HEADER */}
      <section className="details-header">
        <div className="details-header-content">
          <p className="eyebrow">EXPERIMENT</p>

          <h1>{experiment.title}</h1>

          <p className="details-description">
            {experiment.description ||
              experiment.short_description}
          </p>

          <div className="details-meta">
            <span className="ui-badge">
              {experiment.difficulty}
            </span>

            <span className="ui-badge">
              {experiment.category}
            </span>

            <span className="details-duration">
              {experiment.duration_minutes} min
            </span>
          </div>
        </div>
      </section>

      {/* OBJECTIVE */}
      {experiment.objective && (
        <section className="details-section">
          <Card>
            <div className="details-card-content">
              <p className="eyebrow">OBJECTIVE</p>

              <h2>Learning Objective</h2>

              <p>{experiment.objective}</p>
            </div>
          </Card>
        </section>
      )}

      {/* THEORY */}
      {experiment.theory && (
        <section className="details-section">
          <Card>
            <div className="details-card-content">
              <p className="eyebrow">THEORY</p>

              <h2>Theory</h2>

              <p>{experiment.theory}</p>
            </div>
          </Card>
        </section>
      )}

      {/* COMPONENTS */}
      {experiment.components &&
        experiment.components.length > 0 && (
          <section className="details-section">
            <Card>
              <div className="details-card-content">
                <p className="eyebrow">COMPONENTS</p>

                <h2>Required Components</h2>

                <ul className="details-list">
                  {experiment.components.map((component) => (
                    <li key={component}>{component}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </section>
        )}

      {/* FORMULA */}
      <section className="details-section">
        <Card>
          <div className="details-card-content">
            <p className="eyebrow">EXPERIMENT</p>

            <h2>Experiment Overview</h2>

            <p>
              Review the experiment theory and objective before
              starting the practical workspace.
            </p>
          </div>
        </Card>
      </section>

      {/* PROCEDURE / OUTCOME PLACEHOLDER */}
      <section className="details-section details-grid">
        <Card>
          <div className="details-card-content">
            <p className="eyebrow">PROCEDURE</p>

            <h2>Procedure</h2>

            <p>
              Follow the experiment instructions and observe the
              expected circuit behavior in the workspace.
            </p>
          </div>
        </Card>

        <Card>
          <div className="details-card-content">
            <p className="eyebrow">EXPECTED OUTCOME</p>

            <h2>Expected Outcome</h2>

            <p>
              Complete the experiment and compare your observations
              with the expected electrical behavior.
            </p>
          </div>
        </Card>
      </section>

      {/* START EXPERIMENT */}
      <section className="details-cta">
        <Card>
          <div className="details-cta-content">
            <div>
              <p className="eyebrow">READY TO START?</p>

              <h2>Start the Experiment</h2>

              <p>
                Open the experiment workspace to continue learning
                through practical circuit work.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() =>
                navigate(
                  `/experiments/${experiment.id}/workspace`
                )
              }
            >
              Start Experiment
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default ExperimentDetailsPage;