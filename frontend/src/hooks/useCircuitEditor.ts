/**
 * Core circuit editor hook: manages components, wires, connections,
 * selection, placement mode, wire drawing, and undo/redo.
 * 
 * Uses editor-local types; converts to engine types when running simulation.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// Editor types (new)
import type {
  ComponentInstance,
  ComponentType,
  WireConnection,
  WireSegment,
  EditorCircuit,
} from "../components/simulation/editorTypes";
import {
  DEFAULT_TERMINALS,
  DEFAULT_PROPERTIES,
} from "../components/simulation/editorTypes";
import { nextDesignator } from "../components/simulation/referenceDesignators";

// Engine types (only needed for conversion, not for state)
import type { CircuitDefinition } from "../components/simulation/engine";
import { toEngineCircuit } from "../components/simulation/editorAdapters";

// ── Types ──

export type EditorMode = "select" | "place" | "wire";

export interface EditorState {
  circuit: EditorCircuit;
  selectedComponentId: string | null;
  selectedWireId: string | null;
  mode: EditorMode;
  placementType: ComponentType | null;
  /** Wire currently being drawn */
  wireStart: { componentId: string; terminalId: string; x: number; y: number } | null;
  wirePreviewPoints: { x: number; y: number }[];
  /** Undo/redo stacks (store EditorCircuit) */
  undoStack: EditorCircuit[];
  redoStack: EditorCircuit[];
  /** Dirty flag for save indicator */
  dirty: boolean;
}

const EMPTY_CIRCUIT: EditorCircuit = {
  components: [],
  wires: [],
  connections: [],
  junctions: [],
};

const GRID = 20; // snap grid size

/** Snap a value to the nearest grid point */
function snap(val: number): number {
  return Math.round(val / GRID) * GRID;
}

