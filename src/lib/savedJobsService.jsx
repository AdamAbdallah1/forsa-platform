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

// ============================================================
// HELPERS
// ============================================================

const getAuthenticatedUid = () => {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Authentication required.");
  }

  return uid;
};

const getAuthenticatedEmail = () => {
  return auth.currentUser?.email || null;
};

const toIso = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

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

// ============================================================
// SAVE JOB
// ============================================================

export async function saveJob({ post }) {
  const uid = getAuthenticatedUid();
  const email = getAuthenticatedEmail();

  if (!post?.id) {
    throw new Error("Post ID is required to save a job.");
  }

  const postId = String(post.id);
  const savedJobId = `${uid}_${postId}`;

  const savedJobRef = doc(
    db,
    "savedJobs",
    savedJobId
  );

  // Check whether this user already saved this post.
  const existingQuery = query(
    collection(db, "savedJobs"),
    where("userUid", "==", uid),
    where("postId", "==", postId)
  );

  const existingSnapshot = await getDocs(existingQuery);

  // Already saved.
  if (!existingSnapshot.empty) {
    const existingDoc = existingSnapshot.docs[0];

    return {
      id: existingDoc.id,
      userUid: uid,
      userEmail: email,
      postId,
      post: existingDoc.data().post || post,
      savedAt: toIso(existingDoc.data().savedAt),
      alreadySaved: true,
    };
  }

  const safePost = sanitizeFirestoreObject(post);

  await setDoc(savedJobRef, {
    id: savedJobId,
    userUid: uid,
    userEmail: email,
    postId,
    post: safePost,
    savedAt: serverTimestamp(),
  });

  await incrementPostMetric(
    postId,
    "saves",
    1
  );

  return {
    id: savedJobId,
    userUid: uid,
    userEmail: email,
    postId,
    post,
    savedAt: new Date().toISOString(),
    alreadySaved: false,
  };
}

// ============================================================
// REMOVE SAVED JOB
// ============================================================

export async function unsaveJob({ postId }) {
  const uid = getAuthenticatedUid();

  if (!postId) {
    throw new Error(
      "Post ID is required to remove a saved job."
    );
  }

  const normalizedPostId = String(postId);

  // Find the actual saved-job document belonging
  // to the currently authenticated Firebase user.
  const savedJobsQuery = query(
    collection(db, "savedJobs"),
    where("userUid", "==", uid),
    where("postId", "==", normalizedPostId)
  );

  const snapshot = await getDocs(savedJobsQuery);

  // Nothing exists.
  if (snapshot.empty) {
    return {
      removed: false,
      reason: "not-found",
    };
  }

  // Delete every matching document.
  // Normally there should only be one because saveJob()
  // uses `${uid}_${postId}` as the document ID.
  await Promise.all(
    snapshot.docs.map((savedJobDoc) =>
      deleteDoc(savedJobDoc.ref)
    )
  );

  // Decrement the saves counter only when something
  // was actually removed.
  await incrementPostMetric(
    normalizedPostId,
    "saves",
    -1
  );

  return {
    removed: true,
  };
}

// ============================================================
// GET USER SAVED JOBS
// ============================================================

export async function getUserSavedJobs(userUid) {
  const authenticatedUid = getAuthenticatedUid();

  // Do not allow the caller to read another user's saves.
  if (
    userUid &&
    String(userUid) !== String(authenticatedUid)
  ) {
    throw new Error(
      "You can only access your own saved jobs."
    );
  }

  const q = query(
    collection(db, "savedJobs"),
    where(
      "userUid",
      "==",
      authenticatedUid
    )
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      ...data,
      id: item.id,
      savedAt: toIso(data.savedAt),
    };
  });
}