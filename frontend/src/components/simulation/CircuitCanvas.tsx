import type { SimulationMode } from "../../types/simulation";

type CircuitCanvasProps = {
  mode: SimulationMode;
  voltage: string;
  r1: string;
  r2: string;
  running: boolean;
  switchOn: boolean;
  onToggleSwitch: () => void;
};

function CircuitCanvas({
  mode,
  voltage,
  r1,
  r2,
  running,
  switchOn,
  onToggleSwitch,
}: CircuitCanvasProps) {
  const active = running && switchOn;

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      {mode === "series" ? (
        <div
          style={{
            minWidth: "min(100%, 620px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(12px, 3vw, 32px)",
            padding: "30px 15px",
            boxSizing: "border-box",
            flexWrap: "wrap",
          }}
        >
          <CircuitNode
            type="battery"
            label={`${voltage || "0"} V`}
            active={active}
          />

          <Wire active={active} />

          <SwitchControl
            switchOn={switchOn}
            onToggle={onToggleSwitch}
          />

          <Wire active={active} />

          <Resistor label={`R1 = ${r1 || "0"} Ω`} active={active} />

          <Wire active={active} />

          <CircuitNode
            type="load"
            label="Load"
            active={active}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            padding: "30px 15px",
            flexWrap: "wrap",
          }}
        >
          <CircuitNode
            type="battery"
            label={`${voltage || "0"} V`}
            active={active}
          />

          <Wire active={active} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minWidth: "150px",
            }}
          >
            <Resistor
              label={`R1 = ${r1 || "0"} Ω`}
              active={active}
            />

            <Resistor
              label={`R2 = ${r2 || "0"} Ω`}
              active={active}
            />
          </div>

          <Wire active={active} />

          <CircuitNode
            type="load"
            label="Load"
            active={active}
          />
        </div>
      )}
    </div>
  );
}

function Wire({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "clamp(30px, 7vw, 70px)",
        height: "4px",
        flexShrink: 0,
        borderRadius: "4px",
        backgroundColor: active ? "#7c3aed" : "#9ca3af",
      }}
    />
  );
}

function SwitchControl({
  switchOn,
  onToggle,
}: {
  switchOn: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={switchOn}
        aria-label={`Circuit switch ${switchOn ? "on" : "off"}`}
        style={{
          minWidth: "70px",
          minHeight: "42px",
          padding: "8px 14px",
          borderRadius: "8px",
          border: `2px solid ${
            switchOn ? "#16a34a" : "#dc2626"
          }`,
          backgroundColor: switchOn ? "#f0fdf4" : "#fef2f2",
          color: switchOn ? "#166534" : "#991b1b",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {switchOn ? "ON" : "OFF"}
      </button>

      <div
        style={{
          marginTop: "6px",
          fontSize: "12px",
          color: "#6b7280",
        }}
      >
        Switch
      </div>
    </div>
  );
}

function CircuitNode({
  type,
  label,
  active,
}: {
  type: "battery" | "load";
  label: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        minWidth: "75px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "58px",
          height: "58px",
          margin: "0 auto",
          borderRadius: "50%",
          border: `2px solid ${
            active ? "#7c3aed" : "#9ca3af"
          }`,
          backgroundColor: active ? "#f5f3ff" : "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: active ? "#6d28d9" : "#4b5563",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        {type === "battery" ? "SOURCE" : "LOAD"}
      </div>

      <div
        style={{
          marginTop: "7px",
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Resistor({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div
      style={{
        minWidth: "125px",
        padding: "14px 18px",
        boxSizing: "border-box",
        borderRadius: "8px",
        border: `2px solid ${
          active ? "#7c3aed" : "#9ca3af"
        }`,
        backgroundColor: active ? "#f5f3ff" : "#f9fafb",
        color: "#374151",
        textAlign: "center",
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
}

export default CircuitCanvas;