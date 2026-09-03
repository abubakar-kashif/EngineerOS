/**
 * Adapter functions to convert between editor and engine representations.
 */

import type { EditorCircuit, WireConnection } from './editorTypes';
import type { CircuitDefinition, Component, Connection } from './engine';
import { createTerminalId } from './engine/circuitGraph';

/**
 * Convert an editor circuit to engine CircuitDefinition.
 * - Editor components -> engine Components (map x,y to position)
 * - Editor connections -> engine Connections (format terminal IDs)
 * - Visual wires (WireSegment) are ignored for electrical topology.
 */
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
      from: createTerminalId(from.componentId, from.terminalType as any),
      to: createTerminalId(to.componentId, to.terminalType as any),
    };
  });

  return {
    components,
    connections,
    // nodes will be built by engine's graph builder
  };
}