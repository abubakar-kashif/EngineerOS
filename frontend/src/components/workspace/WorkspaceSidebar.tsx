import { Clock, BookOpen, Target } from "lucide-react";
import Card from "../ui/Card";
import type { Experiment } from "../../types/experiment";

interface WorkspaceSidebarProps {
  experiment: Experiment;
}

function WorkspaceSidebar({ experiment }: WorkspaceSidebarProps) {
  return (
    <aside className="ws-sidebar">
      <Card className="ws-sidebar-card">
        <div className="ws-sidebar-section">
          <p className="eyebrow">EXPERIMENT INFO</p>
          <dl className="ws-sidebar-info">
            <div className="ws-info-row">
              <dt><BookOpen size={13} /> Category</dt>
              <dd>{experiment.category}</dd>
            </div>
            <div className="ws-info-row">
              <dt><Target size={13} /> Difficulty</dt>
              <dd>{experiment.difficulty}</dd>
            </div>
            <div className="ws-info-row">
              <dt><Clock size={13} /> Duration</dt>
              <dd>{experiment.duration_minutes} min</dd>
            </div>
          </dl>
        </div>
      </Card>

      {experiment.prerequisites && experiment.prerequisites.length > 0 && (
        <Card className="ws-sidebar-card">
          <div className="ws-sidebar-section">
            <p className="eyebrow">PREREQUISITES</p>
            <ul className="ws-sidebar-list">
              {experiment.prerequisites.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {experiment.learning_outcomes && experiment.learning_outcomes.length > 0 && (
        <Card className="ws-sidebar-card">
          <div className="ws-sidebar-section">
            <p className="eyebrow">LEARNING OUTCOMES</p>
            <ul className="ws-sidebar-list">
              {experiment.learning_outcomes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </aside>
  );
}

export default WorkspaceSidebar;
