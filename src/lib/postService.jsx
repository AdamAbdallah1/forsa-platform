import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export async function createPost(postData) {
  const cleanPost = {
    ...postData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "active",
  };

  const ref = await addDoc(collection(db, "posts"), cleanPost);

  return {
    id: ref.id,
    ...postData,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function getActivePosts() {
  const q = query(
    collection(db, "posts"),
    where("status", "!=", "closed"),
    orderBy("status"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}