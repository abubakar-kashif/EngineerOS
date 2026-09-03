import Button from "../ui/Button";
import type { SimulationMode } from "../../types/simulation";

type SimulationModeSelectorProps = {
  mode: SimulationMode;
  onChange: (mode: SimulationMode) => void;
};

function SimulationModeSelector({ mode, onChange }: SimulationModeSelectorProps) {
  return (
    <div className="sim-mode-selector" role="group" aria-label="Circuit simulation mode">
      <Button
        type="button"
        variant={mode === "series" ? "primary" : "secondary"}
        onClick={() => onChange("series")}
      >
        Series Circuit
      </Button>
      <Button
        type="button"
        variant={mode === "parallel" ? "primary" : "secondary"}
        onClick={() => onChange("parallel")}
      >
        Parallel Circuit
      </Button>
    </div>
  );
}

export default SimulationModeSelector;
