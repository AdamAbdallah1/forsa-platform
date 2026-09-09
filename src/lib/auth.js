import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  deleteUser,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "./firebase";

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
    return;
  }

  await sendEmailVerification(user);
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
    email.trim().toLowerCase()
  );
}

/* =========================================================
CHANGE EMAIL
========================================================= */

/**
 * Change the current user's email.
 *
 * The new email must be verified again.
 */
export async function changeCurrentUserEmail(newEmail) {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  const email = newEmail.trim().toLowerCase();

  await updateEmail(auth.currentUser, email);

  /*
   * The new address must be verified again.
   */
  await sendEmailVerification(auth.currentUser);

  /*
   * Remove the old application session because the account
   * is now waiting for email verification.
   */
  localStorage.removeItem("forsaAccount");

  return {
    ...getAccount(),
    email,
    emailVerified: false,
  };
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
LOGOUT
========================================================= */

export async function logout() {
  await signOut(auth);

  localStorage.removeItem("forsaAccount");
}