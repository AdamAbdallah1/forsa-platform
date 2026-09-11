import { signOut } from "firebase/auth";
import { auth } from "./firebase";

/*
 * ACCOUNT DELETION (CLIENT WRAPPER)
 *
 * Deletion is fully orchestrated server-side by /api/delete-account.js. The
 * browser no longer runs the Firestore deletion sequence or Firebase's
 * deleteUser() for account deletion; it is only a thin authenticated wrapper
 * that:
 *   1. sends the just-reauthenticated ID token to the endpoint,
 *   2. clears Forsa local storage ONLY after the server confirms success,
 *   3. signs out locally so the existing AuthContext listener settles.
 *
 * The server enforces fresh authentication (recent auth_time), a per-UID
 * concurrency lock, and UID-scoped cleanup — with honest, retryable failures.
 */

/*
 * The complete set of Forsa-owned localStorage keys. Deletion clears ONLY
 * these, never the whole origin.
 */
const FORSA_LOCAL_KEYS = [
  "forsaAccount",
  "forsaProfile",
  "forsaPosts",
  "forsaPostsCache",
  "forsaMessages",
  "forsaMessagesCache",
  "forsaNotifications",
  "forsaNotificationsCache",
  "forsaSavedJobs",
  "forsaSavedJobNotes",
  "forsaRecentlyViewed",
  "forsaUsers",
  "forsaCompanyFollowers",
  "forsaFollowedCompanies",
  "forsaCustomTags",
  "forsaNetLine",
  "forsaPostAnalytics",
  "forsaPresence",
  "forsaTrustedPosters",
];

export function clearForsaLocalData() {
  FORSA_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
}

function getServerError(data, fallback) {
  if (data && typeof data.error === "string") {
    return data.error;
  }

  return fallback;
}

async function callDeleteEndpoint() {
  const user = auth.currentUser;

  if (!user) {
    const error = new Error("No authenticated user.");
    error.code = "NO_USER";
    throw error;
  }

  let idToken;

  try {
    idToken = await user.getIdToken(true);
  } catch {
    const error = new Error(
      "Could not refresh your session. Please sign in again."
    );
    error.code = "NETWORK";
    throw error;
  }

  let response;

  try {
    response = await fetch("/api/delete-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: "{}",
    });
  } catch {
    const error = new Error(
      "Network error. Check your connection and try again."
    );
    error.code = "NETWORK";
    throw error;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      getServerError(data, "Could not delete your account. Please try again.")
    );

    error.code = data?.code || "DELETION_FAILED";
    error.status = response.status;

    throw error;
  }

  return data || { success: true };
}

/**
 * Delete the current account and clear all Forsa local data.
 *
 * The caller is responsible for reauthenticating the user first (see
 * reauthenticateCurrentUser) — the server rejects requests whose auth_time is
 * older than the freshness window.
 */
export async function deleteCurrentAccount() {
  const result = await callDeleteEndpoint();

  try {
    await signOut(auth);
  } catch {
    // The Firebase account may already be gone; local cleanup still runs.
  }

  clearForsaLocalData();

  return result;
}