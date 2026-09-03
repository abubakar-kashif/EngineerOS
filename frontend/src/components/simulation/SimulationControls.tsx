import { Play, Square, RotateCcw, Undo, Redo, Trash2 } from "lucide-react";
import Button from "../ui/Button";

type SimulationControlsProps = {
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  running: boolean;
  // Added for undo/redo/clear
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

function SimulationControls({
  onRun,
  onStop,
  onReset,
  running,
  onUndo,
  onRedo,
  onClear,
  canUndo = false,
  canRedo = false,
}: SimulationControlsProps) {
  return (
    <div className="sim-controls">
      <Button type="button" variant="primary" onClick={onRun} disabled={running}>
        <Play size={14} /> Run Simulation
      </Button>
      <Button type="button" variant="secondary" onClick={onStop} disabled={!running}>
        <Square size={12} /> Stop
      </Button>
      <Button type="button" variant="ghost" onClick={onReset}>
        <RotateCcw size={14} /> Reset
      </Button>

      {onUndo && (
        <Button type="button" variant="ghost" onClick={onUndo} disabled={!canUndo}>
          <Undo size={14} /> Undo
        </Button>
      )}
      {onRedo && (
        <Button type="button" variant="ghost" onClick={onRedo} disabled={!canRedo}>
          <Redo size={14} /> Redo
        </Button>
      )}
      {onClear && (
        <Button type="button" variant="ghost" onClick={onClear}>
          <Trash2 size={14} /> Clear
        </Button>
      )}
    </div>
  );
}

export default SimulationControls;