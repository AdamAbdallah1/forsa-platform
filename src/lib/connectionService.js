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
import { db } from "./firebase";

export const connectionId = (fromUid, toUid) => `${fromUid}_${toUid}`;

export async function followUser({ fromUser, toUser }) {
  if (!fromUser?.uid || !toUser?.uid) {
    throw new Error("Missing user information.");
  }

  if (fromUser.uid === toUser.uid) {
    throw new Error("You cannot connect with yourself.");
  }

  const id = connectionId(fromUser.uid, toUser.uid);

  await setDoc(doc(db, "connections", id), {
    id,
    fromUid: fromUser.uid,
    fromName: fromUser.name || "User",
    fromEmail: fromUser.email || "",
    toUid: toUser.uid,
    toName: toUser.name || "User",
    toEmail: toUser.email || "",
    status: "following",
    createdAt: serverTimestamp(),
  });

  return id;
}

export async function unfollowUser({ fromUid, toUid }) {
  await deleteDoc(doc(db, "connections", connectionId(fromUid, toUid)));
}

export async function getFollowing(uid) {
  const q = query(collection(db, "connections"), where("fromUid", "==", uid));
  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getFollowers(uid) {
  const q = query(collection(db, "connections"), where("toUid", "==", uid));
  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function isFollowing(fromUid, toUid) {
  const snap = await getDocs(
    query(
      collection(db, "connections"),
      where("fromUid", "==", fromUid),
      where("toUid", "==", toUid)
    )
  );

  return !snap.empty;
}