import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileAlt,
  FaInbox,
  FaMapMarkerAlt,
  FaSearch,
  FaTimesCircle,
  FaVideo,
} from "react-icons/fa";

import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

import {
  cancelThreadInterview,
  deleteThreadFromFirestore,
  listenUserThreads,
} from "../lib/applicationService";


function safeJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}


const statusOptions = [
  "all",
  "pending",
  "interview",
  "shortlisted",
  "accepted",
  "rejected",
];


const statusMeta = {
  interview: {
    label: "Interview",
    icon: FaClock,
    className: "bg-blue-50 text-blue-700",
  },

  pending: {
    label: "Pending",
    icon: FaClock,
    className: "bg-amber-50 text-amber-700",
  },

  shortlisted: {
    label: "Shortlisted",
    icon: FaCheckCircle,
    className: "bg-violet-50 text-[var(--forsa-primary)]",
  },

  accepted: {
    label: "Accepted",
    icon: FaCheckCircle,
    className: "bg-green-50 text-green-700",
  },

  rejected: {
    label: "Rejected",
    icon: FaTimesCircle,
    className: "bg-red-50 text-red-600",
  },
};


function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function isValidUrl(value) {
  if (!value) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}


export default function MyApplications() {
  /*
   * ---------------------------------------------------------
   * ACCOUNT
   * ---------------------------------------------------------
   */

  const account = safeJson("forsaAccount", null);


  /*
   * ---------------------------------------------------------
   * IMPORTANT:
   *
   * DO NOT use localStorage as the source of applications.
   *
   * Firestore is the source of truth.
   *
   * listenUserThreads() listens to:
   *
   * applications where seeker.uid == account.uid
   *
   * and updates this state whenever Firestore changes.
   * ---------------------------------------------------------
   */

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  /*
   * ---------------------------------------------------------
   * REAL-TIME FIRESTORE LISTENER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!account?.uid) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    console.log(
      "MY APPLICATIONS: starting Firestore listener for",
      account.uid
    );

    const unsubscribe = listenUserThreads(
      account,

      (firestoreThreads) => {
        console.log(
          "MY APPLICATIONS: Firestore threads updated",
          firestoreThreads
        );

        setThreads(firestoreThreads);
        setLoading(false);

        /*
         * Keep localStorage updated only as a cache.
         *
         * It is NOT used to display the application.
         */
        try {
          localStorage.setItem(
            "forsaMessages",
            JSON.stringify(firestoreThreads)
          );

          localStorage.setItem(
            "forsaMessagesCache",
            JSON.stringify(firestoreThreads)
          );
        } catch (error) {
          console.warn(
            "Could not update application cache:",
            error
          );
        }
      },

      (error) => {
        console.error(
          "MY APPLICATIONS: Firestore listener error:",
          error
        );

        setLoading(false);
      }
    );

    return () => {
      console.log("MY APPLICATIONS: stopping Firestore listener");
      unsubscribe();
    };
  }, [account?.uid]);


  /*
   * ---------------------------------------------------------
   * FILTER APPLICATIONS
   * ---------------------------------------------------------
   */

  const applications = useMemo(() => {
    if (!account?.uid) {
      return [];
    }

    const queryText = search.trim().toLowerCase();

    return threads
      .filter((thread) => {
        /*
         * Primary check: seeker UID.
         *
         * This is better than comparing email strings.
         */
        if (thread.seeker?.uid) {
          return thread.seeker.uid === account.uid;
        }

        /*
         * Fallback for old application documents.
         */
        return (
          thread.seeker?.email?.toLowerCase() ===
          account.email?.toLowerCase()
        );
      })

      .filter((thread) => {
        const status = thread.status || "pending";

        const matchesStatus =
          statusFilter === "all" ||
          status === statusFilter;

        const text = `
          ${thread.title || ""}
          ${thread.company || ""}
          ${thread.lastMessage || ""}
          ${thread.status || ""}
          ${thread.interview?.date || ""}
          ${thread.interview?.time || ""}
          ${thread.interview?.meetingLink || ""}
          ${thread.interview?.locationName || ""}
          ${thread.interview?.notes || ""}
        `.toLowerCase();

        const matchesSearch =
          !queryText || text.includes(queryText);

        return matchesStatus && matchesSearch;
      })

      .sort(
        (a, b) =>
          new Date(
            b.updatedAt ||
              b.createdAt ||
              0
          ) -
          new Date(
            a.updatedAt ||
              a.createdAt ||
              0
          )
      );
  }, [
    threads,
    account?.uid,
    account?.email,
    search,
    statusFilter,
  ]);


  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */

  const stats = useMemo(
    () => ({
      total: applications.length,

      pending: applications.filter(
        (item) =>
          (item.status || "pending") === "pending"
      ).length,

      interview: applications.filter(
        (item) =>
          item.status === "interview"
      ).length,

      shortlisted: applications.filter(
        (item) =>
          item.status === "shortlisted"
      ).length,

      accepted: applications.filter(
        (item) =>
          item.status === "accepted"
      ).length,

      rejected: applications.filter(
        (item) =>
          item.status === "rejected"
      ).length,
    }),
    [applications]
  );


  /*
   * ---------------------------------------------------------
   * CANCEL INTERVIEW
   * ---------------------------------------------------------
   */

  const cancelInterview = async (application) => {
    if (!application?.id) {
      return;
    }

    if (!application?.interview) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel the interview for "${
        application.title || "this opportunity"
      }"?`
    );

    if (!confirmed) {
      return;
    }

    const now = new Date().toISOString();

    const systemMessage = {
      id: Date.now(),
      from: "Forsa",
      role: "system",
      text: `Interview cancelled for ${
        application.title || "this application"
      }.`,
      createdAt: now,
    };

    try {
      console.log(
        "MY APPLICATIONS: cancelling interview",
        application.id
      );

      /*
       * Firestore is updated here.
       *
       * The listener above will automatically receive
       * the new document afterwards.
       */
      await cancelThreadInterview(
        application.id,
        {
          by: account.email,
          systemMessage,
        }
      );

      console.log(
        "MY APPLICATIONS: interview cancelled"
      );

      /*
       * DO NOT manually update threads here.
       *
       * Firestore listener handles it.
       */
    } catch (error) {
      console.error(
        "Cancel interview error:",
        error
      );

      alert(
        "Could not cancel the interview."
      );
    }
  };


  /*
   * ---------------------------------------------------------
   * REMOVE APPLICATION
   * ---------------------------------------------------------
   */

  const removeApplication = async (application) => {
    if (!application?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Remove your application for "${
        application.title ||
        "this opportunity"
      }"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log(
        "MY APPLICATIONS: deleting application",
        application.id
      );

      /*
       * Delete the Firestore document.
       *
       * The real-time listener will then remove it
       * from the UI automatically.
       */
      await deleteThreadFromFirestore(
        application.id
      );

      console.log(
        "MY APPLICATIONS: application deleted"
      );

      /*
       * We intentionally DO NOT manipulate threads here.
       *
       * onSnapshot -> listenUserThreads()
       * will send the updated list.
       */
    } catch (error) {
      console.error(
        "Remove application error:",
        error
      );

      alert(
        "Could not remove the application."
      );
    }
  };


  /*
   * ---------------------------------------------------------
   * NOT LOGGED IN
   * ---------------------------------------------------------
   */

  if (!account) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <SEO title="My Applications" />

        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <div className="rounded-[24px] border border-[var(--forsa-border)] bg-white p-7 shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-[var(--forsa-primary)]">
              <FaInbox />
            </div>

            <h1 className="mt-4 text-xl font-semibold">
              Login required
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
              Log in to view your applications,
              interviews, and conversations.
            </p>

            <Link
              to="/auth"
              className="forsa-button mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              Login
            </Link>

          </div>
        </div>

        <Footer />
      </section>
    );
  }


  /*
   * ---------------------------------------------------------
   * MAIN PAGE
   * ---------------------------------------------------------
   */

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">

      <SEO title="My Applications" />

      <AppHeader />

      <main className="mx-auto max-w-[1120px] px-4 pb-20 sm:px-5">

        {/* HEADER */}

        <section className="mt-6 rounded-[26px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <span className="inline-flex rounded-full bg-[var(--forsa-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--forsa-primary)]">
                Career dashboard
              </span>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                My applications
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Track applications, hiring status,
                conversations, and interview invitations.
              </p>

            </div>

            <Link
              to="/explore"
              className="forsa-button inline-flex w-fit items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
            >
              Explore jobs

              <FaArrowRight className="text-[10px]" />
            </Link>

          </div>


          {/* STATS */}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">

            <Stat
              label="Total"
              value={stats.total}
            />

            <Stat
              label="Pending"
              value={stats.pending}
            />

            <Stat
              label="Interviews"
              value={stats.interview}
            />

            <Stat
              label="Shortlisted"
              value={stats.shortlisted}
            />

            <Stat
              label="Accepted"
              value={stats.accepted}
            />

            <Stat
              label="Rejected"
              value={stats.rejected}
            />

          </div>

        </section>


        {/* SEARCH / FILTER */}

        <section className="sticky top-[70px] z-20 mt-4 rounded-[22px] border border-[var(--forsa-border)] bg-white/95 p-2.5 shadow-sm backdrop-blur-xl">

          <div className="grid gap-2.5 lg:grid-cols-[1fr_auto] lg:items-center">

            <div className="flex h-10 items-center gap-2.5 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-3.5">

              <FaSearch className="text-xs text-[var(--forsa-primary)]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search company, role, message..."
                className="w-full bg-transparent text-sm outline-none"
              />

            </div>


            <div className="flex gap-1.5 overflow-x-auto">

              {statusOptions.map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setStatusFilter(status)
                    }
                    className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${
                      statusFilter === status
                        ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                        : "border-[var(--forsa-border)] bg-white text-neutral-600"
                    }`}
                  >
                    {status === "all"
                      ? "All"
                      : statusMeta[status]
                          ?.label ||
                        status}
                  </button>
                )
              )}

            </div>

          </div>

        </section>


        {/* LOADING */}

        {loading ? (
          <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--forsa-border)] border-t-[var(--forsa-primary)]" />

            <p className="mt-4 text-sm text-neutral-500">
              Loading your applications...
            </p>

          </div>
        ) : applications.length === 0 ? (

          <EmptyState
            hasFilters={
              Boolean(search.trim()) ||
              statusFilter !== "all"
            }
          />

        ) : (

          <div className="mt-4 grid gap-3">

            {applications.map(
              (application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onCancelInterview={
                    cancelInterview
                  }
                  onRemoveApplication={
                    removeApplication
                  }
                />
              )
            )}

          </div>

        )}

      </main>

      <Footer />

    </section>
  );
}


/*
 * =========================================================
 * APPLICATION CARD
 * =========================================================
 */

function ApplicationCard({
  application,
  onCancelInterview,
  onRemoveApplication,
}) {

  /*
   * IMPORTANT:
   *
   * This status comes directly from the Firestore
   * listener.
   *
   * If Firestore says:
   *
   * status: "rejected"
   *
   * this will display:
   *
   * Rejected
   */

  const status =
    application.status || "pending";

  const meta =
    statusMeta[status] ||
    statusMeta.pending;

  const Icon = meta.icon;


  return (
    <article
      className={`rounded-[24px] border bg-white p-4 shadow-sm sm:p-5 ${
        application.interview
          ? "border-blue-200"
          : "border-[var(--forsa-border)]"
      }`}
    >

      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">

        <div className="min-w-0 flex-1">

          {/* STATUS */}

          <div className="flex flex-wrap items-center gap-1.5">

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
            >
              <Icon className="text-[9px]" />

              {meta.label}
            </span>

            <span className="rounded-full bg-[var(--forsa-bg)] px-2.5 py-1 text-[11px] text-neutral-500">
              Updated{" "}
              {formatDate(
                application.updatedAt ||
                  application.createdAt
              )}
            </span>

          </div>


          {/* TITLE */}

          <h2 className="mt-3 text-xl font-semibold tracking-[-0.035em]">
            {application.title ||
              "Untitled opportunity"}
          </h2>


          {/* COMPANY */}

          <p className="mt-1 text-xs text-neutral-500">

            {application.company ||
              "Company"}

            {" · "}

            {application.opportunity
              ?.location ||
              "Lebanon"}

          </p>


          {/* LAST MESSAGE */}

          <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
            {application.lastMessage ||
              "Application sent."}
          </p>


          {/* INTERVIEW */}

          {application.interview && (
            <InterviewCard
              interview={
                application.interview
              }
              application={application}
              onCancel={() =>
                onCancelInterview(
                  application
                )
              }
            />
          )}


          {/* CV / CONTACT */}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">

            <InfoBox
              icon={<FaFileAlt />}
              label="CV"
              value={
                application.cv?.name ||
                application.cv?.url ||
                "No CV attached"
              }
              href={
                application.cv?.url
              }
            />

            <InfoBox
              icon={<FaEnvelope />}
              label="Contact"
              value={
                application.opportunity
                  ?.contact ||
                "Inside messages"
              }
            />

          </div>

        </div>


        {/* ACTIONS */}

        <div className="grid h-fit gap-2 sm:flex lg:w-[150px] lg:grid">

          <Link
            to="/messages"
            className="forsa-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white"
          >
            Messages

            <FaArrowRight className="text-[9px]" />
          </Link>


          <Link
            to={`/explore?post=${
              application.opportunityId ||
              application.postId ||
              ""
            }`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700"
          >
            <FaBriefcase className="text-[10px]" />

            View job
          </Link>


          <button
            type="button"
            onClick={() =>
              onRemoveApplication(
                application
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <FaTimesCircle className="text-[10px]" />

            Remove application
          </button>

        </div>

      </div>

    </article>
  );
}


/*
 * =========================================================
 * INTERVIEW CARD
 * =========================================================
 */

function InterviewCard({
  interview,
  application,
  onCancel,
}) {

  const isOnline =
    interview.type === "online";

  const meetingLink =
    interview.meetingLink?.trim();

  const mapsLink =
    interview.mapsLink?.trim();


  return (
    <div className="mt-4 rounded-[20px] border border-blue-100 bg-blue-50/80 p-3.5">

      <div className="flex items-center justify-between gap-3">

        <div className="flex min-w-0 items-center gap-2.5">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs text-blue-600">

            {isOnline ? (
              <FaVideo />
            ) : (
              <FaMapMarkerAlt />
            )}

          </div>


          <div className="min-w-0">

            <p className="text-sm font-semibold text-blue-800">
              Interview scheduled
            </p>

            <p className="text-[11px] text-blue-600">
              {isOnline
                ? "Online interview"
                : "In-person interview"}
            </p>

          </div>

        </div>


        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-blue-700">
          {isOnline
            ? "Online"
            : "In person"}
        </span>

      </div>


      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">

        <InterviewDetail
          label="Date"
          value={
            interview.date ||
            "Not specified"
          }
        />

        <InterviewDetail
          label="Time"
          value={
            interview.time ||
            "Not specified"
          }
        />

        <InterviewDetail
          label={
            isOnline
              ? "Format"
              : "Location"
          }
          value={
            isOnline
              ? "Online"
              : interview.locationName ||
                interview.location ||
                "In person"
          }
        />

      </div>


      {isOnline && (
        <div className="mt-2.5 flex flex-col gap-2 rounded-[16px] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="min-w-0">

            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-500">
              Meeting link
            </p>

            {meetingLink ? (
              <p className="mt-1 truncate text-xs text-neutral-600">
                {meetingLink}
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">
                Meeting link not provided yet.
              </p>
            )}

          </div>


          {meetingLink && (
            <a
              href={
                isValidUrl(
                  meetingLink
                )
                  ? meetingLink
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`forsa-button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white ${
                !isValidUrl(
                  meetingLink
                )
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              Join

              <FaExternalLinkAlt className="text-[9px]" />
            </a>
          )}

        </div>
      )}


      {!isOnline && mapsLink && (
        <a
          href={
            isValidUrl(mapsLink)
              ? mapsLink
              : undefined
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2.5 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 ${
            !isValidUrl(mapsLink)
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          <FaMapMarkerAlt className="text-[10px]" />

          Open location

          <FaExternalLinkAlt className="text-[9px]" />
        </a>
      )}


      {interview.notes && (
        <div className="mt-2.5 rounded-[16px] bg-white p-3">

          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-500">
            Notes
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-700">
            {interview.notes}
          </p>

        </div>
      )}


      <button
        type="button"
        onClick={onCancel}
        className="mt-3 w-full rounded-full border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
      >
        Cancel interview
      </button>

    </div>
  );
}


