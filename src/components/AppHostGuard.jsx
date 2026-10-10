import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/*
 * Requires an authenticated Firebase session on app.forsa.digital ONLY.
 *
 * Every other hostname (forsa.digital, www.forsa.digital, localhost, Vercel
 * preview and deployment URLs) keeps its existing public behavior — on those
 * hosts this guard renders its children untouched.
 *
 * The open-path allowlist keeps the authentication infrastructure reachable
 * while signed out, so the redirect to /auth can never loop back into this
 * guard.
 *
 * This checks authentication ONLY. Email verification, account type, and
 * onboarding continue to be enforced by the existing AuthRoute /
 * VerifyEmailRoute / ProtectedRoute / HiringRoute / SeekerRoute guards, and
 * admin access still requires users/{uid}.role == "admin" in AdminRoute.
 */
const APP_HOST = "app.forsa.digital";

const OPEN_PATHS = new Set([
  "/auth",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
]);

const AUTH_LOADING_SPINNER = (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{
      background: "var(--forsa-bg)",
      color: "var(--forsa-text)",
    }}
  >
    <div
      className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
      style={{
        borderColor: "var(--forsa-primary, #8b5cf6)",
        borderTopColor: "transparent",
      }}
    />
  </div>
);

const normalizePathname = (pathname) => {
  const trimmed = String(pathname || "/").replace(/\/+$/, "");

  return trimmed || "/";
};

function isAppHost() {
  return (
    typeof window !== "undefined" &&
    window.location.hostname === APP_HOST
  );
}

export default function AppHostGuard({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (!isAppHost()) {
    return children;
  }

  if (OPEN_PATHS.has(normalizePathname(location.pathname))) {
    return children;
  }

  if (loading) {
    return AUTH_LOADING_SPINNER;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
