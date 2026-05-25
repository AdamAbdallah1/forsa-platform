import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export async function createPost(postData) {
  const docRef = await addDoc(collection(db, "posts"), {
    ...postData,
    createdAt: serverTimestamp(),
    status: "active",
  });

  return {
    id: docRef.id,
    ...postData,
    status: "active",
  };
}