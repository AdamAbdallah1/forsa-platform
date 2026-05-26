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

const toIso = (value) => {
  if (!value) return new Date().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return value;
};

export async function createNotification(data) {
  const ref = await addDoc(collection(db, "notifications"), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });

  return {
    id: ref.id,
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export async function getUserNotifications(email) {
  const q = query(
    collection(db, "notifications"),
    where("targetEmail", "==", email),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => {
    const data = item.data();

    return {
      id: item.id,
      ...data,
      createdAt: toIso(data.createdAt),
    };
  });
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, "notifications", id));
}