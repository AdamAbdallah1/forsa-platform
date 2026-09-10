import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../lib/firebase";
import { getAccount } from "../lib/auth";
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaGlobe,
  FaShareAlt,
  FaFlag,
  FaBookmark,
  FaRegBookmark,
  FaPaperPlane,
  FaCheckCircle,
} from "react-icons/fa";

import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import SignInRequiredModal from "../components/SignInRequiredModal";
import ExternalAppliedModal from "../components/ExternalAppliedModal";
import { getPostById, incrementPostMetric, recordApplyClick } from "../lib/postService";
import { buildJobPostingSchema } from "../lib/seo";
import { createReport } from "../lib/reportService";
import { getUserSavedJobs, saveJob, unsaveJob } from "../lib/savedJobsService";
import { createExternalApplication } from "../lib/applicationService";
import { showToast } from "../lib/Toast";

const getWorkCountry = (item) => item?.workCountry || "Lebanon";

const getExternalApplicationType = (item) => {
  if (item?.applicationMethod !== "external") return "";
  return item?.externalApplicationType || "url";
};

const buildMailtoLink = (item) => {
  const email = String(item?.applicationEmail || "").trim();
  const subject = `Application — ${item?.title || "Job"} — via Forsa`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
};

const isAbroadPost = (item) => {
  return String(getWorkCountry(item)).toLowerCase() !== "lebanon";
};

const isAgencyPost = (item) => {
  return (
    item?.postSource === "agency" ||
    item?.sourceType === "agency" ||
    item?.category === "Recruitment Agency" ||
    item?.type === "Recruitment Agency"
  );
};

const getHiringFor = (item) => {
  return item?.hiringFor || item?.targetRole || item?.company || "Hiring";
};

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function InfoRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="border-b border-[var(--forsa-border)] py-3 last:border-0">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-neutral-800">
        {value}
      </p>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]">
      {children}
    </span>
  );
}

