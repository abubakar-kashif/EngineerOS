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
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <Button
        type="button"
        variant="primary"
        onClick={onRun}
        disabled={running}
      >
        ▶ Run Simulation
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={onStop}
        disabled={!running}
      >
        ⏹ Stop
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onReset}
      >
        Reset
      </Button>
    </div>
  );
}

export default SimulationControls;