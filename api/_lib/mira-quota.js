import { FieldValue } from "firebase-admin/firestore";
import { db } from "./forsa-server.js";
import {
  ContractError,
  miraGlobalDocId,
  miraUsageDay,
  miraUsageDocId,
  nextUtcMidnightIso,
  resolveDailyLimit,
  resolveGlobalLimit,
} from "./mira-contract.js";

/*
 * Mira's durable quota accounting: one per-user counter and one
 * application-wide counter, both keyed by UTC day.
 *
 * The existing `rateLimit()` in forsa-server.js is an in-memory sliding
 * window: a good burst guard, but its counters live in a module-scope Map,
 * so they reset on every serverless cold start and are per-instance. It
 * therefore cannot bound a daily allowance. This helper closes that gap.
 *
 * Both counters are consumed in a SINGLE Firestore transaction, which
 * Firestore serialises. Concurrent requests for the same user — or across
 * users racing the shared budget — cannot exceed either limit, because the
 * read-check-write for both documents commits atomically. A plain increment
 * would not be sufficient, because a cap cannot be enforced after the fact
 * without also reading.
 *
 * Writes go through the Admin SDK, which bypasses security rules. The rules
 * deny all client writes to both collections, so a client can neither top up
 * its own allowance, reset anyone else's, nor touch the shared budget.
 *
 * Refund policy: there is deliberately NO refund path. With plain HTTPS
 * against a remote inference API, a timeout or dropped connection cannot
 * distinguish "never sent" from "processed but the response was lost", so
 * any automatic refund risks double-spending the shared budget during an
 * outage. A consumed unit stays consumed; both allowances reset at UTC
 * midnight. Requests rejected before invocation never consume anything.
 */

class QuotaExceededError extends Error {
  constructor(used, limit) {
    super("Daily Forsa AI limit reached. Try again tomorrow.");
    this.name = "QuotaExceededError";
    this.status = 429;
    this.code = "QUOTA_EXCEEDED";
    this.used = used;
    this.limit = limit;
  }
}

class GlobalQuotaExceededError extends Error {
  constructor(used, limit) {
    super("Forsa AI has reached its free daily capacity. Try again tomorrow.");
    this.name = "GlobalQuotaExceededError";
    this.status = 429;
    this.code = "GLOBAL_QUOTA_EXCEEDED";
    this.used = used;
    this.limit = limit;
  }
}

function resolvePersonalLimit(limitOverride) {
  if (limitOverride === undefined || limitOverride === null) {
    return resolveDailyLimit(process.env.MIRA_DAILY_LIMIT);
  }

  if (Number.isFinite(limitOverride) && limitOverride > 0) {
    return Math.floor(limitOverride);
  }

  throw new QuotaExceededError(0, 0);
}

function resolveSharedLimit(limitOverride) {
  if (limitOverride === undefined || limitOverride === null) {
    return resolveGlobalLimit(process.env.MIRA_GLOBAL_DAILY_LIMIT);
  }

  if (Number.isFinite(limitOverride) && limitOverride > 0) {
    return Math.floor(limitOverride);
  }

  throw new GlobalQuotaExceededError(0, 0);
}

/** Read a user's current usage without consuming anything. */
export async function getMiraQuota(uid, now = new Date()) {
  const limit = resolveDailyLimit(process.env.MIRA_DAILY_LIMIT);
  const ref = db.collection("miraUsage").doc(miraUsageDocId(uid, now));

  const snap = await ref.get();

  const used = snap.exists ? Number(snap.data()?.count || 0) : 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: nextUtcMidnightIso(now),
  };
}

/**
 * Consume one unit of the user's daily allowance AND one unit of the shared
 * daily budget, atomically.
 *
 * Throws QuotaExceededError (personal 429) or GlobalQuotaExceededError
 * (shared 429). The caller must only invoke this immediately before a real
 * provider call — every path that returns earlier consumes nothing.
 *
 * @returns {Promise<{personal: {used, limit, resetAt},
 *                     shared: {used, limit, resetAt}}>}
 */
export async function consumeMiraQuotas(
  uid,
  { personalLimit, globalLimit, now = new Date() } = {}
) {
  const personal = resolvePersonalLimit(personalLimit);
  const shared = resolveSharedLimit(globalLimit);

  if (personal <= 0) {
    throw new QuotaExceededError(0, personal);
  }

  if (shared <= 0) {
    throw new GlobalQuotaExceededError(0, shared);
  }

  const day = miraUsageDay(now);
  const resetAt = nextUtcMidnightIso(now);
  const personalRef = db.collection("miraUsage").doc(miraUsageDocId(uid, now));
  const globalRef = db.collection("miraUsageGlobal").doc(miraGlobalDocId(now));

  return db.runTransaction(async (transaction) => {
    const [personalSnap, globalSnap] = await Promise.all([
      transaction.get(personalRef),
      transaction.get(globalRef),
    ]);

    const personalUsed = personalSnap.exists
      ? Number(personalSnap.data()?.count || 0)
      : 0;
    const sharedUsed = globalSnap.exists
      ? Number(globalSnap.data()?.count || 0)
      : 0;

    if (personalUsed >= personal) {
      throw new QuotaExceededError(personalUsed, personal);
    }

    if (sharedUsed >= shared) {
      throw new GlobalQuotaExceededError(sharedUsed, shared);
    }

    const nextPersonal = personalUsed + 1;
    const nextShared = sharedUsed + 1;

    transaction.set(
      personalRef,
      {
        uid: String(uid),
        day,
        count: nextPersonal,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      globalRef,
      {
        day,
        count: nextShared,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      personal: {
        used: nextPersonal,
        limit: personal,
        remaining: personal - nextPersonal,
        resetAt,
      },
      shared: {
        used: nextShared,
        limit: shared,
        remaining: shared - nextShared,
        resetAt,
      },
    };
  });
}

export { QuotaExceededError, GlobalQuotaExceededError, ContractError };
