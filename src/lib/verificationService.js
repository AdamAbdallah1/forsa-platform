import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

export async function createVerificationRequest(data) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be signed in to request verification.");
  }

  const email = currentUser.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("Your account does not have an email address.");
  }

  const existingQuery = query(
    collection(db, "verificationRequests"),
    where("uid", "==", currentUser.uid),
    where("status", "==", "pending")
  );

  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    throw new Error("You already have a verification request under review.");
  }

  const ref = await addDoc(collection(db, "verificationRequests"), {
    ...data,
    uid: currentUser.uid,
    requestedByEmail: email,
    companyEmail: (data.companyEmail || email).trim().toLowerCase(),
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    ...data,
    uid: currentUser.uid,
    requestedByEmail: email,
    companyEmail: (data.companyEmail || email).trim().toLowerCase(),
    status: "pending",
  };
}