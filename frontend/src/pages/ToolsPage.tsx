import { useState } from "react";

type Tool = "ohm" | "power" | "series" | "parallel";

function ToolsPage() {
  const [tool, setTool] = useState<Tool>("ohm");

  const [voltage, setVoltage] = useState("");
  const [current, setCurrent] = useState("");
  const [resistance, setResistance] = useState("");

  const [powerVoltage, setPowerVoltage] = useState("");
  const [powerCurrent, setPowerCurrent] = useState("");

  const [seriesValues, setSeriesValues] = useState("");
  const [parallelValues, setParallelValues] = useState("");

  const [result, setResult] = useState("");

  const calculate = () => {
    setResult("");

    // OHM'S LAW
    if (tool === "ohm") {
      const v = Number(voltage);
      const i = Number(current);
      const r = Number(resistance);

      const hasV = voltage.trim() !== "";
      const hasI = current.trim() !== "";
      const hasR = resistance.trim() !== "";

      const count = [hasV, hasI, hasR].filter(Boolean).length;

      if (count !== 2) {
        setResult(
          "Please enter exactly two values and leave the third value empty."
        );
        return;
      }

      if (hasV && hasR && !hasI) {
        const answer = v / r;

        setResult(
          `Current (I) = V / R = ${v} / ${r} = ${answer.toFixed(3)} A`
        );
        return;
      }

      if (hasI && hasR && !hasV) {
        const answer = i * r;

        setResult(
          `Voltage (V) = I × R = ${i} × ${r} = ${answer.toFixed(3)} V`
        );
        return;
      }

      if (hasV && hasI && !hasR) {
        const answer = v / i;

        setResult(
          `Resistance (R) = V / I = ${v} / ${i} = ${answer.toFixed(3)} Ω`
        );
        return;
      }
    }

    // POWER
    if (tool === "power") {
      const v = Number(powerVoltage);
      const i = Number(powerCurrent);

      if (powerVoltage.trim() === "" || powerCurrent.trim() === "") {
        setResult("Please enter Voltage and Current.");
        return;
      }

      if (v <= 0 || i <= 0) {
        setResult("Please enter valid positive values.");
        return;
      }

      const answer = v * i;

      setResult(`Power (P) = V × I = ${v} × ${i} = ${answer.toFixed(3)} W`);
      return;
    }

    // SERIES RESISTANCE
    if (tool === "series") {
      const values = seriesValues
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => value > 0);

      if (values.length < 2) {
        setResult("Enter at least two resistance values.");
        return;
      }

      const total = values.reduce((sum, value) => sum + value, 0);

      setResult(
        `Rₜ = ${values.join(" + ")} = ${total.toFixed(3)} Ω`
      );
      return;
    }

    // PARALLEL RESISTANCE
    if (tool === "parallel") {
      const values = parallelValues
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => value > 0);

      if (values.length < 2) {
        setResult("Enter at least two resistance values.");
        return;
      }

      const reciprocal = values.reduce(
        (sum, value) => sum + 1 / value,
        0
      );

      const total = 1 / reciprocal;

      setResult(
        `Equivalent Resistance (Rₜ) = ${total.toFixed(3)} Ω`
      );
      return;
    }
  };

  const clearAll = () => {
    setVoltage("");
    setCurrent("");
    setResistance("");
    setPowerVoltage("");
    setPowerCurrent("");
    setSeriesValues("");
    setParallelValues("");
    setResult("");
  };

  const selectTool = (selectedTool: Tool) => {
    setTool(selectedTool);
    clearAll();
  };

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "40px 30px",
        color: "#ffffff",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          ENGINEEROS • ENGINEERING TOOLS
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 12px",
          }}
        >
          Electrical Engineering Tools
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "17px",
            margin: 0,
          }}
        >
          Calculate electrical quantities using engineering formulas.
        </p>
      </div>

      {/* TOOL CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        <button
          onClick={() => selectTool("ohm")}
          style={{
            padding: "18px",
            minHeight: "110px",
            textAlign: "left",
            borderRadius: "14px",
            border:
              tool === "ohm"
                ? "1px solid #8b5cf6"
                : "1px solid #292d3b",
            background:
              tool === "ohm" ? "#241447" : "#111522",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "24px" }}>⚡</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              marginTop: "8px",
            }}
          >
            Ohm's Law
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "5px",
            }}
          >
            Calculate Voltage, Current or Resistance.
          </div>
        </button>

        <button
          onClick={() => selectTool("power")}
          style={{
            padding: "18px",
            minHeight: "110px",
            textAlign: "left",
            borderRadius: "14px",
            border:
              tool === "power"
                ? "1px solid #8b5cf6"
                : "1px solid #292d3b",
            background:
              tool === "power" ? "#241447" : "#111522",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "24px" }}>🔋</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              marginTop: "8px",
            }}
          >
            Power Calculator
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "5px",
            }}
          >
            Calculate electrical power.
          </div>
        </button>

        <button
          onClick={() => selectTool("series")}
          style={{
            padding: "18px",
            minHeight: "110px",
            textAlign: "left",
            borderRadius: "14px",
            border:
              tool === "series"
                ? "1px solid #8b5cf6"
                : "1px solid #292d3b",
            background:
              tool === "series" ? "#241447" : "#111522",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "24px" }}>🔗</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              marginTop: "8px",
            }}
          >
            Series Resistance
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "5px",
            }}
          >
            Calculate total series resistance.
          </div>
        </button>

        <button
          onClick={() => selectTool("parallel")}
          style={{
            padding: "18px",
            minHeight: "110px",
            textAlign: "left",
            borderRadius: "14px",
            border:
              tool === "parallel"
                ? "1px solid #8b5cf6"
                : "1px solid #292d3b",
            background:
              tool === "parallel" ? "#241447" : "#111522",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: "24px" }}>🔌</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              marginTop: "8px",
            }}
          >
            Parallel Resistance
          </div>
          <div
            style={{
              color: "#9ca3af",
              fontSize: "13px",
              marginTop: "5px",
            }}
          >
            Calculate equivalent resistance.
          </div>
        </button>
      </div>

      {/* CALCULATOR */}
      <div
        style={{
          background: "#0f121c",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "28px",
        }}
      >
        {/* OHM */}
        {tool === "ohm" && (
          <>
            <h2 style={{ marginTop: 0 }}>Ohm's Law</h2>

            <p style={{ color: "#9ca3af" }}>
              Enter exactly two values. The third value will be calculated.
            </p>

            <div
              style={{
                padding: "16px",
                background: "#111522",
                borderRadius: "12px",
                margin: "20px 0",
                color: "#c4b5fd",
                fontWeight: 700,
              }}
            >
              V = I × R
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <label>
                Voltage (V)
                <input
                  type="number"
                  min="0"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                  placeholder="e.g. 12"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    marginTop: "8px",
                    borderRadius: "10px",
                    border: "1px solid #363b4b",
                    background: "#080b12",
                    color: "#ffffff",
                  }}
                />
              </label>

              <label>
                Current (A)
                <input
                  type="number"
                  min="0"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="e.g. 2"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    marginTop: "8px",
                    borderRadius: "10px",
                    border: "1px solid #363b4b",
                    background: "#080b12",
                    color: "#ffffff",
                  }}
                />
              </label>

              <label>
                Resistance (Ω)
                <input
                  type="number"
                  min="0"
                  value={resistance}
                  onChange={(e) => setResistance(e.target.value)}
                  placeholder="e.g. 6"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    marginTop: "8px",
                    borderRadius: "10px",
                    border: "1px solid #363b4b",
                    background: "#080b12",
                    color: "#ffffff",
                  }}
                />
              </label>
            </div>
          </>
        )}

        {/* POWER */}
        {tool === "power" && (
          <>
            <h2 style={{ marginTop: 0 }}>Power Calculator</h2>

            <p style={{ color: "#9ca3af" }}>
              Enter Voltage and Current to calculate electrical power.
            </p>

            <div
              style={{
                padding: "16px",
                background: "#111522",
                borderRadius: "12px",
                margin: "20px 0",
                color: "#c4b5fd",
                fontWeight: 700,
              }}
            >
              P = V × I
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
              }}
            >
              <label>
                Voltage (V)
                <input
                  type="number"
                  min="0"
                  value={powerVoltage}
                  onChange={(e) => setPowerVoltage(e.target.value)}
                  placeholder="e.g. 230"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    marginTop: "8px",
                    borderRadius: "10px",
                    border: "1px solid #363b4b",
                    background: "#080b12",
                    color: "#ffffff",
                  }}
                />
              </label>

              <label>
                Current (A)
                <input
                  type="number"
                  min="0"
                  value={powerCurrent}
                  onChange={(e) => setPowerCurrent(e.target.value)}
                  placeholder="e.g. 5"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    marginTop: "8px",
                    borderRadius: "10px",
                    border: "1px solid #363b4b",
                    background: "#080b12",
                    color: "#ffffff",
                  }}
                />
              </label>
            </div>
          </>
        )}

        {/* SERIES */}
        {tool === "series" && (
          <>
            <h2 style={{ marginTop: 0 }}>Series Resistance</h2>

            <p style={{ color: "#9ca3af" }}>
              Enter resistance values separated by commas.
            </p>

            <div
              style={{
                padding: "16px",
                background: "#111522",
                borderRadius: "12px",
                margin: "20px 0",
                color: "#c4b5fd",
                fontWeight: 700,
              }}
            >
              Rₜ = R₁ + R₂ + R₃ + ...
            </div>

            <label>
              Resistance Values (Ω)
              <input
                type="text"
                value={seriesValues}
                onChange={(e) => setSeriesValues(e.target.value)}
                placeholder="Example: 10, 20, 30"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  marginTop: "8px",
                  borderRadius: "10px",
                  border: "1px solid #363b4b",
                  background: "#080b12",
                  color: "#ffffff",
                }}
              />
            </label>
          </>
        )}

        {/* PARALLEL */}
        {tool === "parallel" && (
          <>
            <h2 style={{ marginTop: 0 }}>Parallel Resistance</h2>

            <p style={{ color: "#9ca3af" }}>
              Enter resistance values separated by commas.
            </p>

            <div
              style={{
                padding: "16px",
                background: "#111522",
                borderRadius: "12px",
                margin: "20px 0",
                color: "#c4b5fd",
                fontWeight: 700,
              }}
            >
              1 / Rₜ = 1 / R₁ + 1 / R₂ + ...
            </div>

            <label>
              Resistance Values (Ω)
              <input
                type="text"
                value={parallelValues}
                onChange={(e) => setParallelValues(e.target.value)}
                placeholder="Example: 10, 20"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  marginTop: "8px",
                  borderRadius: "10px",
                  border: "1px solid #363b4b",
                  background: "#080b12",
                  color: "#ffffff",
                }}
              />
            </label>
          </>
        )}

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            onClick={calculate}
            style={{
              padding: "14px 28px",
              borderRadius: "10px",
              border: "none",
              background: "#7c3aed",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Calculate
          </button>

          <button
            onClick={clearAll}
            style={{
              padding: "14px 24px",
              borderRadius: "10px",
              border: "1px solid #363b4b",
              background: "#111522",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {/* RESULT */}
        {result !== "" && (
          <div
            style={{
              marginTop: "24px",
              padding: "22px",
              background: "#111522",
              border: "1px solid #292d3b",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                color: "#a78bfa",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              CALCULATION RESULT
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "19px",
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolsPage;