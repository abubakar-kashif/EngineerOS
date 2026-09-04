/**
 * Freeform Simulation Lab — EngineerOS electronics workstation.
 *
 * Pipeline: EditorCircuit → Adapter → validate → solve → measurements →
 * graphs → SimulationResult → persistence → UI (no competing result path).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCircuitEditor } from "../hooks/useCircuitEditor";
import { validateCircuit, solveCircuit } from "../components/simulation/engine";
import type { SimulationResult } from "../components/simulation/engine";
import AnalysisPanel from "../components/simulation/AnalysisPanel";
import ComponentInspector from "../components/simulation/ComponentInspector";
import ComponentPalette from "../components/simulation/ComponentPalette";
import InstrumentsPanel from "../components/simulation/InstrumentsPanel";
import GraphViewer from "../components/simulation/GraphViewer";
import SimToolbar, { type SimToolbarStatus } from "../components/simulation/SimToolbar";
import WorkspaceCircuitCanvas, {
  type CircuitCanvasHandle,
} from "../components/simulation/WorkspaceCircuitCanvas";
import WorkspaceMentorPanel from "../components/simulation/WorkspaceMentorPanel";
import SimulationResults from "../components/simulation/SimulationResults";
import MeasurementsPanel from "../components/simulation/MeasurementsPanel";
import { getExperimentById } from "../services/experimentService";
import { persistAndRunSimulation } from "../services/simulationPersistence";
import { toast } from "../components/ui/useToast";
import {
  createWorkspaceProject,
  downloadWorkspaceProject,
  loadWorkspaceFromLocalStorage,
  readWorkspaceProjectFile,
  saveWorkspaceToLocalStorage,
} from "../services/workspaceCircuitStorage";
import type { Experiment } from "../types/experiment";

const TEN_EXPERIMENT_IDS = [
  "ohms-law",
  "series-circuit",
  "parallel-circuit",
  "kvl",
  "kcl",
  "voltage-divider",
  "current-divider",
  "rc-circuit",
  "diode-characteristics",
  "led-circuit",
] as const;

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
    beginMoveComponent,
    deleteComponent,
    deleteWire,
    duplicateComponent,
    rotateComponent,
    updateProperty,
    startWire,
    startWireFromWire,
    updateWirePreview,
    pinWireWaypoint,
    completeWire,
    completeWireToWire,
    cancelWire,
    cancelPlacement,
    setPlacementType,
    selectComponent,
    selectWire,
    reshapeWire,
    prepareWireReshape,
    beginReshapeWire,
    moveWireEndpoint,
    beginMoveWireEndpoint,
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
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [simulationRunId, setSimulationRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [experiment, setExperiment] = useState<Experiment | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadExperiment() {
      if (!experimentParam) {
        setExperiment(null);
        return;
      }
      try {
        const data = await getExperimentById(experimentParam);
        if (!cancelled) setExperiment(data ?? null);
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
      if (experimentParam || experiment?.id) {
        engineCircuit.experimentId = experiment?.id ?? experimentParam ?? undefined;
      }
      const validation = validateCircuit(engineCircuit);
      if (!validation.valid) {
        const invalid: SimulationResult = {
          status: "invalid",
          validation,
          error: "Circuit validation failed",
        };
        setSimResult(invalid);
        const persist = await persistAndRunSimulation({
          circuit: engineCircuit,
          localResult: invalid,
          experimentId: experiment?.id ?? experimentParam,
          existingSimulationId: simulationId,
          name: experiment?.title ?? "Lab simulation",
        });
        if (persist.simulationId) setSimulationId(persist.simulationId);
        setSimulationRunId(persist.simulationRunId);
        if (persist.engineResult) setSimResult(persist.engineResult);
        return;
      }
      const result = solveCircuit(engineCircuit);
      setSimResult(result);

      const persist = await persistAndRunSimulation({
        circuit: engineCircuit,
        localResult: result,
        experimentId: experiment?.id ?? experimentParam,
        existingSimulationId: simulationId,
        name: experiment?.title ?? "Lab simulation",
      });
      if (persist.simulationId) setSimulationId(persist.simulationId);
      setSimulationRunId(persist.simulationRunId);
      if (persist.engineResult) setSimResult(persist.engineResult);
      if (persist.persisted) {
        toast.success(
          result.status === "completed" ? "Simulation completed" : "Simulation saved",
          "Mentor context updated with this run.",
        );
      } else if (persist.error) {
        toast.warning("Results not persisted", persist.error);
      }
      if (result.status === "failed" || result.status === "invalid") {
        toast.error(
          result.status === "invalid" ? "Circuit invalid" : "Simulation failed",
          result.validation?.errors?.[0]?.message ?? result.error ?? "Check the measurements panel.",
        );
      }
    } catch (err) {
      setSimResult({
        status: "failed",
        error: String(err),
      });
    } finally {
      setIsRunning(false);
    }
  }, [getEngineCircuit, experiment, experimentParam, simulationId]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetSimulation = useCallback(() => {
    setSimResult(null);
    setSimulationRunId(null);
  }, []);

  const handleClearAll = useCallback(() => {
    clearCircuit();
    setSimResult(null);
    setSimulationRunId(null);
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
    toast.success("Circuit saved", "Browser storage and download updated.");
  }, [state.circuit, experiment, experimentParam, markClean]);

  const handleOpenClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleOpenFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      const project = await readWorkspaceProjectFile(file);
      if (!project) {
        toast.error("Could not open project", "Choose a valid .engineeros.json file.");
        return;
      }
      loadCircuit(project.circuit);
      setSimResult(null);
      setSimulationRunId(null);
      if (project.viewport) {
        requestAnimationFrame(() => canvasRef.current?.setViewport(project.viewport!));
      } else {
        requestAnimationFrame(() => canvasRef.current?.fitToScreen());
      }
      toast.success("Circuit opened");
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
      toast.error("Fullscreen unavailable", "This browser blocked fullscreen mode.");
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
        onResetView={() => canvasRef.current?.resetZoom()}
        onToggleFullscreen={toggleFullscreen}
      />

      {experimentParam && TEN_EXPERIMENT_IDS.includes(experimentParam as (typeof TEN_EXPERIMENT_IDS)[number]) && (
        <p className="sim2-experiment-banner">
          Freeform lab for <strong>{experiment?.title ?? experimentParam}</strong> — same
          editor and simulation pipeline as all ten experiments.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.engineeros.json,application/json"
        hidden
        onChange={e => {
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
            onRotateComponent={rotateComponent}
          />
          <InstrumentsPanel
            result={simResult}
            selectedComponentId={state.selectedComponentId}
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
              onBeginMoveComponent={beginMoveComponent}
              onStartWire={startWire}
              onStartWireFromWire={startWireFromWire}
              onCompleteWire={completeWire}
              onCompleteWireToWire={completeWireToWire}
              onUpdateWirePreview={updateWirePreview}
              onPinWireWaypoint={pinWireWaypoint}
              onCancelWire={cancelWire}
              onCancelPlacement={cancelPlacement}
              onDeleteWire={deleteWire}
              onDeleteComponent={deleteComponent}
              onReshapeWire={reshapeWire}
              onPrepareWireReshape={prepareWireReshape}
              onBeginReshapeWire={beginReshapeWire}
              onMoveWireEndpoint={moveWireEndpoint}
              onBeginMoveWireEndpoint={beginMoveWireEndpoint}
              placementType={state.placementType}
            />
          </div>

          <div className="sim2-analysis">
            <div className="sim2-analysis-split">
              <div className="sim2-analysis-pane">
                <h3 className="sim2-results-heading">Measurements / Results</h3>
                {isRunning ? (
                  <p className="sim2-analysis-empty" role="status">
                    Simulation running…
                  </p>
                ) : simResult ? (
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
                {isRunning ? (
                  <p className="sim2-analysis-empty" role="status">
                    Waiting for solver graphs…
                  </p>
                ) : simResult?.graphs && simResult.graphs.length > 0 ? (
                  <GraphViewer graphs={simResult.graphs} />
                ) : (
                  <p className="sim2-analysis-empty">
                    Run a valid simulation to see graphs from the solver.
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
          simulationRunId={simulationRunId}
        />
      </div>

      <Link
        className="sim2-mentor-mobile-link"
        to={`/mentor?${new URLSearchParams({
          ...(experiment?.id || experimentParam
            ? { experiment: experiment?.id ?? experimentParam! }
            : {}),
          stage: "simulation",
          ...(simulationRunId ? { simulation: simulationRunId } : {}),
          ...(simResult?.status ? { sim: simResult.status } : {}),
        }).toString()}`}
      >
        Open AI Mentor
      </Link>
    </div>
  );
}

export default SimulationPage;
