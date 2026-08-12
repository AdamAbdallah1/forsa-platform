import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
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
 * 1. Firebase creates the Auth account.
 * 2. Firebase sends the verification email.
 * 3. Firestore creates the user profile.
 * 4. No local application session is created yet.
 * 5. Caller redirects to the verification screen.
 */
export async function registerUser(accountData) {
  const email = accountData.email.trim().toLowerCase();
  const password = accountData.password;

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
  const { password: _, ...safeAccountData } = accountData;

  const cleanAccount = {
    ...safeAccountData,
    uid,
    email,
    emailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), cleanAccount);

  /*
   * Do NOT create the local session yet.
   *
   * The user must verify the email first.
   */
  return {
    ...safeAccountData,
    uid,
    email,
    emailVerified: false,
    requiresEmailVerification: true,
  };
}

/* =========================================================
   LOGIN
   ========================================================= */

/**
 * Login with email/password.
 *
 * Unverified email accounts are rejected.
 */
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = credential.user;

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
 *   true  -> email is verified
 *   false -> email is not verified / no user
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
