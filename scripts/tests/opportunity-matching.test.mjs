/* Opportunity matching + trust foundations: deterministic tests for the
 * shared matcher, expiry helper, and verification signal in
 * src/lib/exploreUtils.js. Pure logic — no Firebase, no network.
 * Run with: npm run test:matching
 * (or: node scripts/tests/opportunity-matching.test.mjs) */
import assert from "node:assert/strict";

const utils = await import(
  new URL("../../src/lib/exploreUtils.js", import.meta.url).href
);

const {
  MATCH_WEIGHTS,
  VERIFIED_REASONS,
  calculateMatchScore,
  getFreshnessAdjustment,
  getMatchBreakdown,
  getMatchMeta,
  getVerifiedOpportunitySignal,
  isExpired,
} = utils;

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

/* Fixed local noon — injectable `now` keeps every time assertion
   deterministic regardless of the machine timezone. */
const NOON = new Date(2025, 5, 15, 12, 0, 0);

const fullPost = {
  tags: ["React", "Node", "CSS", "Python"],
  type: "Internship",
  location: "Beirut, Lebanon",
  featured: true,
  urgent: true,
};

const fullProfile = { skills: ["react", "node"], lookingFor: ["internship"] };
const fullAccount = { city: "Beirut" };

/* ---------------- weights (locked algorithm) ---------------- */

check("match weights pin the historical ranking constants", () => {
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
  // 35 base + round(2/4*35)=18 skills + 18 goals + 10 location + 4 + 3.
  assert.equal(calculateMatchScore(fullPost, fullProfile, fullAccount), 88);
});

check("empty profile scores 0", () => {
  assert.equal(calculateMatchScore(fullPost, {}, {}), 0);
  assert.equal(calculateMatchScore(fullPost, null, null), 0);
  assert.equal(calculateMatchScore(null, {}, {}), 0);
});

