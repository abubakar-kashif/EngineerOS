/**
 * Core circuit editor hook: components, Proteus-like wires/junctions,
 * selection, placement, undo/redo. Converts to engine types for simulation.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ComponentInstance,
  ComponentType,
  EditorCircuit,
  WireEnd,
  WireSegment,
} from "../components/simulation/editorTypes";
import {
  DEFAULT_TERMINALS,
  DEFAULT_PROPERTIES,
} from "../components/simulation/editorTypes";
import {
  buildOrthogonalPreview,
  getTerminalWorldPosition,
} from "../components/simulation/editorUtils";
import { nextDesignator } from "../components/simulation/referenceDesignators";
import type { CircuitDefinition } from "../components/simulation/engine";
import { toEngineCircuit } from "../components/simulation/editorAdapters";
import {
  hitTestWire,
  mergeNetIds,
  moveJunction,
  normalizeEditorCircuit,
  pruneOrphanJunctions,
  rebuildConnections,
  reshapeWireAt,
  retargetWiresForComponent,
  snapWiringCursor,
  splitWireAtPoint,
  uid,
  type Point,
} from "../components/simulation/wireTopology";

export type EditorMode = "select" | "place" | "wire";

/** Origin of an in-progress wire (terminal or attach point on existing wire). */
export type WireOrigin =
  | { kind: "terminal"; componentId: string; terminalId: string }
  | { kind: "wire"; wireId: string; x: number; y: number };

export interface WireStartState {
  origin: WireOrigin;
  /** Rubber-band start (last pinned corner or origin). */
  x: number;
  y: number;
  /** Fixed geometry from origin through pinned waypoints. */
  fixedPoints: Point[];
}

export interface EditorState {
  circuit: EditorCircuit;
  selectedComponentId: string | null;
  selectedWireId: string | null;
  mode: EditorMode;
  placementType: ComponentType | null;
  wireStart: WireStartState | null;
  wirePreviewPoints: Point[];
  undoStack: EditorCircuit[];
  redoStack: EditorCircuit[];
  dirty: boolean;
}

const EMPTY_CIRCUIT: EditorCircuit = {
  components: [],
  wires: [],
  connections: [],
  junctions: [],
};

const GRID = 20;

function snap(val: number): number {
  return Math.round(val / GRID) * GRID;
}

function commitCircuit(circuit: EditorCircuit): EditorCircuit {
  const pruned = pruneOrphanJunctions(circuit);
  return {
    ...pruned,
    connections: rebuildConnections(pruned),
  };
}

function pathFromFixedToEnd(fixed: Point[], end: Point): Point[] {
  if (fixed.length === 0) return [end, end];
  const last = fixed[fixed.length - 1];
  const elbow = buildOrthogonalPreview(last, end);
  return [...fixed.slice(0, -1), ...elbow];
}

