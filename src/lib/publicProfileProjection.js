/*
 * Public profile projection builder.
 *
 * Pure data-transform: no Firebase imports, so the SAME whitelist logic is
 * used by the client sync (publicProfileService.js) and the admin-side
 * backfill script (scripts/backfillPublicProfiles.js). Keeping one source of
 * truth guarantees the server never publishes fields the client can't.
 */

export const PUBLIC_PROFILE_COLLECTION = "publicProfiles";

const COMPANY_ACCOUNT_TYPES = new Set(["hiring", "company"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickList(value) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value.filter(
    (item) => item !== undefined && item !== null
  );

  return cleaned.length > 0 ? cleaned : undefined;
}

function pickObject(value) {
  if (value === undefined || value === null) return undefined;
  return value;
}

/**
 * Build ONLY the intentionally-public projection of a user profile from
 * their private document (already in hand at sync time). Removes
 * undefined/null/empty so the payload is safe for setDoc.
 */
export function buildPublicProfile(user) {
  const profile = {
    uid: user?.uid,
    accountType: user?.accountType,
    name: cleanString(user?.name) || undefined,
    username: cleanString(user?.username) || undefined,
    city: cleanString(user?.city) || undefined,
  };

  const isCompany = COMPANY_ACCOUNT_TYPES.has(user?.accountType);

  if (!isCompany) {
    profile.headline = cleanString(user?.headline) || undefined;
    profile.bio =
      cleanString(user?.bio) ||
      cleanString(user?.about) ||
      cleanString(user?.summary) ||
      undefined;
    profile.availability =
      cleanString(user?.availability) || undefined;
    profile.skills = pickList(user?.publicSkills ?? user?.skills);
    profile.lookingFor = pickList(
      user?.publicLookingFor ?? user?.lookingFor
    );
    profile.experience = pickObject(user?.experience);
    profile.education = pickObject(user?.education);
    profile.portfolioLinks =
      cleanString(user?.portfolioLinks) ||
      cleanString(user?.portfolio) ||
      undefined;
    profile.desiredRole = cleanString(user?.desiredRole) || undefined;
    profile.opportunityType =
      cleanString(user?.opportunityType) || undefined;
    profile.preferredLocation =
      cleanString(user?.preferredLocation) || undefined;
    profile.workPreference =
      cleanString(user?.workPreference) || undefined;
    profile.cvAvailable = Boolean(user?.cv || user?.publicCv) || undefined;
  }

  if (isCompany) {
    profile.companyName =
      cleanString(user?.companyName) ||
      cleanString(user?.name) ||
      undefined;
    profile.companyEmail = cleanString(user?.companyEmail) || undefined;
    profile.email = cleanString(user?.email) || undefined;
    profile.contactPerson =
      cleanString(user?.contactPerson) || undefined;
    profile.companyBio = cleanString(user?.companyBio) || undefined;
    profile.website = cleanString(user?.website) || undefined;
    profile.instagram = cleanString(user?.instagram) || undefined;
  }

  const result = {};

  Object.keys(profile).forEach((key) => {
    const value = profile[key];
    if (value === undefined || value === null) return;
    result[key] = value;
  });

  return result;
}