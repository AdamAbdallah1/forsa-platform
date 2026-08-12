import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppHeader from "../components/AppHeader";
import SEO from "../components/SEO";

import {
  FaArrowLeft,
  FaBriefcase,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGraduationCap,
  FaLink,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";

/* ============================================================
   HELPERS
============================================================ */

function cleanList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          return (
            item.title ||
            item.name ||
            item.label ||
            item.value ||
            item.description ||
            ""
          );
        }

        return String(item);
      })
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const result =
      value.title ||
      value.name ||
      value.label ||
      value.value ||
      value.description;

    return result ? [String(result).trim()] : [];
  }

  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (typeof value === "object") {
    return (
      value.text ||
      value.description ||
      value.name ||
      value.title ||
      fallback
    );
  }

  return fallback;
}

function getCvData(user) {
  const raw = user?.cv || user?.publicCv;

  if (!raw) return null;

  if (typeof raw === "string") {
    return {
      url: raw,
      name: "CV / Resume",
    };
  }

  if (typeof raw === "object") {
    return {
      url:
        typeof raw.url === "string"
          ? raw.url
          : typeof raw.downloadURL === "string"
          ? raw.downloadURL
          : typeof raw.downloadUrl === "string"
          ? raw.downloadUrl
          : "",

      name:
        typeof raw.name === "string"
          ? raw.name
          : typeof raw.fileName === "string"
          ? raw.fileName
          : "CV / Resume",
    };
  }

  return null;
}

function normalizeUrl(value) {
  if (!value) return "";

  const url = String(value).trim();

  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}

/* ============================================================
   MAIN
============================================================ */

