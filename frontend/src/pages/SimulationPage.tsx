/**
 * Freeform Simulation Lab — EngineerOS electronics workstation.
 *
 * Layout: header controls | components | canvas | AI Mentor | measurements
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCircuitEditor } from "../hooks/useCircuitEditor";
import { validateCircuit, solveCircuit } from "../components/simulation/engine";
import type { SimulationResult } from "../components/simulation/engine";
import AnalysisPanel from "../components/simulation/AnalysisPanel";
import ComponentInspector from "../components/simulation/ComponentInspector";
import ComponentPalette from "../components/simulation/ComponentPalette";
import SimToolbar, { type SimToolbarStatus } from "../components/simulation/SimToolbar";
import WorkspaceCircuitCanvas, {
  type CircuitCanvasHandle,
} from "../components/simulation/WorkspaceCircuitCanvas";
import WorkspaceMentorPanel from "../components/simulation/WorkspaceMentorPanel";
import SimulationResults from "../components/simulation/SimulationResults";
import MeasurementsPanel from "../components/simulation/MeasurementsPanel";
import { getExperimentById } from "../services/experimentService";
import {
  createWorkspaceProject,
  downloadWorkspaceProject,
  loadWorkspaceFromLocalStorage,
  readWorkspaceProjectFile,
  saveWorkspaceToLocalStorage,
} from "../services/workspaceCircuitStorage";
import type { Experiment } from "../types/experiment";

function SimulationPage() {
  const [searchParams] = useSearchParams();
  const experimentParam = searchParams.get("experiment");
  const canvasRef = useRef<CircuitCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labRef = useRef<HTMLDivElement>(null);

  const {
    state,
    addComponent,
    moveComponent,
    deleteComponent,
    deleteWire,
    duplicateComponent,
    updateProperty,
    startWire,
    updateWirePreview,
    completeWire,
    cancelWire,
    cancelPlacement,
    setPlacementType,
    selectComponent,
    selectWire,
    undo,
    redo,
    clearCircuit,
    loadCircuit,
    markClean,
    getEngineCircuit,
    canUndo,
    canRedo,
    selectedComponent,
  } = useCircuitEditor();

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [persistMessage, setPersistMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadExperiment() {
      if (!experimentParam) {
        setExperiment(null);
        return;
      }
      try {
        const data = await getExperimentById(experimentParam);
        if (!cancelled) setExperiment(data);
      } catch {
        if (!cancelled) setExperiment(null);
      }
    }
    void loadExperiment();
    return () => {
      cancelled = true;
    };
  }, [experimentParam]);

  // Restore last local workspace once on mount (does not fabricate demo circuits).
  useEffect(() => {
    const saved = loadWorkspaceFromLocalStorage();
    if (saved?.circuit.components.length) {
      loadCircuit(saved.circuit);
      if (saved.viewport) {
        requestAnimationFrame(() => canvasRef.current?.setViewport(saved.viewport!));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot restore
  }, []);

  useEffect(() => {
    function onFsChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toolbarStatus: SimToolbarStatus = useMemo(() => {
    if (isRunning) return "running";
    if (!simResult) return "idle";
    if (simResult.status === "completed") return "completed";
    if (simResult.status === "invalid") return "invalid";
    if (simResult.status === "failed") return "failed";
    return "error";
  }, [isRunning, simResult]);

  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    try {
      const engineCircuit = getEngineCircuit();
      const validation = validateCircuit(engineCircuit);
      if (!validation.valid) {
        setSimResult({
          status: "invalid",
          validation,
          error: "Circuit validation failed",
        });
        return;
      }
      const result = solveCircuit(engineCircuit);
      setSimResult(result);
    } catch (err) {
      setSimResult({
        status: "failed",
        error: String(err),
      });
    } finally {
      setIsRunning(false);
    }
  }, [getEngineCircuit]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetSimulation = useCallback(() => setSimResult(null), []);

  const handleClearAll = useCallback(() => {
    clearCircuit();
    setSimResult(null);
  }, [clearCircuit]);

  const handleSave = useCallback(() => {
    const project = createWorkspaceProject(state.circuit, {
      experimentId: experiment?.id ?? experimentParam,
      viewport: canvasRef.current?.getViewport() ?? null,
    });
    saveWorkspaceToLocalStorage(project);
    downloadWorkspaceProject(
      project,
      `${(experiment?.slug || experiment?.id || "circuit").replace(/\s+/g, "-")}.engineeros.json`,
    );
    markClean();
    setPersistMessage("Circuit saved (browser + download).");
    window.setTimeout(() => setPersistMessage(null), 2500);
  }, [state.circuit, experiment, experimentParam, markClean]);

  const handleOpenClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleOpenFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const project = await readWorkspaceProjectFile(file);
      if (!project) {
        setPersistMessage("Could not open that project file.");
        window.setTimeout(() => setPersistMessage(null), 3000);
        return;
      }
      loadCircuit(project.circuit);
      setSimResult(null);
      if (project.viewport) {
        requestAnimationFrame(() => canvasRef.current?.setViewport(project.viewport!));
      } else {
        requestAnimationFrame(() => canvasRef.current?.fitToScreen());
      }
      setPersistMessage("Circuit opened.");
      window.setTimeout(() => setPersistMessage(null), 2500);
    },
    [loadCircuit],
  );

  const toggleFullscreen = useCallback(async () => {
    const el = labRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setPersistMessage("Fullscreen is not available in this browser.");
      window.setTimeout(() => setPersistMessage(null), 3000);
    }
  }, []);

  return (
    <div
      ref={labRef}
      className={`sim2-page ${fullscreen ? "sim2-page--fullscreen" : ""}`}
    >
      <SimToolbar
        status={toolbarStatus}
        experimentTitle={experiment?.title}
        canRun={!isRunning && state.circuit.components.length > 0}
        canUndo={canUndo}
        canRedo={canRedo}
        dirty={state.dirty}
        fullscreen={fullscreen}
        onRun={runSimulation}
        onStop={stopSimulation}
        onReset={resetSimulation}
        onUndo={undo}
        onRedo={redo}
        onClear={handleClearAll}
        onSave={handleSave}
        onOpen={handleOpenClick}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onFit={() => canvasRef.current?.fitToScreen()}
        onToggleFullscreen={toggleFullscreen}
      />

      {persistMessage && (
        <div className="sim2-toast" role="status">
          {persistMessage}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.engineeros.json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          void handleOpenFile(file);
          e.target.value = "";
        }}
      />

      <div className="sim2-layout sim2-layout--lab">
        <aside className="sim2-sidebar">
          <ComponentPalette
            onSelectType={setPlacementType}
            selectedType={state.placementType}
          />
          <ComponentInspector
            component={selectedComponent}
            onUpdateProperty={updateProperty}
            onDeleteComponent={deleteComponent}
            onDuplicateComponent={duplicateComponent}
          />
        </aside>

        <div className="sim2-main">
          <div className="sim2-canvas-zone">
            <WorkspaceCircuitCanvas
              ref={canvasRef}
              className="sim2-canvas-host"
              editor={state}
              simResult={simResult}
              onAddComponent={addComponent}
              onSelectComponent={selectComponent}
              onSelectWire={selectWire}
              onMoveComponent={moveComponent}
              onStartWire={startWire}
              onCompleteWire={completeWire}
              onUpdateWirePreview={updateWirePreview}
              onCancelWire={cancelWire}
              onCancelPlacement={cancelPlacement}
              onDeleteWire={deleteWire}
              onDeleteComponent={deleteComponent}
              placementType={state.placementType}
            />
          </div>

          <div className="sim2-analysis">
            <div className="sim2-analysis-split">
              <div className="sim2-analysis-pane">
                <h3 className="sim2-results-heading">Measurements / Results</h3>
                {simResult ? (
                  <>
                    <SimulationResults result={simResult} />
                    <MeasurementsPanel result={simResult} />
                  </>
                ) : (
                  <AnalysisPanel
                    circuit={getEngineCircuit()}
                    result={simResult}
                    selectedComponentId={state.selectedComponentId}
                  />
                )}
              </div>
              <div className="sim2-analysis-pane">
                <h3 className="sim2-results-heading">Graphs</h3>
                {simResult?.graphs && simResult.graphs.length > 0 ? (
                  <ul className="sim2-graph-list">
                    {simResult.graphs.map((g) => (
                      <li key={g.id} className="sim2-graph-item">
                        <strong>{g.title}</strong>
                        <span>
                          {g.type} · {g.series?.length ?? 0} series
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sim2-analysis-empty">
                    Run a valid simulation to see graph summaries from the solver.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <WorkspaceMentorPanel
          experimentId={experiment?.id ?? experimentParam}
          experimentTitle={experiment?.title ?? null}
          simResult={simResult}
        />
      </div>
    </div>
  );
}

export default SimulationPage;
