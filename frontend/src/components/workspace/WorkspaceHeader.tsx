import { Link } from "react-router-dom";
import { Save, Play } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import type { Experiment } from "../../types/experiment";
import type { SaveStatus } from "../../types/simulation";

interface WorkspaceHeaderProps {
  experiment: Experiment;
  progress: string;
  saveStatus: SaveStatus;
  onSave: () => void;
  onOpenSimulation: () => void;
}

const difficultyVariant: Record<string, "success" | "warning" | "danger"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
};

function WorkspaceHeader({
  experiment,
  progress,
  saveStatus,
  onSave,
  onOpenSimulation,
}: WorkspaceHeaderProps) {
  const saveLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "failed"
          ? "Save Failed"
          : "Save Progress";

  return (
    <header className="ws-header">
      <nav className="ws-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="ws-bc-sep">/</span>
        <Link to="/experiments">Experiments</Link>
        <span className="ws-bc-sep">/</span>
        <Link to={`/experiments/${experiment.id}`}>{experiment.title}</Link>
        <span className="ws-bc-sep">/</span>
        <span className="ws-bc-current">Workspace</span>
      </nav>

      <div className="ws-header-inner">
        <div className="ws-header-info">
          <h1 className="ws-header-title">{experiment.title}</h1>
          <p className="ws-header-desc">
            {experiment.short_description || "Experiment workspace"}
          </p>
          <div className="ws-header-badges">
            <Badge variant={difficultyVariant[experiment.difficulty] || "default"} size="sm">
              {experiment.difficulty}
            </Badge>
            <Badge variant="info" size="sm">{progress}</Badge>
          </div>
        </div>

        <div className="ws-header-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={saveStatus === "saving"}
          >
            <Save size={14} /> {saveLabel}
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenSimulation}>
            <Play size={14} /> Open Simulation
          </Button>
        </div>
      </div>
    </header>
  );
}

export default WorkspaceHeader;
