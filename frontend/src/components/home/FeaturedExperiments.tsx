import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import SectionHeading from "../ui/SectionHeading";
import type { Experiment } from "../../types/experiment";

interface FeaturedExperimentsProps {
  experiments: Experiment[];
  isLoading: boolean;
}

const difficultyVariant: Record<string, "success" | "warning" | "danger"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
};

function FeaturedExperiments({ experiments, isLoading }: FeaturedExperimentsProps) {
  const featured = experiments.slice(0, 6);

  return (
    <section className="home-section">
      <SectionHeading
        eyebrow="FEATURED EXPERIMENTS"
        title="Start with the fundamentals"
        description="Explore electrical engineering experiments designed to build your understanding step by step."
      />

      {isLoading && (
        <div className="home-featured-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="home-exp-card">
              <div className="ui-skeleton ui-skeleton-text" style={{ width: "60%", height: 18 }} />
              <div className="ui-skeleton ui-skeleton-text" style={{ width: "90%", marginTop: 8 }} />
              <div className="ui-skeleton ui-skeleton-text" style={{ width: "40%", marginTop: 12 }} />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && featured.length > 0 && (
        <>
          <div className="home-featured-grid">
            {featured.map((exp) => (
              <Link
                key={exp.id}
                to={`/experiments/${exp.id}`}
                className="home-exp-card-link"
              >
                <Card className="home-exp-card" hoverable>
                  <div className="home-exp-card-icon">⚡</div>
                  <h3 className="home-exp-card-title">{exp.title}</h3>
                  <p className="home-exp-card-desc">
                    {exp.short_description || exp.description || "Explore this experiment."}
                  </p>
                  <div className="home-exp-card-meta">
                    <Badge variant={difficultyVariant[exp.difficulty] || "default"} size="sm">
                      {exp.difficulty}
                    </Badge>
                    <span className="home-exp-card-time">
                      <Clock size={12} />
                      {exp.duration_minutes} min
                    </span>
                  </div>
                  <span className="home-exp-card-cta">
                    Start Experiment <ArrowRight size={14} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>

          <div className="home-section-action">
            <Button to="/experiments" variant="secondary">
              View All Experiments
            </Button>
          </div>
        </>
      )}

      {!isLoading && featured.length === 0 && (
        <Card className="home-empty-state">
          <h3>Experiments unavailable</h3>
          <p>Featured experiments could not be loaded right now.</p>
          <div className="home-section-action">
            <Button to="/experiments" variant="secondary">
              View Experiments
            </Button>
          </div>
        </Card>
      )}
    </section>
  );
}

export default FeaturedExperiments;
