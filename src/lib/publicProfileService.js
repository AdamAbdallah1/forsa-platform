import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import {
  buildPublicProfile,
  PUBLIC_PROFILE_COLLECTION,
} from "./publicProfileProjection";

export { buildPublicProfile };

/*
 * Public profile projections.
 *
 * The private users/{uid} document is restricted to its owner and admins
 * (see firestore.rules). Public surfaces — company directory, people
 * directory, public seeker profile, company profile — read whitelisted
 * fields from publicProfiles/{uid} instead.
 *
 * This service is the ONLY client-side writer path. It never copies email
 * (seekers), phone, CV URLs, or administrative fields into the public
 * document. The admin-side backfill script shares the same projection
 * builder (see publicProfileProjection.js).
 */

export { PUBLIC_PROFILE_COLLECTION };

/**
 * Publish/refresh the caller's own public profile projection.
 *
 * `extraFields` lets a partial caller (e.g. CV upload with only the
 * account object) override fields for this sync. The write is a merge of
 * whitelisted fields only, so it can never leak private data and never
 * deletes unrelated projection fields.
 */
export async function syncPublicProfile(user, extraFields) {
  if (!user || !user.uid) return;

  const source = extraFields ? { ...user, ...extraFields } : user;
  const payload = buildPublicProfile(source);

  if (Object.keys(payload).length === 0) return;

  await setDoc(doc(db, PUBLIC_PROFILE_COLLECTION, String(user.uid)), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function getPublicProfiles() {
  const snapshot = await getDocs(collection(db, PUBLIC_PROFILE_COLLECTION));

  return snapshot.docs.map((item) => ({
    uid: item.id,
    ...item.data(),
  }));
}

export async function getPublicProfile(uid) {
  if (!uid) return null;

  const snapshot = await getDoc(
    doc(db, PUBLIC_PROFILE_COLLECTION, String(uid))
  );

  if (!snapshot.exists()) return null;

  return {
    uid: snapshot.id,
    ...snapshot.data(),
  };
}