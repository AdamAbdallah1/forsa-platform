import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  /*
   * Firebase is still restoring the authentication state.
   * Do not redirect anywhere until we know the real state.
   */
  if (user === undefined) {
    return (
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
  }

  /*
   * No Firebase user means the visitor is not authenticated.
   */
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  /*
   * Email/password accounts must verify their email.
   *
   * Google accounts are allowed because Google authentication
   * already establishes the identity.
   */
  const isGoogleUser = user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  if (!isGoogleUser && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
}
