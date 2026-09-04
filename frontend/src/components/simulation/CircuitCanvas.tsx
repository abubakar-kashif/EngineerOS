/**
 * Main circuit canvas: SVG-based editor with grid, snap, pan, zoom.
 * Renders components, wires, junctions, and handles all mouse interaction.
 * Zoom/pan stay inside the canvas viewport (not whole-page scroll).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentInstance, ComponentType } from "./editorTypes";
import { getTerminalWorldPosition } from "./editorUtils";
import type { SimulationResult } from "./engine";
import type { EditorState } from "../../hooks/useCircuitEditor";
import type { WorkspaceViewport } from "../../services/workspaceCircuitStorage";
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

export interface CircuitCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  resetZoom: () => void;
  getViewport: () => WorkspaceViewport;
  setViewport: (viewport: WorkspaceViewport) => void;
}

interface CircuitCanvasProps {
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
  onDeleteWire?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  placementType: ComponentType | null;
}

const GRID_SIZE = 20;
const DEFAULT_VIEW: WorkspaceViewport = { x: -40, y: -40, w: 880, h: 560 };

const CircuitCanvas = forwardRef<CircuitCanvasHandle, CircuitCanvasProps>(function CircuitCanvas(
  {
    editor,
    simResult,
    onAddComponent,
    onSelectComponent,
    onSelectWire,
    onMoveComponent,
    onStartWire,
    onCompleteWire,
    onUpdateWirePreview,
    onCancelWire,
    onCancelPlacement,
    onDeleteWire,
    onDeleteComponent,
    placementType,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState<WorkspaceViewport>(DEFAULT_VIEW);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(
    null,
  );

  const zoomByFactor = useCallback((factor: number) => {
    setViewBox((v) => {
      const newW = Math.max(200, Math.min(4000, v.w * factor));
      const newH = Math.max(200, Math.min(4000, v.h * factor));
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
    });
  }, []);

  const fitToScreen = useCallback(() => {
    const comps = editor.circuit.components;
    if (comps.length === 0) {
      setViewBox(DEFAULT_VIEW);
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of comps) {
      minX = Math.min(minX, c.x - 40);
      minY = Math.min(minY, c.y - 40);
      maxX = Math.max(maxX, c.x + 80);
      maxY = Math.max(maxY, c.y + 80);
    }
    for (const wire of editor.circuit.wires) {
      for (const p of wire.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }
    const pad = 60;
    const w = Math.max(200, maxX - minX + pad * 2);
    const h = Math.max(200, maxY - minY + pad * 2);
    setViewBox({ x: minX - pad, y: minY - pad, w, h });
  }, [editor.circuit.components, editor.circuit.wires]);

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: () => zoomByFactor(0.85),
      zoomOut: () => zoomByFactor(1.15),
      fitToScreen,
      resetZoom: () => setViewBox(DEFAULT_VIEW),
      getViewport: () => ({ ...viewBox }),
      setViewport: (viewport: WorkspaceViewport) => setViewBox({ ...viewport }),
    }),
    [zoomByFactor, fitToScreen, viewBox],
  );

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

  const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }
      if (e.button !== 0) return;
      if (placementType) {
        onAddComponent(placementType, snap(pos.x), snap(pos.y));
        return;
      }
      if (editor.wireStart) {
        onUpdateWirePreview(snap(pos.x), snap(pos.y));
        return;
      }
      if ((e.target as Element).closest(".canvas-component")) return;
      if ((e.target as Element).closest(".canvas-terminal")) return;
      if ((e.target as Element).closest(".canvas-wire")) return;
      onSelectComponent(null);
    },
    [
      screenToCanvas,
      placementType,
      editor.wireStart,
      onAddComponent,
      onSelectComponent,
      onUpdateWirePreview,
    ],
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
        onMoveComponent(dragging.id, snap(pos.x - dragging.offsetX), snap(pos.y - dragging.offsetY));
        return;
      }
      if (editor.wireStart) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onUpdateWirePreview(snap(pos.x), snap(pos.y));
      }
    },
    [
      panning,
      panStart,
      dragging,
      editor.wireStart,
      screenToCanvas,
      viewBox,
      onMoveComponent,
      onUpdateWirePreview,
    ],
  );

  const handleMouseUp = useCallback(() => {
    if (panning) setPanning(false);
    if (dragging) setDragging(null);
  }, [panning, dragging]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "Escape") {
        if (editor.wireStart) onCancelWire();
        else if (placementType) onCancelPlacement();
        else onSelectComponent(null);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editor.selectedWireId && onDeleteWire) {
          e.preventDefault();
          onDeleteWire(editor.selectedWireId);
        } else if (editor.selectedComponentId && onDeleteComponent) {
          e.preventDefault();
          onDeleteComponent(editor.selectedComponentId);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    editor.wireStart,
    editor.selectedWireId,
    editor.selectedComponentId,
    placementType,
    onCancelWire,
    onCancelPlacement,
    onSelectComponent,
    onDeleteWire,
    onDeleteComponent,
  ]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const svg = svgRef.current;
    if (!svg) {
      zoomByFactor(factor);
      return;
    }
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    setViewBox((v) => {
      const newW = Math.max(200, Math.min(4000, v.w * factor));
      const newH = Math.max(200, Math.min(4000, v.h * factor));
      const worldX = v.x + mx * v.w;
      const worldY = v.y + my * v.h;
      return {
        x: worldX - mx * newW,
        y: worldY - my * newH,
        w: newW,
        h: newH,
      };
    });
  }, [zoomByFactor]);

  const handleTerminalMouseDown = useCallback(
    (e: React.MouseEvent, compId: string, termId: string) => {
      e.stopPropagation();
      const comp = editor.circuit.components.find((c) => c.id === compId);
      if (!comp) return;
      const world = getTerminalWorldPosition(comp, termId);
      if (!world) return;
      if (editor.wireStart) {
        onCompleteWire(compId, termId);
      } else {
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

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, compId: string) => {
      if (e.button !== 0) return;
      if (editor.wireStart) return;
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

  const getComponentResult = (id: string) => {
    if (!simResult?.measurements) return undefined;
    return simResult.measurements.componentMeasurements.find((m: { componentId: string }) => m.componentId === id);
  };

  const renderComponent = (comp: ComponentInstance) => {
    const isSelected = editor.selectedComponentId === comp.id;
    const result = getComponentResult(comp.id);
    const activeTerminal =
      editor.wireStart && editor.wireStart.componentId === comp.id
        ? editor.wireStart.terminalId
        : null;

    const terminalData = comp.terminals.map((t: string) => {
      const connected = editor.circuit.connections.some(
        (conn) => conn.from === `${comp.id}:${t}` || conn.to === `${comp.id}:${t}`,
      );
      const world = getTerminalWorldPosition(comp, t);
      return {
        id: t,
        x: world ? world.x - comp.x : 0,
        y: world ? world.y - comp.y : 0,
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
        const label =
          c >= 0.001 ? `${(c * 1000).toFixed(1)}mF` : c >= 1e-6 ? `${(c * 1e6).toFixed(1)}μF` : `${c}F`;
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
        node = <DiodeNode {...commonProps} />;
        break;
      case "led":
        node = <LEDNode {...commonProps} color={comp.properties.color as string} />;
        break;
      case "switch":
        node = <SwitchNode {...commonProps} closed={comp.properties.closed as boolean} />;
        break;
      case "ground":
        node = <GroundNode {...commonProps} />;
        break;
      case "voltmeter":
        node = (
          <VoltmeterNode
            {...commonProps}
            reading={result ? `${result.voltage.toFixed(2)}V` : undefined}
          />
        );
        break;
      case "ammeter":
        node = (
          <AmmeterNode
            {...commonProps}
            reading={result ? `${(result.current * 1000).toFixed(2)}mA` : undefined}
          />
        );
        break;
      default:
        node = null;
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

  return (
    <div
      ref={containerRef}
      className="sim-canvas-container"
      onWheel={handleWheel}
    >
      <svg
        ref={svgRef}
        className="sim-canvas-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {gridPattern}
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid-dots)" />

        {editor.circuit.wires.map((wire) => (
          <CircuitWire
            key={wire.id}
            wire={wire}
            selected={wire.id === editor.selectedWireId}
            onClick={() => onSelectWire(wire.id)}
          />
        ))}

        {editor.wireStart && editor.wirePreviewPoints.length > 1 && (
          <WirePreview points={editor.wirePreviewPoints} />
        )}

        {editor.circuit.junctions?.map((j, idx) => (
          <JunctionMarker key={`junction-${idx}`} cx={j.x} cy={j.y} />
        ))}

        {editor.circuit.components.map(renderComponent)}
      </svg>

      {editor.circuit.components.length === 0 && !placementType && <EmptyCanvasState />}

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
        {!placementType && !editor.wireStart && (
          <span className="sim-mode-indicator sim-mode-hint">
            Scroll to zoom · Alt+drag or middle-click to pan · Delete removes selection
          </span>
        )}
      </div>
    </div>
  );
});

export default CircuitCanvas;
