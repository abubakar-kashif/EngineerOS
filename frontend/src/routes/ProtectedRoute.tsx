import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AppLoadingScreen from "../components/layout/AppLoadingScreen";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Unverified sessions (e.g. right after register) must complete email verification.
  if (user && user.email_verified === false) {
    return (
      <Navigate
        to="/verify"
        replace
        state={{ email: user.email, from: location }}
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
