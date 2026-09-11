import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithCustomToken,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  deleteUser,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

/*
 * Production destination for Firebase's password-reset action links.
 *
 * handleCodeInApp routes the email link directly to the Forsa SPA
 * (Vercel-hosted, not Firebase Hosting) with the Firebase-validated
 * oobCode in the query string, where /reset-password completes the flow
 * via verifyPasswordResetCode()/confirmPasswordReset().
 */
const RESET_PASSWORD_URL = "https://forsa.digital/reset-password";

const RESET_PASSWORD_ACTION_CODE_SETTINGS = {
  url: RESET_PASSWORD_URL,
  handleCodeInApp: true,
};

/* =========================================================
LOCAL SESSION HELPERS
========================================================= */

export function safeJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
}

export function getAccount() {
  return safeJson("forsaAccount", null);
}

export function setSession(account) {
  localStorage.setItem("forsaAccount", JSON.stringify(account));
}

/* =========================================================
USERNAME HELPERS
========================================================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

/**
 * Change the current user's public username.
 *
 * The claim is staged so Firestore security rules can validate it:
 *
 * 1. Claim the new `usernames/{usernameLower}` mapping with a single
 *    create-only write. An existing document is an update write, which
 *    the rules deny, so a collision fails this step (username taken).
 * 2. Atomically update `users/{uid}` (username / usernameLower) and
 *    release the previous mapping. The rules verify the newly claimed
 *    mapping belongs to this user via get().
 * 3. If step 2 fails, the fresh mapping is released again.
 *
 * After success the new username resolves on login and the old one no
 * longer does.
 */
export async function changeUsername(newUsername) {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  const username = String(newUsername || "").trim();
  const usernameLower = username.toLowerCase();

  if (!USERNAME_RE.test(usernameLower)) {
    throw new Error("USERNAME_INVALID");
  }

  const uid = auth.currentUser.uid;
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User profile not found.");
  }

  const currentUsernameLower =
    typeof userSnap.data().usernameLower === "string"
      ? userSnap.data().usernameLower
      : null;

  const refreshSession = (extra = {}) => {
    const next = {
      ...(getAccount() || {}),
      ...userSnap.data(),
      username,
      usernameLower,
      ...extra,
    };

    setSession(next);

    return next;
  };

  /*
   * Same lowercase key: just sync the display casing on the profile.
   * No mapping change is needed.
   */
  if (currentUsernameLower === usernameLower) {
    await updateDoc(userRef, {
      username,
      updatedAt: serverTimestamp(),
    });

    return refreshSession();
  }

  const available = await checkUsernameAvailable(usernameLower);

  if (!available) {
    throw new Error("USERNAME_TAKEN");
  }

  /*
   * Phase 1: claim the new mapping. Create-only rules means an owned
   * username is an update write and is rejected here.
   */
  try {
    await setDoc(doc(db, "usernames", usernameLower), { uid });
  } catch (claimError) {
    throw new Error("USERNAME_TAKEN", {
      cause: claimError,
    });
  }

  try {
    const batch = writeBatch(db);

    batch.update(userRef, {
      username,
      usernameLower,
      updatedAt: serverTimestamp(),
    });

    if (currentUsernameLower) {
      batch.delete(doc(db, "usernames", currentUsernameLower));
    }

    await batch.commit();
  } catch (batchError) {
    /*
     * Release the mapping claimed above. The delete is allowed because
     * the mapping's uid is this user's own.
     */
    try {
      await deleteDoc(doc(db, "usernames", usernameLower));
    } catch {
      // Best effort: a stale mapping is harmless because the username
      // login endpoint cross-checks ownership before authenticating.
    }

    throw batchError;
  }

  return refreshSession();
}