check("post without tags scores base 35 only", () => {
  const post = { type: "Remote", location: "" };
  assert.equal(
    calculateMatchScore(post, { skills: ["x"], lookingFor: [] }, {}),
    35
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
  // 35 + 35 + 18 + 10 + 4 + 3 = 105 -> capped.
  assert.equal(
    calculateMatchScore(post, { skills: ["a", "b"], lookingFor: ["remote"] }, { city: "Beirut" }),
    98
  );
});

check("location match is one-directional (preserved quirk)", () => {
  // City "Beirut, Lebanon" does NOT match post location "Beirut" — the
  // check is postLocation.includes(accountCity) only. Locked as-is.
  const post = { tags: [], type: "x", location: "Beirut" };
  assert.equal(
    calculateMatchScore(post, { skills: ["y"], lookingFor: [] }, { city: "Beirut, Lebanon" }),
    35
  );
});

/* ---------------- breakdown parity ---------------- */

check("breakdown total equals score on every fixture", () => {
  const fixtures = [
    [fullPost, fullProfile, fullAccount],
    [fullPost, {}, {}],
    [{ type: "Remote", location: "" }, { skills: ["x"], lookingFor: [] }, {}],
    [
      { tags: ["a"], type: "t", location: "l" },
      { skills: [], lookingFor: ["t"], },
      { city: "l" },
    ],
    [null, null, null],
  ];

  for (const [post, profile, account] of fixtures) {
    const breakdown = getMatchBreakdown(post, profile, account);
    assert.equal(
      breakdown.score,
      calculateMatchScore(post, profile, account),
      JSON.stringify({ post, profile, account })
    );
  }
});

check("breakdown exposes contributing reasons", () => {
  const breakdown = getMatchBreakdown(fullPost, fullProfile, fullAccount);

  assert.equal(breakdown.hasProfile, true);
  assert.deepEqual(breakdown.matchedTags, ["react", "node"]);
  assert.equal(breakdown.skillPoints, 18);
  assert.equal(breakdown.goalPoints, 18);
  assert.equal(breakdown.locationPoints, 10);

  const keys = breakdown.reasons.map((reason) => reason.key);
  assert.deepEqual(keys, ["base", "skills", "goals", "location", "featured", "urgent"]);

  const total = breakdown.reasons.reduce((sum, reason) => sum + reason.points, 0);
  assert.equal(total, breakdown.score);
});

check("breakdown of empty profile carries the no-profile reason", () => {
  const breakdown = getMatchBreakdown(fullPost, {}, {});

  assert.equal(breakdown.score, 0);
  assert.equal(breakdown.hasProfile, false);
  assert.deepEqual(breakdown.reasons.map((reason) => reason.key), ["no-profile"]);
});

/* ---------------- getMatchMeta parity ---------------- */

check("meta returns original-case skills and type flag", () => {
  const meta = getMatchMeta(fullPost, fullProfile);

  assert.deepEqual(meta.matchingSkills, ["React", "Node"]);
  assert.equal(meta.matchingType, true);
});

check("meta type flag is false without a goal match", () => {
  const meta = getMatchMeta(fullPost, { skills: [], lookingFor: ["chef"] });

  assert.equal(meta.matchingType, false);
});

check("known score/meta asymmetry is preserved, not silently fixed", () => {
  // calculateMatchScore also matches when the post type CONTAINS the
  // interest ("freelance".includes("free")), but getMatchMeta does not.
  // Both behaviors are locked until a product decision says otherwise.
  const post = { tags: [], type: "Freelance", location: "" };
  const profile = { skills: ["x"], lookingFor: ["free"] };

  assert.equal(calculateMatchScore(post, profile, {}), 35 + 18);
  assert.equal(getMatchMeta(post, profile).matchingType, false);
});

/* ---------------- freshness extension point ---------------- */

check("freshness adjustment is a pinned no-op", () => {
  for (const post of [fullPost, {}, null, { deadline: "2020-01-01" }]) {
    assert.deepEqual(getFreshnessAdjustment(post, NOON), {
      points: 0,
      active: false,
      reasons: [],
    });
  }
});

/* ---------------- isExpired ---------------- */

check("missing or empty deadline never expires", () => {
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
  // Same day, noon: still open.
  assert.equal(isExpired({ deadline: "2025-06-15" }, NOON), false);
  // Exactly at 23:59:59.999 local: not yet past the deadline.
  assert.equal(
    isExpired({ deadline: "2025-06-15" }, new Date(2025, 5, 15, 23, 59, 59, 999)),
    false
  );
  // One millisecond into the next day: expired.
  assert.equal(
    isExpired({ deadline: "2025-06-15" }, new Date(2025, 5, 16, 0, 0, 0)),
    true
  );
});

check("invalid deadlines fail closed (never expire)", () => {
  for (const deadline of [
    "not-a-date",
    "2025-13-01",
    "2025-02-30",
    "2025-00-10",
    true,
    {},
    [],
  ]) {
    assert.equal(isExpired({ deadline }, NOON), false, String(deadline));
  }
});

check("instant deadlines compare directly", () => {
  // Date instance: exact instant, no end-of-day treatment.
  assert.equal(isExpired({ deadline: new Date(2020, 0, 1) }, NOON), true);
  assert.equal(isExpired({ deadline: new Date(2030, 0, 1) }, NOON), false);
  // ISO datetime string: instant semantics.
  assert.equal(isExpired({ deadline: "2025-06-15T10:00:00" }, NOON), true);
  assert.equal(isExpired({ deadline: "2025-06-15T14:00:00" }, NOON), false);
  // Firestore-style timestamp.
  assert.equal(
    isExpired({ deadline: { toDate: () => new Date(2020, 0, 1) } }, NOON),
    true
  );
  // Throwing toDate: fail closed.
  assert.equal(
    isExpired({ deadline: { toDate: () => { throw new Error("x"); } } }, NOON),
    false
  );
  // Millisecond epoch numbers (relative to the injected now).
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

/* ---------------- verified signal ---------------- */

const qualifiedPost = () => ({
  verified: true,
  reviewStatus: "approved",
  moderationStatus: "approved",
  safetyStatus: "clear",
  status: "active",
  reviewedBy: "admin@test.com",
  approvedAt: "2030-01-01T10:00:00Z",
  deadline: "2030-01-01",
});

check("fully qualified listing verifies with empty reasons", () => {
  const signal = getVerifiedOpportunitySignal(qualifiedPost(), NOON);

  assert.deepEqual(signal, {
    employerVerified: true,
    reviewPassed: true,
    fresh: true,
    eligible: true,
    verified: true,
    reasons: [],
  });
});

check("unverified employer fails, even with companyVerified legacy flag", () => {
  const plain = { ...qualifiedPost(), verified: false };
  const legacy = { ...qualifiedPost(), verified: undefined, companyVerified: true };

  for (const post of [plain, legacy, {}]) {
    const signal = getVerifiedOpportunitySignal(post, NOON);

    assert.equal(signal.employerVerified, false);
    assert.equal(signal.verified, false);
    assert.ok(signal.reasons.includes(VERIFIED_REASONS.EMPLOYER_NOT_VERIFIED));
  }
});

check("badges alone never verify: trusted/featured/urgent/ownership", () => {
  const signal = getVerifiedOpportunitySignal(
    {
      trusted: true,
      featured: true,
      urgent: true,
      ownerUid: "someone",
      status: "active",
      reviewedBy: "admin@test.com",
      approvedAt: "2030-01-01T10:00:00Z",
      reviewStatus: "approved",
      moderationStatus: "approved",
      safetyStatus: "clear",
      deadline: "2030-01-01",
    },
    NOON
  );

  assert.equal(signal.verified, false);
  assert.deepEqual(signal.reasons, [VERIFIED_REASONS.EMPLOYER_NOT_VERIFIED]);
});

check("pending review fails with pending + inactive reasons", () => {
  const signal = getVerifiedOpportunitySignal(
    { ...qualifiedPost(), reviewStatus: "pending" },
    NOON
  );

  assert.equal(signal.reviewPassed, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("rejected review fails distinctly from pending", () => {
  const signal = getVerifiedOpportunitySignal(
    { ...qualifiedPost(), moderationStatus: "rejected" },
    NOON
  );

  assert.equal(signal.reviewPassed, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.REVIEW_REJECTED));
  assert.ok(!signal.reasons.includes(VERIFIED_REASONS.REVIEW_PENDING));
});

check("safety flags fail even when everything else passes", () => {
  for (const post of [
    { ...qualifiedPost(), safetyStatus: "suspicious" },
    { ...qualifiedPost(), suspicious: true },
  ]) {
    const signal = getVerifiedOpportunitySignal(post, NOON);

    assert.equal(signal.reviewPassed, false);
    assert.equal(signal.eligible, false);
    assert.equal(signal.verified, false);
    assert.ok(signal.reasons.includes(VERIFIED_REASONS.SAFETY_FLAGGED));
  }
});

check("expired listing fails freshness but keeps eligibility shape", () => {
  const signal = getVerifiedOpportunitySignal(
    { ...qualifiedPost(), deadline: "2020-01-01" },
    NOON
  );

  assert.equal(signal.fresh, false);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.EXPIRED));
});

check("closed listing is ineligible without inventing a deadline verdict", () => {
  const signal = getVerifiedOpportunitySignal(
    { ...qualifiedPost(), status: "closed", deadline: "" },
    NOON
  );

  assert.equal(signal.eligible, false);
  assert.equal(signal.fresh, true);
  assert.equal(signal.verified, false);
  assert.ok(signal.reasons.includes(VERIFIED_REASONS.NOT_ACTIVE));
  assert.ok(!signal.reasons.includes(VERIFIED_REASONS.EXPIRED));
});

check("reasons are empty exactly when verified", () => {
  const cases = [
    qualifiedPost(),
    { ...qualifiedPost(), verified: false },
    { ...qualifiedPost(), reviewStatus: "pending" },
    { ...qualifiedPost(), status: "closed" },
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

console.log(`\n${passed}/${passed + failures.length} passed`);
process.exit(failures.length === 0 ? 0 : 1);
