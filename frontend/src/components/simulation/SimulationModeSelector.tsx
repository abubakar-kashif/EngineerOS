import Button from "../ui/Button";
import type { SimulationMode } from "../../types/simulation";

type SimulationModeSelectorProps = {
  mode: SimulationMode;
  onChange: (mode: SimulationMode) => void;
};

function SimulationModeSelector({
  mode,
  onChange,
}: SimulationModeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Circuit simulation mode"
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
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