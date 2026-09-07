import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppLoadingScreen from "../components/layout/AppLoadingScreen";
import type { ReactNode } from "react";

/**
 * Auth pages for signed-out users.
 * Verified sessions → dashboard; unverified sessions → /verify (never bounce via dashboard).
 */
function PublicRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  if (isAuthenticated && user) {
    if (user.email_verified === false) {
      return (
        <Navigate
          to="/verify"
          replace
          state={{ email: user.email, from: location }}
        />
      );
    }
    const from =
      (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

export default PublicRoute;
