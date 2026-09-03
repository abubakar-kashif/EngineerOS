import { useState } from "react";
import { ChevronDown, FlaskConical, Zap, CircuitBoard, BarChart3, ExternalLink } from "lucide-react";
import Badge from "../ui/Badge";
import type { MentorContext } from "../../types/mentor";

interface ContextPanelProps {
  context: MentorContext;
  objective: string | null;
}

const statusLabels: Record<string, string> = {
  idle: "Idle",
  building: "Building",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const statusVariants: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  idle: "default",
  building: "info",
  running: "warning",
  completed: "success",
  failed: "danger",
};

function ContextPanel({ context, objective }: ContextPanelProps) {
  const [open, setOpen] = useState(true);

  const hasExperiment = !!context.experimentId;
  const hasSim = context.simulationStatus !== "idle";
  const hasCircuit = context.circuit !== null;
  const hasMeasurements = context.measurements !== null;
  const hasQuiz = context.quizQuestion !== null;

  // Nothing to display if no context at all
  if (!hasExperiment && !hasSim && !hasCircuit && !hasMeasurements && !hasQuiz) return null;

  return (
    <section className="mentor-context-panel" aria-label="Mentor context">
      <button
        type="button"
        className="mentor-context-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mentor-context-body"
      >
        <span className="mentor-context-label">
          <FlaskConical size={13} />
          Context
        </span>
        <span className="mentor-context-summary">
          {context.experimentTitle ?? "General"}
          {hasSim && (
            <span className="mentor-context-stage"> · Sim {statusLabels[context.simulationStatus]}</span>
          )}
          {hasCircuit && (
            <span className="mentor-context-stage"> · {context.circuit!.componentCount} components</span>
          )}
        </span>
        <ChevronDown size={14} className={`mentor-context-chevron ${open ? "mentor-context-chevron--open" : ""}`} />
      </button>

      {open && (
        <div id="mentor-context-body" className="mentor-context-body">
          {/* Experiment context */}
          {hasExperiment && (
            <div className="mentor-context-section">
              <div className="mentor-context-section-icon">
                <FlaskConical size={13} />
              </div>
              <div className="mentor-context-section-content">
                <div className="mentor-context-row">
                  <span className="eyebrow">EXPERIMENT</span>
                  <span className="mentor-context-value">{context.experimentTitle}</span>
                </div>
                {context.difficulty && (
                  <div className="mentor-context-row">
                    <span className="eyebrow">DIFFICULTY</span>
                    <Badge variant="info" size="sm">{context.difficulty}</Badge>
                  </div>
                )}
                {context.stage && (
                  <div className="mentor-context-row">
                    <span className="eyebrow">STAGE</span>
                    <span className="mentor-context-value">{context.stage}</span>
                  </div>
                )}
                {objective && (
                  <div className="mentor-context-row mentor-context-row--objective">
                    <span className="eyebrow">OBJECTIVE</span>
                    <p className="mentor-context-objective">{objective}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simulation status */}
          {hasSim && (
            <div className="mentor-context-section">
              <div className="mentor-context-section-icon">
                <Zap size={13} />
              </div>
              <div className="mentor-context-section-content">
                <div className="mentor-context-row">
                  <span className="eyebrow">SIMULATION</span>
                  <Badge variant={statusVariants[context.simulationStatus] ?? "default"} size="sm">
                    {statusLabels[context.simulationStatus] ?? context.simulationStatus}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Circuit summary */}
          {hasCircuit && context.circuit && (
            <div className="mentor-context-section">
              <div className="mentor-context-section-icon">
                <CircuitBoard size={13} />
              </div>
              <div className="mentor-context-section-content">
                <div className="mentor-context-row">
                  <span className="eyebrow">CIRCUIT</span>
                  <span className="mentor-context-value">
                    {context.circuit.componentCount} components · {context.circuit.wireCount} wires
                  </span>
                </div>
                {context.circuit.validationErrors > 0 && (
                  <div className="mentor-context-row">
                    <span className="eyebrow">VALIDATION</span>
                    <Badge variant="danger" size="sm">
                      {context.circuit.validationErrors} error{context.circuit.validationErrors !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Measurements */}
          {hasMeasurements && context.measurements && (
            <div className="mentor-context-section">
              <div className="mentor-context-section-icon">
                <BarChart3 size={13} />
              </div>
              <div className="mentor-context-section-content">
                {context.measurements.totalVoltage && (
                  <div className="mentor-context-row">
                    <span className="eyebrow">VOLTAGE</span>
                    <span className="mentor-context-value">{context.measurements.totalVoltage}</span>
                  </div>
                )}
                {context.measurements.totalCurrent && (
                  <div className="mentor-context-row">
                    <span className="eyebrow">CURRENT</span>
                    <span className="mentor-context-value">{context.measurements.totalCurrent}</span>
                  </div>
                )}
                {context.measurements.totalPower && (
                  <div className="mentor-context-row">
                    <span className="eyebrow">POWER</span>
                    <span className="mentor-context-value">{context.measurements.totalPower}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz question */}
          {hasQuiz && (
            <div className="mentor-context-section">
              <div className="mentor-context-section-icon">
                <span className="mentor-context-quiz-icon">?</span>
              </div>
              <div className="mentor-context-section-content">
                <div className="mentor-context-row mentor-context-row--quiz">
                  <span className="eyebrow">QUIZ QUESTION</span>
                  <p className="mentor-context-quiz-text">{context.quizQuestion}</p>
                </div>
              </div>
            </div>
          )}

          {hasExperiment && (
            <a
              className="mentor-context-link"
              href={`/experiments/${context.experimentId}/workspace`}
            >
              Open Workspace <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </section>
  );
}

export default ContextPanel;
