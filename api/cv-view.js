import {
  authenticate,
  db,
  getUser,
  CV_MAX_BYTES,
  isOwnKey,
  objectMeta,
  presignGet,
} from "./_lib/forsa-server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const decoded = await authenticate(req);

    const { objectKey, applicationId } = req.body || {};

    if (typeof objectKey !== "string" || !objectKey) {
      return res.status(400).json({
        error: "Missing CV reference.",
      });
    }

    let allowed = false;

    /* The CV owner can always view their own CV. */

    if (isOwnKey(objectKey, decoded.uid)) {
      const user = await getUser(decoded.uid);

      allowed =
        !!user &&
        user.cv?.storage === "r2" &&
        user.cv.objectKey === objectKey;
    }

    /* An application participant (owner or applicant) can view a CV
       that is attached to that application. */

    if (!allowed && applicationId) {
      const snap = await db
        .collection("applications")
        .doc(String(applicationId))
        .get();

      if (snap.exists) {
        const item = snap.data();

        const isParticipant =
          item.ownerUid === decoded.uid ||
          item.seeker?.uid === decoded.uid;

        if (isParticipant) {
          const embeddedCvs = [
            item.cv,
            ...(item.conversation || []).map((message) => message?.cv),
          ].filter(Boolean);

          allowed = embeddedCvs.some(
            (cv) =>
              cv.storage === "r2" && cv.objectKey === objectKey
          );
        }
      }
    }

    if (!allowed) {
      return res.status(403).json({
        error: "You are not allowed to view this CV.",
      });
    }

    let meta;

    try {
      meta = await objectMeta(objectKey);
    } catch {
      return res.status(404).json({
        error: "CV not found.",
      });
    }

    if (
      meta.contentType !== "application/pdf" ||
      meta.size > CV_MAX_BYTES
    ) {
      return res.status(400).json({
        error: "Invalid CV file.",
      });
    }

    const viewUrl = await presignGet(objectKey);

    return res.status(200).json({
      viewUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("CV view endpoint failed:", error);

    const status = error.status || 500;

    return res.status(status).json({
      error: error.message || "Internal server error.",
    });
  }
}