/**
 * Simulation Page: full simulation workspace with canvas, palette, inspector, and analysis.
 */
import { useState, useCallback } from "react";
import { useCircuitEditor } from "../hooks/useCircuitEditor";
import { validateCircuit, solveCircuit } from "../components/simulation/engine";
import type { SimulationResult } from "../components/simulation/engine";
import type { ComponentType } from "../components/simulation/editorTypes";
import AnalysisPanel from "../components/simulation/AnalysisPanel";
import ComponentInspector from "../components/simulation/ComponentInspector";
import ComponentPalette from "../components/simulation/ComponentPalette";
import SimulationControls from "../components/simulation/SimulationControls";
import WorkspaceCircuitCanvas from "../components/simulation/WorkspaceCircuitCanvas";
import SimulationResults from "../components/simulation/SimulationResults";

function SimulationPage() {
  // Use the editor hook
  const {
    state,
    addComponent,
    moveComponent,
    rotateComponent,
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
    clearSelection,
    undo,
    redo,
    clearCircuit,
    getEngineCircuit,
    canUndo,
    canRedo,
    selectedComponent,
  } = useCircuitEditor();

  // Simulation state
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Run simulation
  const runSimulation = useCallback(async () => {
    setIsRunning(true);
    try {
      // Convert editor circuit to engine CircuitDefinition
      const engineCircuit = getEngineCircuit();
      // Validate
      const validation = validateCircuit(engineCircuit);
      if (!validation.isValid) {
        setSimResult({
          status: "invalid",
          validation,
          error: "Circuit validation failed",
        });
        setIsRunning(false);
        return;
      }
      // Solve
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

  // Reset simulation results
  const resetSimulation = useCallback(() => {
    setSimResult(null);
  }, []);

  // Clear all (circuit + results)
  const handleClearAll = useCallback(() => {
    clearCircuit();
    setSimResult(null);
  }, [clearCircuit]);

  return (
    <div className="sim-page">
      {/* Toolbar / Controls */}
      <div className="sim-page-toolbar">
        <SimulationControls
          onRun={runSimulation}
          onReset={resetSimulation}
          onUndo={undo}
          onRedo={redo}
          onClear={handleClearAll}
          canUndo={canUndo}
          canRedo={canRedo}
          isRunning={isRunning}
          hasResult={simResult !== null}
        />
      </div>

      <div className="sim-page-layout">
        {/* Left panel: Palette */}
        <div className="sim-page-palette">
          <ComponentPalette
            onSelectType={setPlacementType}
            selectedType={state.placementType}
          />
        </div>

        {/* Center: Canvas */}
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

        {/* Right panel: Inspector + Analysis */}
        <div className="sim-page-panels">
          {/* Component Inspector */}
          <div className="sim-page-inspector">
            <ComponentInspector
              component={selectedComponent}
              onUpdateProperty={updateProperty}
              onDeleteComponent={deleteComponent}
              onDuplicateComponent={duplicateComponent}
            />
          </div>

          {/* Analysis / Results */}
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