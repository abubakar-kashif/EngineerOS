/**
 * Adapter functions to convert between editor and engine representations.
 */
import type { EditorCircuit } from './editorTypes';
import type { CircuitDefinition, Component, Connection } from './engine';
import { createTerminalId, type TerminalType } from './engine/circuitGraph';

export function toEngineCircuit(editor: EditorCircuit): CircuitDefinition {
  const components: Component[] = editor.components.map((comp) => ({
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

  const connections: Connection[] = editor.connections.map((conn, index) => {
    const parseRef = (ref: string): { componentId: string; terminalType: string } => {
      const parts = ref.split(':');
      return { componentId: parts[0], terminalType: parts[1] };
    };
    const from = parseRef(conn.from);
    const to = parseRef(conn.to);
    return {
      id: `conn_${index}_${Date.now()}`,
      from: createTerminalId(from.componentId, from.terminalType as TerminalType),
      to: createTerminalId(to.componentId, to.terminalType as TerminalType),
    };
  });

  return {
    components,
    connections,
  };
}