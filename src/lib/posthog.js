import posthog from "posthog-js";

const US_API_HOST = "https://us.i.posthog.com";

/**
 * Route templates for paths whose single trailing segment is an identifier
 * (Firebase UID, employer email, job post ID). Only the template is ever sent
 * to PostHog — the raw value is replaced before the event is captured.
 */
const IDENTIFIER_ROUTE_TEMPLATES = {
  jobs: "/jobs/:jobId",
  seeker: "/seeker/:uid",
  company: "/company/:email",
};

/**
 * Allowlist of job fields that may leave the browser. Anything not listed
 * here — description, requirements, contact, applicationEmail, ownerEmail,
 * ownerUid, applicants, free-text tags — is deliberately excluded.
 */
const JOB_VIEW_FIELDS = [
  ["id", "job_id"],
  ["title", "job_title"],
  ["company", "job_company"],
  ["type", "job_type"],
  ["location", "job_location"],
  ["workCountry", "job_work_country"],
  ["category", "job_category"],
  ["applicationMethod", "job_application_method"],
  ["verified", "job_verified"],
  ["trusted", "job_trusted"],
  ["featured", "job_featured"],
];

let client = null;
let initialized = false;
let lastTrackedPathname = null;
let lastTrackedJobId = null;

/**
 * Strips query strings and hashes, then replaces identifier-bearing route
 * segments with their route template.
 */
export function sanitizePathname(pathname) {
  const [pathOnly] = String(pathname ?? "").split("?");
  const segments = pathOnly.split("#")[0].split("/").filter(Boolean);

  if (segments.length === 0) return "/";

  if (segments.length === 2 && IDENTIFIER_ROUTE_TEMPLATES[segments[0]]) {
    return IDENTIFIER_ROUTE_TEMPLATES[segments[0]];
  }

  return `/${segments.join("/")}`;
}

function sanitizedUrl() {
  const template = sanitizePathname(window.location.pathname);
  return `${window.location.origin}${template}`;
}

/**
 * Every event captured through here carries a sanitized `$current_url` /
 * `$pathname`, which overrides the raw browser location PostHog would
 * otherwise attach automatically.
 */
function sendEvent(name, properties) {
  if (!client || typeof window === "undefined") return;

  client.capture(name, {
    ...properties,
    $current_url: sanitizedUrl(),
    $pathname: sanitizePathname(window.location.pathname),
  });
}

export function initPostHog() {
  if (initialized) return client;
  initialized = true;

  const key = import.meta.env.VITE_POSTHOG_KEY;

  // Without a key, analytics must not run and must never break the app.
  if (!key) return client;

  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || US_API_HOST,
    // Page views are captured manually, once per pathname.
    capture_pageview: false,
    // No click/form/input autocapture, and no session replay for now.
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_conversations: true,
    disable_product_tours: true,
    // Avoid storing internal referrer URLs.
    property_denylist: ["$referrer", "$referring_domain"],
    mask_personal_data_properties: true,
    save_campaign_params: false,
  });

  client = posthog;
  return client;
}

export function capturePageView(pathname) {
  if (!client) return;

  const template = sanitizePathname(pathname);

  // Deduplicated on module state so React re-renders and StrictMode's
  // double-invoked effects cannot emit a second event for the same path.
  if (template === lastTrackedPathname) return;
  lastTrackedPathname = template;

  sendEvent("$pageview");
}

export function captureJobViewed(job) {
  if (!client || !job?.id) return;

  const jobId = String(job.id);

  if (jobId === lastTrackedJobId) return;
  lastTrackedJobId = jobId;

  const properties = {};

  for (const [source, target] of JOB_VIEW_FIELDS) {
    const value = job[source];

    if (value === undefined || value === null) continue;

    properties[target] = typeof value === "string" ? value.slice(0, 200) : value;
  }

  sendEvent("Job Viewed", properties);
}

/**
 * Identifies a signed-in user by Firebase UID only. No email, display name,
 * photo URL or Firestore profile data is sent.
 */
export function identifyUser(uid) {
  if (!client || !uid) return;

  client.identify(String(uid));
}

export function resetUser() {
  if (!client) return;

  client.reset();
}
