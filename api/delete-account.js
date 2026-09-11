import {
  adminAuth,
  authenticateFresh,
  db,
  deleteObject,
  isOwnKey,
  listUidObjects,
} from "./_lib/forsa-server.js";

/*
 * DELETE ACCOUNT ENDPOINT
 *
 * Server-orchestrated account deletion. The client never issues Firestore or
 * Auth deletions for account deletion; it only supplies a just-reauthenticated
 * ID token. The authenticated UID is derived exclusively from the verified
 * token — the request body is never trusted for identity.
 *
 * Ordering (all UID-scoped):
 *   1. Fresh authentication (auth_time within 5 minutes).
 *   2. Per-UID concurrency lock (deletionLocks/{uid}).
 *   3. Read the identity document and collect R2 CV object keys BEFORE any
 *      reference to those objects is deleted.
 *   4. Idempotent fast path: identity document already gone -> finish R2 +
 *      Auth cleanup, report alreadyDeleted.
 *   5. Firestore deletion scoped to this UID (admin SDK bypasses rules).
 *   6. R2 deletion: collected keys + stale/replaced keys under cvs/{uid}/.
 *   7. Username mapping, only if it points at this UID.
 *   8. users/{uid} then Firebase Auth deletion LAST, only after all required
 *      Firestore and R2 cleanup succeeded.
 *
 * Partial failures are reported honestly (no success:true) and the operation
 * is safely retryable: every step is idempotent.
 */

const BATCH_LIMIT = 500;
const LOCK_TTL_MS = 10 * 60 * 1000;

function addOwnR2Cv(uid, cvKeys, maybeCv) {
  if (
    maybeCv &&
    maybeCv.storage === "r2" &&
    typeof maybeCv.objectKey === "string" &&
    isOwnKey(maybeCv.objectKey, uid)
  ) {
    cvKeys.add(maybeCv.objectKey);
  }
}

async function applicationsOf(uid) {
  const byOwner = await db
    .collection("applications")
    .where("ownerUid", "==", uid)
    .get();

  const bySeeker = await db
    .collection("applications")
    .where("seeker.uid", "==", uid)
    .get();

  const refs = new Map();

  [...byOwner.docs, ...bySeeker.docs].forEach((doc) =>
    refs.set(doc.ref.path, doc)
  );

  return [...refs.values()];
}

function collectApplicationCvKeys(uid, cvKeys, appData) {
  addOwnR2Cv(uid, cvKeys, appData.cv);

  const conversation = Array.isArray(appData.conversation)
    ? appData.conversation
    : [];

  conversation.forEach((message) => {
    if (message && typeof message === "object") {
      addOwnR2Cv(uid, cvKeys, message.cv);
    }
  });
}

async function batchDelete(refs) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = db.batch();

    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));

    await batch.commit();
  }
}

async function deleteWhere(collectionName, field, value) {
  const snap = await db
    .collection(collectionName)
    .where(field, "==", value)
    .get();

  await batchDelete(snap.docs.map((doc) => doc.ref));
}

/*
 * Notifications addressed to this account: any notification whose target is
 * this UID or an email this account owns. Notifications this account SENT to
 * others are left alone (they belong to the other user's inbox).
 */
async function deleteUserNotifications(uid, emailCandidates) {
  const refs = new Map();

  for (const email of emailCandidates) {
    if (!email) continue;

    const snap = await db
      .collection("notifications")
      .where("targetEmail", "==", email)
      .get();

    snap.docs.forEach((doc) => refs.set(doc.ref.path, doc.ref));
  }

  const byUid = await db
    .collection("notifications")
    .where("targetUid", "==", uid)
    .get();

  byUid.docs.forEach((doc) => refs.set(doc.ref.path, doc.ref));

  await batchDelete([...refs.values()]);
}

async function deleteUidR2Objects(uid, cvKeys) {
  for (const key of cvKeys) {
    await deleteObject(key);
  }

  /*
   * Sweep for stale/replaced CVs. Listing requires s3:ListBucket on the R2
   * credential; if the credential lacks it, continue with the required
   * collected keys rather than aborting the whole deletion.
   */
  let staleKeys = [];

  try {
    staleKeys = await listUidObjects(uid);
  } catch (error) {
    console.error(
      "R2 CV enumeration failed; continuing with collected keys:",
      error
    );
  }

  for (const key of staleKeys) {
    if (!cvKeys.has(key)) {
      await deleteObject(key);
    }
  }
}

