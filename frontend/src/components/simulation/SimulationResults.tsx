import Card from "../ui/Card";
import Badge from "../ui/Badge";
import type { SimulationResult } from "../../types/simulation";

type SimulationResultsProps = {
  result: SimulationResult | null;
  running: boolean;
  switchOn: boolean;
  error: string;
};

function SimulationResults({
  result,
  running,
  switchOn,
  error,
}: SimulationResultsProps) {
  const isActive = running && switchOn;

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            Simulation Results
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Calculated electrical values
          </p>
        </div>

        <Badge>
          {isActive ? "Running" : "Stopped"}
        </Badge>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "18px",
            padding: "12px 14px",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {result ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "14px",
              marginTop: "20px",
            }}
          >
            <ResultItem
              label="Total Resistance"
              value={`${result.totalResistance.toFixed(3)} Ω`}
            />

            <ResultItem
              label="Current"
              value={`${result.current.toFixed(3)} A`}
            />

            <ResultItem
              label="Power"
              value={`${result.power.toFixed(3)} W`}
            />
          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "8px",
              background: "#f9fafb",
              color: "#374151",
            }}
          >
            <strong>Formula:</strong> I = V / R
          </div>
        </>
      ) : (
        <p
          style={{
            marginTop: "20px",
            color: "#6b7280",
          }}
        >
          Run the simulation to view calculated results.
        </p>
      )}
    </Card>
  );
}

type ResultItemProps = {
  label: string;
  value: string;
};

function ResultItem({ label, value }: ResultItemProps) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "8px",
        background: "#f9fafb",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "13px",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: "18px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default SimulationResults;