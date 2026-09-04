import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types/auth";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import * as authService from "../services/authService";
import { requestThemeSync } from "../components/ui/ThemeContext";
import { toast } from "../components/ui/useToast";

/**
 * Restores the account-level theme preference (GET /auth/me → preferences).
 * The backend preference wins over the device-local choice on sign-in.
 */
function syncThemeFromAccount(user: User | null): void {
  const theme = user?.preferences?.theme;
  if (theme === "light" || theme === "dark" || theme === "system") {
    requestThemeSync(theme);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Optimistically render the cached user while GET /api/auth/me confirms it.
  const [user, setUser] = useState<User | null>(() => authService.getSession()?.user ?? null);
  const [isLoading, setIsLoading] = useState(() => authService.getToken() !== null);

  useEffect(() => {
    if (!authService.getToken()) return undefined;

    let cancelled = false;
    authService
      .fetchSession()
      .then((session) => {
        if (!cancelled) {
          setUser(session?.user ?? null);
          syncThemeFromAccount(session?.user ?? null);
        }
      })
      .catch(() => {
        // Network/server failure: keep the cached user so a temporary
        // backend outage does not sign the user out of the UI.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user: loggedInUser } = await authService.login(credentials);
    setUser(loggedInUser);
    syncThemeFromAccount(loggedInUser);
    toast.success("Login successful", "Welcome back to EngineerOS.");
  }, []);

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const response = await authService.register(credentials);
      setUser(response.user);
      syncThemeFromAccount(response.user);
      return response;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    toast.info("Logged out", "Your session has ended.");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const session = await authService.fetchSession();
      setUser(session?.user ?? null);
      syncThemeFromAccount(session?.user ?? null);
    } catch {
      // Keep the current user when the refresh call fails (e.g. network).
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
