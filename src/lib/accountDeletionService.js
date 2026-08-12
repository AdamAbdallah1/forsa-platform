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

  console.log(`[ACCOUNT DELETE] Checking ${collectionName}.${field}`);

  const q = query(
    collection(db, collectionName),
    where(field, "==", value)
  );

  const snap = await getDocs(q);

  console.log(
    `[ACCOUNT DELETE] ${collectionName}.${field}: ${snap.size} documents`
  );

  if (snap.empty) return;

  const batch = writeBatch(db);

  snap.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  await batch.commit();

  console.log(
    `[ACCOUNT DELETE] Deleted ${snap.size} documents from ${collectionName}`
  );
}

export async function deleteCurrentAccount(account) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No authenticated user found.");
  }

  const uid = currentUser.uid;
  const email = String(currentUser.email || "").trim().toLowerCase();

  if (!uid) {
    throw new Error("Missing account ID.");
  }

  console.log("[ACCOUNT DELETE] Starting account deletion:", {
    uid,
    email,
  });

  // Delete user's posts.
  await deleteQueryResults("posts", "ownerUid", uid);

  // Delete applications owned by the hiring account.
  await deleteQueryResults("applications", "ownerUid", uid);

  // Delete applications created by the seeker.
  await deleteQueryResults("applications", "seeker.uid", uid);

  // Delete saved jobs.
  await deleteQueryResults("savedJobs", "userUid", uid);

  // Delete notifications belonging to this email.
  await deleteQueryResults("notifications", "targetEmail", email);

  // Delete connections.
  await deleteQueryResults("connections", "fromUid", uid);
  await deleteQueryResults("connections", "toUid", uid);

  // Delete verification requests.
  await deleteQueryResults("verificationRequests", "uid", uid);

  // Delete Firestore user profile.
  console.log("[ACCOUNT DELETE] Deleting users/" + uid);

  await deleteDoc(doc(db, "users", uid));

  console.log("[ACCOUNT DELETE] Firestore deletion complete.");

  // Finally delete Firebase Authentication account.
  console.log("[ACCOUNT DELETE] Deleting Firebase Auth account.");

  await deleteUser(currentUser);

  console.log("[ACCOUNT DELETE] Firebase Auth account deleted.");

  localStorage.clear();
}
