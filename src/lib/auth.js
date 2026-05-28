import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
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
export async function registerUser(accountData) {
  const email = accountData.email.trim().toLowerCase();
  const password = accountData.password;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const { password: _, ...safeAccountData } = accountData;

  const cleanAccount = {
    ...safeAccountData,
    uid,
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), cleanAccount);

  const sessionAccount = {
    ...safeAccountData,
    uid,
    email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  setSession(sessionAccount);
  return sessionAccount;
}

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const uid = credential.user.uid;
  const snap = await getDoc(doc(db, "users", uid));

  if (!snap.exists()) {
    throw new Error("User profile not found.");
  }

  const account = {
    uid,
    ...snap.data(),
  };

  setSession(account);
  return account;
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
    };

    setSession(account);
    return { account, isNewUser: false };
  }

  const newAccount = {
    uid: user.uid,
    accountType: "finder",
    name: user.displayName || "Forsa user",
    email: user.email,
    city: "",
    photoURL: user.photoURL || "",
    provider: "google",
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

  return { account: sessionAccount, isNewUser: true };
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("forsaAccount");
}