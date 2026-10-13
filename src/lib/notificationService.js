import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
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

/**
 * Real-time listener for a user's notifications.
 * Returns unsubscribe function.
 * Queries without orderBy to avoid composite index requirements; sorts in memory.
 */
export function listenUserNotifications(
  { email, uid } = {},
  onChange,
  onError
) {
  if (!email && !uid) {
    onChange([]);
    return () => {};
  }

  const cleanEmail = String(email || "").trim().toLowerCase();
  const queries = [];

  if (uid !== undefined && uid !== null) {
    queries.push(
      query(
        collection(db, "notifications"),
        where("targetUid", "==", uid),
        limit(100)
      )
    );
  }

  if (cleanEmail) {
    queries.push(
      query(
        collection(db, "notifications"),
        where("targetEmail", "==", cleanEmail),
        limit(100)
      )
    );
  }

  if (queries.length === 0) {
    onChange([]);
    return () => {};
  }

  const seen = new Map();
  let hasEmittedInitial = false;
  let queryErrorCount = 0;

  const unsubscribes = queries.map((q, queryIndex) => {
    return onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          const normalized = {
            id: change.doc.id,
            ...data,
            createdAt: toIso(data.createdAt),
          };
          if (change.type === "removed") {
            seen.delete(change.doc.id);
          } else {
            seen.set(change.doc.id, normalized);
          }
        });
        if (hasEmittedInitial) {
          const notifications = [...seen.values()].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
          onChange(notifications);
        }
      },
      (error) => {
        // Log each query's error individually but don't break other queries
        console.error(`Notifications query ${queryIndex} error:`, error);
        queryErrorCount++;
        if (onError && queryErrorCount === queries.length) {
          // Only call onError if ALL queries have failed
          onError(error);
        }
      }
    );
  });

  // Initial emit after all listeners have fired once
  // Use a timeout to allow initial snapshots to arrive
  setTimeout(() => {
    if (!hasEmittedInitial) {
      hasEmittedInitial = true;
      const notifications = [...seen.values()].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      onChange(notifications);
    }
  }, 500);

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

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

/**
 * Mark all unread "new_message" notifications for a specific application/thread as read.
 * Called when user opens a conversation to clear the unread badge.
 */
export async function markThreadNotificationsRead({ applicationId, email, uid } = {}) {
  if (!applicationId || (!email && !uid)) return;

  const cleanEmail = String(email || "").trim().toLowerCase();

  const queries = [];

  if (uid !== undefined && uid !== null) {
    queries.push(
      query(
        collection(db, "notifications"),
        where("targetUid", "==", uid),
        where("applicationId", "==", applicationId),
        where("type", "==", "new_message"),
        where("read", "==", false)
      )
    );
  }

  if (cleanEmail) {
    queries.push(
      query(
        collection(db, "notifications"),
        where("targetEmail", "==", cleanEmail),
        where("applicationId", "==", applicationId),
        where("type", "==", "new_message"),
        where("read", "==", false)
      )
    );
  }

  if (queries.length === 0) return;

  try {
    const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
    const batch = [];

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        if (!batch.some((b) => b.id === docSnap.id)) {
          batch.push(docSnap);
        }
      });
    });

    await Promise.all(
      batch.map((docSnap) =>
        updateDoc(doc(db, "notifications", docSnap.id), { read: true })
      )
    );
  } catch (error) {
    console.error("markThreadNotificationsRead error:", error);
  }
}