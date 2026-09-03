const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

const TOKEN_KEY = "engineeros_auth_token";
// Keys used by the pre-Phase-9 development mock — cleared for hygiene.
const LEGACY_KEYS = ["engineeros_dev_session", "engineeros_dev_users"];

export const USER_CACHE_KEY = "engineeros_user_cache";

const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface RequestConfig {
  /** Per-request timeout in milliseconds (default 15000). */
  timeoutMs?: number;
  /**
   * When false, a 401 clears the cached session without redirecting to
   * /login — used by session checks that handle the failure themselves.
   */
  redirectOn401?: boolean;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthCache(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_CACHE_KEY);
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  config?: RequestConfig,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        ...(options?.headers ?? {}),
      },
      signal: controller.signal,
    });
  } catch {
    // fetch only rejects on network failure or abort — map both to ApiError.
    if (controller.signal.aborted) {
      throw new ApiError(0, "The request timed out. Please try again.");
    }
    throw new ApiError(
      0,
      "Unable to reach the EngineerOS server. Check that the backend is running and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    // Session expired or revoked: clear the auth state and return to the
    // login page (skipped for requests that handle 401 themselves).
    clearAuthCache();
    if (config?.redirectOn401 !== false && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const body = await response.json();

      if (typeof body?.detail === "string") {
        message = body.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
