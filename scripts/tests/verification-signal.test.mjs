/* Verification signal & review-stamp lifecycle tests:
 * Covers the verification matrix and authorization boundaries
 * for the Opportunity Standard — Phase 1.
 * Run with: npm run test:verification-signal
 * or: node scripts/tests/verification-signal.test.mjs */
import assert from "node:assert/strict";

const utils = await import(
  new URL("../../src/lib/exploreUtils.js", import.meta.url).href
);

const {
  calculateMatchScore,
  getMatchBreakdown,
  getMatchMeta,
  getVerifiedOpportunitySignal,
  isExpired,
  VERIFIED_REASONS,
  MATCH_WEIGHTS,
} = utils;

const NOON = new Date(2025, 5, 15, 12, 0, 0);

const fullyQualified = () => ({
  verified: true,
  reviewStatus: "approved",
  moderationStatus: "approved",
  safetyStatus: "clear",
  status: "active",
  deadline: "2030-01-01",
  reviewedBy: "admin@test.com",
  approvedAt: "2025-06-15T10:00:00Z",
});

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}

/* ---------- Verification matrix ---------- */

check(
  "verified: true + all gates pass + both reviewedBy + approvedAt → verified with empty reasons",
  () => {
    const signal = getVerifiedOpportunitySignal(fullyQualified(), NOON);
    assert.deepEqual(signal, {
      employerVerified: true,
      reviewPassed: true,
      fresh: true,
      eligible: true,
      verified: true,
      reasons: [],
    });
  }
);

