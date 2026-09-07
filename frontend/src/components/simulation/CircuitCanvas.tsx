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
import { getTerminalLocalOffset, getTerminalWorldPosition } from "./editorUtils";
import type { SimulationResult } from "./engine";
import type { EditorState } from "../../hooks/useCircuitEditor";
import type { WorkspaceViewport } from "../../services/workspaceCircuitStorage";
import {
  panViewBoxByClientDelta,
  screenToWorldFromRect,
  zoomViewBoxAt,
  zoomViewBoxCenter,
} from "./viewportMath";
import { findNearestTerminal, hitTestWire } from "./wireTopology";
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
  onBeginMoveComponent?: (id: string) => void;
  onStartWire: (compId: string, termId: string, x: number, y: number) => void;
  onStartWireFromWire?: (wireId: string, x: number, y: number) => void;
  onCompleteWire: (compId: string, termId: string) => void;
  onCompleteWireToWire?: (wireId: string, x: number, y: number) => void;
  onUpdateWirePreview: (x: number, y: number) => void;
  onPinWireWaypoint?: (x: number, y: number) => void;
  onCancelWire: () => void;
  onCancelPlacement: () => void;
  onDeleteWire?: (id: string) => void;
  onDeleteComponent?: (id: string) => void;
  onReshapeWire?: (wireId: string, vertexIndex: number, x: number, y: number) => void;
  onPrepareWireReshape?: (wireId: string, x: number, y: number) => number;
  onBeginReshapeWire?: (wireId: string) => void;
  onMoveWireEndpoint?: (wireId: string, which: "a" | "b", x: number, y: number) => void;
  onCommitWireEndpoint?: (wireId: string, which: "a" | "b", x: number, y: number) => void;
  onBeginMoveWireEndpoint?: (wireId: string) => void;
  placementType: ComponentType | null;
}

const GRID_SIZE = 20;
const DEFAULT_VIEW: WorkspaceViewport = { x: -40, y: -40, w: 880, h: 560 };
const WIRE_DRAG_THRESHOLD_PX = 6;