/*
 * =========================================================
 * INTERVIEW DETAIL
 * =========================================================
 */

function InterviewDetail({
  label,
  value,
}) {
  return (
    <div className="rounded-[14px] bg-white px-3 py-2.5">

      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-blue-500">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-blue-800">
        {value}
      </p>

    </div>
  );
}


/*
 * =========================================================
 * INFO BOX
 * =========================================================
 */

function InfoBox({
  icon,
  label,
  value,
  href,
}) {
  return (
    <div className="rounded-[16px] bg-[var(--forsa-bg)] px-3.5 py-3">

      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        {icon}
        {label}
      </p>


      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex max-w-full items-center gap-1.5 break-all text-xs font-medium text-[var(--forsa-primary)]"
        >
          <span className="truncate">
            {value}
          </span>

          <FaExternalLinkAlt className="shrink-0 text-[8px]" />
        </a>
      ) : (
        <p className="mt-1.5 truncate text-xs text-neutral-700">
          {value}
        </p>
      )}

    </div>
  );
}


/*
 * =========================================================
 * STAT
 * =========================================================
 */

function Stat({
  label,
  value,
}) {
  return (
    <div className="rounded-[17px] bg-[var(--forsa-bg)] px-3 py-3">

      <p className="text-xl font-semibold tracking-[-0.04em]">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] text-neutral-500">
        {label}
      </p>

    </div>
  );
}


/*
 * =========================================================
 * EMPTY STATE
 * =========================================================
 */

function EmptyState({
  hasFilters,
}) {
  return (
    <div className="mt-4 rounded-[24px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">

      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-sm text-[var(--forsa-primary)]">
        <FaInbox />
      </div>


      <h2 className="mt-4 text-xl font-semibold">

        {hasFilters
          ? "No matching applications"
          : "No applications yet"}

      </h2>


      <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-neutral-600">

        {hasFilters
          ? "Try changing your search or status filter."
          : "Apply to opportunities from Explore and they will appear here."}

      </p>


      <Link
        to="/explore"
        className="forsa-button mt-5 inline-flex rounded-full px-5 py-2.5 text-xs font-semibold text-white"
      >
        Explore jobs
      </Link>

    </div>
  );
}