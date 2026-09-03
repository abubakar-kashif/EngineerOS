import { Play, Square, RotateCcw, Save } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import type { SimulationStatus } from "../../types/simulation";

interface SimulationToolbarProps {
  status: SimulationStatus;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onSave: () => void;
}

const statusConfig: Record<SimulationStatus, { label: string; icon: string; variant: "default" | "success" | "info" | "warning" | "danger" }> = {
  ready:     { label: "Ready",     icon: "●", variant: "default" },
  running:   { label: "Running",   icon: "●", variant: "info" },
  completed: { label: "Completed", icon: "✓", variant: "success" },
  stopped:   { label: "Stopped",   icon: "■", variant: "warning" },
  error:     { label: "Error",     icon: "✕", variant: "danger" },
};

function SimulationToolbar({ status, onRun, onStop, onReset, onSave }: SimulationToolbarProps) {
  const cfg = statusConfig[status];

  return (
    <div className="sim-toolbar" role="toolbar" aria-label="Simulation controls">
      <div className="sim-toolbar-left">
        <span className="sim-toolbar-title">Circuit Simulator</span>
        <Badge variant={cfg.variant} className="sim-status-badge">
          <span className="sim-status-icon">{cfg.icon}</span>
          {cfg.label}
        </Badge>
      </div>

      <div className="sim-toolbar-right">
        <Button
          variant="primary"
          size="sm"
          onClick={onRun}
          disabled={status === "running"}
          aria-label="Run simulation"
        >
          <Play size={14} /> Run
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onStop}
          disabled={status !== "running"}
          aria-label="Stop simulation"
        >
          <Square size={12} /> Stop
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          aria-label="Reset simulation"
        >
          <RotateCcw size={14} /> Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          aria-label="Save results"
        >
          <Save size={14} /> Save
        </Button>
      </div>
    </div>
  );
}

export default SimulationToolbar;
