import { describe, expect, it, vi } from "vitest";
import {
  fetchSession,
  getToken,
  getSession,
  login,
  logout,
  register,
} from "../services/authService";
import { getAuthToken, USER_CACHE_KEY } from "../services/api";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { User } from "../types/auth";

const testUser: User = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  email_verified: true,
  preferences: {
    theme: "dark",
    preferred_difficulty: "Beginner",
    learning_reminders: false,
    default_experiment_view: "overview",
    notify_quiz_results: true,
    notify_report_completion: true,
    notify_learning_reminders: false,
    notify_email: true,
    notify_activity: true,
  },
  sessions: [],
};

const authPayload = { user: testUser, token: "token-abc" };

describe("login", () => {
  it("stores the token and caches the user on success", async () => {
    const calls = mockApiRoutes({ "POST /auth/login": jsonResponse(authPayload) });

    const response = await login({ email: "ada@example.com", password: "supersecret1" });

    expect(response.user.email).toBe("ada@example.com");
    expect(getAuthToken()).toBe("token-abc");
    expect(JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? "{}")).toMatchObject({
      id: "u1",
    });
    expect(calls[0].body).toEqual({ email: "ada@example.com", password: "supersecret1" });
  });

  it("throws the server error and stores nothing on invalid credentials", async () => {
    mockApiRoutes({
      "POST /auth/login": jsonResponse({ detail: "Incorrect email or password." }, 401),
    });

    await expect(
      login({ email: "ada@example.com", password: "wrong" }),
    ).rejects.toMatchObject({ status: 401, message: "Incorrect email or password." });

    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem(USER_CACHE_KEY)).toBeNull();
  });
});

describe("register", () => {
  it("stores the returned session (dev_code included in DEBUG builds)", async () => {
    mockApiRoutes({
      "POST /auth/register": jsonResponse({ ...authPayload, dev_code: "123456" }),
    });

    const response = await register({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "supersecret1",
    });

    expect(response.dev_code).toBe("123456");
    expect(getAuthToken()).toBe("token-abc");
  });
});

describe("logout", () => {
  it("revokes the session server-side and clears the local cache", async () => {
    const calls = mockApiRoutes({
      "POST /auth/logout": jsonResponse({ message: "Signed out successfully." }),
    });

    await logout();

    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      "POST /auth/logout",
    ]);
    expect(getToken()).toBeNull();
    expect(localStorage.getItem(USER_CACHE_KEY)).toBeNull();
  });

  it("clears the local cache even when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    await expect(logout()).resolves.toBeUndefined();
    expect(getToken()).toBeNull();
  });
});

describe("fetchSession", () => {
  it("returns null without calling the API when no token is cached", async () => {
    const calls = mockApiRoutes({});

    await expect(fetchSession()).resolves.toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("validates the cached token against /auth/me", async () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ user: { ...testUser, name: "Updated" }, token: "token-abc" }),
    });

    const session = await fetchSession();

    expect(session?.user.name).toBe("Updated");
    expect(session?.token).toBe("token-abc");
    expect(
      JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? "{}"),
    ).toMatchObject({ name: "Updated" });
  });

  it("returns null and clears the cache when the session has expired (401)", async () => {
    localStorage.setItem("engineeros_auth_token", "expired");
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(testUser));
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ detail: "Session expired or invalid" }, 401),
    });

    await expect(fetchSession()).resolves.toBeNull();
    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem(USER_CACHE_KEY)).toBeNull();
  });

  it("rethrows network errors so callers can keep the cached user", async () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    await expect(fetchSession()).rejects.toMatchObject({ status: 0 });
  });
});

describe("getSession (synchronous cache)", () => {
  it("returns the cached user and token", () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(testUser));

    const session = getSession();

    expect(session?.token).toBe("token-abc");
    expect(session?.user.email).toBe("ada@example.com");
  });

  it("returns null without a token", () => {
    expect(getSession()).toBeNull();
  });
});
