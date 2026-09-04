/**
 * Workspace wrapper for CircuitCanvas — forwards viewport handle.
 */
import { forwardRef } from "react";
import type { SimulationResult } from "./engine";
import type { EditorState } from "../../hooks/useCircuitEditor";
import type { ComponentType } from "./editorTypes";
import CircuitCanvas, { type CircuitCanvasHandle } from "./CircuitCanvas";

export type { CircuitCanvasHandle };

interface WorkspaceCircuitCanvasProps {
  editor: EditorState;
  simResult: SimulationResult | null;
  onAddComponent: (type: ComponentType, x: number, y: number) => void;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onBeginMoveComponent?: (id: string) => void;
  onStartWire: (compId: string, termId: string, x: number, y: number) => void;
  onCompleteWire: (compId: string, termId: string) => void;
  onUpdateWirePreview: (x: number, y: number) => void;
  onCancelWire: () => void;
  onCancelPlacement: () => void;
  onDeleteWire?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  placementType: ComponentType | null;
  className?: string;
}

const WorkspaceCircuitCanvas = forwardRef<CircuitCanvasHandle, WorkspaceCircuitCanvasProps>(
  function WorkspaceCircuitCanvas({ className, ...props }, ref) {
    return (
      <div className={className}>
        <CircuitCanvas ref={ref} {...props} />
      </div>
    );
  },
);

export default WorkspaceCircuitCanvas;