export function useCircuitEditor(initial?: EditorCircuit) {
  const [state, setState] = useState<EditorState>({
    circuit: initial ? normalizeEditorCircuit(initial) : { ...EMPTY_CIRCUIT },
    selectedComponentId: null,
    selectedWireId: null,
    mode: "select",
    placementType: null,
    wireStart: null,
    wirePreviewPoints: [],
    undoStack: [],
    redoStack: [],
    dirty: false,
  });

  const circuitRef = useRef(state.circuit);
  useEffect(() => {
    circuitRef.current = state.circuit;
  }, [state.circuit]);

  const pushUndo = useCallback((prev: EditorCircuit) => {
    setState((s) => ({
      ...s,
      undoStack: [...s.undoStack.slice(-49), prev],
      redoStack: [],
      dirty: true,
    }));
  }, []);

  const selectComponent = useCallback((id: string | null) => {
    setState((s) => ({
      ...s,
      selectedComponentId: id,
      selectedWireId: null,
      mode: id ? "select" : s.mode,
    }));
  }, []);

  const selectWire = useCallback((id: string | null) => {
    setState((s) => ({
      ...s,
      selectedWireId: id,
      selectedComponentId: null,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((s) => ({
      ...s,
      selectedComponentId: null,
      selectedWireId: null,
      mode: s.wireStart ? "wire" : "select",
    }));
  }, []);

  const setPlacementType = useCallback((type: ComponentType | null) => {
    setState((s) => ({
      ...s,
      mode: type ? "place" : "select",
      placementType: type,
      wireStart: null,
      wirePreviewPoints: [],
    }));
  }, []);

  const cancelPlacement = useCallback(() => {
    setState((s) => ({
      ...s,
      mode: "select",
      placementType: null,
    }));
  }, []);

  const addComponent = useCallback(
    (type: ComponentType, canvasX: number, canvasY: number) => {
      const circuit = circuitRef.current;
      const existingLabels = new Set(circuit.components.map((c) => c.label));
      const label = nextDesignator(type, existingLabels);

      const comp: ComponentInstance = {
        id: uid("comp"),
        type,
        label,
        x: snap(canvasX),
        y: snap(canvasY),
        rotation: 0,
        properties: { ...DEFAULT_PROPERTIES[type] },
        terminals: [...DEFAULT_TERMINALS[type]],
      };

      pushUndo(circuit);
      setState((s) => ({
        ...s,
        circuit: {
          ...s.circuit,
          components: [...s.circuit.components, comp],
        },
        selectedComponentId: comp.id,
        selectedWireId: null,
        mode: "select",
        placementType: null,
      }));
    },
    [pushUndo],
  );

  const beginMoveComponent = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      if (!circuit.components.some((c) => c.id === id)) return;
      pushUndo(circuit);
    },
    [pushUndo],
  );

  const moveComponent = useCallback((id: string, canvasX: number, canvasY: number) => {
    setState((s) => {
      const comp = s.circuit.components.find((c) => c.id === id);
      if (!comp) return s;
      const nx = snap(canvasX);
      const ny = snap(canvasY);
      if (nx === comp.x && ny === comp.y) return s;

      const moved = { ...comp, x: nx, y: ny };
      const components = s.circuit.components.map((c) => (c.id === id ? moved : c));
      const base = { ...s.circuit, components };
      const wires = retargetWiresForComponent(base, id);
      return {
        ...s,
        circuit: commitCircuit({ ...base, wires }),
        dirty: true,
      };
    });
  }, []);

  const rotateComponent = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => {
        const components = s.circuit.components.map((c) =>
          c.id === id
            ? { ...c, rotation: ((c.rotation + 90) % 360) as 0 | 90 | 180 | 270 }
            : c,
        );
        const base = { ...s.circuit, components };
        const wires = retargetWiresForComponent(base, id);
        return {
          ...s,
          circuit: commitCircuit({ ...base, wires }),
          dirty: true,
        };
      });
    },
    [pushUndo],
  );

  const deleteComponent = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => {
        const wires = s.circuit.wires.filter((w) => {
          const touches =
            (w.a?.kind === "terminal" && w.a.componentId === id) ||
            (w.b?.kind === "terminal" && w.b.componentId === id);
          return !touches;
        });
        const next = commitCircuit({
          ...s.circuit,
          components: s.circuit.components.filter((c) => c.id !== id),
          wires,
        });
        return {
          ...s,
          circuit: next,
          selectedComponentId: s.selectedComponentId === id ? null : s.selectedComponentId,
        };
      });
    },
    [pushUndo],
  );

  const deleteWire = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => {
        const next = commitCircuit({
          ...s.circuit,
          wires: s.circuit.wires.filter((w) => w.id !== id),
        });
        return {
          ...s,
          circuit: next,
          selectedWireId: s.selectedWireId === id ? null : s.selectedWireId,
        };
      });
    },
    [pushUndo],
  );

  const duplicateComponent = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      const original = circuit.components.find((c) => c.id === id);
      if (!original) return;
      const existingLabels = new Set(circuit.components.map((c) => c.label));
      const label = nextDesignator(original.type, existingLabels);

      const copy: ComponentInstance = {
        ...original,
        id: uid("comp"),
        label,
        x: original.x + 60,
        y: original.y + 40,
        properties: { ...original.properties },
        terminals: [...original.terminals],
      };

      pushUndo(circuit);
      setState((s) => ({
        ...s,
        circuit: {
          ...s.circuit,
          components: [...s.circuit.components, copy],
        },
        selectedComponentId: copy.id,
      }));
    },
    [pushUndo],
  );

  const updateProperty = useCallback(
    (id: string, property: string, value: number | string | boolean) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => ({
        ...s,
        circuit: {
          ...s.circuit,
          components: s.circuit.components.map((c) => {
            if (c.id !== id) return c;
            if (property === "__label__") return { ...c, label: value as string };
            return { ...c, properties: { ...c.properties, [property]: value } };
          }),
        },
      }));
    },
    [pushUndo],
  );

  // ── Wire drawing ──

  const startWireFromTerminal = useCallback(
    (componentId: string, terminalId: string, worldX: number, worldY: number) => {
      setState((s) => ({
        ...s,
        mode: "wire",
        wireStart: {
          origin: { kind: "terminal", componentId, terminalId },
          x: worldX,
          y: worldY,
          fixedPoints: [{ x: worldX, y: worldY }],
        },
        wirePreviewPoints: [{ x: worldX, y: worldY }],
        selectedComponentId: null,
        selectedWireId: null,
      }));
    },
    [],
  );

  /** @deprecated alias — terminal start */
  const startWire = startWireFromTerminal;

  const startWireFromWire = useCallback((wireId: string, worldX: number, worldY: number) => {
    setState((s) => ({
      ...s,
      mode: "wire",
      wireStart: {
        origin: { kind: "wire", wireId, x: worldX, y: worldY },
        x: worldX,
        y: worldY,
        fixedPoints: [{ x: worldX, y: worldY }],
      },
      wirePreviewPoints: [{ x: worldX, y: worldY }],
      selectedComponentId: null,
      selectedWireId: null,
    }));
  }, []);

  const updateWirePreview = useCallback((worldX: number, worldY: number) => {
    setState((s) => {
      if (!s.wireStart) return s;
      const snapped = snapWiringCursor(s.circuit, { x: worldX, y: worldY });
      const preview = pathFromFixedToEnd(s.wireStart.fixedPoints, snapped.point);
      return { ...s, wirePreviewPoints: preview };
    });
  }, []);

  /** Pin an intermediate corner while wiring (empty-canvas click). */
  const pinWireWaypoint = useCallback((worldX: number, worldY: number) => {
    setState((s) => {
      if (!s.wireStart) return s;
      const snapped = snapWiringCursor(s.circuit, { x: worldX, y: worldY });
      // If snapped to a finish target, do not pin — caller should complete.
      if (snapped.kind === "terminal" || snapped.kind === "wire") return s;
      const fixedPoints = pathFromFixedToEnd(s.wireStart.fixedPoints, snapped.point);
      return {
        ...s,
        wireStart: {
          ...s.wireStart,
          x: snapped.point.x,
          y: snapped.point.y,
          fixedPoints,
        },
        wirePreviewPoints: fixedPoints,
      };
    });
  }, []);

  /**
   * Resolve origin into a WireEnd on circuit, splitting a host wire if needed.
   */
  function materializeOrigin(
    circuit: EditorCircuit,
    origin: WireOrigin,
  ): { circuit: EditorCircuit; end: WireEnd; netId: string; startPoint: Point } | null {
    if (origin.kind === "terminal") {
      const comp = circuit.components.find((c) => c.id === origin.componentId);
      if (!comp) return null;
      const startPoint = getTerminalWorldPosition(comp, origin.terminalId);
      const netId = uid("net");
      return {
        circuit,
        end: {
          kind: "terminal",
          componentId: origin.componentId,
          terminalId: origin.terminalId,
        },
        netId,
        startPoint,
      };
    }
    const split = splitWireAtPoint(circuit, origin.wireId, { x: origin.x, y: origin.y });
    if (!split) return null;
    return {
      circuit: split.circuit,
      end: { kind: "junction", junctionId: split.junctionId },
      netId: split.netId,
      startPoint: { x: origin.x, y: origin.y },
    };
  }

  const completeWireToTerminal = useCallback((componentId: string, terminalId: string) => {
    setState((s) => {
      if (!s.wireStart) return s;
      const origin = s.wireStart.origin;
      if (
        origin.kind === "terminal" &&
        origin.componentId === componentId &&
        origin.terminalId === terminalId
      ) {
        return s;
      }

      const endComp = s.circuit.components.find((c) => c.id === componentId);
      if (!endComp) return s;
      const endPoint = getTerminalWorldPosition(endComp, terminalId);

      let working = s.circuit;
      const originMat = materializeOrigin(working, origin);
      if (!originMat) return s;
      working = originMat.circuit;

      const endEnd: WireEnd = { kind: "terminal", componentId, terminalId };
      let netId = originMat.netId;

      // If finishing onto a terminal that already belongs to a net via existing wires,
      // create a fresh segment still on origin net — rebuildConnections unions via shared terminals.
      // When origin was a wire, netId is that wire's net; adding terminal joins the net.

      const points = pathFromFixedToEnd(s.wireStart.fixedPoints, endPoint);
      // After materializeOrigin from wire, fixedPoints[0] may be stale vs junction — retarget start
      if (points.length > 0) points[0] = originMat.startPoint;

      const wire: WireSegment = {
        id: uid("wire"),
        netId,
        points: points.length >= 2 ? points : [originMat.startPoint, endPoint],
        a: originMat.end,
        b: endEnd,
      };

      // If origin was a new terminal net and end terminal already on another net, merge
      const endExisting = working.wires.find(
        (w) =>
          (w.a?.kind === "terminal" &&
            w.a.componentId === componentId &&
            w.a.terminalId === terminalId) ||
          (w.b?.kind === "terminal" &&
            w.b.componentId === componentId &&
            w.b.terminalId === terminalId),
      );
      if (endExisting && origin.kind === "terminal") {
        netId = endExisting.netId;
        wire.netId = netId;
      } else if (endExisting && origin.kind === "wire") {
        working = mergeNetIds(working, originMat.netId, endExisting.netId);
        netId = originMat.netId;
        wire.netId = netId;
      }

      const next = commitCircuit({
        ...working,
        wires: [...working.wires, { ...wire, netId }],
      });

      return {
        ...s,
        circuit: next,
        undoStack: [...s.undoStack.slice(-49), s.circuit],
        redoStack: [],
        dirty: true,
        mode: "select",
        wireStart: null,
        wirePreviewPoints: [],
      };
    });
  }, []);

  const completeWire = completeWireToTerminal;

  const completeWireToWire = useCallback((wireId: string, x: number, y: number) => {
    setState((s) => {
      if (!s.wireStart) return s;
      const at = { x, y };
      // Don't connect a wire to itself at the same origin without geometry
      if (s.wireStart.origin.kind === "wire" && s.wireStart.origin.wireId === wireId) {
        return s;
      }

      let working = s.circuit;
      const originMat = materializeOrigin(working, s.wireStart.origin);
      if (!originMat) return s;
      working = originMat.circuit;

      // Target wire id may still be valid if origin wasn't that wire
      const targetId =
        working.wires.some((w) => w.id === wireId)
          ? wireId
          : hitTestWire(at, working.wires)?.wireId;
      if (!targetId) return s;

      const split = splitWireAtPoint(working, targetId, at);
      if (!split) return s;
      working = split.circuit;
      working = mergeNetIds(working, originMat.netId, split.netId);
      const netId = originMat.netId;

      const endPoint = {
        x:
          (working.junctions ?? []).find((j) => j.id === split.junctionId)?.x ??
          at.x,
        y:
          (working.junctions ?? []).find((j) => j.id === split.junctionId)?.y ??
          at.y,
      };
      const points = pathFromFixedToEnd(s.wireStart.fixedPoints, endPoint);
      if (points.length > 0) points[0] = originMat.startPoint;

      const wire: WireSegment = {
        id: uid("wire"),
        netId,
        points: points.length >= 2 ? points : [originMat.startPoint, endPoint],
        a: originMat.end,
        b: { kind: "junction", junctionId: split.junctionId },
      };

      const next = commitCircuit({
        ...working,
        wires: [...working.wires, wire],
      });

      return {
        ...s,
        circuit: next,
        undoStack: [...s.undoStack.slice(-49), s.circuit],
        redoStack: [],
        dirty: true,
        mode: "select",
        wireStart: null,
        wirePreviewPoints: [],
      };
    });
  }, []);

  const cancelWire = useCallback(() => {
    setState((s) => ({
      ...s,
      mode: "select",
      wireStart: null,
      wirePreviewPoints: [],
    }));
  }, []);

  /** Drag a specific vertex index (endpoints excluded from reshape). */
  const moveWireVertex = useCallback((wireId: string, vertexIndex: number, x: number, y: number) => {
    const cursor = { x, y };
    setState((s) => {
      const wire = s.circuit.wires.find((w) => w.id === wireId) ??
        circuitRef.current.wires.find((w) => w.id === wireId);
      if (!wire) return s;
      if (vertexIndex <= 0 || vertexIndex >= wire.points.length - 1) return s;
      const points = wire.points.map((p) => ({ ...p }));
      points[vertexIndex] = { ...cursor };
      const updated = { ...wire, points };
      const nextCircuit = {
        ...s.circuit,
        wires: s.circuit.wires.map((w) => (w.id === wireId ? updated : w)),
      };
      // Keep map in sync if wire list was from ref
      if (!s.circuit.wires.some((w) => w.id === wireId)) {
        nextCircuit.wires = circuitRef.current.wires.map((w) =>
          w.id === wireId ? updated : w,
        );
      }
      circuitRef.current = nextCircuit;
      return {
        ...s,
        circuit: nextCircuit,
        dirty: true,
      };
    });
  }, []);

  /** Ensure an interior vertex exists near cursor; returns its index for dragging. */
  const prepareWireReshape = useCallback((wireId: string, x: number, y: number): number => {
    const cursor = { x, y };
    const circuit = circuitRef.current;
    const wire = circuit.wires.find((w) => w.id === wireId);
    if (!wire || wire.points.length < 2) return 1;
    for (let i = 1; i < wire.points.length - 1; i++) {
      if (Math.hypot(wire.points[i].x - cursor.x, wire.points[i].y - cursor.y) < 12) {
        return i;
      }
    }
    const updated = reshapeWireAt(wire, cursor, "insert");
    let bestIdx = 1;
    let bestDist = Infinity;
    for (let i = 1; i < updated.points.length - 1; i++) {
      const d = Math.hypot(updated.points[i].x - cursor.x, updated.points[i].y - cursor.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const nextCircuit = {
      ...circuit,
      wires: circuit.wires.map((w) => (w.id === wireId ? updated : w)),
    };
    circuitRef.current = nextCircuit;
    setState((s) => ({
      ...s,
      circuit: nextCircuit,
      dirty: true,
    }));
    return bestIdx;
  }, []);

  const beginReshapeWire = useCallback(
    (wireId: string) => {
      const circuit = circuitRef.current;
      if (!circuit.wires.some((w) => w.id === wireId)) return;
      pushUndo(circuit);
    },
    [pushUndo],
  );

  /** Move a wire endpoint; optionally reattach to a nearby terminal. */
  const moveWireEndpoint = useCallback(
    (wireId: string, which: "a" | "b", x: number, y: number) => {
      const cursor = { x, y };
      setState((s) => {
        const wire = s.circuit.wires.find((w) => w.id === wireId);
        if (!wire || !wire.a || !wire.b) return s;

        const snapped = snapWiringCursor(s.circuit, cursor, { excludeWireId: wireId });
        const points = wire.points.map((p) => ({ ...p }));
        const idx = which === "a" ? 0 : points.length - 1;
        points[idx] = snapped.point;

        let a = wire.a;
        let b = wire.b;
        let circuit = s.circuit;
        const netId = wire.netId;

        if (snapped.kind === "terminal" && snapped.terminal) {
          const end: WireEnd = {
            kind: "terminal",
            componentId: snapped.terminal.componentId,
            terminalId: snapped.terminal.terminalId,
          };
          if (which === "a") a = end;
          else b = end;
        } else if (snapped.kind === "wire" && snapped.wireHit) {
          const split = splitWireAtPoint(circuit, snapped.wireHit.wireId, snapped.point);
          if (split) {
            circuit = split.circuit;
            circuit = mergeNetIds(circuit, netId, split.netId);
            const juncEnd: WireEnd = { kind: "junction", junctionId: split.junctionId };
            if (which === "a") a = juncEnd;
            else b = juncEnd;
          }
        } else if ((wire[which] as WireEnd).kind === "junction") {
          const jid = (wire[which] as Extract<WireEnd, { kind: "junction" }>).junctionId;
          circuit = moveJunction(circuit, jid, snapped.point.x, snapped.point.y);
        } else {
          // Detach from terminal into a free junction so geometry can float
          const jid = uid("junc");
          circuit = {
            ...circuit,
            junctions: [
              ...(circuit.junctions ?? []),
              { id: jid, x: snapped.point.x, y: snapped.point.y, netId },
            ],
          };
          const juncEnd: WireEnd = { kind: "junction", junctionId: jid };
          if (which === "a") a = juncEnd;
          else b = juncEnd;
        }

        const updated: WireSegment = { ...wire, a, b, points, netId };
        // Wire may have been replaced if we split another — find by id still
        const wires = circuit.wires.map((w) => (w.id === wireId ? updated : w));
        // If split removed and we're updating, ensure our wire exists
        if (!wires.some((w) => w.id === wireId)) {
          wires.push(updated);
        }

        return {
          ...s,
          circuit: commitCircuit({ ...circuit, wires }),
          dirty: true,
        };
      });
    },
    [],
  );

  const beginMoveWireEndpoint = useCallback(
    (wireId: string) => {
      const circuit = circuitRef.current;
      if (!circuit.wires.some((w) => w.id === wireId)) return;
      pushUndo(circuit);
    },
    [pushUndo],
  );

  const undo = useCallback(() => {
    setState((s) => {
      if (s.undoStack.length === 0) return s;
      const prev = s.undoStack[s.undoStack.length - 1];
      return {
        ...s,
        circuit: prev,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, s.circuit],
        wireStart: null,
        wirePreviewPoints: [],
        mode: "select",
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.redoStack.length === 0) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        ...s,
        circuit: next,
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, s.circuit],
        wireStart: null,
        wirePreviewPoints: [],
        mode: "select",
      };
    });
  }, []);

  const clearCircuit = useCallback(() => {
    const circuit = circuitRef.current;
    if (circuit.components.length === 0 && circuit.wires.length === 0) return;
    pushUndo(circuit);
    setState((s) => ({
      ...s,
      circuit: { ...EMPTY_CIRCUIT },
      selectedComponentId: null,
      selectedWireId: null,
      mode: "select",
      wireStart: null,
      wirePreviewPoints: [],
    }));
  }, [pushUndo]);

  const loadCircuit = useCallback((circuit: EditorCircuit) => {
    setState((s) => ({
      ...s,
      circuit: normalizeEditorCircuit(circuit),
      selectedComponentId: null,
      selectedWireId: null,
      mode: "select",
      wireStart: null,
      wirePreviewPoints: [],
      undoStack: [],
      redoStack: [],
      dirty: false,
    }));
  }, []);

  const markClean = useCallback(() => {
    setState((s) => (s.dirty ? { ...s, dirty: false } : s));
  }, []);

  const selectedComponent = state.selectedComponentId
    ? state.circuit.components.find((c) => c.id === state.selectedComponentId) ?? null
    : null;

  const getEngineCircuit = useCallback((): CircuitDefinition => {
    return toEngineCircuit(state.circuit);
  }, [state.circuit]);

  return {
    state,
    selectComponent,
    selectWire,
    clearSelection,
    setPlacementType,
    cancelPlacement,
    addComponent,
    moveComponent,
    beginMoveComponent,
    rotateComponent,
    deleteComponent,
    deleteWire,
    duplicateComponent,
    updateProperty,
    startWire,
    startWireFromTerminal,
    startWireFromWire,
    updateWirePreview,
    pinWireWaypoint,
    completeWire,
    completeWireToTerminal,
    completeWireToWire,
    cancelWire,
    reshapeWire: moveWireVertex,
    prepareWireReshape,
    beginReshapeWire,
    moveWireEndpoint,
    beginMoveWireEndpoint,
    undo,
    redo,
    clearCircuit,
    loadCircuit,
    markClean,
    selectedComponent,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    getEngineCircuit,
  };
}
