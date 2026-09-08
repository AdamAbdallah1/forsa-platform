import { auth } from "./firebase";

/*
 * Request the one-time Forsa profile-complete email for the currently
 * authenticated user.
 *
 * Safe by construction:
 * - Only fires for the signed-in user's own token (server derives the
 *   recipient from the verified Firebase ID token; the client never
 *   supplies an address).
 * - Non-blocking: never throws, never prevents navigation or a profile
 *   save.
 * - The server independently judges profile completeness from the
 *   persisted users/{uid} document and claims
 *   profileCompleteEmailSentAt atomically in a Firestore transaction,
 *   so repeated or concurrent saves can never produce duplicate
 *   emails, and an incomplete profile is silently skipped (no marker,
 *   no email).
 */
export async function requestProfileCompleteEmail() {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.error(
        "Profile complete email request skipped: no session."
      );
      return { sent: false, reason: "no-session" };
    }

    const idToken = await user.getIdToken();

    const response = await fetch("/api/profile-complete-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        "Profile complete email request failed:",
        data || response.status
      );

      return { sent: false, reason: String(response.status) };
    }

    return {
      sent: data?.alreadySent === false,
      alreadySent: data?.alreadySent === true,
    };
  } catch (error) {
    console.error("Profile complete email request failed:", error);

    return { sent: false, reason: "network" };
  }
}