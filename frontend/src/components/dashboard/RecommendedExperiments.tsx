import { Link } from "react-router-dom";
import { ArrowRight, Clock, Play, Sparkles } from "lucide-react";
import Badge from "../ui/Badge";
import type { Experiment } from "../../types/experiment";
import type { DashboardRecommendation } from "../../types/dashboard";

type RecommendedExperimentsProps = {
  continueLearning: Experiment | null;
  nextRecommended: DashboardRecommendation[];
};

/**
 * "What should I do next?" — the experiment the user left unfinished,
 * plus fresh suggestions whose prerequisites are satisfied.
 */
function RecommendedExperiments({
  continueLearning,
  nextRecommended,
}: RecommendedExperimentsProps) {
  return (
    <section className="dashboard-recommendations-zone" aria-label="Recommended experiments">
      {continueLearning && (
        <div className="dashboard-continue-card">
          <div className="dashboard-continue-head">
            <span className="dashboard-continue-kicker">
              <Play size={13} /> Continue learning
            </span>
            <Badge variant="info" size="sm">
              In Progress
            </Badge>
          </div>

          <h3 className="dashboard-continue-title">{continueLearning.title}</h3>
          <p className="dashboard-continue-description">
            {continueLearning.short_description ?? continueLearning.description ?? ""}
          </p>

          <div className="dashboard-continue-meta">
            <Badge variant="default" size="sm">
              {continueLearning.difficulty}
            </Badge>
            <span className="dashboard-continue-duration">
              <Clock size={13} /> {continueLearning.duration_minutes} min
            </span>
          </div>

          <Link to={`/experiments/${continueLearning.id}`} className="dashboard-continue-cta">
            Resume experiment <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="dashboard-recommendations">
        <div className="dashboard-recommendations-head">
          <h2 className="dashboard-panel-title">
            <Sparkles size={15} /> Recommended next
          </h2>
          <Link to="/experiments" className="dashboard-panel-link">
            Browse all <ArrowRight size={13} />
          </Link>
        </div>

        {nextRecommended.length === 0 ? (
          <p className="dashboard-activity-empty">
            You have started every experiment — keep completing them to unlock the rest.
          </p>
        ) : (
          <div className="dashboard-recommend-grid">
            {nextRecommended.map(({ experiment, reason }) => (
              <Link
                key={experiment.id}
                to={`/experiments/${experiment.id}`}
                className="dashboard-recommend-card"
              >
                <div className="dashboard-recommend-card-head">
                  <Badge variant="default" size="sm">
                    {experiment.difficulty}
                  </Badge>
                  <span className="dashboard-continue-duration">
                    <Clock size={12} /> {experiment.duration_minutes} min
                  </span>
                </div>
                <h3 className="dashboard-recommend-title">{experiment.title}</h3>
                <p className="dashboard-recommend-reason">{reason}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default RecommendedExperiments;