const CircuitCanvas = forwardRef<CircuitCanvasHandle, CircuitCanvasProps>(function CircuitCanvas(
  {
    editor,
    simResult,
    onAddComponent,
    onSelectComponent,
    onSelectWire,
    onMoveComponent,
    onBeginMoveComponent,
    onStartWire,
    onStartWireFromWire,
    onCompleteWire,
    onCompleteWireToWire,
    onUpdateWirePreview,
    onPinWireWaypoint,
    onCancelWire,
    onCancelPlacement,
    onDeleteWire,
    onDeleteComponent,
    onReshapeWire,
    onPrepareWireReshape,
    onBeginReshapeWire,
    onMoveWireEndpoint,
    onCommitWireEndpoint,
    onBeginMoveWireEndpoint,
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
  const [reshaping, setReshaping] = useState<{
    wireId: string;
    vertexIndex: number;
  } | null>(null);
  const [movingEndpoint, setMovingEndpoint] = useState<{
    wireId: string;
    which: "a" | "b";
  } | null>(null);
  const [pendingWireGesture, setPendingWireGesture] = useState<{
    wireId: string;
    world: { x: number; y: number };
    clientX: number;
    clientY: number;
  } | null>(null);

  const zoomByFactor = useCallback((factor: number) => {
    setViewBox((v) => zoomViewBoxCenter(v, factor));
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

  /** Single screen → world path for place / select / drag / wire / hit targeting. */
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };

      // Prefer SVG CTM so letterboxing / zoom / pan stay aligned with the cursor.
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const sp = pt.matrixTransform(ctm.inverse());
        return { x: sp.x, y: sp.y };
      }

      return screenToWorldFromRect(clientX, clientY, svg.getBoundingClientRect(), viewBox);
    },
    [viewBox],
  );

  const snap = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 2) {
        setPendingWireGesture(null);
        if (editor.wireStart) onCancelWire();
        else if (placementType) onCancelPlacement();
        return;
      }
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
      if ((e.target as Element).closest(".canvas-component")) return;
      if ((e.target as Element).closest(".canvas-terminal")) return;
      if ((e.target as Element).closest(".canvas-wire-endpoint")) return;
      if ((e.target as Element).closest(".canvas-wire")) return;

      if (editor.wireStart) {
        // Pin-to-pin: snap to terminals only. Never auto-join a crossed wire.
        const term = findNearestTerminal(editor.circuit, pos);
        if (term) {
          onCompleteWire(term.componentId, term.terminalId);
        } else {
          onPinWireWaypoint?.(pos.x, pos.y);
        }
        return;
      }

      onSelectComponent(null);
      onSelectWire(null);
    },
    [
      screenToCanvas,
      placementType,
      editor.wireStart,
      editor.circuit,
      onAddComponent,
      onSelectComponent,
      onSelectWire,
      onCancelWire,
      onCancelPlacement,
      onCompleteWire,
      onPinWireWaypoint,
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
        setViewBox((v) => panViewBoxByClientDelta(v, dx, dy, rect.width, rect.height));
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }
      if (pendingWireGesture && !reshaping && !movingEndpoint) {
        const dx = e.clientX - pendingWireGesture.clientX;
        const dy = e.clientY - pendingWireGesture.clientY;
        if (Math.hypot(dx, dy) >= WIRE_DRAG_THRESHOLD_PX) {
          onBeginReshapeWire?.(pendingWireGesture.wireId);
          const vertexIndex =
            onPrepareWireReshape?.(
              pendingWireGesture.wireId,
              pendingWireGesture.world.x,
              pendingWireGesture.world.y,
            ) ?? 1;
          setReshaping({ wireId: pendingWireGesture.wireId, vertexIndex });
          setPendingWireGesture(null);
        }
        return;
      }
      if (movingEndpoint && onMoveWireEndpoint) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onMoveWireEndpoint(movingEndpoint.wireId, movingEndpoint.which, pos.x, pos.y);
        return;
      }
      if (reshaping && onReshapeWire) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onReshapeWire(reshaping.wireId, reshaping.vertexIndex, pos.x, pos.y);
        return;
      }
      if (dragging) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onMoveComponent(dragging.id, snap(pos.x - dragging.offsetX), snap(pos.y - dragging.offsetY));
        return;
      }
      if (editor.wireStart) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onUpdateWirePreview(pos.x, pos.y);
      }
    },
    [
      panning,
      panStart,
      dragging,
      reshaping,
      movingEndpoint,
      pendingWireGesture,
      editor.wireStart,
      screenToCanvas,
      onMoveComponent,
      onUpdateWirePreview,
      onReshapeWire,
      onMoveWireEndpoint,
      onBeginReshapeWire,
      onPrepareWireReshape,
    ],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const isLeave = e.type === "mouseleave";
      if (pendingWireGesture && !reshaping) {
        if (!isLeave) {
          onStartWireFromWire?.(
            pendingWireGesture.wireId,
            pendingWireGesture.world.x,
            pendingWireGesture.world.y,
          );
        }
        setPendingWireGesture(null);
      }
      if (movingEndpoint) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onCommitWireEndpoint?.(movingEndpoint.wireId, movingEndpoint.which, pos.x, pos.y);
        setMovingEndpoint(null);
      }
      if (panning) setPanning(false);
      if (dragging) setDragging(null);
      if (reshaping) setReshaping(null);
    },
    [
      panning,
      dragging,
      reshaping,
      movingEndpoint,
      pendingWireGesture,
      screenToCanvas,
      onStartWireFromWire,
      onCommitWireEndpoint,
    ],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === "Escape") {
        setPendingWireGesture(null);
        if (editor.wireStart) onCancelWire();
        else if (placementType) onCancelPlacement();
        else {
          onSelectComponent(null);
          onSelectWire(null);
        }
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
    onSelectWire,
    onDeleteWire,
    onDeleteComponent,
  ]);

  // React 19 registers onWheel as passive — preventDefault is a no-op there.
  // Native { passive: false } keeps wheel zoom inside the workspace only.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const svg = svgRef.current;
      if (!svg) {
        setViewBox((v) => zoomViewBoxCenter(v, factor));
        return;
      }

      const ctm = svg.getScreenCTM();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const world = pt.matrixTransform(ctm.inverse());
        setViewBox((v) => zoomViewBoxAt(v, factor, world.x, world.y));
        return;
      }

      const rect = svg.getBoundingClientRect();
      setViewBox((v) => {
        const world = screenToWorldFromRect(e.clientX, e.clientY, rect, v);
        return zoomViewBoxAt(v, factor, world.x, world.y);
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleWireMouseDown = useCallback(
    (e: React.MouseEvent, wireId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const pos = screenToCanvas(e.clientX, e.clientY);
      const hit = hitTestWire(pos, editor.circuit.wires) ?? {
        wireId,
        point: pos,
        segmentIndex: 0,
        t: 0.5,
        distance: 0,
      };

      if (editor.wireStart) {
        onCompleteWireToWire?.(hit.wireId, hit.point.x, hit.point.y);
        return;
      }

      onSelectWire(wireId);
      if (e.ctrlKey || e.metaKey) return;

      // Second interaction on the selected wire: click branches, drag reshapes.
      if (editor.selectedWireId === wireId) {
        setPendingWireGesture({
          wireId,
          world: hit.point,
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
    },
    [
      screenToCanvas,
      editor.circuit.wires,
      editor.wireStart,
      editor.selectedWireId,
      onCompleteWireToWire,
      onSelectWire,
    ],
  );

  const handleEndpointMouseDown = useCallback(
    (e: React.MouseEvent, wireId: string, which: "a" | "b") => {
      if (e.button !== 0) return;
      e.stopPropagation();
      onSelectWire(wireId);
      onBeginMoveWireEndpoint?.(wireId);
      setMovingEndpoint({ wireId, which });
    },
    [onSelectWire, onBeginMoveWireEndpoint],
  );

  const handleTerminalMouseDown = useCallback(
    (e: React.MouseEvent, compId: string, termId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const comp = editor.circuit.components.find((c) => c.id === compId);
      if (!comp) return;
      const world = getTerminalWorldPosition(comp, termId);
      if (editor.wireStart) {
        onCompleteWire(compId, termId);
      } else {
        onStartWire(compId, termId, world.x, world.y);
      }
    },
    [editor.circuit.components, editor.wireStart, onStartWire, onCompleteWire],
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
      onBeginMoveComponent?.(compId);
      setDragging({
        id: compId,
        offsetX: pos.x - comp.x,
        offsetY: pos.y - comp.y,
      });
    },
    [
      editor.wireStart,
      editor.circuit.components,
      screenToCanvas,
      onSelectComponent,
      onBeginMoveComponent,
    ],
  );

  const getComponentResult = (id: string) => {
    if (!simResult?.measurements) return undefined;
    return simResult.measurements.componentMeasurements.find((m: { componentId: string }) => m.componentId === id);
  };

  const renderComponent = (comp: ComponentInstance) => {
    const isSelected = editor.selectedComponentId === comp.id;
    const result = getComponentResult(comp.id);
    const activeTerminal =
      editor.wireStart?.origin.kind === "terminal" &&
      editor.wireStart.origin.componentId === comp.id
        ? editor.wireStart.origin.terminalId
        : null;

    const terminalData = comp.terminals.map((t: string) => {
      const connected = editor.circuit.connections.some(
        (conn) => conn.from === `${comp.id}:${t}` || conn.to === `${comp.id}:${t}`,
      );
      // Local offsets only — parent <g> already applies rotation.
      const local = getTerminalLocalOffset(comp.type, t);
      return {
        id: t,
        x: local.x,
        y: local.y,
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
    <div ref={containerRef} className="sim-canvas-container">
      <svg
        ref={svgRef}
        className="sim-canvas-svg"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setPendingWireGesture(null);
          if (editor.wireStart) onCancelWire();
          else if (placementType) onCancelPlacement();
        }}
      >
        {gridPattern}
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid-dots)" />

        {editor.circuit.wires.map((wire) => (
          <CircuitWire
            key={wire.id}
            wire={wire}
            selected={wire.id === editor.selectedWireId}
            showEndpoints={wire.id === editor.selectedWireId}
            onMouseDown={(e) => handleWireMouseDown(e, wire.id)}
            onEndpointMouseDown={(e, which) => handleEndpointMouseDown(e, wire.id, which)}
          />
        ))}

        {editor.wireStart && editor.wirePreviewPoints.length > 1 && (
          <WirePreview points={editor.wirePreviewPoints} />
        )}

        {(editor.circuit.junctions ?? []).map((j) => (
          <JunctionMarker key={j.id} cx={j.x} cy={j.y} />
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
            Click terminal or wire to connect • empty click pins corner • Esc cancels
          </span>
        )}
        {!placementType && !editor.wireStart && (
          <span className="sim-mode-indicator sim-mode-hint">
            Click a pin to wire · click a wire to select · click selected wire to branch · drag to reshape · Esc cancels
          </span>
        )}
      </div>
    </div>
  );
});

export default CircuitCanvas;
