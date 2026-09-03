interface WorkspaceProgressProps {
  progress: "not_started" | "in_progress" | "completed";
}

const stepLabels = ["Setup", "Configure", "Simulate", "Review"] as const;

function getActiveStep(progress: string): number {
  if (progress === "completed") return 4;
  if (progress === "in_progress") return 2;
  return 1;
}

function WorkspaceProgress({ progress }: WorkspaceProgressProps) {
  const activeStep = getActiveStep(progress);

  return (
    <div className="ws-progress-bar" role="progressbar" aria-valuenow={activeStep} aria-valuemin={1} aria-valuemax={4}>
      {stepLabels.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < activeStep;
        const active = stepNum === activeStep;
        return (
          <div
            key={label}
            className={`ws-progress-step ${done ? "ws-progress-step--done" : ""} ${active ? "ws-progress-step--active" : ""}`}
          >
            <span className="ws-progress-dot">{done ? "✓" : stepNum}</span>
            <span className="ws-progress-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default WorkspaceProgress;