check("missing reviewedBy fails approved listing", () => {
  const post = { ...fullyQualified(), reviewedBy: undefined };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("missing approvedAt fails approved listing", () => {
  const post = { ...fullyQualified(), approvedAt: undefined };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("empty string reviewedBy fails approved listing", () => {
  const post = { ...fullyQualified(), reviewedBy: "" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("empty string approvedAt fails approved listing", () => {
  const post = { ...fullyQualified(), approvedAt: "" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("null reviewedBy fails approved listing", () => {
  const post = { ...fullyQualified(), reviewedBy: null };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("null approvedAt fails approved listing", () => {
  const post = { ...fullyQualified(), approvedAt: null };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("pending review fails verification", () => {
  const post = { ...fullyQualified(), reviewStatus: "pending" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.reviewPassed, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("rejected review fails verification distinctly", () => {
  const post = { ...fullyQualified(), moderationStatus: "rejected" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.reviewPassed, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_REJECTED));
  assert.ok(!signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("safety flagged fails verification", () => {
  const post = { ...fullyQualified(), safetyStatus: "suspicious" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.reviewPassed, false);
  assert.equal(signal.eligible, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.SAFETY_FLAGGED));
});

check("expired listing fails fresh but keeps eligibility shape", () => {
  const post = { ...fullyQualified(), deadline: "2020-01-01" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.fresh, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.EXPIRED));
  assert.equal(signal.eligible, true);
});

check("closed listing is ineligible without inventing deadline verdict", () => {
  const post = { ...fullyQualified(), status: "closed", deadline: "" };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.eligible, false);
  assert.equal(signal.fresh, true);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.NOT_ACTIVE));
  assert.ok(!signal.reasons.includes(VERIFIED_REASONS.EXPIRED));
});

check("reasons are empty exactly when verified", () => {
  const cases = [
    fullyQualified(),
    { ...fullyQualified(), verified: false },
    { ...fullyQualified(), reviewStatus: "pending" },
    { ...fullyQualified(), status: "closed" },
    {},
  ];
  for (const post of cases) {
    const signal = getVerifiedOpportunitySignal(post, NOON);
    assert.equal(
      signal.reasons.length === 0,
      signal.verified,
      JSON.stringify(signal)
    );
  }
});

check("reason codes are stable strings", () => {
  assert.deepEqual(VERIFIED_REASONS, {
    EMPLOYER_NOT_VERIFIED: "employer-not-verified",
    REVIEW_PENDING: "review-pending",
    REVIEW_REJECTED: "review-rejected",
    SAFETY_FLAGGED: "safety-flagged",
    EXPIRED: "expired",
    NOT_ACTIVE: "not-active",
  });
});

/* ---------- Authorization boundaries ---------- */

check("MATCH_WEIGHTS constants are locked", () => {
  assert.deepEqual(MATCH_WEIGHTS, {
    BASE: 35,
    SKILLS: 35,
    GOALS: 18,
    LOCATION: 10,
    FEATURED: 4,
    URGENT: 3,
    MIN: 0,
    MAX: 98,
  });
});

check("full match scores 88 (hand-verified)", () => {
  const fullPost = {
    tags: ["React", "Node", "CSS", "Python"],
    type: "Internship",
    location: "Beirut, Lebanon",
    featured: true,
    urgent: true,
  };
  const fullProfile = { skills: ["react", "node"], lookingFor: ["internship"] };
  const fullAccount = { city: "Beirut" };
  assert.equal(
    calculateMatchScore(fullPost, fullProfile, fullAccount),
    88
  );
});

check("perfect match caps at 98, not 105", () => {
  const post = {
    tags: ["a", "b"],
    type: "Remote",
    location: "Beirut",
    featured: true,
    urgent: true,
  };
  assert.equal(
    calculateMatchScore(post, { skills: ["a", "b"], lookingFor: ["remote"] }, { city: "Beirut" }),
    98
  );
});

check("location match is one-directional (preserved quirk)", () => {
  const post = { tags: [], type: "x", location: "Beirut" };
  assert.equal(
    calculateMatchScore(post, { skills: ["y"], lookingFor: [] }, { city: "Beirut, Lebanon" }),
    35
  );
});

/* ---------- isExpired integration ---------- */

check("isExpired with missing/empty deadline never expires", () => {
  for (const post of [
    {},
    null,
    undefined,
    { deadline: "" },
    { deadline: "   " },
    { deadline: null },
    { status: "closed" },
    { status: "closed", deadline: "" },
  ]) {
    assert.equal(isExpired(post, NOON), false);
  }
});

check("date-only deadlines expire after local end of day", () => {
  assert.equal(isExpired({ deadline: "2020-01-01" }, NOON), true);
  assert.equal(isExpired({ deadline: "2030-12-31" }, NOON), false);
  assert.equal(isExpired({ deadline: "2025-06-15" }, NOON), false);
  assert.equal(
    isExpired({ deadline: "2025-06-15" }, new Date(2025, 5, 15, 23, 59, 59, 999)),
    false
  );
  assert.equal(
    isExpired({ deadline: "2025-06-15" }, new Date(2025, 5, 16, 0, 0, 0)),
    true
  );
});

check("invalid deadlines fail closed (never expire)", () => {
  for (const deadline of ["not-a-date", "2025-13-01", "2025-02-30", "2025-00-10", true, {}, []]) {
    assert.equal(isExpired({ deadline }, NOON), false, String(deadline));
  }
});

check("instant deadlines compare directly", () => {
  assert.equal(isExpired({ deadline: new Date(2020, 0, 1) }, NOON), true);
  assert.equal(isExpired({ deadline: new Date(2030, 0, 1) }, NOON), false);
  assert.equal(isExpired({ deadline: "2025-06-15T10:00:00" }, NOON), true);
  assert.equal(isExpired({ deadline: "2025-06-15T14:00:00" }, NOON), false);
  assert.equal(
    isExpired({ deadline: { toDate: () => new Date(2020, 0, 1) } }, NOON),
    true
  );
  assert.equal(
    isExpired({ deadline: { toDate: () => { throw new Error("x") } } }, NOON),
    false
  );
  assert.equal(isExpired({ deadline: NOON.getTime() - 1000 }, NOON), true);
  assert.equal(isExpired({ deadline: NOON.getTime() + 3600_000 }, NOON), false);
  assert.equal(isExpired({ deadline: NaN }, NOON), false);
  assert.equal(isExpired({ deadline: Infinity }, NOON), false);
});

check("invalid `now` fails closed and input is never mutated", () => {
  const post = Object.freeze({ deadline: "2020-01-01" });
  assert.equal(isExpired(post, new Date(NaN)), false);
  assert.equal(isExpired(post, "garbage"), false);
  assert.equal(post.deadline, "2020-01-01");
});

check("default `now` is the current time", () => {
  assert.equal(isExpired({ deadline: "2000-01-01" }), true);
  assert.equal(isExpired({ deadline: "2999-01-01" }), false);
});

/* ---------- Review stamp lifecycle ---------- */

check("approved post carries reviewedBy and approvedAt", () => {
  const post = {
    verified: true,
    reviewStatus: "approved",
    moderationStatus: "approved",
    safetyStatus: "clear",
    status: "active",
    approvedAt: "2025-06-15T10:00:00Z",
    reviewedBy: "admin@test.com",
  };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, true);
  assert.equal(signal.reviewPassed, true);
  assert.ok(post.approvedAt !== undefined);
  assert.ok(post.reviewedBy !== undefined);
});

check("rejected post carries rejectedAt and reviewedBy", () => {
  const post = {
    verified: true,
    reviewStatus: "rejected",
    moderationStatus: "rejected",
    safetyStatus: "clear",
    status: "closed",
    rejectedAt: "2025-06-15T10:00:00Z",
    reviewedBy: "admin@test.com",
  };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.verified, false);
  assert.equal(signal.reviewPassed, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_REJECTED));
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.NOT_ACTIVE));
  assert.ok(post.rejectedAt !== undefined);
  assert.ok(post.reviewedBy !== undefined);
});

check("suspicious post carries suspiciousAt", () => {
  const post = {
    safetyStatus: "suspicious",
    suspicious: true,
    suspiciousAt: "2025-06-15T10:00:00Z",
  };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.eligible, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.SAFETY_FLAGGED));
  assert.ok(post.suspiciousAt !== undefined);
});

check("re-review resets review stamps and re-enables approval", () => {
  const post = {
    verified: true,
    reviewStatus: "pending",
    moderationStatus: "pending",
    safetyStatus: "clear",
    status: "active",
    approvedAt: null,
    rejectedAt: null,
    reviewedBy: null,
  };
  const signal = getVerifiedOpportunitySignal(post, NOON);
  assert.equal(signal.reviewPassed, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

/* ---------- Integration: signal ↔ Firestore-compatible fields ---------- */

check("signal is consistent with Firestore-created post defaults", () => {
  const nonAgencyPost = {
    verified: true,
    reviewStatus: "approved",
    moderationStatus: "approved",
    safetyStatus: "clear",
    status: "active",
    reviewedBy: "admin@test.com",
    approvedAt: "2025-06-15T10:00:00Z",
  };
  const signal = getVerifiedOpportunitySignal(nonAgencyPost, NOON);
  assert.deepEqual(signal, {
    employerVerified: true,
    reviewPassed: true,
    fresh: true,
    eligible: true,
    verified: true,
    reasons: [],
  });
});

check("signal correctly rejects agency post with pending review", () => {
  const agencyPostPending = {
    verified: true,
    reviewStatus: "pending",
    moderationStatus: "pending",
    safetyStatus: "clear",
    status: "active",
  };
  const signal = getVerifiedOpportunitySignal(agencyPostPending, NOON);
  assert.equal(signal.reviewPassed, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

console.log(`\n${passed}/${passed + failures.length} passed`);
process.exit(failures.length === 0 ? 0 : 1);