async function deleteAuthAccount(uid) {
  try {
    await adminAuth.deleteUser(uid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      throw error;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    /*
     * 1) Fresh authentication is enforced before ANY destructive work. The
     *    auth_time comes from the verified ID token, never the client.
     */
    const decoded = await authenticateFresh(req, 5 * 60);

    const uid = String(decoded.uid || "");

    if (!uid) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        error: "Unauthorized.",
      });
    }

    /*
     * 2) Server-side concurrency lock, strictly scoped to this UID. Created
     *    with create-only semantics so simultaneous requests for the same
     *    account cannot both proceed.
     */
    const lockRef = db.collection("deletionLocks").doc(uid);

    const lockSnap = await lockRef.get();

    if (lockSnap.exists) {
      const data = lockSnap.data() || {};

      const startedMs = data.startedAt?.toMillis
        ? data.startedAt.toMillis()
        : new Date(String(data.startedAt || 0)).getTime();

      if (Date.now() - startedMs < LOCK_TTL_MS) {
        return res.status(409).json({
          success: false,
          code: "DELETION_IN_PROGRESS",
          error:
            "A deletion for this account is already in progress. Please try again in a few minutes.",
        });
      }

      await lockRef.delete().catch(() => {});
    }

    try {
      await lockRef.create({ uid, startedAt: new Date() });
    } catch {
      return res.status(409).json({
        success: false,
        code: "DELETION_IN_PROGRESS",
        error:
          "A deletion for this account is already in progress. Please try again in a few minutes.",
      });
    }

    try {
      /*
       * 3) Read the identity document and collect every R2 object key the
       *    account references BEFORE any of those references are deleted.
       */
      const userSnap = await db.collection("users").doc(uid).get();

      const userData = userSnap.exists ? userSnap.data() : null;

      const cvKeys = new Set();
      const emailCandidates = new Set();

      if (userData) {
        addOwnR2Cv(uid, cvKeys, userData.cv);
        addOwnR2Cv(uid, cvKeys, userData.publicCv);

        const userEmail = String(userData.email || "")
          .trim()
          .toLowerCase();

        if (userEmail) {
          emailCandidates.add(userEmail);
        }
      }

      const tokenEmail = String(decoded.email || "")
        .trim()
        .toLowerCase();

      if (tokenEmail) {
        emailCandidates.add(tokenEmail);
      }

      const applications = await applicationsOf(uid);

      applications.forEach((doc) =>
        collectApplicationCvKeys(uid, cvKeys, doc.data() || {})
      );

      /*
       * 4) Idempotent fast path: the identity document is already gone, so
       *    nothing else remains to delete in Firestore. Finish R2 + Auth
       *    cleanup so a partial retry converges to fully deleted.
       */
      if (!userData) {
        await deleteUidR2Objects(uid, cvKeys);

        await deleteAuthAccount(uid);

        return res.status(200).json({
          success: true,
          alreadyDeleted: true,
        });
      }

      /*
       * 5) Firestore deletion, scoped strictly to this UID.
       */
      await deleteWhere("posts", "ownerUid", uid);

      await batchDelete(applications.map((doc) => doc.ref));

      await deleteWhere("savedJobs", "userUid", uid);

      await deleteWhere("applyClicks", "userUid", uid);

      await deleteUserNotifications(uid, emailCandidates);

      await deleteWhere("connections", "fromUid", uid);
      await deleteWhere("connections", "toUid", uid);

      await deleteWhere("verificationRequests", "uid", uid);

      /*
       * 6) R2 cleanup: collected CVs plus stale/replaced objects still
       *    under cvs/{uid}/.
       */
      await deleteUidR2Objects(uid, cvKeys);

      /*
       * 7) Username mapping, only if it belongs to this UID.
       */
      const usernameLower = String(userData.usernameLower || "")
        .trim()
        .toLowerCase();

      if (usernameLower) {
        const mappingSnap = await db
          .collection("usernames")
          .doc(usernameLower)
          .get();

        if (
          mappingSnap.exists &&
          mappingSnap.data().uid === uid
        ) {
          await db.collection("usernames").doc(usernameLower).delete();
        }
      }

      /*
       * 8) Identity last: profile document, then the Firebase Auth account.
       *    Auth deletion only happens after all required Firestore and R2
       *    cleanup succeeded.
       */
      await db.collection("users").doc(uid).delete();

      await deleteAuthAccount(uid);

      return res.status(200).json({
        success: true,
        alreadyDeleted: false,
      });
    } finally {
      await lockRef.delete().catch(() => {});
    }
  } catch (error) {
    console.error("Account deletion endpoint failed:", error);

    const status = error.status || 500;

    const code =
      error.code === "REAUTH_REQUIRED" ||
      error.code === "DELETION_IN_PROGRESS"
        ? error.code
        : "DELETION_FAILED";

    const message =
      code === "DELETION_FAILED"
        ? "Account deletion could not be completed. Please try again."
        : error.message;

    return res.status(status).json({
      success: false,
      code,
      error: message,
    });
  }
}