#!/usr/bin/env node
/*
 * One-time / repeatable backfill: create or refresh the intentionally-public
 * publicProfiles/{uid} projection for every existing user, using ONLY the
 * admin service account (server-side path, rules bypassed safely).
 *
 * Safety guarantees:
 *  - Reads users/{uid} and writes ONLY publicProfiles/{uid}.
 *  - Never modifies or deletes a users/{uid} document.
 *  - Uses the exact same projection whitelist as the client
 *    (src/lib/publicProfileProjection.js).
 *  - Never copies email (seekers), phone, CV URLs, or admin fields.
 *  - Idempotent: docs already matching the projection are skipped; reruns
 *    converge and never duplicate or corrupt data.
 *
 * Usage:
 *   node scripts/backfillPublicProfiles.js                # dry run (default)
 *   node scripts/backfillPublicProfiles.js --apply        # write
 *   node scripts/backfillPublicProfiles.js --apply --limit=50
 *   node scripts/backfillPublicProfiles.js --apply --uid=<UID>  # target specific user
 *   node scripts/backfillPublicProfiles.js --uid=<UID>        # dry run for specific user
 *
 * Requires the Firebase service account on the path used by the API layer:
 *   FIREBASE_SERVICE_ACCOUNT_JSON  or  FIREBASE_SERVICE_ACCOUNT_PATH
 * (dotenv loads .env.local; see api/_lib/forsa-server.js).
 */
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../api/_lib/forsa-server.js";
import { buildPublicProfile } from "../src/lib/publicProfileProjection.js";

const APPLY = process.argv.includes("--apply");

const LIMIT_ARG = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) || 0 : 0;

const UID_ARG = process.argv.find((arg) => arg.startsWith("--uid="));
const TARGET_UID = UID_ARG ? UID_ARG.split("=")[1] : null;

const PEOPLE_KEY_ORDER = [
  "uid",
  "accountType",
  "name",
  "username",
  "city",
  "companyName",
  "companyEmail",
  "email",
  "contactPerson",
  "companyBio",
  "website",
  "instagram",
  "headline",
  "bio",
  "availability",
  "skills",
  "lookingFor",
  "experience",
  "education",
  "portfolioLinks",
  "desiredRole",
  "opportunityType",
  "preferredLocation",
  "workPreference",
  "cvAvailable",
];

function normalize(value) {
  if (value === undefined || value === null) return value;

  if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date || typeof value.toDate === "function") {
    return `__ts__${value.toDate().toISOString()}`;
  }

  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalize(value[key]);
        return result;
      }, {});
  }

  return String(value);
}

function fingerprint(payload) {
  return PEOPLE_KEY_ORDER
    .filter((key) => payload[key] !== undefined)
    .map((key) => `${key}:${JSON.stringify(normalize(payload[key]))}`)
    .join("|");
}

async function flush(batch, size) {
  if (size === 0) return;

  if (APPLY) {
    await batch.commit();
  }
}

const usersRef = db.collection("users");
const profilesRef = db.collection("publicProfiles");

let scanned = 0;
let created = 0;
let updated = 0;
let skipped = 0;
let failed = 0;
let batch = db.batch();
let batchOps = 0;

const pack = (op) => {
  batch.set(op.ref, op.data);
  batchOps += 1;

  if (batchOps >= 400) {
    flush(batch, batchOps);
    batch = db.batch();
    batchOps = 0;
  }
};

async function run() {
  let userDocs = [];

  if (TARGET_UID) {
    const userDoc = await usersRef.doc(TARGET_UID).get();
    if (!userDoc.exists) {
      console.error(`User ${TARGET_UID} not found`);
      process.exitCode = 1;
      return;
    }
    userDocs = [userDoc];
  } else {
    const stream = usersRef.stream();
    for await (const userDoc of stream) {
      userDocs.push(userDoc);
    }
  }

  for (const userDoc of userDocs) {
    if (LIMIT > 0 && scanned >= LIMIT) break;

    scanned += 1;

    try {
      const data = userDoc.data() || {};
      const uid = data.uid || userDoc.id;

      if (!uid) {
        skipped += 1;
        continue;
      }

      const payload = buildPublicProfile({ ...data, uid });

      if (Object.keys(payload).length < 2) {
        skipped += 1;
        continue;
      }

      const existingRef = profilesRef.doc(String(uid));
      const existingSnap = await existingRef.get();
      const existing = existingSnap.exists ? existingSnap.data() : null;

      const nextFingerprint = fingerprint(payload);

      if (existing && fingerprint(existing) === nextFingerprint) {
        skipped += 1;
        continue;
      }

      pack({
        ref: existingRef,
        data: {
          ...payload,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });

      if (existing) updated += 1;
      else created += 1;
    } catch (error) {
      console.error(`Failed for ${userDoc.id}:`, error);
      failed += 1;
    }
  }

  await flush(batch, batchOps);

  console.log("");
  console.log(`MODE:            ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);
  console.log(`Users scanned:   ${scanned}`);
  console.log(`Projections:     ${created} created, ${updated} updated`);
  console.log(`Skipped:         ${skipped} (unchanged or empty profile)`);
  console.log(`Failed:          ${failed}`);
}

run().catch((error) => {
  console.error("Backfill failed:", error);
  process.exitCode = 1;
});