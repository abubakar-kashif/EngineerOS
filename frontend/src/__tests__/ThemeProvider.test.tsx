import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../components/ui/ThemeProvider";
import { requestThemeSync, useTheme } from "../components/ui/ThemeContext";
import { AuthProvider } from "../contexts/AuthProvider";
import { useAuth } from "../contexts/AuthContext";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { User } from "../types/auth";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

function ThemeHarness() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("light")}>
        Go light
      </button>
    </div>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeHarness />
    </ThemeProvider>,
  );
}

describe("ThemeProvider persistence", () => {
  it("defaults to the dark theme and applies it to the document", () => {
    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("restores the persisted theme from localStorage on mount", () => {
    localStorage.setItem("engineeros-theme", "light");

    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("persists theme changes to localStorage and the document", async () => {
    renderTheme();

    screen.getByRole("button", { name: "Go light" }).click();

    expect(localStorage.getItem("engineeros-theme")).toBe("light");
    await waitFor(() =>
      expect(screen.getByTestId("theme")).toHaveTextContent("light"),
    );
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("light"),
    );
  });

  it("resolves the 'system' preference through the OS media query", () => {
    localStorage.setItem("engineeros-theme", "system");
    // The setup stub reports a light OS preference (matches: false).
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    renderTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("adopts the account theme pushed through the sync event", async () => {
    renderTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // AuthProvider dispatches this after login/session validation.
    requestThemeSync("light");

    await waitFor(() =>
      expect(screen.getByTestId("theme")).toHaveTextContent("light"),
    );
    expect(localStorage.getItem("engineeros-theme")).toBe("light");
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("light"),
    );
  });
});

describe("theme persistence across sign-in", () => {
  it("applies the account preference returned by /auth/login (backend wins)", async () => {
    const lightUser: User = {
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      preferences: {
        theme: "light",
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
    mockApiRoutes({
      "POST /auth/login": jsonResponse({ user: lightUser, token: "token-abc" }),
    });

    function LoginButton() {
      const { login } = useAuth();
      return (
        <button
          type="button"
          onClick={() =>
            void login({ email: "ada@example.com", password: "supersecret1" })
          }
        >
          Sign in
        </button>
      );
    }

    // Provider nesting matches the app: ThemeProvider wraps AuthProvider.
    render(
      <ThemeProvider>
        <AuthProvider>
          <LoginButton />
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    screen.getByRole("button", { name: "Sign in" }).click();

    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("light"),
    );
    // The account-level choice is persisted for future visits.
    expect(localStorage.getItem("engineeros-theme")).toBe("light");
  });
});
