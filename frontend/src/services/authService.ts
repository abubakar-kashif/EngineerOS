import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/auth";
import {
  ApiError,
  USER_CACHE_KEY,
  apiRequest,
  clearAuthCache,
  getAuthToken,
  setAuthToken,
} from "./api";

interface AuthMessageResponse {
  message: string;
  dev_code?: string | null;
}

function cacheUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_CACHE_KEY);
  }
}

/** Persist an updated user object into the session cache (e.g. after verify). */
export function cacheSessionUser(user: User): void {
  cacheUser(user);
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    { redirectOn401: false },
  );

  setAuthToken(data.token);
  cacheUser(data.user);
  return data;
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  setAuthToken(data.token);
  cacheUser(data.user);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<{ message: string }>(
      "/auth/logout",
      { method: "POST" },
      { redirectOn401: false },
    );
  } catch {
    // The local session is cleared below even when the server call fails
    // (for example, when the token already expired).
  } finally {
    clearAuthCache();
  }
}

/**
 * Validates the cached token against GET /api/auth/me.
 * Returns null (and clears the cache) when the session is gone;
 * rethrows network/server errors so callers can keep the cached user.
 */
export async function fetchSession(): Promise<{ user: User; token: string } | null> {
  if (!getAuthToken()) return null;

  try {
    const data = await apiRequest<AuthResponse>(
      "/auth/me",
      undefined,
      { redirectOn401: false },
    );

    cacheUser(data.user);
    return { user: data.user, token: data.token };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthCache();
      return null;
    }
    throw error;
  }
}

/** Synchronous cached session — used to render instantly at startup. */
export function getSession(): { user: User; token: string } | null {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (cached) {
      return { user: JSON.parse(cached) as User, token };
    }
  } catch {
    /* ignore malformed cache */
  }
  return null;
}

export async function verifyEmail(email: string, code: string): Promise<AuthMessageResponse> {
  return apiRequest<AuthMessageResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resendVerification(email: string): Promise<AuthMessageResponse> {
  return apiRequest<AuthMessageResponse>("/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string): Promise<AuthMessageResponse> {
  return apiRequest<AuthMessageResponse>("/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<AuthMessageResponse> {
  return apiRequest<AuthMessageResponse>("/auth/reset", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function getToken(): string | null {
  return getAuthToken();
}