function CompanyMark({ name }) {
  const initials = String(name || "Company")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--forsa-primary)] text-sm font-bold tracking-wide text-white shadow-[0_10px_24px_rgba(109,40,217,0.18)]">
      {initials || "F"}
    </div>
  );
}

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [showExternalApplied, setShowExternalApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadJob = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const result = await getPostById(jobId);

        if (cancelled) return;

        if (!result) {
          setNotFound(true);
          setJob(null);
          return;
        }

        setJob(result);

        try {
          await incrementPostMetric(result.id, "views");
        } catch (error) {
          console.error("Failed to record view:", error);
        }
      } catch (error) {
        console.error("Failed to load job:", error);

        if (!cancelled) {
          setNotFound(true);
          setJob(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadJob();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (!job?.id || !auth.currentUser?.uid) return;

    let active = true;

    getUserSavedJobs(auth.currentUser.uid)
      .then((items) => {
        if (active) {
          setSaved(items.some((item) => String(item.postId) === String(job.id)));
        }
      })
      .catch((error) => {
        console.error("Could not load saved state:", error);
      });

    return () => {
      active = false;
    };
  }, [job?.id]);

  useEffect(() => {
    const previous = document.querySelector(
      "script[data-forsa-jobposting]"
    );

    if (previous) previous.remove();

    if (!job) return undefined;

    const schema = buildJobPostingSchema(job);

    if (!schema) return undefined;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-forsa-jobposting", "true");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const current = document.querySelector(
        "script[data-forsa-jobposting]"
      );

      if (current) current.remove();
    };
  }, [job]);

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: job?.title || "Job opportunity on Forsa",
          text: job?.company
            ? `${job.title} at ${job.company}`
            : job?.title || "Job opportunity on Forsa",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied");

      window.setTimeout(() => {
        setShareStatus("");
      }, 2000);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  };

  const handleApply = () => {
    if (!job) return;

    const session = getAccount();
    const seekerUid = session?.accountType !== "hiring" ? session?.uid : null;

    if (!session) {
      setShowSignInPrompt(true);
      return;
    }

    if (job.applicationMethod === "external") {
      const externalType = getExternalApplicationType(job);

      const trackExternalApplication = () => {
        if (!seekerUid) return;

        createExternalApplication(job, session)
          .then(() => setShowExternalApplied(true))
          .catch((error) => {
            console.error("Could not save external application tracking:", error);
          });
      };

      if (externalType === "email") {
        const email = String(job.applicationEmail || "").trim();

        if (!email) {
          showToast("This application email is unavailable.", "error");
          return;
        }

        window.open(
          buildMailtoLink(job),
          "_blank",
          "noopener,noreferrer"
        );
        trackExternalApplication();
        showToast(`Email ${email} with your CV and application details`);
        if (seekerUid) {
          recordApplyClick({ postId: job.id, uid: seekerUid, method: "email" });
        }
        return;
      }

      try {
        const url = new URL(job.applicationUrl);

        if (!["http:", "https:"].includes(url.protocol)) {
          return;
        }

        window.open(url.href, "_blank", "noopener,noreferrer");
        trackExternalApplication();
        showToast("Opening the external application page");
        if (seekerUid) {
          recordApplyClick({ postId: job.id, uid: seekerUid, method: "url" });
        }
      } catch {
        showToast("This application link is unavailable.", "error");
      }

      return;
    }

    if (seekerUid) {
      recordApplyClick({ postId: job.id, uid: seekerUid, method: "forsa" });
    }

    navigate(`/explore?post=${encodeURIComponent(job.id)}&apply=1`);
  };

  const handleSave = async () => {
    if (!job) return;

    if (!auth.currentUser) {
      showToast("Sign in to save opportunities", "info");
      navigate("/auth?mode=login");
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setSaveLoading(true);

    try {
      if (nextSaved) {
        await saveJob({ post: job });
        showToast("Opportunity saved");
      } else {
        await unsaveJob({ postId: job.id });
        showToast("Removed from saved jobs");
      }
    } catch (error) {
      console.error("Save job error:", error);
      setSaved(!nextSaved);
      showToast("Could not update saved jobs. Try again.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReport = async () => {
    if (!job || reporting) return;

    if (!auth.currentUser) {
      showToast("Sign in to report an opportunity", "info");
      navigate("/auth?mode=login");
      return;
    }

    const reason = window.prompt(
      "Report reason: fake post, unclear pay, spam, unsafe, or other"
    );

    if (!reason?.trim()) return;

    setReporting(true);

    try {
      await createReport({
        postId: job.id,
        title: job.title,
        company: job.company,
        reason: reason.trim(),
        reporterUid: auth.currentUser.uid,
        reporterEmail: auth.currentUser.email || null,
        ownerUid: job.ownerUid || null,
        ownerEmail: job.ownerEmail || job.contact || null,
      });
      showToast("Report submitted", "info");
    } catch (error) {
      console.error("Report opportunity error:", error);
      showToast("Could not submit the report. Try again.", "error");
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#fbfafc]">
        <AppHeader />

        <main className="mx-auto max-w-[1100px] px-4 pb-32 pt-8 sm:px-6 lg:pb-16">
          <div className="animate-pulse">
            <div className="h-4 w-24 rounded bg-neutral-200" />
            <div className="mt-8 h-10 w-3/4 rounded bg-neutral-200" />
            <div className="mt-3 h-5 w-1/2 rounded bg-neutral-200" />

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="h-80 rounded-[28px] bg-white" />
              <div className="h-72 rounded-[28px] bg-white" />
            </div>
          </div>
        </main>

        <Footer />
      </section>
    );
  }

  if (notFound || !job) {
    return (
      <section className="min-h-screen bg-[#fbfafc]">
        <AppHeader />

        <main className="mx-auto flex min-h-[65vh] max-w-[700px] items-center justify-center px-4 py-16 text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
              <FaBriefcase />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              Opportunity not found
            </h1>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              This opportunity may have been removed, closed, or is no longer
              available.
            </p>

            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              <FaArrowLeft className="text-xs" />
              Back to Explore
            </button>
          </div>
        </main>

        <Footer />
      </section>
    );
  }

  const abroad = isAbroadPost(job);
  const agency = isAgencyPost(job);
  const externalIsEmail =
    getExternalApplicationType(job) === "email";
  const companyLabel = job.verified
    ? `${job.company} · Verified`
    : job.trusted
      ? `${job.company} · Trusted`
      : job.company;

  return (
    <section className="min-h-screen bg-[#fbfafc]">
      <SEO
        title={`${job.title} at ${job.company || "Forsa"}`}
        description={
          job.description ||
          `${job.title} opportunity${job.company ? ` at ${job.company}` : ""} on Forsa.`
        }
        url={`https://forsa.digital/jobs/${job.id}`}
      />

      <AppHeader />

      <main className="mx-auto max-w-[1100px] px-4 pb-32 pt-5 sm:px-6 lg:pb-16">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          <FaArrowLeft className="text-xs" />
          Back
        </button>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <section className="rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:rounded-[28px] sm:p-7">
              <div className="flex items-start gap-4">
                <CompanyMark name={job.company} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {job.type && <Badge>{job.type}</Badge>}

                    {job.urgent && (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
                        Urgent
                      </span>
                    )}

                    {agency && <Badge>Agency</Badge>}

                    {abroad && <Badge>Abroad · {getWorkCountry(job)}</Badge>}
                  </div>

                  <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#18121f] sm:text-4xl">
                    {job.title}
                  </h1>

                  <p className="mt-2 text-base font-semibold text-neutral-700">
                    {job.company || "Company"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-500">
                    {job.location && (
                      <span className="inline-flex items-center gap-2">
                        <FaMapMarkerAlt className="text-[var(--forsa-primary)]" />
                        {job.location}
                      </span>
                    )}

                    {abroad && (
                      <span className="inline-flex items-center gap-2">
                        <FaGlobe className="text-[var(--forsa-primary)]" />
                        {getWorkCountry(job)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2 border-t border-[var(--forsa-border)] pt-5">
                {job.verified && <Badge>Verified company</Badge>}
                {!job.verified && job.trusted && <Badge>Trusted company</Badge>}
                {job.featured && <Badge>Featured</Badge>}
                {!job.verified && !job.trusted && (
                  <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-500">
                    New poster
                  </span>
                )}
              </div>

              <div className="mt-8 border-t border-[var(--forsa-border)] pt-7">
  <h2 className="text-xl font-semibold tracking-[-0.025em]">
    About the opportunity
  </h2>

  <div className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600 sm:text-base">
    {job.description || "No description provided."}
  </div>

  {job.requirements?.trim() && (
    <div className="mt-7 border-t border-[var(--forsa-border)] pt-7">
      <h2 className="text-xl font-semibold tracking-[-0.025em]">
        Requirements
      </h2>

      <div className="mt-4 whitespace-pre-line text-sm leading-7 text-neutral-600 sm:text-base">
        {job.requirements}
      </div>
    </div>
  )}
</div>

              {Array.isArray(job.tags) && job.tags.length > 0 && (
                <div className="mt-8 border-t border-[var(--forsa-border)] pt-7">
                  <h2 className="text-xl font-semibold tracking-[-0.025em]">
                    Skills & tags
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {agency && (
              <section className="mt-5 rounded-[24px] border border-[var(--forsa-primary)]/15 bg-[var(--forsa-bg-soft)] p-5 sm:p-6">
                <h2 className="font-semibold text-[var(--forsa-primary)]">
                  Recruitment / placement agency
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  This opportunity was posted by a recruitment or placement
                  agency. Verify the employer and application details before
                  sharing sensitive information or making payments.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Hiring for" value={getHiringFor(job)} />
                  <InfoRow
                    label="Work location"
                    value={
                      abroad
                        ? `${job.location || "Not specified"} · ${getWorkCountry(job)}`
                        : job.location
                    }
                  />
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit lg:sticky lg:top-6">
            <section className="rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:rounded-[28px] sm:p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-400">
                  At a glance
                </p>

                <div className="mt-3">
                  <InfoRow label="Company" value={companyLabel} />
                  <InfoRow label="Type" value={job.type} />
                  <InfoRow label="Location" value={job.location} />
                  {abroad && (
                    <InfoRow label="Country" value={getWorkCountry(job)} />
                  )}
                  <InfoRow label="Pay" value={job.pay} />
                  <InfoRow
                    label="Posted"
                    value={formatDate(job.createdAt)}
                  />
                                    {job.deadline && (
                    <InfoRow
                      label="Application deadline"
                      value={formatDate(job.deadline)}
                    />
                  )}
                  {agency && (
                    <InfoRow label="Hiring for" value={getHiringFor(job)} />
                  )}
                </div>
              </div>

              {job.applicationMethod === "external" && (
                <div className="mt-5 rounded-2xl border border-[var(--forsa-primary)]/15 bg-[var(--forsa-bg-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--forsa-primary)]">
                    External application
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {externalIsEmail
                      ? "Your email app will open so you can send your CV to the company."
                      : "You will be redirected to the company&apos;s application page."}
                  </p>
                </div>
              )}

              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(109,40,217,0.18)] transition hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                >
                  <FaPaperPlane className="text-xs" />
                  {job.applicationMethod === "external"
                    ? externalIsEmail
                      ? "Apply via email"
                      : "Apply externally"
                    : "Apply"}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveLoading}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3.5 text-sm font-medium transition ${
                    saved
                      ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                      : "border-[var(--forsa-border)] bg-white text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {saved ? <FaBookmark /> : <FaRegBookmark />}
                  {saved ? "Saved" : "Save job"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
                >
                  <FaShareAlt className="text-xs" />
                  {shareStatus || "Share opportunity"}
                </button>

                <button
                  type="button"
                  onClick={handleReport}
                  disabled={reporting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3.5 text-sm font-medium text-neutral-500 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFlag className="text-xs" />
                  Report opportunity
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4">
                <FaCheckCircle className="mt-0.5 shrink-0 text-[var(--forsa-primary)]" />

                <p className="text-xs leading-5 text-neutral-500">
                  Never pay to apply for a job. Verify requests for money,
                  personal documents, or financial information.
                </p>
              </div>
            </section>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--forsa-border)] bg-white/95 p-3 shadow-[0_-10px_30px_rgba(20,12,40,0.08)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto grid max-w-[1100px] grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="min-h-11 rounded-full bg-[var(--forsa-primary)] px-4 text-sm font-semibold text-white shadow-sm"
            >
              {job.applicationMethod === "external"
                ? externalIsEmail
                  ? "Apply via email"
                  : "Apply externally"
                : "Apply now"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              aria-label={saved ? "Remove from saved jobs" : "Save opportunity"}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border ${
                saved
                  ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                  : "border-[var(--forsa-border)] bg-white text-neutral-600"
              }`}
            >
              {saved ? <FaBookmark /> : <FaRegBookmark />}
            </button>
          </div>
        </div>
      </main>

      <Footer />

      <SignInRequiredModal
        open={showSignInPrompt}
        onSignIn={() => navigate("/auth?mode=login")}
        onCreateAccount={() => navigate("/auth")}
        onClose={() => setShowSignInPrompt(false)}
      />

      <ExternalAppliedModal
        open={showExternalApplied}
        onClose={() => setShowExternalApplied(false)}
      />
    </section>
  );
}