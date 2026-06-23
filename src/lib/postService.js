import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
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

  await updateDoc(doc(db, "posts", postId), {
    [field]: increment(delta),
    updatedAt: serverTimestamp(),
  });
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

export async function getAdminPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizePost);
}

export async function getPostsByOwner({ uid, email }) {
  const postsRef = collection(db, "posts");
  const results = [];

  if (uid) {
    const uidSnap = await getDocs(query(postsRef, where("ownerUid", "==", uid)));
    results.push(...uidSnap.docs);
  }

  if (email) {
    const emailSnap = await getDocs(query(postsRef, where("ownerEmail", "==", email)));
    results.push(...emailSnap.docs);
  }

  const unique = new Map();

  results.forEach((item) => {
    unique.set(item.id, normalizePost(item));
  });

  return Array.from(unique.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
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