export type ThemePreference = "light" | "dark" | "system";
export type DifficultyPreference = "Beginner" | "Intermediate" | "Advanced";
export type ExperimentViewPreference = "overview" | "procedure" | "simulation";

export interface UserPreferences {
  theme: ThemePreference;
  preferred_difficulty: DifficultyPreference;
  learning_reminders: boolean;
  default_experiment_view: ExperimentViewPreference;
  notify_quiz_results: boolean;
  notify_report_completion: boolean;
  notify_learning_reminders: boolean;
  notify_email: boolean;
  notify_activity: boolean;
}

export interface SessionInfo {
  id: string;
  created_at: string;
  expires_at: string;
  /** User-Agent of the client that opened the session (may be null). */
  user_agent?: string | null;
  current: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  email_verified?: boolean;
  created_at?: string;
  /** Account-level preferences (present on real backend responses). */
  preferences?: UserPreferences;
  /** Active sessions (present on real backend responses). */
  sessions?: SessionInfo[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  /** Verification code in development (DEBUG) builds; null otherwise. */
  dev_code?: string | null;
}

export interface AuthError {
  message: string;
  field?: string;
}

/**
 * Authentication endpoints (implemented in Phase 9 — see docs/API_CONTRACT.md):
 *
 * POST /api/auth/register   { name, email, password } -> { user, token, dev_code? }
 * POST /api/auth/login      { email, password }       -> { user, token }
 * POST /api/auth/logout     (with auth header)         -> { message }
 * GET  /api/auth/me         (with auth header)         -> { user, token }
 * POST /api/auth/verify     { email, code }            -> { message }
 * POST /api/auth/resend     { email }                  -> { message, dev_code? }
 * POST /api/auth/forgot     { email }                  -> { message, dev_code? }
 * POST /api/auth/reset      { token, password }        -> { message }
 */
