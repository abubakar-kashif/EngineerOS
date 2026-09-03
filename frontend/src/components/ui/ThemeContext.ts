import { createContext, useContext } from "react";

type Theme = "dark" | "light" | "system";

/**
 * Window event used to push an account-level theme preference (restored
 * from GET /api/auth/me) into the ThemeProvider. The providers are nested
 * (ThemeProvider wraps AuthProvider), so a plain event keeps them decoupled.
 */
export const THEME_SYNC_EVENT = "engineeros:theme-sync";

/** Applies `theme` locally by notifying the ThemeProvider. */
export function requestThemeSync(theme: Theme): void {
  window.dispatchEvent(new CustomEvent<Theme>(THEME_SYNC_EVENT, { detail: theme }));
}

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export type { Theme, ThemeContextValue };