/** Generate a unique ID */
let idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}_${++idCounter}_${Date.now().toString(36)}`;
}

// ── Hook ──

export function useCircuitEditor(initial?: EditorCircuit) {
  const [state, setState] = useState<EditorState>({
    circuit: initial ?? { ...EMPTY_CIRCUIT },
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

  // Keep a ref for latest circuit (used in callbacks)
  const circuitRef = useRef(state.circuit);
  useEffect(() => { circuitRef.current = state.circuit; }, [state.circuit]);

  /** Push current circuit to undo stack before a mutation */
  const pushUndo = useCallback((prev: EditorCircuit) => {
    setState((s) => ({
      ...s,
      undoStack: [...s.undoStack.slice(-49), prev],
      redoStack: [],
      dirty: true,
    }));
  }, []);

  // ── Selection ──

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

  // ── Placement mode ──

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

  // ── Add component ──

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

  // ── Move component ──

  const moveComponent = useCallback(
    (id: string, canvasX: number, canvasY: number) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => ({
        ...s,
        circuit: {
          ...s.circuit,
          components: s.circuit.components.map((c) =>
            c.id === id ? { ...c, x: snap(canvasX), y: snap(canvasY) } : c,
          ),
        },
      }));
    },
    [pushUndo],
  );

  // ── Rotate ──

  const rotateComponent = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => ({
        ...s,
        circuit: {
          ...s.circuit,
          components: s.circuit.components.map((c) =>
            c.id === id
              ? { ...c, rotation: ((c.rotation + 90) % 360) as 0 | 90 | 180 | 270 }
              : c,
          ),
        },
      }));
    },
    [pushUndo],
  );

  // ── Delete ──

  const deleteComponent = useCallback(
    (id: string) => {
      const circuit = circuitRef.current;
      pushUndo(circuit);
      setState((s) => {
        // Remove component and any connections/wires referencing it
        const connections = s.circuit.connections.filter((conn) => {
          const fromId = conn.from.split(":")[0];
          const toId = conn.to?.split(":")[0];
          return fromId !== id && toId !== id;
        });
        return {
          ...s,
          circuit: {
            ...s.circuit,
            components: s.circuit.components.filter((c) => c.id !== id),
            connections,
          },
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
        const wire = s.circuit.wires.find((w) => w.id === id);
        if (!wire) return s;
        // Remove the wire itself
        return {
          ...s,
          circuit: {
            ...s.circuit,
            wires: s.circuit.wires.filter((w) => w.id !== id),
          },
          selectedWireId: s.selectedWireId === id ? null : s.selectedWireId,
        };
      });
    },
    [pushUndo],
  );

  // ── Duplicate ──

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

  // ── Update property ──

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

  const startWire = useCallback(
    (componentId: string, terminalId: string, worldX: number, worldY: number) => {
      setState((s) => ({
        ...s,
        mode: "wire",
        wireStart: { componentId, terminalId, x: worldX, y: worldY },
        wirePreviewPoints: [{ x: worldX, y: worldY }],
        selectedComponentId: null,
        selectedWireId: null,
      }));
    },
    [],
  );

  const updateWirePreview = useCallback(
    (worldX: number, worldY: number) => {
      setState((s) => {
        if (!s.wireStart) return s;
        // Orthogonal routing: add intermediate point
        const last = s.wirePreviewPoints[s.wirePreviewPoints.length - 1];
        const dx = worldX - last.x;
        const dy = worldY - last.y;
        const newPoints = [...s.wirePreviewPoints];
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal first
          newPoints.push({ x: worldX, y: last.y });
        } else {
          newPoints.push({ x: last.x, y: worldY });
        }
        newPoints.push({ x: worldX, y: worldY });
        return { ...s, wirePreviewPoints: newPoints };
      });
    },
    [],
  );

  const completeWire = useCallback(
    (componentId: string, terminalId: string) => {
      const circuit = circuitRef.current;
      const s = state;
      if (!s.wireStart) return;

      const fromRef = `${s.wireStart.componentId}:${s.wireStart.terminalId}`;
      const toRef = `${componentId}:${terminalId}`;

      const wireId = uid("wire");
      const wire: WireSegment = {
        id: wireId,
        points: [
          { x: s.wireStart.x, y: s.wireStart.y },
          ...s.wirePreviewPoints.slice(1),
        ],
      };

      const connection: WireConnection = { from: fromRef, to: toRef };

      pushUndo(circuit);
      setState((prev) => ({
        ...prev,
        circuit: {
          ...prev.circuit,
          wires: [...prev.circuit.wires, wire],
          connections: [...prev.circuit.connections, connection],
        },
        mode: "select",
        wireStart: null,
        wirePreviewPoints: [],
      }));
    },
    [pushUndo, state],
  );

  const cancelWire = useCallback(() => {
    setState((s) => ({
      ...s,
      mode: "select",
      wireStart: null,
      wirePreviewPoints: [],
    }));
  }, []);

  // ── Undo / Redo ──

  const undo = useCallback(() => {
    setState((s) => {
      if (s.undoStack.length === 0) return s;
      const prev = s.undoStack[s.undoStack.length - 1];
      return {
        ...s,
        circuit: prev,
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, s.circuit],
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
      };
    });
  }, []);

  // ── Clear ──

  const clearCircuit = useCallback(() => {
    const circuit = circuitRef.current;
    if (circuit.components.length === 0) return;
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

  // ── Load circuit ──

  const loadCircuit = useCallback((circuit: EditorCircuit) => {
    setState((s) => ({
      ...s,
      circuit,
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

  // ── Selected component reference ──

  const selectedComponent = state.selectedComponentId
    ? state.circuit.components.find((c) => c.id === state.selectedComponentId) ?? null
    : null;

  // ── Expose engine conversion (optional) ──
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
    rotateComponent,
    deleteComponent,
    deleteWire,
    duplicateComponent,
    updateProperty,
    startWire,
    updateWirePreview,
    completeWire,
    cancelWire,
    undo,
    redo,
    clearCircuit,
    loadCircuit,
    selectedComponent,
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    getEngineCircuit, // new helper for running simulation
  };
}