import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { isVerifiedUser, getPostAuthDestination } from "../lib/authRoutes";

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

/*
 * /forgot-password is a request form for unauthenticated users.
 *
 * - unauthenticated          -> children (the request form)
 * - authenticated + verified -> canonical destination (no reset request
 *                               form needed while signed in)
 * - authenticated + unverified -> /verify-email (consistent with the
 *                               verification architecture; /forgot-password
 *                               must not become a way to bypass verification)
 */
export default function ForgotPasswordRoute({ children }) {
  const { user, account, loading } = useAuth();

  if (loading) {
    return AUTH_LOADING_SPINNER;
  }

  if (!user) {
    return children;
  }

  if (!isVerifiedUser(user)) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Navigate to={getPostAuthDestination(account)} replace />;
}