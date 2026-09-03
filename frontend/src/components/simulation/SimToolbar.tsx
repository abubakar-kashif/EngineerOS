/**
 * Simulation toolbar: status badge + action buttons for the simulator.
 */
import {
  Play,
  Square,
  Undo2,
  Redo2,
  Trash2,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
} from "lucide-react";

interface SimToolbarProps {
  status: "idle" | "running" | "completed" | "error";
  canRun: boolean;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  onRun: () => void;
  onStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

const statusLabels: Record<string, string> = {
  idle: "Ready",
  running: "Running…",
  completed: "Completed",
  error: "Errors Found",
};

const statusColors: Record<string, string> = {
  idle: "var(--color-text-muted)",
  running: "var(--color-warning)",
  completed: "var(--color-success)",
  error: "var(--color-danger)",
};

function SimToolbar({
  status,
  canRun,
  canUndo,
  canRedo,
  dirty,
  onRun,
  onStop,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onZoomIn,
  onZoomOut,
  onFit,
}: SimToolbarProps) {
  return (
    <div className="sim2-toolbar">
      <div className="sim2-toolbar-left">
        <span className="sim2-toolbar-title">EngineerOS Simulation</span>
        <span className="sim2-status-dot" style={{ background: statusColors[status] }} />
        <span className="sim2-status-label">{statusLabels[status]}</span>
        {dirty && <span className="sim2-dirty">● Unsaved</span>}
      </div>
      <div className="sim2-toolbar-right">
        <ToolbarBtn icon={<Undo2 size={14} />} label="Undo" disabled={!canUndo} onClick={onUndo} />
        <ToolbarBtn icon={<Redo2 size={14} />} label="Redo" disabled={!canRedo} onClick={onRedo} />
        <span className="sim2-toolbar-sep" />
        <ToolbarBtn icon={<ZoomIn size={14} />} label="Zoom In" onClick={onZoomIn} />
        <ToolbarBtn icon={<ZoomOut size={14} />} label="Zoom Out" onClick={onZoomOut} />
        <ToolbarBtn icon={<Maximize2 size={14} />} label="Fit" onClick={onFit} />
        <ToolbarBtn icon={<Grid3x3 size={14} />} label="Grid" onClick={() => {}} />
        <span className="sim2-toolbar-sep" />
        {status === "running" ? (
          <button className="sim2-btn sim2-btn--stop" onClick={onStop}>
            <Square size={14} /> Stop
          </button>
        ) : (
          <button className="sim2-btn sim2-btn--run" disabled={!canRun} onClick={onRun}>
            <Play size={14} /> Run
          </button>
        )}
        <ToolbarBtn icon={<Save size={14} />} label="Save" onClick={onSave} />
        <ToolbarBtn icon={<Trash2 size={14} />} label="Clear" onClick={onClear} />
      </div>
    </div>
  );
}

function ToolbarBtn({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="sim2-toolbar-btn"
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export default SimToolbar;
