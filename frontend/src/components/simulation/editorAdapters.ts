/**
 * Adapter functions to convert between editor and engine representations.
 * Visual wire geometry never enters the solver — only terminal net connections.
 */
import type { EditorCircuit } from './editorTypes';
import type { CircuitDefinition, Component, Connection } from './engine';
import { createTerminalId, type TerminalType } from './engine/circuitGraph';
import { normalizeEditorCircuit, rebuildConnections } from './wireTopology';

export function toEngineCircuit(editor: EditorCircuit): CircuitDefinition {
  const normalized = normalizeEditorCircuit(editor);
  const connectionsSrc =
    normalized.connections.length > 0
      ? normalized.connections
      : rebuildConnections(normalized);

  const components: Component[] = normalized.components.map((comp) => ({
    id: comp.id,
    type: comp.type,
    label: comp.label,
    position: { x: comp.x, y: comp.y },
    rotation: comp.rotation,
    properties: { ...comp.properties },
    terminals: comp.terminals.map((termType) => ({
      id: createTerminalId(comp.id, termType),
      type: termType,
      componentId: comp.id,
    })),
    metadata: comp.metadata,
  }));

  const connections: Connection[] = connectionsSrc.map((conn, index) => {
    const parseRef = (ref: string): { componentId: string; terminalType: string } => {
      const parts = ref.split(':');
      return { componentId: parts[0], terminalType: parts[1] };
    };
    const from = parseRef(conn.from);
    const to = parseRef(conn.to);
    return {
      id: `conn_${index}_${conn.from}_${conn.to}`,
      from: createTerminalId(from.componentId, from.terminalType as TerminalType),
      to: createTerminalId(to.componentId, to.terminalType as TerminalType),
    };
  });

  return {
    components,
    connections,
  };
}
