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

export const calculateMatchScore = (post, profile, account) => {
  const skills = (profile?.skills || []).map(normalize);
  const lookingFor = (profile?.lookingFor || []).map(normalize);
  const tags = (post?.tags || []).map(normalize);
  const postType = normalize(post?.type);
  const postLocation = normalize(post?.location);
  const accountCity = normalize(account?.city);

  if (!skills.length && !lookingFor.length && !accountCity) {
    return 0;
  }

  let score = 35;

  const matchedTags = tags.filter((tag) => skills.includes(tag));

  if (tags.length > 0) {
    score += Math.min(
      35,
      Math.round((matchedTags.length / tags.length) * 35)
    );
  }

  const goalMatch = lookingFor.some((item) => {
    return (
      item === postType ||
      item === `${postType} work` ||
      item === `${postType} job` ||
      item.includes(postType) ||
      postType.includes(item)
    );
  });

  if (goalMatch) score += 18;

  if (accountCity && postLocation.includes(accountCity)) {
    score += 10;
  }

  if (post?.featured) score += 4;
  if (post?.urgent) score += 3;

  return Math.min(98, Math.max(0, score));
};

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