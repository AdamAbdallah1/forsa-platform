import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";

export default function HiringRoute({ children }) {
  const [state, setState] = useState({
    loading: true,
    user: null,
    account: null,
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (mounted) {
          setState({
            loading: false,
            user: null,
            account: null,
          });
        }
        return;
      }

      try {
        await currentUser.reload();

        const isGoogleUser = currentUser.providerData.some(
          (provider) => provider.providerId === "google.com"
        );

        if (!isGoogleUser && !currentUser.emailVerified) {
          if (mounted) {
            setState({
              loading: false,
              user: currentUser,
              account: null,
            });
          }
          return;
        }

        const userDoc = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (!userDoc.exists()) {
          if (mounted) {
            setState({
              loading: false,
              user: currentUser,
              account: null,
            });
          }
          return;
        }

        if (mounted) {
          setState({
            loading: false,
            user: currentUser,
            account: userDoc.data(),
          });
        }
      } catch (error) {
        console.error("Hiring route authorization failed:", error);

        if (mounted) {
          setState({
            loading: false,
            user: currentUser,
            account: null,
          });
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (state.loading) {
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

  if (!state.user) {
    return <Navigate to="/auth" replace />;
  }

  const isGoogleUser = state.user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  if (!isGoogleUser && !state.user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!state.account) {
    return <Navigate to="/auth" replace />;
  }

  if (state.account.accountType !== "hiring") {
    return <Navigate to="/explore" replace />;
  }

  return children;
}
