import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export async function createVerificationRequest(data) {
  const email = (
    data.requestedByEmail ||
    data.companyEmail ||
    data.email ||
    ""
  )
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error("Company email is required.");
  }

  const existingQuery = query(
    collection(db, "verificationRequests"),
    where("requestedByEmail", "==", email),
    where("status", "==", "pending")
  );

  const existing = await getDocs(existingQuery);

  if (!existing.empty) {
    throw new Error("You already have a verification request under review.");
  }

  const ref = await addDoc(collection(db, "verificationRequests"), {
    ...data,
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
    requestedByEmail: email,
    companyEmail: data.companyEmail || email,
    status: "pending",
  };
}