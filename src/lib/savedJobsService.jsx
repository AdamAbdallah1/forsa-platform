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
import { db } from "./firebase";

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

export async function saveJob({ userUid, userEmail, post }) {
  const id = `${userUid}_${post.id}`;

  await setDoc(doc(db, "savedJobs", id), {
    id,
    userUid,
    userEmail,
    postId: post.id,
    post,
    savedAt: serverTimestamp(),
  });

  return {
    id,
    userUid,
    userEmail,
    postId: post.id,
    post,
    savedAt: new Date().toISOString(),
  };
}

export async function unsaveJob({ userUid, postId }) {
  const id = `${userUid}_${postId}`;
  await deleteDoc(doc(db, "savedJobs", id));
}

export async function getUserSavedJobs(userUid) {
  const q = query(collection(db, "savedJobs"), where("userUid", "==", userUid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      ...data,
      savedAt: toIso(data.savedAt),
    };
  });
}