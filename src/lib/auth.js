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

export function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
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

/**
 * Register a new email/password user.
 *
 * After registration:
 * - Firebase creates the account
 * - A verification email is sent
 * - The user is NOT added to the Forsa local session yet
 * - The caller should redirect the user to the verification screen
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

  // Send Firebase's email verification message.
  await sendEmailVerification(user);

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
   * IMPORTANT:
   * Do NOT call setSession() here.
   *
   * The user must verify their email first.
   */

  return {
    ...safeAccountData,
    uid,
    email,
    emailVerified: false,
    requiresEmailVerification: true,
  };
}

/**
 * Login with email/password.
 *
 * Unverified email accounts are not allowed into the application.
 */
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = credential.user;

  // Reload Firebase's latest user state.
  await user.reload();

  if (!user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

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

/**
 * Check whether the currently authenticated Firebase user
 * has verified their email.
 */
export async function checkEmailVerification() {
  if (!auth.currentUser) {
    return false;
  }

  await auth.currentUser.reload();

  return auth.currentUser.emailVerified;
}

/**
 * Resend the Firebase verification email.
 */
export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  if (auth.currentUser.emailVerified) {
    return;
  }

  await sendEmailVerification(auth.currentUser);
}

/**
 * Complete the verification process.
 *
 * Call this after the user clicks "I've verified my email".
 */
export async function completeEmailVerification() {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  await auth.currentUser.reload();

  if (!auth.currentUser.emailVerified) {
    return false;
  }

  const uid = auth.currentUser.uid;
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  const account = {
    uid,
    ...snap.data(),
    emailVerified: true,
  };

  await updateDoc(doc(db, "users", uid), {
    emailVerified: true,
    updatedAt: serverTimestamp(),
  });

  setSession(account);

  return true;
}

export async function updateUserAccount(uid, data) {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  const current = getAccount();
  const next = { ...current, ...data };
  setSession(next);

  return next;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  const snap = await getDoc(doc(db, "users", user.uid));

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

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

export async function changeCurrentUserEmail(newEmail) {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  const email = newEmail.trim().toLowerCase();

  await updateEmail(auth.currentUser, email);

  // A changed email must be verified again.
  await sendEmailVerification(auth.currentUser);

  const current = getAccount();

  const next = {
    ...current,
    email,
    emailVerified: false,
  };

  /*
   * Remove the local session because the new email
   * needs to be verified again.
   */
  localStorage.removeItem("forsaAccount");

  return next;
}

export async function changeCurrentUserPassword(newPassword) {
  if (!auth.currentUser) {
    throw new Error("No authenticated user.");
  }

  await updatePassword(auth.currentUser, newPassword);
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("forsaAccount");
}
