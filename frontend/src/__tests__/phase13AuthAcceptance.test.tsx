/**
 * Phase 13 — frontend/backend auth agreement (UI gates).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthProvider";
import LoginPage from "../pages/auth/LoginPage";
import ProtectedRoute from "../routes/ProtectedRoute";
import PublicRoute from "../routes/PublicRoute";
import { USER_CACHE_KEY } from "../services/api";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { User } from "../types/auth";

const verified: User = {
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
};

function VerifyLanding() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  return <div data-testid="verify-page">Verify {email}</div>;
}

function Dashboard() {
  return <div data-testid="dashboard-content">Dashboard</div>;
}

describe("Phase 13 auth gates", () => {
  it("sends unverified login (403) to verification instead of the dashboard", async () => {
    mockApiRoutes({
      "POST /auth/login": jsonResponse(
        { detail: "Please verify your email before signing in." },
        403,
      ),
      "POST /auth/resend": jsonResponse({ message: "Verification code sent." }),
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyLanding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/forgot-password" element={<div>Forgot</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/^email$/i), "unverified@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "supersecret1");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByTestId("verify-page")).toHaveTextContent("unverified@example.com"),
    );
    expect(screen.queryByTestId("dashboard-content")).not.toBeInTheDocument();
    expect(localStorage.getItem("engineeros_auth_token")).toBeNull();
  });

  it("keeps a verified session on the dashboard and off /verify", async () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(verified));
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ user: verified, token: "token-abc" }),
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login</div>} />
            <Route path="/verify" element={<VerifyLanding />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("verify-page")).not.toBeInTheDocument();
  });

  it("sends verified users away from /login to the dashboard", async () => {
    localStorage.setItem("engineeros_auth_token", "token-abc");
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(verified));
    mockApiRoutes({
      "GET /auth/me": jsonResponse({ user: verified, token: "token-abc" }),
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div data-testid="login-page">Login</div>
                </PublicRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verify" element={<VerifyLanding />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("dashboard-content")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("verify-page")).not.toBeInTheDocument();
  });
});
