/**
 * Simulation Page: full simulation workspace with canvas, palette, inspector, and analysis.
 */
import { useState, useCallback } from "react";
import { useCircuitEditor } from "../hooks/useCircuitEditor";
import { validateCircuit, solveCircuit } from "../components/simulation/engine";
import type { SimulationResult } from "../components/simulation/engine";
import AnalysisPanel from "../components/simulation/AnalysisPanel";
import ComponentInspector from "../components/simulation/ComponentInspector";
import ComponentPalette from "../components/simulation/ComponentPalette";
import SimulationControls from "../components/simulation/SimulationControls";
import WorkspaceCircuitCanvas from "../components/simulation/WorkspaceCircuitCanvas";
import SimulationResults from "../components/simulation/SimulationResults";

function SimulationPage() {
  const {
    state,
    addComponent,
    moveComponent,
    deleteComponent,
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
    getEngineCircuit,
    canUndo,
    canRedo,
    selectedComponent,
  } = useCircuitEditor();

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

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
        setIsRunning(false);
        return;
      }
      const result = solveCircuit(engineCircuit);
      setSimResult(result);
    } catch (err) {
      setSimResult({
        status: "failed",
        error: String(err),
      });
    }
    setIsRunning(false);
  }, [getEngineCircuit]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    // If needed, you can cancel any ongoing simulation here.
  }, []);

  const resetSimulation = useCallback(() => setSimResult(null), []);
  const handleClearAll = useCallback(() => {
    clearCircuit();
    setSimResult(null);
  }, [clearCircuit]);

  return (
    <div className="sim-page">
      <div className="sim-page-toolbar">
        <SimulationControls
          onRun={runSimulation}
          onStop={stopSimulation}
          onReset={resetSimulation}
          onUndo={undo}
          onRedo={redo}
          onClear={handleClearAll}
          canUndo={canUndo}
          canRedo={canRedo}
          running={isRunning}
        />
      </div>

      <div className="sim-page-layout">
        <div className="sim-page-palette">
          <ComponentPalette
            onSelectType={setPlacementType}
            selectedType={state.placementType}
          />
        </div>

        <div className="sim-page-canvas">
          <WorkspaceCircuitCanvas
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
            placementType={state.placementType}
          />
        </div>

        <div className="sim-page-panels">
          <div className="sim-page-inspector">
            <ComponentInspector
              component={selectedComponent}
              onUpdateProperty={updateProperty}
              onDeleteComponent={deleteComponent}
              onDuplicateComponent={duplicateComponent}
            />
          </div>

          <div className="sim-page-analysis">
            {simResult ? (
              <SimulationResults result={simResult} />
            ) : (
              <AnalysisPanel
                circuit={getEngineCircuit()}
                result={simResult}
                selectedComponentId={state.selectedComponentId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulationPage;