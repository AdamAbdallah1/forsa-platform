/*
 * Public profile projection builder.
 *
 * Pure data-transform: no Firebase imports, so the SAME whitelist logic is
 * used by the client sync (publicProfileService.js) and the admin-side
 * backfill script (scripts/backfillPublicProfiles.js). Keeping one source of
 * truth guarantees the server never publishes fields the client can't.
 */

export const PUBLIC_PROFILE_COLLECTION = "publicProfiles";

export { sanitizeCompanyBio };

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
function normalizeProjects(projects) {
  if (!Array.isArray(projects)) return undefined;

  const allowed = ["id", "name", "description", "role", "technologies", "liveDemoUrl", "sourceCodeUrl", "coverImage"];
  const normalized = [];

  projects.forEach((project) => {
    if (project === null || project === undefined) return;
    if (typeof project !== "object") return;

    const clean = {};
    allowed.forEach((key) => {
      const val = project[key];
      if (key === "technologies") {
        const arr = (val || [])
          .filter((t) => typeof t === "string")
          .map((t) => t.trim())
          .filter((t, i, self) => self.indexOf(t) === i);
        if (arr.length > 0) clean.technologies = arr;
      } else if (key === "liveDemoUrl" || key === "sourceCodeUrl") {
        if (val && typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
          clean[key] = val;
        }
      } else if (key === "coverImage") {
        if (val && typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://") || val === "")) {
          clean.coverImage = val;
        }
      } else {
        if (val !== undefined && val !== null) {
          const trimmed = typeof val === "string" ? val.trim() : String(val);
          if (trimmed) clean[key] = trimmed;
        }
      }
    });

    if (clean.id || clean.name || clean.description || clean.technologies || clean.liveDemoUrl || clean.sourceCodeUrl || clean.coverImage) {
      normalized.push(clean);
    }
  });

  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Sanitize company bio to prevent accidental exposure of Firebase Auth
 * user directory data. The directory export contains column headers:
 * "Identifier", "Providers", "Created", "Signed In", "User UID", "Actions".
 * If these appear together in the bio, it indicates accidental leakage
 * of Firebase Auth user list data. We strip such content.
 */
function sanitizeCompanyBio(value) {
  const cleaned = cleanString(value);
  if (!cleaned) return undefined;

  // Firebase Auth user directory export column headers
  const directoryHeaders = [
    "Identifier",
    "Providers",
    "Created",
    "Signed In",
    "User UID",
    "Actions",
  ];

  // Check if the bio contains multiple directory headers (indicating leakage)
  const headerCount = directoryHeaders.filter((h) => cleaned.includes(h)).length;

  if (headerCount >= 3) {
    // Likely a leaked user directory export; return empty to prevent exposure
    console.warn("Detected likely Firebase Auth user directory data in companyBio; sanitizing");
    return undefined;
  }

  return cleaned || undefined;
}

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
    profile.projects = normalizeProjects(user?.projects);
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
    profile.companyBio = sanitizeCompanyBio(user?.companyBio);
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