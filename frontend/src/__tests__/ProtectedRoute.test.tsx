import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthProvider";
import ProtectedRoute from "../routes/ProtectedRoute";
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

/** Login page marker that surfaces the redirect location (state.from). */
function LoginLanding() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;
  return (
    <div data-testid="login-page">
      Sign in{from ? ` (redirected from ${from})` : ""}
    </div>
  );
}

function renderProtectedRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginLanding />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="dashboard-content">Private dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("redirects anonymous visitors to /login and remembers the attempted location", () => {
    mockApiRoutes({});

    renderProtectedRoute("/dashboard");

    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("login-page")).toHaveTextContent(
      "redirected from /dashboard",
    );
  });

  it("renders nothing while the cached session is still being validated", () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(testUser));
    // /auth/me never settles → the provider stays in the loading state.
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    renderProtectedRoute("/dashboard");

    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  it("renders the protected content once /auth/me confirms the session", async () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(testUser));
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ user: testUser, token: "token-abc" }),
    });

    renderProtectedRoute("/dashboard");

    await waitFor(() =>
      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });
});
