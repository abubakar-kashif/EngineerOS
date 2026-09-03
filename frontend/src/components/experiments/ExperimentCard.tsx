import { Link } from "react-router-dom";
import { ArrowRight, Clock, CheckCircle2, CircleDot, Circle } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import type { Experiment } from "../../types/experiment";

type UserProgress = "not_started" | "in_progress" | "completed";

interface ExperimentCardProps {
  experiment: Experiment;
  progress?: UserProgress;
}

const difficultyVariant: Record<string, "success" | "warning" | "danger"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
};

function ProgressIndicator({ status }: { status: UserProgress }) {
  if (status === "completed") {
    return (
      <span className="exp-card-progress exp-card-progress--done">
        <CheckCircle2 size={14} /> Completed
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="exp-card-progress exp-card-progress--active">
        <CircleDot size={14} /> In Progress
      </span>
    );
  }
  return (
    <span className="exp-card-progress exp-card-progress--none">
      <Circle size={14} /> Not Started
    </span>
  );
}

function ExperimentCard({ experiment, progress = "not_started" }: ExperimentCardProps) {
  return (
    <Link to={`/experiments/${experiment.id}`} className="exp-card-link">
      <Card className={`exp-card ${progress !== "not_started" ? `exp-card--${progress}` : ""}`} hoverable>
        <div className="exp-card-top">
          <span className="exp-card-icon">⚡</span>
          <Badge variant={difficultyVariant[experiment.difficulty] || "default"} size="sm">
            {experiment.difficulty}
          </Badge>
        </div>

        <h3 className="exp-card-title">{experiment.title}</h3>

        <p className="exp-card-desc">
          {experiment.short_description || "Explore this experiment."}
        </p>

        <div className="exp-card-meta">
          <span className="exp-card-time">
            <Clock size={12} />
            {experiment.duration_minutes} min
          </span>
          <ProgressIndicator status={progress} />
        </div>

        <span className="exp-card-cta">
          Open Experiment <ArrowRight size={14} />
        </span>
      </Card>
    </Link>
  );
}

export default ExperimentCard;
