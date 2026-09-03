import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import WorkspaceTabs from "../components/workspace/WorkspaceTabs";
import WorkspaceProgress from "../components/workspace/WorkspaceProgress";
import ExperimentContext from "../components/workspace/ExperimentContext";
import CircuitSetupPanel from "../components/workspace/CircuitSetupPanel";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import Card from "../components/ui/Card";
import LoadingState from "../components/common/LoadingState";

import SimulationToolbar from "../components/simulation/SimulationToolbar";
import WorkspaceCircuitCanvas from "../components/simulation/WorkspaceCircuitCanvas";
import MeasurementsPanel from "../components/simulation/MeasurementsPanel";
import SimulationResults from "../components/simulation/SimulationResults";
import SimulationHistory from "../components/simulation/SimulationHistory";

import { getExperimentById } from "../services/experimentService";
import { mockExperiments } from "../data/mockExperiments";
import { runSimulation } from "../services/simulationService";

import type { Experiment } from "../types/experiment";
import type {
  WorkspaceTab,
  SimulationMode,
  SimulationResult,
  SimulationStatus,
  SimulationRun,
  SaveStatus,
} from "../types/simulation";
import { getAllProgress, type UserProgress } from "../utils/experimentProgress";
import { getStatusMap, saveStatus as saveExperimentStatus } from "../services/progressService";
import { getAuthToken } from "../services/api";

/* Circuit parameters an experiment suggests for its workspace simulation.
 * Falls back to the classic defaults when no configuration exists. */
function circuitDefaults(exp: Experiment | null): {
  mode: SimulationMode;
  voltage: string;
  r1: string;
  r2: string;
} {
  const config = exp?.simulation_configuration;
  const params = config?.parameters ?? {};
  const value = (raw: number | undefined, fallback: string) =>
    raw != null && Number.isFinite(raw) ? String(raw) : fallback;
  return {
    mode: config?.mode === "parallel" ? "parallel" : "series",
    voltage: value(params.voltage, "12"),
    r1: value(params.r1, "6"),
    r2: value(params.r2, "12"),
  };
}

