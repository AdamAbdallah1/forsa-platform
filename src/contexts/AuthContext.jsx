/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { setSession } from "../lib/auth";

const AuthContext = createContext(null);

function iso(value) {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
}

/*
 * Brand-new accounts created by registerUser/loginWithGoogle write their
 * users/{uid} document right after sign-in. Until that write lands the
 * auth listeners treat the account as "still building" and keep listening
 * instead of resolving a missing document. Accounts older than this window
 * with no document are resolved as missing.
 */
const FRESH_ACCOUNT_WINDOW_MS = 2 * 60 * 1000;

function isFreshAuthUser(user) {
  const created = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).getTime()
    : 0;

  return created > 0 && Date.now() - created < FRESH_ACCOUNT_WINDOW_MS;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolveMissing = (firebaseUser, nextError = null) => {
    setUser(firebaseUser);
    setAccount(null);
    setLoading(false);
    setError(nextError);
    localStorage.removeItem("forsaAccount");
  };

  useEffect(() => {
    let cancelled = false;
    let stopAccountListener = null;

    const stopListening = () => {
      if (stopAccountListener) {
        stopAccountListener();
        stopAccountListener = null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (cancelled) return;

      stopListening();

      if (!firebaseUser) {
        setUser(null);
        setAccount(null);
        setLoading(false);
        setError(null);
        localStorage.removeItem("forsaAccount");
        return;
      }

      // A signed-in user is never resolved instantly: the single auth
      // state gate drives guard redirects, so it must not expose an
      // account while or before it loads.
      setLoading(true);

      const isGoogleUser = firebaseUser.providerData.some(
        (p) => p.providerId === "google.com"
      );

      if (!isGoogleUser && !firebaseUser.emailVerified) {
        resolveMissing(firebaseUser);
        return;
      }

      stopAccountListener = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snap) => {
          if (cancelled) return;

          if (snap.exists()) {
            stopListening();

            const data = snap.data();

            const resolved = {
              uid: firebaseUser.uid,
              ...data,
              emailVerified: firebaseUser.emailVerified,
              createdAt: iso(data.createdAt),
              updatedAt: iso(data.updatedAt),
            };

            setUser(firebaseUser);
            setAccount(resolved);
            setLoading(false);
            setError(null);
            setSession(resolved);
            return;
          }

          if (!isFreshAuthUser(firebaseUser)) {
            stopListening();
            resolveMissing(firebaseUser);
          }
        },
        (err) => {
          if (cancelled) return;
          stopListening();
          console.error("AuthContext: Firestore read failed:", err);
          resolveMissing(firebaseUser, err);
        }
      );
    });

    return () => {
      cancelled = true;
      stopListening();
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      setUser(null);
      setAccount(null);
      setLoading(false);
      setError(null);
      localStorage.removeItem("forsaAccount");
      return;
    }

    /*
     * Re-resolution must not expose a half-refreshed auth state. The
     * centralized gate holds loading true until user + account are
     * re-derived from a reloaded Firebase user and the Firestore profile.
     */
    setLoading(true);

    try {
      await firebaseUser.reload();

      const isGoogleUser = firebaseUser.providerData.some(
        (p) => p.providerId === "google.com"
      );

      if (!isGoogleUser && !firebaseUser.emailVerified) {
        resolveMissing(firebaseUser);
        return;
      }

      const snap = await getDoc(doc(db, "users", firebaseUser.uid));

      if (!snap.exists()) {
        resolveMissing(firebaseUser);
        return;
      }

      const data = snap.data();

      const resolved = {
        uid: firebaseUser.uid,
        ...data,
        emailVerified: firebaseUser.emailVerified,
        createdAt: iso(data.createdAt),
        updatedAt: iso(data.updatedAt),
      };

      setUser(firebaseUser);
      setAccount(resolved);
      setLoading(false);
      setError(null);
      setSession(resolved);
    } catch (err) {
      console.error("AuthContext: refresh failed:", err);
      resolveMissing(firebaseUser, err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, account, loading, error, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}