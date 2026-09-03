import { Play, Square, RotateCcw } from "lucide-react";
import Button from "../ui/Button";

type SimulationControlsProps = {
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  running: boolean;
};

function SimulationControls({
  onRun,
  onStop,
  onReset,
  running,
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
    </div>
  );
}

export default SimulationControls;
