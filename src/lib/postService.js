import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const toIso = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

const normalizePost = (item) => {
  const data = item.data();

  return {
    id: item.id,
    ...data,
    createdAt: toIso(data.createdAt) || data.createdAt || new Date().toISOString(),
    updatedAt: toIso(data.updatedAt) || data.updatedAt || data.createdAt || new Date().toISOString(),
  };
};

const isAgencyOrAbroad = (postData) => {
  const country = String(postData.workCountry || "Lebanon").toLowerCase();

  return (
    postData.postSource === "agency" ||
    postData.sourceType === "agency" ||
    postData.category === "Recruitment Agency" ||
    postData.type === "Recruitment Agency" ||
    country !== "lebanon"
  );
};

export async function createPost(postData) {
  const needsReview = isAgencyOrAbroad(postData);

  const payload = {
    ...postData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    views: Number(postData.views || 0),
    saves: Number(postData.saves || 0),
    shares: Number(postData.shares || 0),
    reports: Number(postData.reports || 0),
    status: needsReview ? "closed" : "active",
    reviewStatus: needsReview ? "pending" : "approved",
    moderationStatus: needsReview ? "pending" : "approved",
    safetyStatus: "clear",
    featured: needsReview ? false : Boolean(postData.featured),
  };

  const docRef = await addDoc(collection(db, "posts"), payload);

  return {
    id: docRef.id,
    ...postData,
    status: payload.status,
    reviewStatus: payload.reviewStatus,
    moderationStatus: payload.moderationStatus,
    safetyStatus: payload.safetyStatus,
    featured: payload.featured,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function incrementPostMetric(postId, field, delta = 1) {
  if (!postId || !field) return;
  const valid = ["views", "shares", "applications", "saves", "reports"];
  if (!valid.includes(field)) return;

  const postRef = doc(db, "posts", postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) return;

  await updateDoc(postRef, {
    [field]: increment(delta),
    updatedAt: serverTimestamp(),
  });
}

export async function recordApplyClick({ postId, uid, method = "forsa" }) {
  if (!postId || !uid) return false;

  const normalizedPostId = String(postId);
  const clickDocId = `${uid}_${normalizedPostId}`;
  const clickRef = doc(db, "applyClicks", clickDocId);

  try {
    await runTransaction(db, async (tx) => {
      const existingClick = await tx.get(clickRef);

      if (existingClick.exists()) {
        return false;
      }

      tx.set(clickRef, {
        userUid: uid,
        postId: normalizedPostId,
        method,
        clickedAt: serverTimestamp(),
      });

      tx.update(doc(db, "posts", normalizedPostId), {
        applyClicks: increment(1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Could not record apply click:", error);
    return false;
  }

  return true;
}

export async function getActivePosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(normalizePost)
    .filter(
      (post) =>
        post.status !== "closed" &&
        (post.reviewStatus || "approved") !== "pending" &&
        (post.moderationStatus || "approved") !== "pending" &&
        (post.reviewStatus || "approved") !== "rejected" &&
        (post.moderationStatus || "approved") !== "rejected"
    );
}

export async function getPostById(postId) {
  if (!postId) return null;

  const snapshot = await getDoc(doc(db, "posts", postId));

  if (!snapshot.exists()) return null;

  const post = normalizePost(snapshot);

  const isVisible =
    post.status !== "closed" &&
    (post.reviewStatus || "approved") !== "pending" &&
    (post.moderationStatus || "approved") !== "pending" &&
    (post.reviewStatus || "approved") !== "rejected" &&
    (post.moderationStatus || "approved") !== "rejected";

  return isVisible ? post : null;
}

export async function getAdminPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizePost);
}

export async function getPostsByOwner({ uid }) {
  if (!uid) return [];

  const postsRef = collection(db, "posts");

  const snapshot = await getDocs(
    query(postsRef, where("ownerUid", "==", uid))
  );

  return snapshot.docs
    .map(normalizePost)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
}

export async function updatePost(postId, data) {
  await updateDoc(doc(db, "posts", postId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function approvePost(postId) {
  await updatePost(postId, {
    status: "active",
    reviewStatus: "approved",
    moderationStatus: "approved",
    safetyStatus: "clear",
    suspicious: false,
  });
}

export async function rejectPost(postId) {
  await updatePost(postId, {
    status: "closed",
    reviewStatus: "rejected",
    moderationStatus: "rejected",
    featured: false,
  });
}

export async function markPostSuspicious(postId) {
  await updatePost(postId, {
    safetyStatus: "suspicious",
    suspicious: true,
    featured: false,
  });
}

export async function featurePost(postId, featured = true) {
  await updatePost(postId, {
    featured,
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}