import { useEffect, useState, useCallback, type ReactNode } from "react";
import { ThemeContext, THEME_SYNC_EVENT, type Theme } from "./ThemeContext";

const STORAGE_KEY = "engineeros-theme";
const DEFAULT_THEME: Theme = "dark";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_THEME;
}

function applyTheme(resolved: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(getSystemTheme);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  /* Listen for OS preference changes */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Apply the account-level preference restored from the auth session
     (backend preference wins on login; localStorage covers anonymous use). */
  useEffect(() => {
    const handler = (event: Event) => {
      const theme = (event as CustomEvent<Theme>).detail;
      if (theme !== "dark" && theme !== "light" && theme !== "system") return;
      setThemeState(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* localStorage unavailable */
      }
    };
    window.addEventListener(THEME_SYNC_EVENT, handler);
    return () => window.removeEventListener(THEME_SYNC_EVENT, handler);
  }, []);

  /* Apply resolved theme to DOM */
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
