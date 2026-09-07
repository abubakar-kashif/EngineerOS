/**
 * Resolve user-facing engineering designators from internal component IDs.
 * Internal IDs (comp_*) stay as keys; UI should display labels like R1 / V1.
 */
import type { CircuitDefinition } from "./engine/circuitGraph";

export function resolveComponentReference(
  circuit: CircuitDefinition | null | undefined,
  componentId: string,
  fallbackType?: string,
): string {
  if (!componentId) return "Unknown component";

  if (componentId.startsWith("__")) {
    return (fallbackType || "instrument").replace(/_/g, " ");
  }

  const match = circuit?.components.find((c) => c.id === componentId);
  const label = match?.label?.trim();
  if (label) return label;

  // Fixtures / legacy circuits sometimes use designator as the id.
  if (/^[A-Za-z]+\d+$/.test(componentId)) return componentId;

  if (fallbackType?.trim()) {
    return fallbackType.replace(/_/g, " ");
  }

  return "Unknown component";
}
