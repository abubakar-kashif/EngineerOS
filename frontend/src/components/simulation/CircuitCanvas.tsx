/**
 * Main circuit canvas: SVG-based editor with grid, snap, pan, zoom.
 * Renders components, wires, junctions, and handles all mouse interaction.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentInstance, ComponentType, SimulationOutput } from "./engine/types";
import { getTerminalWorldPosition } from "./engine/types";
import type { EditorState } from "../../hooks/useCircuitEditor";
import {
  VoltageSourceNode,
  CurrentSourceNode,
  ResistorNode,
  CapacitorNode,
  InductorNode,
  DiodeNode,
  LEDNode,
  SwitchNode,
  GroundNode,
  VoltmeterNode,
  AmmeterNode,
  JunctionMarker,
} from "./nodes/ComponentNodes";
import CircuitWire, { WirePreview } from "./CircuitWire";
import EmptyCanvasState from "./EmptyCanvasState";

interface CircuitCanvasProps {
  editor: EditorState;
  simOutput: SimulationOutput | null;
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
}

const GRID_SIZE = 20;

function CircuitCanvas({
  editor,
  simOutput,
  onAddComponent,
  onSelectComponent,
  onSelectWire,
  onMoveComponent,
  onStartWire,
  onCompleteWire,
  onUpdateWirePreview,
  onCancelWire,
  onCancelPlacement,
  placementType,
}: CircuitCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -40, y: -40, w: 880, h: 560 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      return {
        x: (clientX - rect.left) * scaleX + viewBox.x,
        y: (clientY - rect.top) * scaleY + viewBox.y,
      };
    },
    [viewBox],
  );

  // Snap to grid
  const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  // ── Mouse handlers ──

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);

      // Middle mouse or space+click = pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      if (e.button !== 0) return;

      // Placement mode
      if (placementType) {
        onAddComponent(placementType, snap(pos.x), snap(pos.y));
        return;
      }

      // Wire drawing mode — check if clicking on background
      if (editor.wireStart) {
        // Add intermediate point for orthogonal routing
        onUpdateWirePreview(snap(pos.x), snap(pos.y));
        return;
      }

      // Click on empty space = deselect
      if ((e.target as Element).closest(".canvas-component")) return;
      if ((e.target as Element).closest(".canvas-terminal")) return;
      if ((e.target as Element).closest(".canvas-wire")) return;
      onSelectComponent(null);
    },
    [screenToCanvas, placementType, editor.wireStart, onAddComponent, onSelectComponent, onUpdateWirePreview],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scaleX = viewBox.w / rect.width;
        const scaleY = viewBox.h / rect.height;
        setViewBox((v) => ({ ...v, x: v.x - dx * scaleX, y: v.y - dy * scaleY }));
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      if (dragging) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onMoveComponent(dragging.id, snap(pos.x), snap(pos.y));
        return;
      }

      if (editor.wireStart) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onUpdateWirePreview(snap(pos.x), snap(pos.y));
      }
    },
    [panning, panStart, dragging, editor.wireStart, screenToCanvas, viewBox, onMoveComponent, onUpdateWirePreview],
  );

  const handleMouseUp = useCallback(
    () => {
      if (panning) {
        setPanning(false);
        return;
      }
      if (dragging) {
        setDragging(null);
        return;
      }
    },
    [panning, dragging],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editor.wireStart) onCancelWire();
        else if (placementType) onCancelPlacement();
        else onSelectComponent(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        // Delete is handled by the inspector / keyboard shortcut in parent
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editor.wireStart, placementType, onCancelWire, onCancelPlacement, onSelectComponent]);

  // Zoom with mouse wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((v) => {
        const newW = Math.max(200, Math.min(4000, v.w * factor));
        const newH = Math.max(200, Math.min(4000, v.h * factor));
        const cx = v.x + v.w / 2;
        const cy = v.y + v.h / 2;
        return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
      });
    },
    [],
  );

  // ── Component terminal handlers ──

  const handleTerminalMouseDown = useCallback(
    (e: React.MouseEvent, compId: string, termId: string) => {
      e.stopPropagation();
      const comp = editor.circuit.components.find((c) => c.id === compId);
      if (!comp) return;
      const world = getTerminalWorldPosition(comp, termId);
      if (!world) return;

      if (editor.wireStart) {
        // Complete the wire
        onCompleteWire(compId, termId);
      } else {
        // Start a new wire
        onStartWire(compId, termId, world.x, world.y);
      }
    },
    [editor.circuit.components, editor.wireStart, onStartWire, onCompleteWire],
  );

  const handleTerminalMouseUp = useCallback(
    (e: React.MouseEvent, compId: string, termId: string) => {
      e.stopPropagation();
      if (editor.wireStart && editor.wireStart.componentId !== compId) {
        onCompleteWire(compId, termId);
      }
    },
    [editor.wireStart, onCompleteWire],
  );

  // ── Component drag start ──

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, compId: string) => {
      if (e.button !== 0) return;
      if (editor.wireStart) return; // Don't drag while wiring
      e.stopPropagation();
      onSelectComponent(compId);
      const pos = screenToCanvas(e.clientX, e.clientY);
      const comp = editor.circuit.components.find((c) => c.id === compId);
      if (!comp) return;
      setDragging({
        id: compId,
        offsetX: pos.x - comp.x,
        offsetY: pos.y - comp.y,
      });
    },
    [editor.wireStart, editor.circuit.components, screenToCanvas, onSelectComponent],
  );

  // ── Render component SVG ──

  const getComponentResult = (id: string) =>
    simOutput?.components.find((r) => r.componentId === id);

  const renderComponent = (comp: ComponentInstance) => {
    const isSelected = editor.selectedComponentId === comp.id;
    const result = getComponentResult(comp.id);
    const activeTerminal = editor.wireStart?.componentId === comp.id
      ? editor.wireStart.terminalId
      : null;

    const terminalData = comp.terminals.map((t) => {
      const connected = editor.circuit.connections.some(
        (conn) =>
          conn.from === `${comp.id}:${t.id}` ||
          conn.to === `${comp.id}:${t.id}`,
      );
      const world = getTerminalWorldPosition(comp, t.id);
      return {
        id: t.id,
        x: world ? world.x - comp.x : t.x,
        y: world ? world.y - comp.y : t.y,
        connected,
      };
    });

    const commonProps = {
      label: comp.label,
      selected: isSelected,
      terminals: terminalData,
      activeTerminal,
      onTerminalMouseDown: (e: React.MouseEvent, termId: string) =>
        handleTerminalMouseDown(e, comp.id, termId),
      onTerminalMouseUp: (e: React.MouseEvent, termId: string) =>
        handleTerminalMouseUp(e, comp.id, termId),
    };

    let node: React.ReactNode;
    switch (comp.type) {
      case "voltage_source":
        node = <VoltageSourceNode {...commonProps} voltage={`${comp.properties.voltage}V`} />;
        break;
      case "current_source":
        node = <CurrentSourceNode {...commonProps} currentValue={`${comp.properties.current}A`} />;
        break;
      case "resistor": {
        const r = comp.properties.resistance as number;
        const label = r >= 1000 ? `${(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)}kΩ` : `${r}Ω`;
        node = <ResistorNode {...commonProps} value={label} />;
        break;
      }
      case "capacitor": {
        const c = comp.properties.capacitance as number;
        const label = c >= 0.001 ? `${(c * 1000).toFixed(1)}mF` : c >= 1e-6 ? `${(c * 1e6).toFixed(1)}μF` : `${c}F`;
        node = <CapacitorNode {...commonProps} value={label} />;
        break;
      }
      case "inductor": {
        const l = comp.properties.inductance as number;
        const label = l >= 1 ? `${l}H` : `${(l * 1000).toFixed(1)}mH`;
        node = <InductorNode {...commonProps} value={label} />;
        break;
      }
      case "diode":
        node = <DiodeNode {...commonProps} state={result?.state} />;
        break;
      case "led":
        node = <LEDNode {...commonProps} state={result?.state} color={comp.properties.color as string} />;
        break;
      case "switch":
        node = <SwitchNode {...commonProps} closed={comp.properties.closed as boolean} />;
        break;
      case "ground":
        node = <GroundNode {...commonProps} />;
        break;
      case "voltmeter":
        node = <VoltmeterNode {...commonProps} reading={result ? `${result.voltage.toFixed(2)}V` : undefined} />;
        break;
      case "ammeter":
        node = <AmmeterNode {...commonProps} reading={result ? `${(result.current * 1000).toFixed(2)}mA` : undefined} />;
        break;
    }

    return (
      <g
        key={comp.id}
        className="canvas-component"
        transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
        onMouseDown={(e) => handleComponentMouseDown(e, comp.id)}
        style={{ cursor: dragging?.id === comp.id ? "grabbing" : "grab" }}
      >
        {node}
      </g>
    );
  };

  // ── Grid pattern ──

  const gridPattern = useMemo(() => {
    const size = GRID_SIZE;
    return (
      <defs>
        <pattern id="grid-dots" width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={size / 2} cy={size / 2} r={0.8} fill="var(--color-border)" />
        </pattern>
      </defs>
    );
  }, []);

  // Empty state
  if (editor.circuit.components.length === 0 && !placementType) {
    return (
      <div className="sim-canvas-container">
        <svg
          ref={svgRef}
          className="sim-canvas-svg"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {gridPattern}
          <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid-dots)" />
        </svg>
        <EmptyCanvasState />
      </div>
    );
  }

  return (
    <div className="sim-canvas-container">
      <svg
        ref={svgRef}
        className="sim-canvas-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {gridPattern}
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid-dots)" />

        {/* Wires */}
        {editor.circuit.wires.map((wire) => (
          <CircuitWire
            key={wire.id}
            wire={wire}
            selected={wire.id === editor.selectedWireId}
            onClick={() => onSelectWire(wire.id)}
          />
        ))}

        {/* Wire preview */}
        {editor.wireStart && editor.wirePreviewPoints.length > 1 && (
          <WirePreview points={editor.wirePreviewPoints} />
        )}

        {/* Junctions */}
        {editor.circuit.junctions.map((j) => (
          <JunctionMarker key={j.id} cx={j.x} cy={j.y} />
        ))}

        {/* Components */}
        {editor.circuit.components.map(renderComponent)}
      </svg>

      {/* Canvas mode indicator */}
      <div className="sim-canvas-mode">
        {placementType && (
          <span className="sim-mode-indicator sim-mode-indicator--place">
            Click to place {placementType.replace(/_/g, " ")} • Esc to cancel
          </span>
        )}
        {editor.wireStart && (
          <span className="sim-mode-indicator sim-mode-indicator--wire">
            Click terminal to connect • Esc to cancel
          </span>
        )}
      </div>
    </div>
  );
}

export default CircuitCanvas;
