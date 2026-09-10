const EMPLOYMENT_TYPE_MAP = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  "Internship": "INTERN",
  "Volunteer": "VOLUNTEER",
};

const COUNTRY_CODE_MAP = {
  Lebanon: "LB",
  "UAE / Dubai": "AE",
  Germany: "DE",
  Qatar: "QA",
  "Saudi Arabia": "SA",
};

const cleanText = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, "")
    .trim();

const toDateTime = (value) => {
  if (!value) return null;

  try {
    const date =
      typeof value?.toDate === "function" ? value.toDate() : new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
  } catch {
    return null;
  }
};

const isRemoteLocation = (post) => {
  const type = cleanText(post.type).toLowerCase();

  return (
    type === "remote" ||
    cleanText(post.workCountry).toLowerCase() === "remote / online"
  );
};

const isHybridLocation = (post) => {
  return cleanText(post.type).toLowerCase() === "hybrid";
};

export const isPubliclyVisiblePost = (post) => {
  if (!post) return false;

  const review = post.reviewStatus || "approved";
  const moderation = post.moderationStatus || "approved";

  return (
    post.status !== "closed" &&
    review !== "pending" &&
    moderation !== "pending" &&
    review !== "rejected" &&
    moderation !== "rejected"
  );
};

export const buildJobPostingSchema = (post) => {
  if (!isPubliclyVisiblePost(post)) return null;

  const title = cleanText(post.title);
  if (!title) return null;

  const datePosted = toDateTime(post.createdAt);

  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description:
      cleanText(post.description) ||
      [title, cleanText(post.company), post.type, post.location, post.pay, post.workCountry]
        .filter(Boolean)
        .join(" — "),
    datePosted,
  };

  if (!datePosted) delete schema.datePosted;

  const validThrough = /^\d{4}-\d{2}-\d{2}$/.test(cleanText(post.deadline))
    ? cleanText(post.deadline)
    : null;

  if (validThrough) schema.validThrough = validThrough;

  const employmentType = EMPLOYMENT_TYPE_MAP[cleanText(post.type)];

  if (employmentType) schema.employmentType = [employmentType];

  const company = cleanText(post.company);
  if (company) {
    schema.hiringOrganization = {
      "@type": "Organization",
      name: company,
    };
  }

  const remote = isRemoteLocation(post);
  const hybrid = isHybridLocation(post);
  const countryCode = COUNTRY_CODE_MAP[cleanText(post.workCountry)];
  const location = cleanText(post.location);

  if (remote || location || countryCode) {
    const address = { "@type": "PostalAddress" };

    if (remote) {
      address.addressLocality = "Remote";
    } else if (location) {
      address.addressLocality = location;
    }

    if (countryCode) address.addressCountry = countryCode;

    schema.jobLocation = {
      "@type": "Place",
      address,
    };

    if (remote || hybrid) {
      schema.jobLocationType = remote ? "TELECOMMUTE" : "FLEXIBLE";
    }
  }

  if (post.applicationMethod !== "external") {
    schema.directApply = true;
  }

  return schema;
};