export const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const normalize = (value) =>
  String(value || "").trim().toLowerCase();

export const isAgencyPost = (post) =>
  post?.postSource === "agency" ||
  post?.sourceType === "agency" ||
  post?.category === "Recruitment Agency" ||
  post?.type === "Recruitment Agency";

export const getWorkCountry = (post) =>
  post?.workCountry ||
  post?.country ||
  (isAgencyPost(post) ? "Abroad" : "Lebanon");

export const isAbroadPost = (post) => {
  const country = normalize(getWorkCountry(post));

  return isAgencyPost(post) || (country && country !== "lebanon");
};

export const getHiringFor = (post) =>
  post?.hiringFor ||
  post?.clientCompany ||
  post?.employer ||
  post?.company ||
  "Employer";

export const getProfileStrength = (account, profile) => {
  const checks = [
    Boolean(account?.name),
    Boolean(account?.email),
    Boolean(account?.city),
    (profile.skills || []).length >= 2,
    (profile.lookingFor || []).length > 0,
    Boolean(profile.cv),
  ];

  const completed = checks.filter(Boolean).length;
  const missing = [];

  if (!profile.skills?.length || profile.skills.length < 2) {
    missing.push("add 2+ skills");
  }

  if (!profile.lookingFor?.length) {
    missing.push("choose work interests");
  }

  if (!profile.cv) {
    missing.push("attach CV");
  }

  return {
    score: Math.round((completed / checks.length) * 100),
    missing,
  };
};

export const calculateMatchScore = (post, profile, account) =>
  getMatchBreakdown(post, profile, account).score;

export const getMatchMeta = (post, profile) => {
  const skills = (profile?.skills || []).map(normalize);

  const matchingSkills = (post.tags || []).filter((tag) =>
    skills.includes(normalize(tag))
  );

  const lookingFor = profile?.lookingFor || [];

  const matchingType = lookingFor.some((item) => {
    const value = normalize(item);
    const type = normalize(post.type);

    return (
      value === type ||
      value === `${type} work` ||
      value === `${type} job` ||
      value.includes(type)
    );
  });

  return {
    matchingSkills,
    matchingType,
  };
};

/*
 * Opportunity matching: single source of truth.
 *
 * The weights below reproduce the historical Explore ranking exactly —
 * `calculateMatchScore` delegates to `getMatchBreakdown`, and the totals are
 * locked by deterministic tests. Do not tune these numbers here; future
 * ranking changes belong in a versioned adjustment layer (see
 * `getFreshnessAdjustment`).
 *
 * Known quirk, preserved deliberately: `calculateMatchScore` counts a goal
 * match when the post type contains the interest string
 * (`postType.includes(item)`), while `getMatchMeta` does not. Changing
 * either side would alter displayed scores or reasons, so both stay as-is
 * until a product decision says otherwise.
 */
export const MATCH_WEIGHTS = {
  BASE: 35,
  SKILLS: 35,
  GOALS: 18,
  LOCATION: 10,
  FEATURED: 4,
  URGENT: 3,
  MIN: 0,
  MAX: 98,
};

