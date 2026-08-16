import { useMemo, useState } from "react";

type Mode = "series" | "parallel";

function SimulationPage() {
  const [voltage, setVoltage] = useState("12");
  const [r1, setR1] = useState("6");
  const [r2, setR2] = useState("12");

  const [mode, setMode] = useState<Mode>("series");
  const [running, setRunning] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    const v = Number(voltage);
    const resistance1 = Number(r1);
    const resistance2 = Number(r2);

    if (v < 0 || resistance1 <= 0) {
      return null;
    }

    let totalResistance = resistance1;

    if (mode === "parallel") {
      if (resistance2 <= 0) {
        return null;
      }

      totalResistance =
        (resistance1 * resistance2) /
        (resistance1 + resistance2);
    }

    const current = switchOn ? v / totalResistance : 0;
    const power = v * current;

    return {
      totalResistance,
      current,
      power,
    };
  }, [voltage, r1, r2, mode, switchOn]);

  function runSimulation() {
    const v = Number(voltage);
    const resistance1 = Number(r1);

    if (!Number.isFinite(v) || v < 0) {
      setError("Please enter a valid voltage.");
      return;
    }

    if (!Number.isFinite(resistance1) || resistance1 <= 0) {
      setError("Resistance must be greater than 0 Ω.");
      return;
    }

    if (mode === "parallel") {
      const resistance2 = Number(r2);

      if (!Number.isFinite(resistance2) || resistance2 <= 0) {
        setError("Please enter a valid second resistance.");
        return;
      }
    }

    setError("");
    setRunning(true);
  }

  function resetSimulation() {
    setVoltage("12");
    setR1("6");
    setR2("12");
    setMode("series");
    setRunning(false);
    setSwitchOn(true);
    setError("");
  }

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            color: "#7c3aed",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: "8px",
          }}
        >
          ELECTRICAL SIMULATION
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            color: "#111827",
          }}
        >
          Circuit Simulator
        </h1>

        <p
          style={{
            color: "#6b7280",
            marginTop: "8px",
          }}
        >
          Build and simulate a simple electrical circuit.
        </p>
      </div>

      {/* MODE BUTTONS */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => {
            setMode("series");
            setRunning(false);
          }}
          style={{
            padding: "11px 20px",
            borderRadius: "8px",
            border: "none",
            background:
              mode === "series" ? "#7c3aed" : "#e5e7eb",
            color:
              mode === "series" ? "white" : "#111827",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Series Circuit
        </button>

        <button
          onClick={() => {
            setMode("parallel");
            setRunning(false);
          }}
          style={{
            padding: "11px 20px",
            borderRadius: "8px",
            border: "none",
            background:
              mode === "parallel" ? "#7c3aed" : "#e5e7eb",
            color:
              mode === "parallel" ? "white" : "#111827",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Parallel Circuit
        </button>
      </div>

      {/* MAIN SIMULATOR */}

      <div
        style={{
          background: "#10121e",
          borderRadius: "18px",
          padding: "28px",
          color: "white",
        }}
      >
        {/* CIRCUIT */}

        <div
          style={{
            background: "#080b15",
            borderRadius: "14px",
            padding: "40px 25px",
            marginBottom: "25px",
            overflowX: "auto",
          }}
        >
          {mode === "series" ? (
            <div
              style={{
                minWidth: "650px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* BATTERY */}

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "60px",
                    height: "75px",
                    border: "3px solid #8b5cf6",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                  }}
                >
                  🔋
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#c4b5fd",
                  }}
                >
                  {voltage} V
                </div>
              </div>

              {/* WIRE */}

              <div
                style={{
                  width: "80px",
                  height: "4px",
                  background:
                    running && switchOn
                      ? "#8b5cf6"
                      : "#374151",
                }}
              />

              {/* SWITCH */}

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => {
                    setSwitchOn(!switchOn);
                    setRunning(false);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "2px solid",
                    borderColor: switchOn
                      ? "#22c55e"
                      : "#ef4444",
                    background: switchOn
                      ? "#14532d"
                      : "#450a0a",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {switchOn ? "ON" : "OFF"}
                </button>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                  }}
                >
                  Switch
                </div>
              </div>

              <div
                style={{
                  width: "80px",
                  height: "4px",
                  background:
                    running && switchOn
                      ? "#8b5cf6"
                      : "#374151",
                }}
              />

              {/* RESISTOR */}

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "85px",
                    height: "42px",
                    border: "3px solid #a78bfa",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  /\/\/\
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#c4b5fd",
                  }}
                >
                  {r1} Ω
                </div>
              </div>

              <div
                style={{
                  width: "80px",
                  height: "4px",
                  background:
                    running && switchOn
                      ? "#8b5cf6"
                      : "#374151",
                }}
              />

              {/* BULB */}

              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "65px",
                    height: "65px",
                    borderRadius: "50%",
                    border:
                      running && switchOn
                        ? "3px solid #facc15"
                        : "3px solid #4b5563",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    background:
                      running && switchOn
                        ? "#facc1530"
                        : "#111827",
                    boxShadow:
                      running && switchOn
                        ? "0 0 30px #facc15"
                        : "none",
                  }}
                >
                  💡
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    color:
                      running && switchOn
                        ? "#facc15"
                        : "#9ca3af",
                  }}
                >
                  Load
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                minWidth: "650px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  color: "#c4b5fd",
                  marginBottom: "20px",
                }}
              >
                🔋 {voltage} V
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "30px",
                }}
              >
                <div
                  style={{
                    padding: "20px",
                    border: "2px solid #8b5cf6",
                    borderRadius: "10px",
                  }}
                >
                  R1 = {r1} Ω
                </div>

                <div
                  style={{
                    padding: "20px",
                    border: "2px solid #8b5cf6",
                    borderRadius: "10px",
                  }}
                >
                  R2 = {r2} Ω
                </div>
              </div>

              <div
                style={{
                  marginTop: "25px",
                  fontSize: "28px",
                }}
              >
                {running && switchOn ? "💡" : "⚫"}
              </div>
            </div>
          )}
        </div>

        {/* INPUTS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              mode === "parallel"
                ? "repeat(3, 1fr)"
                : "repeat(2, 1fr)",
            gap: "18px",
          }}
        >
          <div>
            <label>Voltage (V)</label>

            <input
              type="number"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                background: "#080b15",
                border: "1px solid #303447",
                borderRadius: "8px",
                color: "white",
              }}
            />
          </div>

          <div>
            <label>Resistance R1 (Ω)</label>

            <input
              type="number"
              value={r1}
              onChange={(e) => setR1(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: "8px",
                padding: "13px",
                background: "#080b15",
                border: "1px solid #303447",
                borderRadius: "8px",
                color: "white",
              }}
            />
          </div>

          {mode === "parallel" && (
            <div>
              <label>Resistance R2 (Ω)</label>

              <input
                type="number"
                value={r2}
                onChange={(e) => setR2(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: "8px",
                  padding: "13px",
                  background: "#080b15",
                  border: "1px solid #303447",
                  borderRadius: "8px",
                  color: "white",
                }}
              />
            </div>
          )}
        </div>

        {/* BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "22px",
          }}
        >
          <button
            onClick={runSimulation}
            style={{
              padding: "13px 24px",
              border: "none",
              borderRadius: "8px",
              background: "#7c3aed",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ▶ Run Simulation
          </button>

          <button
            onClick={() => setRunning(false)}
            style={{
              padding: "13px 24px",
              borderRadius: "8px",
              border: "1px solid #374151",
              background: "#171a27",
              color: "white",
              cursor: "pointer",
            }}
          >
            ⏹ Stop
          </button>

          <button
            onClick={resetSimulation}
            style={{
              padding: "13px 24px",
              borderRadius: "8px",
              border: "1px solid #374151",
              background: "#171a27",
              color: "white",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              borderRadius: "8px",
              background: "#450a0a",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* RESULT */}

        {result && (
          <div
            style={{
              marginTop: "25px",
              padding: "22px",
              borderRadius: "12px",
              background: "#171329",
              border: "1px solid #6d28d9",
            }}
          >
            <div
              style={{
                color: "#a78bfa",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "15px",
              }}
            >
              SIMULATION RESULT
            </div>

            <h2 style={{ margin: "0 0 10px 0" }}>
              Current (I) = V / R
            </h2>

            <div
              style={{
                fontSize: "18px",
                marginBottom: "20px",
              }}
            >
              {voltage} /{" "}
              {result.totalResistance.toFixed(3)} ={" "}
              {result.current.toFixed(3)} A
            </div>

            <div
              style={{
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              <div>
                Total Resistance:{" "}
                <strong>
                  {result.totalResistance.toFixed(3)} Ω
                </strong>
              </div>

              <div>
                Current:{" "}
                <strong>
                  {result.current.toFixed(3)} A
                </strong>
              </div>

              <div>
                Power:{" "}
                <strong>
                  {result.power.toFixed(3)} W
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                color:
                  running && switchOn
                    ? "#22c55e"
                    : "#9ca3af",
                fontWeight: 700,
              }}
            >
              {running && switchOn
                ? "● Circuit Running"
                : "● Circuit Stopped"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimulationPage;