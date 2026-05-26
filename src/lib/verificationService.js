import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export async function createVerificationRequest(data) {
  const ref = await addDoc(collection(db, "verificationRequests"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    ...data,
    status: "pending",
  };
}