import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/*
 * Makes app.forsa.digital the canonical host for the application.
 *
 * On the marketing hostnames (forsa.digital and www.forsa.digital) any
 * application route is redirected to the same path on the app host, with
 * the query string and hash preserved verbatim. Marketing and unknown
 * routes stay on the apex, so the homepage, /about, /privacy, /terms,
 * /jobs-in-lebanon, /companies, /company/:email, /text and unmatched
 * paths are never redirected.
 *
 * The app host, localhost, and Vercel preview/deployment URLs are not in
 * APEX_HOSTS, so they are never redirected — this component is inert on
 * them and there is no route back to the apex.
 *
 * Redirect uses window.location.replace() on a different host, which is a
 * full navigation. That replaces the apex entry in session history rather
 * than pushing a new one, so the browser Back button never bounces
 * between the two hosts.
 *
 * Route matching uses an explicit APPLICATION_PATHS set rather than a
 * marketing denylist: a future marketing route defaults to staying on the
 * apex, which fails safe. APPLICATION_PREFIXES covers the parameterized
 * application routes (/jobs/:jobId, /seeker/:uid, /admin/*).
 */

const APP_ORIGIN = "https://app.forsa.digital";

const APEX_HOSTS = new Set(["forsa.digital", "www.forsa.digital"]);

const APPLICATION_PATHS = new Set([
  "/auth",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
  "/onboarding",
  "/explore",
  "/dashboard",
  "/admin-review",
  "/saved",
  "/applications",
  "/profile",
  "/messages",
  "/people",
  "/notifications",
  "/post",
  "/applicants",
  "/ai",
]);

const APPLICATION_PREFIXES = ["/jobs", "/seeker", "/admin"];

const normalizePathname = (pathname) => {
  const trimmed = String(pathname || "/").replace(/\/+$/, "");

  return trimmed || "/";
};

function isApexHost() {
  return (
    typeof window !== "undefined" &&
    APEX_HOSTS.has(window.location.hostname)
  );
}

function isApplicationPath(pathname) {
  const path = normalizePathname(pathname);

  if (APPLICATION_PATHS.has(path)) return true;

  return APPLICATION_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export default function ApexAppRedirect() {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (!isApexHost()) return;
    if (!isApplicationPath(pathname)) return;

    const target = `${APP_ORIGIN}${pathname}${location.search}${location.hash}`;

    window.location.replace(target);
  }, [pathname, location.search, location.hash]);

  return null;
}
