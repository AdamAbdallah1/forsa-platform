import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
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

/**
 * True when a notification targets the given user, by UID (connection
 * notifications) or by verified token email (legacy/application
 * notifications). Both identifiers are bound to the real recipient by the
 * create rules in firestore.rules, so either match proves ownership.
 */
export function notificationMatchesUser(item, { email, uid } = {}) {
  if (!item) return false;

  const target = String(item.targetEmail || "").trim().toLowerCase();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (target && cleanEmail && target === cleanEmail) return true;

  if (
    uid !== undefined &&
    uid !== null &&
    String(item.targetUid || "") === String(uid)
  ) {
    return true;
  }

  return false;
}

export async function createNotification(data) {
  const ref = await addDoc(collection(db, "notifications"), {
    ...data,
    targetEmail: String(data.targetEmail || "").trim().toLowerCase(),
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

export async function getUserNotifications({ email, uid } = {}) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  const queries = [];

  if (uid !== undefined && uid !== null) {
    queries.push(
      query(collection(db, "notifications"), where("targetUid", "==", uid))
    );
  }

  if (cleanEmail) {
    queries.push(
      query(
        collection(db, "notifications"),
        where("targetEmail", "==", cleanEmail)
      )
    );
  }

  if (queries.length === 0) return [];

  const snapshots = await Promise.all(queries.map((q) => getDocs(q)));

  const seen = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((item) => {
      if (seen.has(item.id)) return;

      const data = item.data();

      seen.set(item.id, {
        id: item.id,
        ...data,
        createdAt: toIso(data.createdAt),
      });
    });
  });

  return [...seen.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

export async function markNotificationRead(id) {
  await updateDoc(doc(db, "notifications", id), {
    read: true,
  });
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, "notifications", id));
}