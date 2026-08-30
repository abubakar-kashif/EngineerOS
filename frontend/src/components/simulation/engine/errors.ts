/**
 * Error codes and structures for Simulation Engine
 * Person 1: Simulation Engine
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';

export type ErrorCode =
  | 'MISSING_GROUND'
  | 'OPEN_CIRCUIT'
  | 'FLOATING_NODE'
  | 'DANGLING_TERMINAL'
  | 'DANGLING_WIRE'
  | 'INVALID_CONNECTION'
  | 'INVALID_COMPONENT_VALUE'
  | 'SHORT_CIRCUIT'
  | 'INVALID_SOURCE_CONFIGURATION'
  | 'LED_NO_CURRENT_LIMIT'
  | 'DIODE_REVERSE_BIASED'
  | 'SOLVER_FAILED'
  | 'UNSUPPORTED_COMPONENT'
  | 'INVALID_COMPONENT_ID'
  | 'INVALID_TERMINAL_ID'
  | 'DUPLICATE_CONNECTION';

export interface SimulationError {
  code: ErrorCode;
  severity: ErrorSeverity;
  message: string;
  explanation?: string;
  affectedComponents?: string[];
  affectedTerminals?: string[];
  suggestedFix?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: SimulationError[];
  warnings: SimulationError[];
}

export function createError(
  code: ErrorCode,
  message: string,
  severity: ErrorSeverity = 'error'
): SimulationError {
  return {
    code,
    severity,
    message,
  };
}

export function createErrorWithDetails(
  code: ErrorCode,
  message: string,
  options: Partial<Omit<SimulationError, 'code' | 'severity' | 'message'>>
): SimulationError {
  return {
    code,
    severity: 'error',
    message,
    ...options,
  };
}

/**
 * Predefined error messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  MISSING_GROUND: 'The circuit has no ground reference. Add a ground component and connect it to the circuit.',
  OPEN_CIRCUIT: 'The circuit has an open connection. Some terminals are not properly connected.',
  FLOATING_NODE: 'A floating node detected. Check your connections.',
  DANGLING_TERMINAL: 'A terminal is left disconnected.',
  DANGLING_WIRE: 'A wire is not connected to any component.',
  INVALID_CONNECTION: 'Invalid connection detected.',
  INVALID_COMPONENT_VALUE: 'Invalid component value detected.',
  SHORT_CIRCUIT: 'Short circuit detected.',
  INVALID_SOURCE_CONFIGURATION: 'Invalid source configuration.',
  LED_NO_CURRENT_LIMIT: 'LED connected without current-limiting resistor.',
  DIODE_REVERSE_BIASED: 'Diode is reverse biased.',
  SOLVER_FAILED: 'Solver failed to converge.',
  UNSUPPORTED_COMPONENT: 'Unsupported component type.',
  INVALID_COMPONENT_ID: 'Invalid component ID.',
  INVALID_TERMINAL_ID: 'Invalid terminal ID.',
  DUPLICATE_CONNECTION: 'Duplicate connection detected.',
};