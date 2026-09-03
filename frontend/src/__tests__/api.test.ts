import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, clearAuthCache, getAuthToken, setAuthToken, USER_CACHE_KEY } from "../services/api";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";

afterEach(() => {
  vi.useRealTimers();
});

describe("apiRequest", () => {
  it("returns parsed JSON for a successful response", async () => {
    mockApiRoutes({ "GET /health": jsonResponse({ status: "ok" }) });

    await expect(apiRequest<{ status: string }>("/health")).resolves.toEqual({
      status: "ok",
    });
  });

  it("attaches the bearer token when one is cached", async () => {
    setAuthToken("token-123");
    const calls = mockApiRoutes({ "GET /auth/me": jsonResponse({ user: {} }) });

    await apiRequest("/auth/me");

    expect(calls[0].headers.Authorization).toBe("Bearer token-123");
  });

  it("omits the Authorization header for anonymous requests", async () => {
    const calls = mockApiRoutes({ "GET /progress": jsonResponse({}) });

    await apiRequest("/progress");

    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it("uses the server-provided detail as the error message", async () => {
    mockApiRoutes({
      "POST /auth/register": jsonResponse(
        { detail: "An account with this email already exists." },
        409,
      ),
    });

    const error = await apiRequest("/auth/register", { method: "POST" }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).message).toBe(
      "An account with this email already exists.",
    );
  });

  it("falls back to a generic message when the body has no detail", async () => {
    mockApiRoutes({ "GET /experiments": jsonResponse({ error: "nope" }, 500) });

    const error = await apiRequest("/experiments").catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe("API request failed with status 500");
  });

  it("clears the cached session on 401 (session expiration)", async () => {
    setAuthToken("expired-token");
    localStorage.setItem(USER_CACHE_KEY, '{"id":"u1"}');
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ detail: "Session expired or invalid" }, 401),
    });

    await expect(apiRequest("/auth/me", undefined, { redirectOn401: false })).rejects.toMatchObject({
      status: 401,
    });

    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem(USER_CACHE_KEY)).toBeNull();
  });

  it("maps network failures to an ApiError with status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));

    const error = await apiRequest("/experiments").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
    expect((error as ApiError).message).toContain("Unable to reach the EngineerOS server");
  });

  it("maps request timeouts to an ApiError with status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("The operation was aborted.", "AbortError")),
            );
          }),
      ),
    );
    vi.useFakeTimers();

    const pending = apiRequest("/experiments");
    const assertion = expect(pending).rejects.toMatchObject({
      status: 0,
      message: "The request timed out. Please try again.",
    });
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });

  it("returns undefined for 204 responses", async () => {
    mockApiRoutes({ "DELETE /conversations/c1": new Response(null, { status: 204 }) });

    await expect(apiRequest("/conversations/c1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("sends the JSON body and method from options", async () => {
    const calls = mockApiRoutes({ "POST /progress": jsonResponse({}) });

    await apiRequest("/progress", {
      method: "POST",
      body: JSON.stringify({ experiment_id: "ohms-law", status: "completed" }),
    });

    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toEqual({
      experiment_id: "ohms-law",
      status: "completed",
    });
    expect(calls[0].headers["Content-Type"]).toBe("application/json");
  });
});

describe("token cache", () => {
  it("stores and clears the bearer token", () => {
    setAuthToken("abc");
    expect(getAuthToken()).toBe("abc");

    clearAuthCache();
    expect(getAuthToken()).toBeNull();
  });
});