export const getMatchBreakdown = (post, profile, account) => {
  const skills = (profile?.skills || []).map(normalize);
  const lookingFor = (profile?.lookingFor || []).map(normalize);
  const tags = (post?.tags || []).map(normalize);
  const postType = normalize(post?.type);
  const postLocation = normalize(post?.location);
  const accountCity = normalize(account?.city);

  if (!skills.length && !lookingFor.length && !accountCity) {
    return {
      score: 0,
      hasProfile: false,
      base: 0,
      skillPoints: 0,
      matchedTags: [],
      tagCount: tags.length,
      goalMatched: false,
      goalPoints: 0,
      locationMatched: false,
      locationPoints: 0,
      featuredApplied: false,
      urgentApplied: false,
      reasons: [
        {
          key: "no-profile",
          label: "Add skills, interests, or a city to get matches.",
          points: 0,
        },
      ],
    };
  }

  const matchedTags = tags.filter((tag) => skills.includes(tag));

  const skillPoints =
    tags.length > 0
      ? Math.min(
          MATCH_WEIGHTS.SKILLS,
          Math.round((matchedTags.length / tags.length) * MATCH_WEIGHTS.SKILLS)
        )
      : 0;

  const goalMatched = lookingFor.some((item) => {
    return (
      item === postType ||
      item === `${postType} work` ||
      item === `${postType} job` ||
      item.includes(postType) ||
      postType.includes(item)
    );
  });

  const goalPoints = goalMatched ? MATCH_WEIGHTS.GOALS : 0;

  const locationMatched = Boolean(
    accountCity && postLocation.includes(accountCity)
  );

  const locationPoints = locationMatched ? MATCH_WEIGHTS.LOCATION : 0;

  const featuredApplied = Boolean(post?.featured);
  const urgentApplied = Boolean(post?.urgent);

  const score = Math.min(
    MATCH_WEIGHTS.MAX,
    Math.max(
      MATCH_WEIGHTS.MIN,
      MATCH_WEIGHTS.BASE +
        skillPoints +
        goalPoints +
        locationPoints +
        (featuredApplied ? MATCH_WEIGHTS.FEATURED : 0) +
        (urgentApplied ? MATCH_WEIGHTS.URGENT : 0)
    )
  );

  const reasons = [
    { key: "base", label: "Base match", points: MATCH_WEIGHTS.BASE },
  ];

  if (skillPoints > 0) {
    reasons.push({
      key: "skills",
      label: `${matchedTags.length} of ${tags.length} skills match`,
      points: skillPoints,
    });
  }

  if (goalMatched) {
    reasons.push({
      key: "goals",
      label: "Matches your work interests",
      points: goalPoints,
    });
  }

  if (locationMatched) {
    reasons.push({
      key: "location",
      label: "In your city",
      points: locationPoints,
    });
  }

  if (featuredApplied) {
    reasons.push({
      key: "featured",
      label: "Featured opportunity",
      points: MATCH_WEIGHTS.FEATURED,
    });
  }

  if (urgentApplied) {
    reasons.push({
      key: "urgent",
      label: "Hiring urgently",
      points: MATCH_WEIGHTS.URGENT,
    });
  }

  return {
    score,
    hasProfile: true,
    base: MATCH_WEIGHTS.BASE,
    skillPoints,
    matchedTags,
    tagCount: tags.length,
    goalMatched,
    goalPoints,
    locationMatched,
    locationPoints,
    featuredApplied,
    urgentApplied,
    reasons,
  };
};

/*
 * Extension point for Opportunity Radar freshness adjustments.
 *
 * Currently a pinned no-op: ranking today applies no time-based penalty, and
 * deterministic tests lock that behavior. The Radar phase will implement
 * decay here (e.g. points lost per day past a freshness window) without
 * touching the base weights above. Callers should add `adjustment.points`
 * to the breakdown score and surface `adjustment.reasons` alongside it.
 */
export const getFreshnessAdjustment = (post, now = new Date()) => {
  void post;
  void now;

  return { points: 0, active: false, reasons: [] };
};

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/*
 * Resolve a deadline value to an expiry instant (milliseconds), or NaN when
 * the value carries no usable date. Never throws, never mutates its input.
 */
const toExpiryInstant = (value) => {
  if (value === null || value === undefined) return NaN;

  if (value instanceof Date) return value.getTime();

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  if (value && typeof value.toDate === "function") {
    try {
      const date = value.toDate();
      return date instanceof Date ? date.getTime() : NaN;
    } catch {
      return NaN;
    }
  }

  if (typeof value !== "string") return NaN;

  const trimmed = value.trim();

  if (!trimmed) return NaN;

  const dateOnly = trimmed.match(DATE_ONLY_RE);

  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);

    if (month < 1 || month > 12 || day < 1 || day > 31) return NaN;

    // End of the deadline day: applications close AFTER this date, using
    // the same local end-of-day convention as the existing listing UI.
    // The round-trip guard rejects impossible dates (e.g. February 30th)
    // instead of letting the Date constructor roll them into March.
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);

    if (end.getMonth() !== month - 1 || end.getDate() !== day) return NaN;

    return end.getTime();
  }

  return new Date(trimmed).getTime();
};

/*
 * Deadline semantics (verified against PostOpportunity + Explore): the
 * deadline form field is a calendar DATE (`YYYY-MM-DD` string); a listing
 * expires after 23:59:59 local time on that date. Missing, empty, or
 * unparseable deadlines never expire a listing — and an absent deadline
 * never makes an otherwise ineligible (closed/rejected/pending) listing
 * eligible. Use alongside the status gates in getActivePosts, not instead
 * of them. Pure: reads only, injectable `now` for deterministic tests.
 */
export const isExpired = (post, now = new Date()) => {
  const end = toExpiryInstant(post?.deadline);

  if (!Number.isFinite(end)) return false;

  const at = now instanceof Date ? now.getTime() : new Date(now).getTime();

  if (!Number.isFinite(at)) return false;

  return at > end;
};

export const VERIFIED_REASONS = {
  EMPLOYER_NOT_VERIFIED: "employer-not-verified",
  REVIEW_PENDING: "review-pending",
  REVIEW_REJECTED: "review-rejected",
  SAFETY_FLAGGED: "safety-flagged",
  EXPIRED: "expired",
  NOT_ACTIVE: "not-active",
};

