/**
 * Phase 10 — Professional circuit simulator page.
 * Workstation layout: palette | canvas | inspector + analysis.
 */
import { useCallback, useMemo, useState } from "react";

import { useCircuitEditor } from "../hooks/useCircuitEditor";
import { validateCircuit, hasBlockingErrors } from "../components/simulation/engine/circuitValidator";
import { solveDC } from "../components/simulation/engine/dcSolver";
import type { SimulationOutput, ValidationError } from "../components/simulation/engine/types";

import SimToolbar from "../components/simulation/SimToolbar";
import ComponentPalette from "../components/simulation/ComponentPalette";
import CircuitCanvas from "../components/simulation/CircuitCanvas";
import ComponentInspector from "../components/simulation/ComponentInspector";
import AnalysisPanel from "../components/simulation/AnalysisPanel";

function SimulationPage() {
  const editor = useCircuitEditor();
  const [simOutput, setSimOutput] = useState<SimulationOutput | null>(null);
  const [simStatus, setSimStatus] = useState<"idle" | "running" | "completed" | "error">("idle");

  // ── Validation (recomputed on every circuit change) ──
  const validationErrors: ValidationError[] = useMemo(
    () => validateCircuit(editor.state.circuit),
    [editor.state.circuit],
  );

  const canRun = !hasBlockingErrors(validationErrors) && editor.state.circuit.components.length > 0;

  // ── Run simulation ──
  const handleRun = useCallback(() => {
    if (!canRun) {
      setSimStatus("error");
      return;
    }
    setSimStatus("running");
    // Solve synchronously (educational scope)
    try {
      const output = solveDC(editor.state.circuit);
      setSimOutput(output);
      setSimStatus("completed");
    } catch {
      setSimStatus("error");
    }
  }, [canRun, editor.state.circuit]);

  const handleStop = useCallback(() => {
    setSimStatus("idle");
  }, []);

  // ── Save (placeholder — backend integration later) ──
  const handleSave = useCallback(() => {
    // TODO: persist via API
    console.log("Save circuit:", editor.state.circuit);
  }, [editor.state.circuit]);

  // ── Zoom / fit placeholders ──
  const handleZoomIn = useCallback(() => {} , []);
  const handleZoomOut = useCallback(() => {}, []);
  const handleFit = useCallback(() => {}, []);

  return (
    <main className="sim2-page">
      {/* Toolbar */}
      <SimToolbar
        status={simStatus}
        canRun={canRun}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        dirty={editor.state.dirty}
        onRun={handleRun}
        onStop={handleStop}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onClear={editor.clearCircuit}
        onSave={handleSave}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
      />

      {/* Three-panel layout */}
      <div className="sim2-layout">
        {/* Left: Component palette + Inspector */}
        <aside className="sim2-sidebar">
          <ComponentPalette
            selectedType={editor.state.placementType}
            onSelect={editor.setPlacementType}
          />
          <ComponentInspector
            component={editor.selectedComponent}
            onChange={editor.updateProperty}
            onDelete={editor.deleteComponent}
            onDuplicate={editor.duplicateComponent}
            onRotate={editor.rotateComponent}
          />
        </aside>

        {/* Center: Canvas + Analysis */}
        <div className="sim2-main">
          <CircuitCanvas
            editor={editor.state}
            simOutput={simOutput}
            onAddComponent={editor.addComponent}
            onSelectComponent={editor.selectComponent}
            onSelectWire={editor.selectWire}
            onMoveComponent={editor.moveComponent}
            onStartWire={editor.startWire}
            onCompleteWire={editor.completeWire}
            onUpdateWirePreview={editor.updateWirePreview}
            onCancelWire={editor.cancelWire}
            onCancelPlacement={editor.cancelPlacement}
            placementType={editor.state.placementType}
          />
          <AnalysisPanel
            circuit={editor.state.circuit}
            output={simOutput}
            validationErrors={validationErrors}
            selectedComponentId={editor.state.selectedComponentId}
          />
        </div>
      </div>
    </main>
  );
}

export default SimulationPage;
