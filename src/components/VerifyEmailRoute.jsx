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

export default function VerifyEmailRoute({ children }) {
  const { user, account, loading } = useAuth();

  if (loading) {
    return AUTH_LOADING_SPINNER;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isVerifiedUser(user)) {
    return <Navigate to={getPostAuthDestination(account)} replace />;
  }

  return children;
}