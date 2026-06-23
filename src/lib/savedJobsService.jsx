import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

export async function saveJob({ userUid, userEmail, post }) {
  const uid = userUid || auth.currentUser?.uid;
  const email = userEmail || auth.currentUser?.email;

  if (!uid) {
    throw new Error("Authentication required to save job.");
  }

  const id = `${uid}_${post.id}`;

  await setDoc(doc(db, "savedJobs", id), {
    id,
    userUid: uid,
    userEmail: email || null,
    postId: post.id,
    post,
    savedAt: serverTimestamp(),
  });

  return {
    id,
    userUid: uid,
    userEmail: email || null,
    postId: post.id,
    post,
    savedAt: new Date().toISOString(),
  };
}

export async function unsaveJob({ userUid, postId }) {
  const uid = userUid || auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Authentication required to remove saved job.");
  }

  const id = `${uid}_${postId}`;
  await deleteDoc(doc(db, "savedJobs", id));
}

export async function getUserSavedJobs(userUid) {
  const uid = userUid || auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Authentication required to load saved jobs.");
  }

  const q = query(collection(db, "savedJobs"), where("userUid", "==", uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      ...data,
      savedAt: toIso(data.savedAt),
    };
  });
}