function WorkspacePage() {
  const { experimentId } = useParams<{ experimentId: string }>();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

  // Simulation state
  const [voltage, setVoltage] = useState("12");
  const [r1, setR1] = useState("6");
  const [r2, setR2] = useState("12");
  const [mode, setMode] = useState<SimulationMode>("series");
  const [simStatus, setSimStatus] = useState<SimulationStatus>("ready");
  const [switchOn, setSwitchOn] = useState(true);
  const [error, setError] = useState("");
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Progress is account-scoped when signed in; local tracking for anonymous.
  const [statusMap, setStatusMap] = useState<Record<string, UserProgress> | null>(() =>
    getAuthToken() ? null : getAllProgress(),
  );
  const progress = experiment ? (statusMap?.[experiment.id] ?? "not_started") : "not_started";

  /* Load the account's statuses when signed in */
  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    getStatusMap()
      .then((map) => {
        if (!cancelled) setStatusMap(map);
      })
      .catch(() => {
        if (!cancelled) setStatusMap({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Load experiment */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!experimentId) { setLoading(false); return; }
      try {
        const data = await getExperimentById(experimentId);
        if (cancelled) return;
        if (data) {
          setExperiment(data);
          // Seed the simulation with the experiment's suggested circuit.
          const defaults = circuitDefaults(data);
          setMode(defaults.mode);
          setVoltage(defaults.voltage);
          setR1(defaults.r1);
          setR2(defaults.r2);
        }
        else {
          const mock = mockExperiments.find((m) => m.id === experimentId || m.slug === experimentId);
          setExperiment(mock ?? null);
        }
      } catch {
        if (cancelled) return;
        const mock = mockExperiments.find((m) => m.id === experimentId || m.slug === experimentId);
        setExperiment(mock ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [experimentId]);

  /* Circuit defaults from the experiment's simulation configuration */
  const simDefaults = useMemo(() => circuitDefaults(experiment), [experiment]);

  /* Compute simulation result */
  const result = useMemo<SimulationResult | null>(() => {
    const v = Number(voltage);
    const resistance1 = Number(r1);
    const resistance2 = Number(r2);
    if (!Number.isFinite(v) || !Number.isFinite(resistance1)) return null;
    if (mode === "parallel" && !Number.isFinite(resistance2)) return null;
    try {
      return runSimulation({ voltage: v, r1: resistance1, r2: mode === "parallel" ? resistance2 : undefined, mode, switchOn });
    } catch {
      return null;
    }
  }, [voltage, r1, r2, mode, switchOn]);

  function handleRun() {
    const v = Number(voltage);
    const res1 = Number(r1);
    if (!Number.isFinite(v) || v < 0) { setError("Please enter a valid non-negative voltage."); setSimStatus("error"); return; }
    if (!Number.isFinite(res1) || res1 <= 0) { setError("Resistance R1 must be greater than 0 Ω."); setSimStatus("error"); return; }
    if (mode === "parallel") {
      const res2 = Number(r2);
      if (!Number.isFinite(res2) || res2 <= 0) { setError("Resistance R2 must be greater than 0 Ω."); setSimStatus("error"); return; }
    }
    try {
      runSimulation({ voltage: v, r1: res1, r2: mode === "parallel" ? Number(r2) : undefined, mode, switchOn });
      setError("");
      setSimStatus("running");
      // Simulate brief running state
      setTimeout(() => {
        setSimStatus("completed");
        if (experiment) {
          saveExperimentStatus(experiment.id, "completed").catch(() => {});
          setStatusMap((prev) => ({ ...(prev ?? {}), [experiment.id]: "completed" }));
        }
        setRuns((prev) => [
          { id: prev.length + 1, timestamp: new Date().toLocaleTimeString(), status: "completed", result, mode },
          ...prev,
        ]);
      }, 800);
    } catch (e) {
      setSimStatus("error");
      setError(e instanceof Error ? e.message : "Unable to run the simulation.");
    }
  }

  function handleStop() { setSimStatus("stopped"); }

  function handleReset() {
    setVoltage(simDefaults.voltage); setR1(simDefaults.r1); setR2(simDefaults.r2);
    setMode(simDefaults.mode); setSimStatus("ready"); setSwitchOn(true); setError("");
  }

  function handleModeChange(nextMode: SimulationMode) {
    setMode(nextMode); setSimStatus("ready"); setError("");
  }

  function handleSave() {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
  }

  function handleOpenSimulation() {
    setActiveTab("simulation");
  }

  /* ---------- Render ---------- */

  if (loading) {
    return <main className="page-container"><LoadingState message="Loading workspace..." /></main>;
  }

  if (!experiment) {
    return (
      <main className="page-container">
        <Card className="ws-error-card">
          <h2>Experiment Not Found</h2>
          <p>We could not load this experiment.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="page-container ws-page">
      <WorkspaceHeader
        experiment={experiment}
        progress={progress.replace("_", " ")}
        saveStatus={saveStatus}
        onSave={handleSave}
        onOpenSimulation={handleOpenSimulation}
      />

      <WorkspaceProgress progress={progress as "not_started" | "in_progress" | "completed"} />

      <WorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="ws-layout">
        <div className="ws-main">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              <ExperimentContext experiment={experiment} />

              {experiment.theory && (
                <Card className="ws-section-card">
                  <div className="ws-section">
                    <p className="eyebrow">THEORY</p>
                    <h3 className="ws-section-title">Background Theory</h3>
                    <p className="ws-section-text">{experiment.theory}</p>
                  </div>
                </Card>
              )}

              {experiment.formulas && experiment.formulas.length > 0 && (
                <Card className="ws-section-card">
                  <div className="ws-section">
                    <p className="eyebrow">KEY FORMULAS</p>
                    {experiment.formulas.map((f, i) => (
                      <div key={i} className="ws-formula-block">
                        <code className="ws-formula-expr">{f.expression}</code>
                        <ul className="ws-formula-vars">
                          {f.variables.map((v) => (
                            <li key={v.symbol}><strong>{v.symbol}</strong> = {v.name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {experiment.procedure && experiment.procedure.length > 0 && (
                <Card className="ws-section-card">
                  <div className="ws-section">
                    <p className="eyebrow">PROCEDURE</p>
                    <h3 className="ws-section-title">Experiment Steps</h3>
                    <ol className="ws-instructions">
                      {experiment.procedure.map((step, i) => (
                        <li key={i}><span className="ws-step-num">{String(i + 1).padStart(2, "0")}</span> {step}</li>
                      ))}
                    </ol>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* CIRCUIT SETUP TAB */}
          {activeTab === "circuit-setup" && (
            <CircuitSetupPanel
              mode={mode}
              voltage={voltage}
              r1={r1}
              r2={r2}
              onVoltageChange={setVoltage}
              onR1Change={setR1}
              onR2Change={setR2}
              onModeChange={handleModeChange}
            />
          )}

          {/* SIMULATION TAB */}
          {activeTab === "simulation" && (
            <div className="ws-sim-environment">
              <SimulationToolbar
                status={simStatus}
                onRun={handleRun}
                onStop={handleStop}
                onReset={handleReset}
                onSave={handleSave}
              />

              <div className="sim-three-panel">
                {/* Left — mode selector + switch */}
                <div className="sim-left-panel">
                  <Card className="sim-panel">
                    <p className="eyebrow">MODE</p>
                    <div className="sim-mode-btns" role="group" aria-label="Circuit mode">
                      <button className={`ws-mode-btn ${mode === "series" ? "ws-mode-btn--active" : ""}`} onClick={() => handleModeChange("series")}>Series</button>
                      <button className={`ws-mode-btn ${mode === "parallel" ? "ws-mode-btn--active" : ""}`} onClick={() => handleModeChange("parallel")}>Parallel</button>
                    </div>
                  </Card>

                  <Card className="sim-panel">
                    <p className="eyebrow">PARAMETERS</p>
                    <div className="sim-param-group">
                      <label className="sim-param-label">
                        Voltage (V)
                        <input type="number" inputMode="decimal" min="0" className="sim-param-input" value={voltage} onChange={(e) => setVoltage(e.target.value)} aria-label="Voltage" />
                      </label>
                      <label className="sim-param-label">
                        R1 (Ω)
                        <input type="number" inputMode="decimal" min="0" className="sim-param-input" value={r1} onChange={(e) => setR1(e.target.value)} aria-label="Resistance R1" />
                      </label>
                      {mode === "parallel" && (
                        <label className="sim-param-label">
                          R2 (Ω)
                          <input type="number" inputMode="decimal" min="0" className="sim-param-input" value={r2} onChange={(e) => setR2(e.target.value)} aria-label="Resistance R2" />
                        </label>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Center — canvas */}
                <div className="sim-center-panel">
                  <Card className="sim-canvas-card">
                    <WorkspaceCircuitCanvas
                      mode={mode}
                      voltage={voltage}
                      r1={r1}
                      r2={r2}
                      running={simStatus === "running"}
                      switchOn={switchOn}
                      onToggleSwitch={() => { setSwitchOn((c) => !c); setError(""); }}
                    />
                  </Card>
                </div>

                {/* Right — measurements */}
                <div className="sim-right-panel">
                  <MeasurementsPanel result={result} status={simStatus} />
                  <SimulationHistory runs={runs} />
                </div>
              </div>

              {/* Status bar */}
              <div className="sim-status-bar" aria-live="polite">
                <span className="sim-status-text">
                  {simStatus === "ready" && "Ready to simulate"}
                  {simStatus === "running" && "Simulation running..."}
                  {simStatus === "completed" && "✓ Simulation completed"}
                  {simStatus === "stopped" && "Simulation stopped"}
                  {simStatus === "error" && `✕ ${error}`}
                </span>
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === "results" && (
            <div className="ws-results-area">
              <SimulationResults
                result={result}
                status={simStatus}
                error={error}
              />

              {experiment.expected_results && experiment.expected_results.length > 0 && (
                <Card className="ws-section-card">
                  <div className="ws-section">
                    <p className="eyebrow">EXPECTED RESULTS</p>
                    <h3 className="ws-section-title">What You Should Observe</h3>
                    <ul className="ws-expected-list">
                      {experiment.expected_results.map((result, i) => (
                        <li key={i}>{result}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              <SimulationHistory runs={runs} />
            </div>
          )}
        </div>

        <WorkspaceSidebar experiment={experiment} />
      </div>
    </main>
  );
}

export default WorkspacePage;
