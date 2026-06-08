import { deleteUser } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";

async function deleteQueryResults(collectionName, field, value) {
  if (!value) return;

  const q = query(collection(db, collectionName), where(field, "==", value));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.docs.forEach((item) => batch.delete(item.ref));

  if (!snap.empty) await batch.commit();
}

export async function deleteCurrentAccount(account) {
  const uid = account?.uid;
  const email = String(account?.email || "").trim().toLowerCase();

  if (!uid) throw new Error("Missing account ID.");

  await Promise.all([
    deleteQueryResults("posts", "ownerUid", uid),
    deleteQueryResults("applications", "ownerUid", uid),
    deleteQueryResults("applications", "seeker.uid", uid),
    deleteQueryResults("savedJobs", "userUid", uid),
    deleteQueryResults("notifications", "targetEmail", email),
    deleteQueryResults("connections", "fromUid", uid),
    deleteQueryResults("connections", "toUid", uid),
    deleteQueryResults("verificationRequests", "uid", uid),
    deleteQueryResults("verificationRequests", "requestedByUid", uid),
  ]);

  await deleteDoc(doc(db, "users", uid));

  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No authenticated user found.");

  await deleteUser(currentUser);

  localStorage.clear();
}