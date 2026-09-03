/**
 * Workspace wrapper for CircuitCanvas, adds controls and passes props.
 * This forwards all props to the interactive CircuitCanvas.
 */
import type { SimulationResult } from "../engine";
import type { EditorState } from "../../hooks/useCircuitEditor";
import type { ComponentType } from "../editorTypes";
import CircuitCanvas from "./CircuitCanvas";

interface WorkspaceCircuitCanvasProps {
  editor: EditorState;
  simResult: SimulationResult | null;
  onAddComponent: (type: ComponentType, x: number, y: number) => void;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onStartWire: (compId: string, termId: string, x: number, y: number) => void;
  onCompleteWire: (compId: string, termId: string) => void;
  onUpdateWirePreview: (x: number, y: number) => void;
  onCancelWire: () => void;
  onCancelPlacement: () => void;
  placementType: ComponentType | null;
  className?: string;
}

function WorkspaceCircuitCanvas(props: WorkspaceCircuitCanvasProps) {
  // If you need additional workspace-specific logic, add it here.
  // For now, just forward everything to CircuitCanvas.
  return <CircuitCanvas {...props} />;
}

export default WorkspaceCircuitCanvas;