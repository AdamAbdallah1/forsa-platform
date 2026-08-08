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
import { incrementPostMetric } from "./postService";

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

const sanitizeFirestoreObject = (data) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export async function saveJob({ userUid, userEmail, post }) {
  const uid = userUid || auth.currentUser?.uid;
  const email = userEmail || auth.currentUser?.email;

  if (!uid) {
    throw new Error("Authentication required to save job.");
  }

  if (!post?.id) {
    throw new Error("Post ID is required to save a job.");
  }

  const id = `${uid}_${post.id}`;
  const savedJobRef = doc(db, "savedJobs", id);

  // Check whether this user already saved this post.
  const existing = await getDocs(
    query(
      collection(db, "savedJobs"),
      where("userUid", "==", uid),
      where("postId", "==", post.id)
    )
  );

  // Already saved: do not increment the counter again.
  if (!existing.empty) {
    return {
      id,
      userUid: uid,
      userEmail: email || null,
      postId: post.id,
      post,
      alreadySaved: true,
    };
  }

  const safePost = sanitizeFirestoreObject(post);

  await setDoc(savedJobRef, {
    id,
    userUid: uid,
    userEmail: email || null,
    postId: post.id,
    post: safePost,
    savedAt: serverTimestamp(),
  });

  await incrementPostMetric(post.id, "saves", 1);

  return {
    id,
    userUid: uid,
    userEmail: email || null,
    postId: post.id,
    post,
    savedAt: new Date().toISOString(),
    alreadySaved: false,
  };
}

export async function unsaveJob({ userUid, postId }) {
  const uid = userUid || auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Authentication required to remove saved job.");
  }

  if (!postId) {
    throw new Error("Post ID is required to remove a saved job.");
  }

  const id = `${uid}_${postId}`;
  const savedJobRef = doc(db, "savedJobs", id);

  // Check whether this save actually exists.
  const existing = await getDocs(
    query(
      collection(db, "savedJobs"),
      where("userUid", "==", uid),
      where("postId", "==", postId)
    )
  );

  // Nothing was saved, so do not decrement the counter.
  if (existing.empty) {
    return;
  }

  await deleteDoc(savedJobRef);

  await incrementPostMetric(postId, "saves", -1);
}

export async function getUserSavedJobs(userUid) {
  const uid = userUid || auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Authentication required to load saved jobs.");
  }

  const q = query(
    collection(db, "savedJobs"),
    where("userUid", "==", uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      ...data,
      savedAt: toIso(data.savedAt),
    };
  });
}
