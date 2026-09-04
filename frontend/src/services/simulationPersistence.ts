/**
 * Persist authoritative simulation runs via existing /api/simulations models.
 * Does not invent a parallel result store — reuses Simulation + run_engine pipeline.
 */
import { apiRequest, getAuthToken, ApiError } from "./api";
import type { CircuitDefinition } from "../components/simulation/engine";
import type { SimulationResult } from "../components/simulation/engine";

export interface PersistedSimulation {
  id: string;
  user_id: string;
  experiment_id?: string | null;
  name: string;
  status: string;
  circuit_definition?: Record<string, unknown> | null;
  validation_errors?: unknown;
  measurements?: unknown;
  results?: unknown;
  created_at?: string;
  updated_at?: string | null;
  completed_at?: string | null;
}

export interface PersistRunOutcome {
  simulationId: string | null;
  persisted: boolean;
  engineResult: SimulationResult;
  error?: string;
}

function circuitPayload(circuit: CircuitDefinition, experimentId?: string | null) {
  return {
    ...circuit,
    experimentId: experimentId ?? circuit.experimentId,
  };
}

/**
 * Create (or update) a simulation row, then run the backend engine which
 * persists results/measurements/validation/status/timestamps.
 * Local `engineResult` remains the UI source of truth when offline/unauthenticated.
 */
export async function persistAndRunSimulation(options: {
  circuit: CircuitDefinition;
  localResult: SimulationResult;
  experimentId?: string | null;
  existingSimulationId?: string | null;
  name?: string;
}): Promise<PersistRunOutcome> {
  const { circuit, localResult, experimentId, existingSimulationId, name } = options;

  if (!getAuthToken()) {
    return {
      simulationId: null,
      persisted: false,
      engineResult: localResult,
      error: "Sign in to persist simulation results on the server.",
    };
  }

  try {
    let simId = existingSimulationId ?? null;
    const definition = circuitPayload(circuit, experimentId);

    if (!simId) {
      const created = await apiRequest<PersistedSimulation>("/simulations/", {
        method: "POST",
        body: JSON.stringify({
          name: name ?? "Lab simulation",
          experiment_id: experimentId ?? null,
          circuit_definition: definition,
        }),
      });
      simId = created.id;
    } else {
      await apiRequest<PersistedSimulation>(`/simulations/${encodeURIComponent(simId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          circuit_definition: definition,
          ...(experimentId ? { experiment_id: experimentId } : {}),
        }),
      });
    }

    // Backend run_engine → same validate→solve path; persists on Simulation model
    const remote = await apiRequest<SimulationResult>(
      `/simulations/${encodeURIComponent(simId)}/run`,
      {
        method: "POST",
        body: JSON.stringify({ circuit_definition: definition }),
      },
    );

    return {
      simulationId: simId,
      persisted: true,
      // Prefer local solve for UI (Maps/graphs intact); remote confirms persistence
      engineResult: localResult.status === "completed" ? localResult : remote,
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Persistence failed";
    return {
      simulationId: existingSimulationId ?? null,
      persisted: false,
      engineResult: localResult,
      error: message,
    };
  }
}
