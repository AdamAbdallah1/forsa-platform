import { auth } from "./firebase";

/*
 * Request the one-time profile-improvement email for the currently
 * authenticated user.
 *
 * Safe by construction:
 * - Only fires for the signed-in user's own token (server derives the
 *   recipient from the verified Firebase ID token; the client never
 *   supplies an address).
 * - Non-blocking: never throws, never prevents navigation or a profile
 *   save.
 * - The server independently evaluates profile weakness from the
 *   persisted users/{uid} document (the app's 8-signal credibility
 *   model) and claims profileImprovementEmailSentAt atomically in a
 *   Firestore transaction, so repeated profile edits can never produce
 *   more than one email, and strong profiles are silently skipped (no
 *   marker, no email).
 */
export async function requestProfileImprovementEmail() {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.error(
        "Profile improvement email request skipped: no session."
      );
      return { sent: false, reason: "no-session" };
    }

    const idToken = await user.getIdToken();

    const response = await fetch("/api/profile-improvement-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        "Profile improvement email request failed:",
        data || response.status
      );

      return { sent: false, reason: String(response.status) };
    }

    return {
      sent: data?.alreadySent === false,
      alreadySent: data?.alreadySent === true,
    };
  } catch (error) {
    console.error("Profile improvement email request failed:", error);

    return { sent: false, reason: "network" };
  }
}