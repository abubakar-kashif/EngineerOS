import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ErrorState from "../components/common/ErrorState";
import LoadingState from "../components/common/LoadingState";

import { getExperimentById } from "../services/experimentService";
import { mockExperiments } from "../data/mockExperiments";
import type { Experiment } from "../types/experiment";

function ExperimentDetailsPage() {
  const { experimentId } = useParams<{
    experimentId: string;
  }>();

  const navigate = useNavigate();

  const [experiment, setExperiment] =
    useState<Experiment | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

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
          const mockExperiment = mockExperiments.find(
            (item) =>
              item.id === experimentId ||
              item.slug === experimentId,
          );

          if (mockExperiment) {
            setExperiment(mockExperiment);
          } else {
            setExperiment(null);
          }

          return;
        }

        setExperiment(data);
      } catch (err) {
        console.error(
          "Failed to load experiment:",
          err,
        );

        /*
         * Development fallback:
         * If the backend request fails, use the local
         * mock experiment data so the frontend remains
         * usable during Week 1 integration.
         */
        const mockExperiment = mockExperiments.find(
          (item) =>
            item.id === experimentId ||
            item.slug === experimentId,
        );

        if (mockExperiment) {
          setExperiment(mockExperiment);
          setError(null);
        } else {
          setExperiment(null);
          setError(
            "Unable to load this experiment. Please try again.",
          );
        }
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
            We could not find the experiment you are
            looking for.
          </p>

          <div className="page-actions">
            <Button
              type="button"
              variant="primary"
              onClick={() =>
                navigate("/experiments")
              }
            >
              Back to Experiments
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const description =
    experiment.description ||
    experiment.short_description ||
    "Explore this electrical engineering experiment.";

  return (
    <main className="page-container">
      {/* =====================================================
          BREADCRUMB
      ===================================================== */}
      <nav
        className="breadcrumb"
        aria-label="Breadcrumb"
      >
        <Link to="/">Home</Link>

        <span>/</span>

        <Link to="/experiments">
          Experiments
        </Link>

        <span>/</span>

        <span>{experiment.title}</span>
      </nav>

      {/* =====================================================
          HEADER
      ===================================================== */}
      <section className="details-header">
        <div className="details-header-content">
          <p className="eyebrow">EXPERIMENT</p>

          <h1>{experiment.title}</h1>

          <p className="details-description">
            {description}
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

            <span className="ui-badge">
              {experiment.status}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          OBJECTIVE
      ===================================================== */}
      {experiment.objective && (
        <section className="details-section">
          <Card>
            <div className="details-card-content">
              <p className="eyebrow">
                OBJECTIVE
              </p>

              <h2>Learning Objective</h2>

              <p>{experiment.objective}</p>
            </div>
          </Card>
        </section>
      )}

      {/* =====================================================
          THEORY
      ===================================================== */}
      {experiment.theory && (
        <section className="details-section">
          <Card>
            <div className="details-card-content">
              <p className="eyebrow">
                THEORY
              </p>

              <h2>Theory</h2>

              <p>{experiment.theory}</p>
            </div>
          </Card>
        </section>
      )}

      {/* =====================================================
          EXPERIMENT INFORMATION
      ===================================================== */}
      <section className="details-section">
        <Card>
          <div className="details-card-content">
            <p className="eyebrow">
              EXPERIMENT INFORMATION
            </p>

            <h2>Experiment Overview</h2>

            <div className="details-grid">
              <div>
                <p className="eyebrow">
                  CATEGORY
                </p>

                <p>{experiment.category}</p>
              </div>

              <div>
                <p className="eyebrow">
                  DIFFICULTY
                </p>

                <p>{experiment.difficulty}</p>
              </div>

              <div>
                <p className="eyebrow">
                  DURATION
                </p>

                <p>
                  {experiment.duration_minutes} minutes
                </p>
              </div>

              <div>
                <p className="eyebrow">
                  STATUS
                </p>

                <p>{experiment.status}</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* =====================================================
          START EXPERIMENT
      ===================================================== */}
      <section className="details-cta">
        <Card>
          <div className="details-cta-content">
            <div>
              <p className="eyebrow">
                READY TO START?
              </p>

              <h2>Start the Experiment</h2>

              <p>
                Open the experiment workspace to
                continue learning through practical
                circuit work.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() =>
                navigate(
                  `/experiments/${experiment.id}/workspace`,
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