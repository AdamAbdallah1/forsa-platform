import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notificationService";

export const connectionId = (fromUid, toUid) => `${fromUid}_${toUid}`;

export async function followUser({ fromUser, toUser }) {
  if (!fromUser?.uid || !toUser?.uid) throw new Error("Missing user information.");
  if (fromUser.uid === toUser.uid) throw new Error("You cannot connect with yourself.");

  const id = connectionId(fromUser.uid, toUser.uid);

  await setDoc(doc(db, "connections", id), {
    id,
    fromUid: fromUser.uid,
    fromName: fromUser.name || "User",
    fromEmail: String(fromUser.email || "").toLowerCase(),
    toUid: toUser.uid,
    toName: toUser.name || "User",
    toEmail: String(toUser.email || "").toLowerCase(),
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    type: "connection_request",
    title: "Connection request",
    text: `${fromUser.name || "Someone"} wants to connect with you.`,
    targetEmail: String(toUser.email || "").toLowerCase(),
    actionUrl: `/seeker/${fromUser.uid}`,
    connectionId: id,
    fromUid: fromUser.uid,
    fromName: fromUser.name || "User",
  });

  return id;
}

export async function acceptConnection(id, currentUser) {
  await updateDoc(doc(db, "connections", id), {
    status: "accepted",
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const snap = await getDocs(
    query(collection(db, "connections"), where("id", "==", id))
  );

  const connection = snap.docs[0]?.data();

  if (connection?.fromEmail) {
    await createNotification({
      type: "connection_accepted",
      title: "Connection accepted",
      text: `${currentUser?.name || "Someone"} accepted your connection request.`,
      targetEmail: String(connection.fromEmail).toLowerCase(),
      actionUrl: `/seeker/${currentUser?.uid}`,
      connectionId: id,
    });
  }
}

export async function rejectConnection(id) {
  await deleteDoc(doc(db, "connections", id));
}

export async function unfollowUser({ fromUid, toUid }) {
  await deleteDoc(doc(db, "connections", connectionId(fromUid, toUid)));
}

export async function getFollowing(uid) {
  const q = query(
    collection(db, "connections"),
    where("fromUid", "==", uid),
    where("status", "==", "accepted")
  );
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getFollowers(uid) {
  const q = query(
    collection(db, "connections"),
    where("toUid", "==", uid),
    where("status", "==", "accepted")
  );
  const snap = await getDocs(q);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getConnectionStatus(fromUid, toUid) {
  const snap = await getDocs(
    query(
      collection(db, "connections"),
      where("fromUid", "==", fromUid),
      where("toUid", "==", toUid)
    )
  );

  if (snap.empty) return "none";
  return snap.docs[0].data().status || "pending";
}

export async function isFollowing(fromUid, toUid) {
  return (await getConnectionStatus(fromUid, toUid)) === "accepted";
}