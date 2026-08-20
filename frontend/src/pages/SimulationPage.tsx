import { useMemo, useState } from "react";

import SectionHeading from "../components/ui/SectionHeading";
import SimulationControls from "../components/simulation/SimulationControls";
import SimulationModeSelector from "../components/simulation/SimulationModeSelector";
import CircuitCanvas from "../components/simulation/CircuitCanvas";
import SimulationResults from "../components/simulation/SimulationResults";

import { runSimulation } from "../services/simulationService";

import type {
  SimulationMode,
  SimulationResult,
} from "../types/simulation";

function SimulationPage() {
  const [voltage, setVoltage] = useState("12");
  const [r1, setR1] = useState("6");
  const [r2, setR2] = useState("12");

  const [mode, setMode] = useState<SimulationMode>("series");
  const [running, setRunning] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [error, setError] = useState("");

  /*
   * All engineering calculations are handled by
   * simulationService.ts.
   *
   * The page only converts UI input into numbers and
   * manages simulation state.
   */
  const result = useMemo<SimulationResult | null>(() => {
    const v = Number(voltage);
    const resistance1 = Number(r1);
    const resistance2 = Number(r2);

    if (
      voltage.trim() === "" ||
      r1.trim() === "" ||
      !Number.isFinite(v) ||
      !Number.isFinite(resistance1)
    ) {
      return null;
    }

    if (mode === "parallel") {
      if (
        r2.trim() === "" ||
        !Number.isFinite(resistance2)
      ) {
        return null;
      }
    }

    try {
      return runSimulation({
        voltage: v,
        r1: resistance1,
        r2:
          mode === "parallel"
            ? resistance2
            : undefined,
        mode,
        switchOn,
      });
    } catch {
      return null;
    }
  }, [voltage, r1, r2, mode, switchOn]);

  function handleModeChange(nextMode: SimulationMode) {
    setMode(nextMode);

    // Changing circuit mode resets the active simulation.
    setRunning(false);
    setError("");
  }

  function handleRun() {
    const v = Number(voltage);
    const resistance1 = Number(r1);

    if (
      voltage.trim() === "" ||
      !Number.isFinite(v) ||
      v < 0
    ) {
      setError("Please enter a valid non-negative voltage.");
      setRunning(false);
      return;
    }

    if (
      r1.trim() === "" ||
      !Number.isFinite(resistance1) ||
      resistance1 <= 0
    ) {
      setError("Resistance R1 must be greater than 0 Ω.");
      setRunning(false);
      return;
    }

    let resistance2: number | undefined;

    if (mode === "parallel") {
      resistance2 = Number(r2);

      if (
        r2.trim() === "" ||
        !Number.isFinite(resistance2) ||
        resistance2 <= 0
      ) {
        setError(
          "Resistance R2 must be greater than 0 Ω."
        );
        setRunning(false);
        return;
      }
    }

    try {
      runSimulation({
        voltage: v,
        r1: resistance1,
        r2: resistance2,
        mode,
        switchOn,
      });

      setError("");
      setRunning(true);
    } catch (simulationError) {
      setRunning(false);

      if (simulationError instanceof Error) {
        setError(simulationError.message);
      } else {
        setError(
          "Unable to run the simulation."
        );
      }
    }
  }

  function handleStop() {
    setRunning(false);
  }

  function handleReset() {
    setVoltage("12");
    setR1("6");
    setR2("12");

    setMode("series");
    setRunning(false);
    setSwitchOn(true);
    setError("");
  }

  function handleSwitchToggle() {
    setSwitchOn((current) => !current);
    setError("");
  }

  return (
    <main className="page-container">
      <SectionHeading
        eyebrow="ELECTRICAL SIMULATION"
        title="Circuit Simulator"
        description="Build and simulate a simple electrical circuit."
      />

      {/* Circuit mode */}
      <div style={{ marginTop: "24px" }}>
        <SimulationModeSelector
          mode={mode}
          onChange={handleModeChange}
        />
      </div>

      <section
        aria-label="Circuit simulation"
        style={{
          marginTop: "24px",
          display: "grid",
          gap: "20px",
        }}
      >
        {/* Circuit visualization */}
        <div
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <CircuitCanvas
            mode={mode}
            voltage={voltage}
            r1={r1}
            r2={r2}
            running={running}
            switchOn={switchOn}
            onToggleSwitch={handleSwitchToggle}
          />
        </div>

        {/* Inputs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              mode === "parallel"
                ? "repeat(auto-fit, minmax(180px, 1fr))"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Voltage */}
          <label>
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Voltage (V)
            </span>

            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={voltage}
              onChange={(event) =>
                setVoltage(event.target.value)
              }
              aria-label="Voltage in volts"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            />
          </label>

          {/* R1 */}
          <label>
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Resistance R1 (Ω)
            </span>

            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={r1}
              onChange={(event) =>
                setR1(event.target.value)
              }
              aria-label="Resistance R1 in ohms"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            />
          </label>

          {/* R2 */}
          {mode === "parallel" && (
            <label>
              <span
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Resistance R2 (Ω)
              </span>

              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={r2}
                onChange={(event) =>
                  setR2(event.target.value)
                }
                aria-label="Resistance R2 in ohms"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                }}
              />
            </label>
          )}
        </div>

        {/* Run / Stop / Reset */}
        <SimulationControls
          onRun={handleRun}
          onStop={handleStop}
          onReset={handleReset}
          running={running}
        />

        {/* Results / errors */}
        <div aria-live="polite">
          <SimulationResults
            result={running ? result : null}
            running={running}
            switchOn={switchOn}
            error={error}
          />
        </div>
      </section>
    </main>
  );
}

export default SimulationPage;