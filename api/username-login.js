import {
  adminAuth,
  db,
  getWebApiKey,
  rateLimit,
} from "./_lib/forsa-server.js";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/*
 * Sentinel used only to equalize work when a username does not exist, so
 * unknown usernames are indistinguishable from an incorrect password.
 * No real account may be created at this address.
 */
const SENTINEL_EMAIL = "no-account@forsa.invalid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const password = String(req.body?.password || "");

  try {
    const raw = String(req.body?.username || "").trim();
    const lower = raw.toLowerCase();

    rateLimit(req, lower);

    /*
     * Uniformly reject bad usernames, missing/oversized passwords, and
     * bad credentials with the same response so nothing is disclosed.
     */
    if (
      !USERNAME_RE.test(lower) ||
      !password ||
      password.length > 4096
    ) {
      return res.status(200).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    /*
     * Resolve the username to its owning account.
     *
     * The mapping and the owner's profile are cross-checked so a forged
     * mapping (already prevented by Firestore rules) could never resolve
     * to an account that does not own this username.
     */
    let uid = null;

    const mappingSnap = await db
      .doc(`usernames/${lower}`)
      .get();

    if (mappingSnap.exists) {
      const mappedUid = mappingSnap.data().uid;

      if (typeof mappedUid === "string" && mappedUid) {
        const userSnap = await db
          .doc(`users/${mappedUid}`)
          .get();

        if (
          userSnap.exists &&
          userSnap.data().usernameLower === lower
        ) {
          uid = mappedUid;
        }
      }
    }

    /*
     * Authenticate against Firebase exactly once, whether or not the
     * username exists, so the endpoint cannot be used as a timing oracle.
     */
    let targetEmail = SENTINEL_EMAIL;

    if (uid) {
      const record = await adminAuth.getUser(uid);

      const email = record.email
        ? String(record.email).trim().toLowerCase()
        : null;

      if (email) {
        targetEmail = email;
      } else {
        uid = null;
      }
    }

    const apiKey = getWebApiKey();

    const authResponse = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: targetEmail,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const authBody = await authResponse.json();

    if (!authResponse.ok || !authBody || !authBody.idToken) {
      return res.status(200).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    const payload = await adminAuth.verifyIdToken(
      authBody.idToken
    );

    /*
     * The account that just authenticated must be the one that owned the
     * username. The email is never returned to the client.
     */
    if (!uid || payload.uid !== uid) {
      return res.status(200).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    if (payload.email_verified !== true) {
      return res.status(200).json({
        error: "EMAIL_NOT_VERIFIED",
      });
    }

    /*
     * The client SDK signs in with this token, which establishes the same
     * session as the email/password path without ever exposing the email.
     */
    const customToken = await adminAuth.createCustomToken(uid);

    return res.status(200).json({
      customToken,
    });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({
        error: error.message,
      });
    }

    console.error("Username login endpoint failed:", error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
}