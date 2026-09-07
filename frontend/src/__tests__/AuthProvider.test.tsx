import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../contexts/AuthProvider";
import { useAuth } from "../contexts/AuthContext";
import { USER_CACHE_KEY } from "../services/api";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { User } from "../types/auth";

const testUser: User = {
  id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
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
};

function Harness() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div data-testid="loading">Loading…</div>;
  return (
    <div data-testid={isAuthenticated ? "authed" : "anonymous"}>
      {user?.email ?? "signed out"}
    </div>
  );
}

function seedSession(user: User = testUser, token = "token-abc"): void {
  localStorage.setItem("engineeros_auth_token", token);
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

describe("AuthProvider session bootstrap", () => {
  it("starts anonymous (no cached token, no /auth/me call)", () => {
    const calls = mockApiRoutes({});

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    expect(screen.getByTestId("anonymous")).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("validates the cached session on mount: loading → confirmed, never anonymous", async () => {
    seedSession();
    mockApiRoutes({
      "GET /auth/me": jsonResponse({
        user: { ...testUser, name: "Confirmed Name" },
        token: "token-abc",
      }),
    });

    const states: string[] = [];
    function RecordingHarness() {
      const { user, isAuthenticated, isLoading } = useAuth();
      states.push(isLoading ? "loading" : isAuthenticated ? "authed" : "anonymous");
      if (isLoading) return <div data-testid="loading">Loading…</div>;
      return (
        <div data-testid={isAuthenticated ? "authed" : "anonymous"}>
          {user?.name ?? "signed out"}
        </div>
      );
    }

    render(
      <AuthProvider>
        <RecordingHarness />
      </AuthProvider>,
    );

    // A cached token means validation is in flight on first paint...
    expect(states[0]).toBe("loading");

    // ...and /auth/me replaces the cached user with the confirmed account.
    await waitFor(() =>
      expect(screen.getByTestId("authed")).toHaveTextContent("Confirmed Name"),
    );
    // The cached session never produces an anonymous flash while validating.
    expect(states).not.toContain("anonymous");
  });

  it("signs the user out when the session has expired (401 from /auth/me)", async () => {
    seedSession();
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ detail: "Session expired or invalid" }, 401),
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("anonymous")).toBeInTheDocument());
    expect(screen.getByTestId("anonymous")).toHaveTextContent("signed out");
    // The dead session is removed from the cache.
    expect(localStorage.getItem("engineeros_auth_token")).toBeNull();
  });

  it("keeps the cached user when /auth/me fails with a network error", async () => {
    seedSession();
    const calls = mockApiRoutes({
      "GET /auth/me": () => {
        throw new TypeError("Failed to fetch");
      },
    });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(calls).toHaveLength(1));
    await waitFor(() => expect(screen.getByTestId("authed")).toBeInTheDocument());
    expect(screen.getByTestId("authed")).toHaveTextContent("ada@example.com");
  });
});

describe("AuthProvider login and logout", () => {
  it("signs the user in through the real authService", async () => {
    mockApiRoutes({
      "POST /auth/login": jsonResponse({ user: testUser, token: "token-abc" }),
    });

    function LoginButton() {
      const { login } = useAuth();
      return (
        <button type="button" onClick={() => void login({
          email: "ada@example.com",
          password: "supersecret1",
        })}>
          Sign in
        </button>
      );
    }

    render(
      <AuthProvider>
        <LoginButton />
        <Harness />
      </AuthProvider>,
    );

    expect(screen.getByTestId("anonymous")).toBeInTheDocument();
    screen.getByRole("button", { name: "Sign in" }).click();

    await waitFor(() => expect(screen.getByTestId("authed")).toBeInTheDocument());
    expect(screen.getByTestId("authed")).toHaveTextContent("ada@example.com");
    expect(localStorage.getItem("engineeros_auth_token")).toBe("token-abc");
  });

  it("signs the user out and clears the session", async () => {
    mockApiRoutes({
      "POST /auth/login": jsonResponse({ user: testUser, token: "token-abc" }),
      "POST /auth/logout": jsonResponse({ message: "Signed out successfully." }),
    });

    function AuthControls() {
      const { login, logout } = useAuth();
      return (
        <>
          <button
            type="button"
            onClick={() =>
              void login({ email: "ada@example.com", password: "supersecret1" })
            }
          >
            Sign in
          </button>
          <button type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </>
      );
    }

    render(
      <AuthProvider>
        <AuthControls />
        <Harness />
      </AuthProvider>,
    );

    screen.getByRole("button", { name: "Sign in" }).click();
    await waitFor(() => expect(screen.getByTestId("authed")).toBeInTheDocument());

    screen.getByRole("button", { name: "Sign out" }).click();
    await waitFor(() => expect(screen.getByTestId("anonymous")).toBeInTheDocument());
    expect(localStorage.getItem("engineeros_auth_token")).toBeNull();
  });

  it("markEmailVerified updates the session cache so ProtectedRoute stops bouncing", async () => {
    const unverified = { ...testUser, email_verified: false };
    seedSession(unverified);
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ user: unverified, token: "token-abc" }),
    });

    function VerifyButton() {
      const { user, markEmailVerified } = useAuth();
      return (
        <div>
          <span data-testid="verified-flag">{String(user?.email_verified)}</span>
          <button type="button" onClick={() => markEmailVerified()}>
            Mark verified
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <VerifyButton />
        <Harness />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("authed")).toBeInTheDocument());
    expect(screen.getByTestId("verified-flag")).toHaveTextContent("false");

    screen.getByRole("button", { name: "Mark verified" }).click();
    await waitFor(() =>
      expect(screen.getByTestId("verified-flag")).toHaveTextContent("true"),
    );
    const cached = JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? "{}") as User;
    expect(cached.email_verified).toBe(true);
  });
});