/*
 * Trustworthy verification signal for Opportunity Radar / Verified Standard.
 *
 * What each flag actually proves (verified against AdminReview,
 * postService, and firestore.rules — see comments inline):
 *
 * - employerVerified: post.verified === true. The rules force this field to
 *   mirror users/{ownerUid}.verified at creation, and only an admin can set
 *   that user flag (via an approved verificationRequests review). This is
 *   genuine proof of an admin identity check. `companyVerified` is
 *   deliberately NOT accepted: nothing in the codebase writes it, so it can
 *   only come from legacy or seed data.
 * - reviewPassed: reviewStatus/moderationStatus are "approved" (absent
 *   treated as approved, mirroring the visibility gate). LIMITATION,
 *   documented here on purpose: ordinary posts auto-approve on creation
 *   with values identical to an admin approval, and reviewedBy/reviewedAt
 *   are written only to verificationRequests — never to posts. So this flag
 *   means "in the fully-approved moderation state", NOT "a human reviewed
 *   this listing". If true human-review proof is ever required, posts need
 *   an explicit reviewer stamp (a later phase; no admin-action changes here).
 * - fresh: the deadline has not passed (see isExpired).
 * - eligible: the listing passes the same visibility gate as getActivePosts
 *   (not closed, no pending/rejected review state) plus an explicit safety
 *   requirement. Stricter than getActivePosts on purpose: that gate does not
 *   check safetyStatus, but a suspicious listing must never qualify here.
 * - verified: all four hold. `trusted`, `featured`, `urgent`, completeness,
 *   and ownership are never sufficient on their own.
 *
 * Pure and side-effect free. `reasons` is empty exactly when verified.
 */
export const getVerifiedOpportunitySignal = (post, now = new Date()) => {
  const reviewStatus = post?.reviewStatus || "approved";
  const moderationStatus = post?.moderationStatus || "approved";
  const reasons = [];

  const employerVerified = post?.verified === true;

  if (!employerVerified) {
    reasons.push(VERIFIED_REASONS.EMPLOYER_NOT_VERIFIED);
  }

  let reviewPassed = true;

  if (reviewStatus === "pending" || moderationStatus === "pending") {
    reviewPassed = false;
    reasons.push(VERIFIED_REASONS.REVIEW_PENDING);
  } else if (reviewStatus === "rejected" || moderationStatus === "rejected") {
    reviewPassed = false;
    reasons.push(VERIFIED_REASONS.REVIEW_REJECTED);
  } else if (
    reviewStatus === "approved" &&
    moderationStatus === "approved" &&
    !(post?.reviewedBy && post?.approvedAt)
  ) {
    // Genuine administrator review evidence required: when a post is
    // employer-verified and in the fully-approved moderation state, it
    // must have recorded review evidence (reviewedBy or approvedAt) to
    // prove the approval was not merely an auto-default from post
    // creation.  This prevents listing owners from claiming verified
    // status without human review.
    reviewPassed = false;
    reasons.push(VERIFIED_REASONS.REVIEW_PENDING);
  }
  const safetyOk =
    post?.safetyStatus === "clear" &&
    post?.suspicious !== true;

  if (!safetyOk) {
    reviewPassed = false;
    reasons.push(VERIFIED_REASONS.SAFETY_FLAGGED);
  }

  const fresh = !isExpired(post, now);

  if (!fresh) {
    reasons.push(VERIFIED_REASONS.EXPIRED);
  }

  const eligible =
    post?.status !== "closed" &&
    reviewStatus !== "pending" &&
    reviewStatus !== "rejected" &&
    moderationStatus !== "pending" &&
    moderationStatus !== "rejected" &&
    safetyOk;

  if (!eligible) {
    reasons.push(VERIFIED_REASONS.NOT_ACTIVE);
  }

  const verified =
    employerVerified && reviewPassed && fresh && eligible;

  return {
    employerVerified,
    reviewPassed,
    fresh,
    eligible,
    verified,
    reasons,
  };
};

export const buildPostUrl = (postId) => {
  const base = window.location.origin;

  return `${base}/explore?post=${encodeURIComponent(postId)}`;
};

export const readSharedPostId = (searchParams, location) => {
  const fromRouter = searchParams.get("post");

  if (fromRouter) return fromRouter;

  const hash = window.location.hash || "";
  const queryString = hash.includes("?") ? hash.split("?")[1] : "";

  const fromHash = new URLSearchParams(queryString).get("post");

  if (fromHash) return fromHash;

  const fromLocation = new URLSearchParams(
    location.search || ""
  ).get("post");

  return fromLocation;
};

export const cleanPostForStorage = (post) => {
  const normalized = { ...post };

  delete normalized.icon;

  return Object.entries(normalized).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {});
};

export const getDateValue = (value) => {
  if (!value) return Date.now();

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  return value;
};