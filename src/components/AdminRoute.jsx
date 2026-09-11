import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { isAdminAccount } from "../lib/authRoutes";

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

export default function AdminRoute({ children }) {
  const { user, account, loading } = useAuth();

  if (loading) {
    return AUTH_LOADING_SPINNER;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isGoogleUser = user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  if (!isGoogleUser && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!isAdminAccount(account)) {
    return <Navigate to="/explore" replace />;
  }

  return children;
}