export default function PublicSeekerProfile() {
  const { uid } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError("");
      setUser(null);

      try {
        if (!uid) {
          throw new Error("Missing seeker UID.");
        }

        const userRef = doc(db, "users", uid);
        const snapshot = await getDoc(userRef);

        if (!mounted) return;

        if (!snapshot.exists()) {
          setUser(null);
          return;
        }

        const data = snapshot.data() || {};

        setUser({
          uid: snapshot.id,
          ...data,
        });
      } catch (error) {
        console.error("Public seeker profile error:", error);

        if (!mounted) return;

        setLoadError(
          "We could not load this profile right now."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [uid]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <SEO title="Seeker Profile" />
        <AppHeader />

        <main className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
          <div className="rounded-3xl border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">
              Loading profile...
            </p>
          </div>
        </main>
      </section>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (loadError) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <SEO title="Profile unavailable" />
        <AppHeader />

        <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
          <div className="rounded-3xl border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <FaUser />
            </div>

            <h1 className="mt-4 text-xl font-semibold">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {loadError}
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full forsa-button px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try again
              </button>

              <Link
                to="/applicants"
                className="inline-flex items-center rounded-full border border-[var(--forsa-border)] bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700"
              >
                Back
              </Link>
            </div>
          </div>
        </main>
      </section>
    );
  }

  /* ============================================================
     NOT FOUND
  ============================================================ */

  if (!user || user.accountType === "hiring") {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <SEO title="Profile not found" />
        <AppHeader />

        <main className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
          <div className="rounded-3xl border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-neutral-500">
              <FaUser />
            </div>

            <h1 className="mt-4 text-xl font-semibold">
              Profile not found
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              This seeker profile is unavailable or private.
            </p>

            <Link
              to="/applicants"
              className="mt-6 inline-flex rounded-full forsa-button px-5 py-2.5 text-sm font-semibold text-white"
            >
              Back to applicants
            </Link>
          </div>
        </main>
      </section>
    );
  }

  /* ============================================================
     NORMALIZED DATA
  ============================================================ */

  const name = cleanText(user.name, "Seeker");
  const city = cleanText(user.city, "Lebanon");
  const email = cleanText(user.email, "");

  const bio = cleanText(
    user.bio || user.about,
    "No public summary has been added yet."
  );

  const skills = cleanList(
    user.skills || user.publicSkills
  );

  const lookingFor = cleanList(
    user.lookingFor || user.publicLookingFor
  );

  const experience = cleanList(user.experience);
  const education = cleanList(user.education);

  const portfolioLinks = cleanList(
    user.portfolioLinks || user.portfolio
  );

  const cv = getCvData(user);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title={`${name} — Seeker Profile`} />

      <AppHeader />

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-7 sm:px-6">
        {/* Back */}

        <Link
          to="/applicants"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-[var(--forsa-primary)]"
        >
          <FaArrowLeft className="text-xs" />
          Back to applicants
        </Link>

        {/* ======================================================
            PROFILE HEADER
        ====================================================== */}

        <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--forsa-border)] bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Identity */}

              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--forsa-primary)] text-xl font-semibold text-white">
                  {initials || "S"}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                      {name}
                    </h1>

                    <span className="rounded-full bg-[var(--forsa-bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--forsa-primary)]">
                      Seeker
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                    <span className="inline-flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-xs" />
                      {city}
                    </span>

                    {email && (
                      <span className="inline-flex items-center gap-1.5 break-all">
                        <FaEnvelope className="text-xs" />
                        {email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* CV */}

              {cv?.url && (
                <a
                  href={cv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full forsa-button px-5 py-3 text-sm font-semibold text-white"
                >
                  <FaFileAlt className="text-xs" />
                  View CV
                </a>
              )}
            </div>
          </div>

          {/* Quick facts */}

          <div className="grid border-t border-[var(--forsa-border)] sm:grid-cols-3">
            <QuickFact
              icon={<FaBriefcase />}
              label="Looking for"
              value={
                lookingFor.length
                  ? lookingFor.slice(0, 2).join(" · ")
                  : "Not specified"
              }
            />

            <QuickFact
              icon={<FaUser />}
              label="Skills"
              value={
                skills.length
                  ? `${skills.length} listed`
                  : "Not specified"
              }
            />

            <QuickFact
              icon={<FaFileAlt />}
              label="CV"
              value={cv?.url ? "Available" : "Not available"}
            />
          </div>
        </div>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main */}

          <div className="space-y-5">
            {/* About */}

            <Card>
              <SectionTitle
                icon={<FaUser />}
                title="About"
              />

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600">
                {bio}
              </p>
            </Card>

            {/* Skills */}

            <Card>
              <SectionTitle
                icon={<FaBriefcase />}
                title="Skills"
              />

              {skills.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-3 py-1.5 text-xs font-medium text-neutral-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyText text="No skills added yet." />
              )}
            </Card>

            {/* Experience */}

            <TimelineCard
              icon={<FaBriefcase />}
              title="Experience"
              items={experience}
              empty="No experience added yet."
            />

            {/* Education */}

            <TimelineCard
              icon={<FaGraduationCap />}
              title="Education"
              items={education}
              empty="No education added yet."
            />
          </div>

          {/* Sidebar */}

          <aside className="space-y-5">
            {/* Looking for */}

            <Card>
              <SectionTitle
                icon={<FaBriefcase />}
                title="Looking for"
              />

              {lookingFor.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {lookingFor.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyText text="No preferences added yet." />
              )}
            </Card>

            {/* CV */}

            <Card>
              <SectionTitle
                icon={<FaFileAlt />}
                title="CV / Resume"
              />

              {cv?.url ? (
                <div className="mt-4">
                  <p className="text-sm text-neutral-600">
                    {cv.name || "CV / Resume"}
                  </p>

                  <a
                    href={cv.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                    Open CV
                  </a>
                </div>
              ) : (
                <EmptyText text="No CV available." />
              )}
            </Card>

            {/* Contact */}

            {email && (
              <Card>
                <SectionTitle
                  icon={<FaEnvelope />}
                  title="Contact"
                />

                <a
                  href={`mailto:${email}`}
                  className="mt-4 block break-all text-sm font-medium text-[var(--forsa-primary)] hover:underline"
                >
                  {email}
                </a>
              </Card>
            )}
          </aside>
        </div>

        {/* ======================================================
            PORTFOLIO
        ====================================================== */}

        <Card className="mt-5">
          <SectionTitle
            icon={<FaLink />}
            title="Portfolio"
          />

          {portfolioLinks.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {portfolioLinks.map((link, index) => {
                const safeLink = normalizeUrl(link);

                if (!safeLink) return null;

                return (
                  <a
                    key={`${safeLink}-${index}`}
                    href={safeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3 text-sm transition hover:border-[var(--forsa-primary)]"
                  >
                    <span className="min-w-0 truncate font-medium text-neutral-700">
                      {link}
                    </span>

                    <FaExternalLinkAlt className="shrink-0 text-xs text-neutral-400 transition group-hover:text-[var(--forsa-primary)]" />
                  </a>
                );
              })}
            </div>
          ) : (
            <EmptyText text="No portfolio links added yet." />
          )}
        </Card>
      </main>
    </section>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-[var(--forsa-border)] bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm text-[var(--forsa-primary)]">
        {icon}
      </span>

      <h2 className="text-sm font-semibold text-neutral-900">
        {title}
      </h2>
    </div>
  );
}

function QuickFact({ icon, label, value }) {
  return (
    <div className="border-t border-[var(--forsa-border)] p-4 sm:border-t-0 sm:border-l first:sm:border-l-0">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
        <span className="text-[var(--forsa-primary)]">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-1.5 truncate text-sm font-semibold text-neutral-800">
        {value}
      </p>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <p className="mt-4 text-sm text-neutral-500">
      {text}
    </p>
  );
}

function TimelineCard({
  icon,
  title,
  items,
  empty,
}) {
  return (
    <Card>
      <SectionTitle
        icon={icon}
        title={title}
      />

      {items.length ? (
        <div className="mt-4 space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4 text-sm leading-6 text-neutral-700"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <EmptyText text={empty} />
      )}
    </Card>
  );
}