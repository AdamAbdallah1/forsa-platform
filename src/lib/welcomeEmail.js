import { auth } from "./firebase";

/*
 * Request the one-time Forsa welcome email for the currently
 * authenticated user.
 *
 * Safe by construction:
 * - Only fires for the signed-in user's own token (server derives
 *   the recipient from the verified Firebase ID token; the client
 *   never supplies an address).
 * - Non-blocking: never throws, never prevents navigation or profile
 *   completion.
 * - Idempotency is enforced server-side with a Firestore transaction
 *   (welcomeEmailSentAt + onboardingCompletedAt claimed atomically),
 *   so repeated or concurrent calls cannot produce duplicate emails.
 */
export async function requestWelcomeEmail() {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.error("Welcome email request skipped: no session.");
      return { sent: false, reason: "no-session" };
    }

    const idToken = await user.getIdToken();

    const response = await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error(
        "Welcome email request failed:",
        data || response.status
      );

      return { sent: false, reason: String(response.status) };
    }

    return {
      sent: data?.alreadySent === false,
      alreadySent: data?.alreadySent === true,
    };
  } catch (error) {
    console.error("Welcome email request failed:", error);

    return { sent: false, reason: "network" };
  }
}