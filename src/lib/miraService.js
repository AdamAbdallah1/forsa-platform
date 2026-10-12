import { useSyncExternalStore } from "react";
import { auth } from "./firebase";

/*
 * Forsa AI's client service.
 *
 * Talks to the server-side endpoint only. Provider credentials, the system
 * prompt, and the quota all live on the server; this module's job is to
 * attach the current Firebase ID token and surface errors honestly.
 *
 * Prompts and replies are never logged or persisted here — conversation
 * history is React memory only, owned by the caller.
 */

const MIRA_ENDPOINT = "/api/mira-chat";

/*
 * Connection state shared between the dedicated page and the floating
 * widget. It starts "unverified": we have not yet observed a successful
 * call, so nothing is claimed.
 */
const STATUS = {
  UNVERIFIED: "unverified",
  CONNECTED: "connected",
  ERROR: "error",
};

let statusSnapshot = { state: STATUS.UNVERIFIED, detail: null };
const statusListeners = new Set();

function emitStatus(next) {
  statusSnapshot = next;
  statusListeners.forEach((listener) => listener());
}

export function subscribeMiraStatus(listener) {
  statusListeners.add(listener);

  return () => statusListeners.delete(listener);
}

export function getMiraStatus() {
  return statusSnapshot;
}

export function useMiraStatus() {
  return useSyncExternalStore(subscribeMiraStatus, getMiraStatus, getMiraStatus);
}

function markConnected() {
  emitStatus({ state: STATUS.CONNECTED, detail: null });
}

function markError(detail) {
  emitStatus({ state: STATUS.ERROR, detail: detail || null });
}

/*
 * Server-confirmed usage, shared across surfaces. Updated from every 200
 * and every quota-bearing 429 so the UI never shows a fabricated counter.
 * `usage` is personal ({ used, limit, resetAt }); `capacity` is the shared
 * budget and is only present after a global-429, since aggregate usage is
 * otherwise not the user's business.
 */
let usageSnapshot = { usage: null, capacity: null };

/*
 * The filtered view handed to React. useSyncExternalStore requires
 * getSnapshot to return a referentially stable value until the store
 * actually changes — allocating a fresh object per read causes React's
 * "getSnapshot should be cached" infinite loop. This reference is replaced
 * only inside emitUsage, so renders see a stable snapshot.
 */
let usageView = { usage: null, capacity: null };

const usageListeners = new Set();

function isFresh(entry) {
  if (!entry) return false;
  if (!entry.resetAt) return true;

  const reset = new Date(entry.resetAt).getTime();

  return Number.isFinite(reset) && reset > Date.now();
}

function toUsageView(snapshot) {
  /* A counter from a previous UTC day is stale — never show yesterday's
     numbers as today's. The next server response refreshes the store. */
  return {
    usage: isFresh(snapshot.usage) ? snapshot.usage : null,
    capacity: isFresh(snapshot.capacity) ? snapshot.capacity : null,
  };
}

function sameEntry(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.used === b.used && a.limit === b.limit && a.resetAt === b.resetAt
  );
}

function emitUsage(next) {
  usageSnapshot = next;

  const view = toUsageView(next);

  /* Notify only when something visible actually changed. Server echoes
     arrive as fresh objects on every response, so this compares fields —
     reference comparison alone would re-render on identical data. */
  if (
    !sameEntry(view.usage, usageView.usage) ||
    !sameEntry(view.capacity, usageView.capacity)
  ) {
    usageView = view;
    usageListeners.forEach((listener) => listener());
  }
}

export function subscribeMiraUsage(listener) {
  usageListeners.add(listener);

  return () => usageListeners.delete(listener);
}

export function getMiraUsage() {
  return usageView;
}

export function useMiraUsage() {
  return useSyncExternalStore(subscribeMiraUsage, getMiraUsage, getMiraUsage);
}

function trackUsage({ usage, capacity } = {}) {
  emitUsage({
    usage: usage ?? usageSnapshot.usage,
    capacity: capacity ?? usageSnapshot.capacity,
  });
}

/**
 * Send a conversation to Forsa AI.
 *
 * @param {{messages: Array<{role: string, content: string}>,
 *          tool?: string,
 *          conversationId?: string | null,
 *          jobId?: string | null,
 *          consent?: {shareCv?: boolean},
 *          signal?: AbortSignal}} options
 * @returns {Promise<{reply: string, model?: string, usage?: object}>}
 * @throws {Error} with `.code`, `.status` and optionally `.quota` (personal)
 *   or `.capacity` (shared budget).
 */
export async function sendMiraMessage({
  messages,
  tool = "general",
  conversationId = null,
  jobId = null,
  consent = { shareCv: false },
  signal,
}) {
  const user = auth.currentUser;

  if (!user) {
    const error = new Error("Sign in to use Forsa AI.");
    error.code = "NOT_AUTHENTICATED";
    error.status = 401;
    throw error;
  }

  let idToken;

  try {
    idToken = await user.getIdToken();
  } catch {
    const error = new Error("Your session expired. Sign in again.");
    error.code = "NOT_AUTHENTICATED";
    error.status = 401;
    throw error;
  }

  let response;

  try {
    response = await fetch(MIRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        messages,
        tool,
        conversationId,
        jobId,
        consent,
      }),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    markError("unreachable");

    const wrapped = new Error("Forsa AI could not be reached. Check your connection.");
    wrapped.code = "MIRA_UNREACHABLE";
    wrapped.status = 0;
    throw wrapped;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    /*
     * A rejected request does not mean Forsa AI is broken: a 429 is a
     * working service reporting a spent allowance, and a 503 is an honest
     * "not configured". Only genuine failures move the shared state. Usage
     * and capacity are recorded whenever the server provides them so the
     * UI reflects confirmed numbers.
     */
    const code = data?.code || "UNKNOWN";

    if (data?.usage) trackUsage({ usage: data.usage });
    if (data?.capacity) trackUsage({ capacity: data.capacity });

    if (
      code === "MIRA_DISABLED" ||
      code === "MIRA_PROVIDER_NOT_CONFIGURED" ||
      code === "QUOTA_EXCEEDED" ||
      code === "GLOBAL_QUOTA_EXCEEDED" ||
      code === "MIRA_PROVIDER_RATE_LIMIT"
    ) {
      markError(code);
    } else if (response.status >= 500) {
      markError("server");
    }

    const error = new Error(data?.error || "Forsa AI could not respond.");
    error.code = code;
    error.status = response.status;
    error.quota = data?.usage;
    error.capacity = data?.capacity;
    throw error;
  }

  if (typeof data?.reply !== "string" || !data.reply.trim()) {
    markError("empty");

    const error = new Error("Forsa AI returned an empty response.");
    error.code = "PROVIDER_EMPTY_REPLY";
    error.status = 502;
    throw error;
  }

  markConnected();

  if (data?.usage) trackUsage({ usage: data.usage });

  return data;
}
