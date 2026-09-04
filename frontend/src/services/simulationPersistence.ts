/**
 * Persist authoritative simulation runs via existing /api/simulations models.
 * Each /run creates a fresh SimulationRun id for Mentor closed-loop context.
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
  /** Session Simulation row id (stable across reruns). */
  simulationId: string | null;
  /** Fresh SimulationRun id for this solve — pass to Mentor ask. */
  simulationRunId: string | null;
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

function extractRunId(remote: SimulationResult | Record<string, unknown>): string | null {
  const meta = (remote as SimulationResult).metadata ?? (remote as { metadata?: Record<string, unknown> }).metadata;
  if (!meta || typeof meta !== "object") return null;
  const id = meta.simulation_run_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Create (or update) a simulation row, then run the backend engine which
 * persists results and a new SimulationRun for Mentor freshness.
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
      simulationRunId: null,
      persisted: false,
      engineResult: localResult,
      error: "Sign in so Mentor can use your latest simulation context.",
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

    const remote = await apiRequest<SimulationResult>(
      `/simulations/${encodeURIComponent(simId)}/run`,
      {
        method: "POST",
        body: JSON.stringify({ circuit_definition: definition }),
      },
    );

    const runId = extractRunId(remote);
    const merged: SimulationResult = {
      ...(localResult.status === "completed" || localResult.status === "invalid"
        ? localResult
        : remote),
      metadata: {
        ...(localResult.metadata || {}),
        ...(remote.metadata || {}),
        simulation_id: simId,
        simulation_run_id: runId,
      },
    };

    return {
      simulationId: simId,
      simulationRunId: runId,
      persisted: true,
      engineResult: merged,
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
      simulationRunId: null,
      persisted: false,
      engineResult: localResult,
      error: message,
    };
  }
}
