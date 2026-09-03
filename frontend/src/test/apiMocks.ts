import { vi } from "vitest";

/** A JSON response with the given status (200 by default). */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export interface RecordedCall {
  method: string;
  /** Path relative to the /api base, e.g. "/auth/login". */
  path: string;
  body?: unknown;
  headers: Record<string, string>;
}

/**
 * Installs a global fetch mock that routes requests by "METHOD /path"
 * (path relative to the /api base URL used by services/api.ts).
 *
 * Routes map to a static Response or a factory receiving the recorded call
 * (useful for echoing the request body). Any request without a matching
 * route fails the test with "Unexpected fetch".
 * Returns the recorded call log for assertions.
 */
export function mockApiRoutes(
  routes: Record<string, Response | ((call: RecordedCall) => Response)>,
): RecordedCall[] {
  const calls: RecordedCall[] = [];

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const method = (init?.method ?? "GET").toUpperCase();
      const path = url.replace(/^https?:\/\/[^/]+\/api/, "");
      const key = `${method} ${path}`;

      const call: RecordedCall = {
        method,
        path,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
        headers: (init?.headers ?? {}) as Record<string, string>,
      };
      calls.push(call);

      const route = routes[key];
      if (route === undefined) {
        throw new Error(`Unexpected fetch: ${method} ${url}`);
      }
      return typeof route === "function" ? route(call) : route;
    }),
  );

  return calls;
}
