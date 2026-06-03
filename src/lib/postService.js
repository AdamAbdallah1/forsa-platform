import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export async function createPost(postData) {
  const docRef = await addDoc(collection(db, "posts"), {
    ...postData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "active",
  });

  return {
    id: docRef.id,
    ...postData,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getActivePosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        id: item.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    })
    .filter((post) => post.status !== "closed");
}

export async function getPostsByOwner({ uid, email, name }) {
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
    const data = item.data();
    unique.set(item.id, {
      id: item.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    });
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

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}