/**
 * Simulation toolbar: status + lab actions for the freeform workstation.
 */
import {
  Play,
  Square,
  Undo2,
  Redo2,
  Trash2,
  Save,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Expand,
  Crosshair,
} from "lucide-react";

export type SimToolbarStatus =
  | "idle"
  | "running"
  | "completed"
  | "invalid"
  | "failed"
  | "error";

interface SimToolbarProps {
  status: SimToolbarStatus;
  experimentTitle?: string | null;
  canRun: boolean;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  fullscreen: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onOpen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onResetView: () => void;
  onToggleFullscreen: () => void;
}

const statusLabels: Record<SimToolbarStatus, string> = {
  idle: "Ready",
  running: "Running…",
  completed: "Completed",
  invalid: "Invalid circuit",
  failed: "Failed",
  error: "Errors found",
};

const statusColors: Record<SimToolbarStatus, string> = {
  idle: "var(--color-text-muted)",
  running: "var(--color-warning)",
  completed: "var(--color-success)",
  invalid: "var(--color-danger)",
  failed: "var(--color-danger)",
  error: "var(--color-danger)",
};

function SimToolbar({
  status,
  experimentTitle,
  canRun,
  canUndo,
  canRedo,
  dirty,
  fullscreen,
  onRun,
  onStop,
  onReset,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onOpen,
  onZoomIn,
  onZoomOut,
  onFit,
  onResetView,
  onToggleFullscreen,
}: SimToolbarProps) {
  return (
    <header className="sim2-toolbar">
      <div className="sim2-toolbar-left">
        <span className="sim2-toolbar-title">
          {experimentTitle ? experimentTitle : "Simulation Lab"}
        </span>
        <span className="sim2-status-dot" style={{ background: statusColors[status] }} />
        <span className="sim2-status-label">{statusLabels[status]}</span>
        {dirty && <span className="sim2-dirty">● Unsaved</span>}
      </div>
      <div className="sim2-toolbar-right" role="toolbar" aria-label="Simulation workspace controls">
        <ToolbarBtn icon={<Undo2 size={14} />} label="Undo" disabled={!canUndo} onClick={onUndo} />
        <ToolbarBtn icon={<Redo2 size={14} />} label="Redo" disabled={!canRedo} onClick={onRedo} />
        <span className="sim2-toolbar-sep" />
        <ToolbarBtn icon={<ZoomIn size={14} />} label="Zoom In" onClick={onZoomIn} />
        <ToolbarBtn icon={<ZoomOut size={14} />} label="Zoom Out" onClick={onZoomOut} />
        <ToolbarBtn icon={<Maximize2 size={14} />} label="Fit to Screen" onClick={onFit} />
        <ToolbarBtn icon={<Crosshair size={14} />} label="Reset View" onClick={onResetView} />
        <ToolbarBtn
          icon={fullscreen ? <Minimize2 size={14} /> : <Expand size={14} />}
          label={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
          onClick={onToggleFullscreen}
        />
        <span className="sim2-toolbar-sep" aria-hidden="true" />
        <ToolbarBtn icon={<FolderOpen size={14} />} label="Open" onClick={onOpen} />
        <ToolbarBtn icon={<Save size={14} />} label="Save" onClick={onSave} />
        <ToolbarBtn icon={<RotateCcw size={14} />} label="Reset results" onClick={onReset} />
        <ToolbarBtn icon={<Trash2 size={14} />} label="Clear circuit" onClick={onClear} />
        <span className="sim2-toolbar-sep" aria-hidden="true" />
        {status === "running" ? (
          <button type="button" className="sim2-btn sim2-btn--stop" onClick={onStop}>
            <Square size={14} /> Stop
          </button>
        ) : (
          <button
            type="button"
            className="sim2-btn sim2-btn--run"
            disabled={!canRun}
            onClick={onRun}
          >
            <Play size={14} /> Run
          </button>
        )}
      </div>
    </header>
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
      type="button"
      className="sim2-toolbar-btn"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export default SimToolbar;