async function postApi(path, body) {
  let response;

  try {
    response = await fetch(`/api/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Network error. Check your connection and try again."
    );
  }

  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error || "Request failed. Please try again."
    );
  }

  return data;
}

/**
 * Check whether a username has already been claimed.
 *
 * Called BEFORE the Firebase Auth account is created so a duplicate
 * username never results in a stale account.
 */
export async function checkUsernameAvailable(username) {
  const lower = normalizeUsername(username);

  if (!USERNAME_RE.test(lower)) {
    return false;
  }

  const data = await postApi("check-username", {
    username: lower,
  });

  return data?.available === true;
}

/* =========================================================
EMAIL VERIFICATION HELPERS
========================================================= */

/**
 * Reload Firebase Auth state.
 *
 * This is important because emailVerified can change on
 * Firebase's servers after the user clicks the email link.
 */
async function reloadCurrentUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  await user.reload();

  return user;
}

/**
 * Force Firebase to refresh the user's ID token.
 *
 * Firestore security rules read:
 *
 * request.auth.token.email_verified
 *
 * The refreshed token allows Firestore rules to see the
 * newly verified email state.
 */
async function refreshAuthToken(user) {
  await user.getIdToken(true);
}

/* =========================================================
REGISTRATION
========================================================= */

/**
 * Register a new email/password user.
 *
 * Flow:
 *
 * 1. Firebase creates the Auth account.
 * 2. Firebase sends the verification email.
 * 3. Firestore creates the user profile.
 * 4. No local application session is created yet.
 * 5. Caller redirects to the verification screen.
 */
export async function registerUser(accountData) {
  const email = accountData.email.trim().toLowerCase();
  const password = accountData.password;

  const username = String(accountData.username || "").trim();
  const usernameLower = username.toLowerCase();

  /*
   * Username uniqueness is checked BEFORE the Firebase account is
   * created so a duplicate username never leaves a stale Auth account.
   */
  if (!USERNAME_RE.test(usernameLower)) {
    throw new Error("USERNAME_INVALID");
  }

  const available = await checkUsernameAvailable(usernameLower);

  if (!available) {
    throw new Error("USERNAME_TAKEN");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = credential.user;
  const uid = user.uid;

  /*
   * Send verification email immediately after account creation.
   */
  await sendEmailVerification(user);

  /*
   * Never store the password in Firestore.
   */
  const safeAccountData = { ...accountData };

  delete safeAccountData.password;

  const cleanAccount = {
    ...safeAccountData,
    uid,
    email,
    username,
    usernameLower,
    emailVerified: false,
    isNewRegistration: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  /*
   * users/{uid} and usernames/{usernameLower} are written in a single
   * atomic batch. Firestore rules only allow `create` on the usernames
   * document, so the second writer to claim the same username fails the
   * entire batch instead of overwriting the mapping.
   */
  const batch = writeBatch(db);

  batch.set(doc(db, "users", uid), cleanAccount);
  batch.set(doc(db, "usernames", usernameLower), { uid });

  try {
    await batch.commit();
  } catch (batchError) {
    /*
     * If the username was claimed between the availability check and
     * this batch, remove the freshly created Auth account and report
     * the collision so no orphan account is left behind.
     */
    const exists = await getDoc(
      doc(db, "usernames", usernameLower)
    )
      .then((snap) => snap.exists())
      .catch(() => false);

    if (exists) {
      try {
        await deleteUser(auth.currentUser);
      } catch {
        // Best effort cleanup only.
      }

      throw new Error("USERNAME_TAKEN", {
        cause: batchError,
      });
    }

    throw batchError;
  }

  /*
   * Do NOT create the local session yet.
   *
   * The user must verify the email first.
   */
  return {
    ...safeAccountData,
    uid,
    email,
    username,
    usernameLower,
    emailVerified: false,
    requiresEmailVerification: true,
  };
}

/* =========================================================
LOGIN
========================================================= */

/**
 * Login with email/password or username/password.
 *
 * - Email input uses the existing Firebase email/password login.
 * - Username input is authenticated by the server, which resolves the
 *   username to its owning account and verifies the password against
 *   Firebase WITHOUT returning the email to the client. The client signs
 *   in with the returned custom token via the same Firebase SDK session.
 *
 * Unverified email accounts are rejected.
 */
export async function loginUser(identifier, password) {
  const value = String(identifier || "").trim();

  let user;

  if (EMAIL_RE.test(value)) {
    const credential = await signInWithEmailAndPassword(
      auth,
      value.toLowerCase(),
      password
    );

    user = credential.user;
  } else {
    const data = await postApi("username-login", {
      username: value,
      password,
    });

    if (data?.error === "EMAIL_NOT_VERIFIED") {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    if (!data?.customToken) {
      throw new Error("INVALID_USERNAME_PASSWORD");
    }

    const credential = await signInWithCustomToken(
      auth,
      data.customToken
    );

    user = credential.user;
  }

  /*
   * Always reload Auth state before checking verification.
   */
  await user.reload();

  if (!user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  /*
   * Refresh the token so Firestore rules have the latest
   * email_verified claim.
   */
  await refreshAuthToken(user);

  const uid = user.uid;
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  const account = {
    uid,
    ...snap.data(),
    emailVerified: true,
  };

  setSession(account);

  return account;
}

/* =========================================================
CHECK EMAIL VERIFICATION
========================================================= */

/**
 * Check the latest Firebase Auth verification state.
 *
 * Returns:
 * true  -> email is verified
 * false -> email is not verified / no user
 */
export async function checkEmailVerification() {
  if (!auth.currentUser) {
    return false;
  }

  const user = await reloadCurrentUser();

  return user.emailVerified;
}

/* =========================================================
SYNC EMAIL VERIFICATION
========================================================= */

/**
 * Sync Firebase Auth email verification state to Firestore.
 *
 * This should be called after the user clicks the verification
 * link and then returns to Forsa.
 *
 * Important:
 * Firebase Auth is the source of truth for verification.
 *
 * Firestore:
 * users/{uid}.emailVerified
 *
 * is only synchronized AFTER Firebase Auth reports:
 *
 * user.emailVerified === true
 */
export async function syncEmailVerification() {
  const user = await reloadCurrentUser();

  /*
   * User has not verified their email yet.
   */
  if (!user.emailVerified) {
    return false;
  }

  /*
   * Refresh the Auth token FIRST.
   *
   * Firestore rules use:
   * request.auth.token.email_verified
   */
  await refreshAuthToken(user);

  const userRef = doc(db, "users", user.uid);

  /*
   * Make sure the Firestore profile exists before updating it.
   */
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  /*
   * Synchronize Firestore profile.
   */
  await updateDoc(userRef, {
    emailVerified: true,
    updatedAt: serverTimestamp(),
  });

  return true;
}

/* =========================================================
RESEND VERIFICATION EMAIL
========================================================= */

/**
 * Resend Firebase's verification email.
 *
 * Returns:
 * { sent: true }            -> email was sent
 * { alreadyVerified: true } -> no email sent; Firebase auth already reports
 *                              the address as verified (e.g. verified in
 *                              another tab), so the caller should refresh
 *                              centralized auth state
 *
 * Throws when Firebase rejects the send; the caller must surface the
 * rejection instead of claiming an email was sent.
 */
export async function resendVerificationEmail() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user.");
  }

  /*
   * Always check the latest Auth state.
   */
  await user.reload();

  /*
   * Do not send another verification email if already verified.
   */
  if (user.emailVerified) {
    return { alreadyVerified: true };
  }

  await sendEmailVerification(user);

  return { sent: true };
}

/* =========================================================
COMPLETE EMAIL VERIFICATION
========================================================= */

/**
 * Complete the verification process.
 *
 * Called after the user clicks:
 *
 * "I've verified my email"
 *
 * Flow:
 *
 * 1. Reload Firebase Auth.
 * 2. Confirm emailVerified.
 * 3. Refresh Auth token.
 * 4. Read Firestore profile.
 * 5. Update Firestore emailVerified.
 * 6. Create the local application session.
 */
export async function completeEmailVerification() {
  const user = await reloadCurrentUser();

  /*
   * Verification has not happened yet.
   */
  if (!user.emailVerified) {
    return false;
  }

  /*
   * Refresh token so Firestore sees:
   *
   * request.auth.token.email_verified == true
   */
  await refreshAuthToken(user);

  const uid = user.uid;
  const userRef = doc(db, "users", uid);

  /*
   * Make sure the profile exists.
   */
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  /*
   * Synchronize Firestore.
   */
  await updateDoc(userRef, {
    emailVerified: true,
    updatedAt: serverTimestamp(),
  });

  /*
   * Build the application session from the latest Firestore data.
   */
  const account = {
    uid,
    ...snap.data(),
    emailVerified: true,
  };

  setSession(account);

  return true;
}

/* =========================================================
USER PROFILE
========================================================= */

/**
 * Update the current user's Firestore profile.
 */
export async function updateUserAccount(uid, data) {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  const current = getAccount();

  const next = {
    ...current,
    ...data,
  };

  setSession(next);

  return next;
}

/* =========================================================
GOOGLE LOGIN
========================================================= */

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  /*
   * Google accounts are considered verified by Firebase
   * for this application's purposes.
   */
  const snap = await getDoc(doc(db, "users", user.uid));

  /*
   * Existing Google/Firebase account.
   */
  if (snap.exists()) {
    const account = {
      uid: user.uid,
      ...snap.data(),
      emailVerified: true,
    };

    setSession(account);

    return {
      account,
      isNewUser: false,
    };
  }

  /*
   * New Google account.
   *
   * isNewRegistration marks accounts created by the current
   * registration flow. It is written ONLY here (and in registerUser)
   * so pre-feature accounts can never be treated as new registrations.
   */
  const newAccount = {
    uid: user.uid,
    accountType: "finder",
    name: user.displayName || "Forsa user",
    email: user.email,
    city: "",
    photoURL: user.photoURL || "",
    provider: "google",
    emailVerified: true,
    isNewRegistration: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", user.uid), newAccount);

  /*
   * Convert server timestamps into serializable local values.
   */
  const sessionAccount = {
    ...newAccount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  setSession(sessionAccount);

  return {
    account: sessionAccount,
    isNewUser: true,
  };
}

/* =========================================================
PASSWORD RESET
========================================================= */

export async function resetPassword(email) {
  await sendPasswordResetEmail(
    auth,
    email.trim().toLowerCase(),
    RESET_PASSWORD_ACTION_CODE_SETTINGS
  );
}

/**
 * Validate a Firebase password-reset action code.
 *
 * Firebase validates the oobCode server-side and resolves with the email
 * address it belongs to. Throws for invalid/expired/already-used codes.
 * The URL's oobCode is never trusted or decoded client-side.
 */
export async function verifyPasswordResetActionCode(oobCode) {
  return verifyPasswordResetCode(auth, oobCode);
}

/**
 * Complete a password reset with Firebase.
 *
 * Firebase re-validates the code server-side and sets the new password.
 * It does NOT manufacture an authenticated session; the caller directs
 * the user to the login flow.
 */
export async function confirmPasswordResetActionCode(oobCode, newPassword) {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

/* =========================================================
CHANGE PASSWORD
========================================================= */

export async function changeCurrentUserPassword(newPassword) {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  await updatePassword(auth.currentUser, newPassword);
}

/* =========================================================
REAUTHENTICATION (account deletion)
========================================================= */

function googleReauthProvider() {
  const provider = new GoogleAuthProvider();

  /*
   * Force an explicit, non-silent Google sign-in so the user actively
   * re-confirms their identity before a destructive operation. This is
   * the equivalent of a fresh login, which keeps Firebase's recent-login
   * protection intact instead of weakening it.
   */
  provider.setCustomParameters({
    prompt: "login",
  });

  return provider;
}

/**
 * Re-authenticate the current Firebase user with their current
 * credentials. Required before account deletion.
 *
 * - Google users: explicit Google reauthentication prompt.
 * - Email/password users: the account's current password.
 *
 * The password is only supplied to Firebase's reauthentication call and
 * is never stored, logged, or returned.
 *
 * Throws errors whose `code` is a stable Firebase code (or a local
 * "PASSWORD_REQUIRED" / "NO_USER" value) for user-safe mapping via
 * reauthErrorMessage().
 */
export async function reauthenticateCurrentUser({ password } = {}) {
  const user = auth.currentUser;

  if (!user) {
    const error = new Error("No authenticated user.");
    error.code = "NO_USER";
    throw error;
  }

  const isGoogle = user.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  if (isGoogle) {
    await reauthenticateWithPopup(user, googleReauthProvider());
    return;
  }

  if (!password) {
    const error = new Error("Current password is required.");
    error.code = "PASSWORD_REQUIRED";
    throw error;
  }

  const credential = EmailAuthProvider.credential(user.email, password);

  await reauthenticateWithCredential(user, credential);
}

/**
 * Map a reauthentication error to a safe, user-facing message.
 */
export function reauthErrorMessage(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That password is incorrect. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again in a little while.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Google sign-in was blocked. Allow popups for this site and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/user-not-found":
    case "auth/user-disabled":
      return "This account is no longer available. Please try again.";
    case "auth/requires-recent-login":
      return "Please sign in again and retry.";
    default:
      return "Could not verify your identity. Please try again.";
  }
}

/* =========================================================
LOGOUT
========================================================= */

/*
 * The single canonical logout implementation for the whole application.
 *
 * 1. signOut(auth)                          -> the source of truth. If it
 *    throws, nothing else runs, so we never pretend the session ended or
 *    wipe the compatibility cache for a Firebase session that still exists.
 * 2. AuthContext observes the sign-out via its single onAuthStateChanged
 *    listener and resolves user/account to null and loading to false.
 * 3. The forsaAccount compatibility cache is removed here; callers must
 *    not perform partial logouts themselves.
 *
 * Navigation to /auth (replace) is a UI-layer concern and is done by the
 * caller.
 */
export async function logout() {
  await signOut(auth);

  localStorage.removeItem("forsaAccount");
}