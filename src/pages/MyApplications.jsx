import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaFileAlt,
  FaInbox,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

function safeJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

const statusOptions = ["all", "pending", "interview", "shortlisted", "accepted", "rejected"];

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
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyApplications() {
  const account = safeJson("forsaAccount", null);
  const messages = safeJson("forsaMessages", []);
  const cachedMessages = safeJson("forsaMessagesCache", []);
  const allThreads = messages.length ? messages : cachedMessages;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const applications = useMemo(() => {
    if (!account?.email) return [];

    const query = search.trim().toLowerCase();

    return allThreads
      .filter((thread) => thread.seeker?.email === account.email)
      .filter((thread) => {
        const status = thread.status || "pending";
        const matchesStatus = statusFilter === "all" || status === statusFilter;

        const text = `${thread.title || ""} ${thread.company || ""} ${
          thread.lastMessage || ""
        }`.toLowerCase();

        return matchesStatus && (!query || text.includes(query));
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
  }, [account?.email, allThreads, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((item) => (item.status || "pending") === "pending").length,
      shortlisted: applications.filter((item) => item.status === "shortlisted").length,
      accepted: applications.filter((item) => item.status === "accepted").length,
      rejected: applications.filter((item) => item.status === "rejected").length,
    };
  }, [applications]);

  if (!account) {
    return (
      <section className="min-h-screen bg-[var(--forsa-bg)]">
        <SEO title="My Applications" />
        <AppHeader />
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="rounded-[30px] border border-[var(--forsa-border)] bg-white p-8">
            <h1 className="text-2xl font-semibold">Login required</h1>
            <Link to="/auth" className="forsa-button mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white">
              Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title="My Applications" />
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-8 rounded-[34px] border border-[var(--forsa-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Application tracker</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">
            My applications
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600">
            Track every opportunity you applied to, check your status, and continue conversations from one clean place.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Total" value={stats.total} />
            <Stat label="Pending" value={stats.pending} />
            <Stat label="Shortlisted" value={stats.shortlisted} />
            <Stat label="Accepted" value={stats.accepted} />
            <Stat label="Rejected" value={stats.rejected} />
          </div>
        </div>

        <div className="sticky top-[74px] z-20 mt-5 rounded-[28px] border border-[var(--forsa-border)] bg-white/90 p-3 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="forsa-focus flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3">
              <FaSearch className="text-sm text-[var(--forsa-primary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, role, message..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`forsa-click shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold capitalize ${
                    statusFilter === status
                      ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                      : "border-[var(--forsa-border)] bg-white text-neutral-600"
                  }`}
                >
                  {status === "all" ? "All" : statusMeta[status]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="mt-6 rounded-[30px] border border-[var(--forsa-border)] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
              <FaInbox />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">No applications yet.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">
              Apply to opportunities from Explore and they will appear here.
            </p>
            <Link to="/explore" className="forsa-button mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white">
              Explore jobs
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {applications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </section>
  );
}

function ApplicationCard({ application }) {
  const status = application.status || "pending";
  const meta = statusMeta[status] || statusMeta.pending;
  const Icon = meta.icon;

  return (
    <article className="forsa-card rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
              <Icon className="text-[10px]" />
              {meta.label}
            </span>

            <span className="rounded-full bg-[var(--forsa-bg)] px-3 py-1 text-xs text-neutral-500">
              Updated {formatDate(application.updatedAt || application.createdAt)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
            {application.title}
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            {application.company || "Company"} · {application.opportunity?.location || "Lebanon"}
          </p>

          <p className="mt-4 line-clamp-3 max-w-3xl text-sm leading-7 text-neutral-600">
            {application.lastMessage || "Application sent."}
          </p>
          {application.interview && (
  <div className="mt-4 rounded-[24px] border border-blue-100 bg-blue-50 p-4">
    <p className="text-sm font-semibold text-blue-700">
      Interview scheduled
    </p>

    <div className="mt-3 grid gap-2 text-sm text-blue-700 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold text-blue-500">Date</p>
        <p className="mt-1">{application.interview.date}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-blue-500">Time</p>
        <p className="mt-1">{application.interview.time}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-blue-500">Location</p>
        <p className="mt-1">{application.interview.location}</p>
      </div>
    </div>

    {application.interview.notes && (
      <p className="mt-3 text-sm leading-6 text-blue-700">
        {application.interview.notes}
      </p>
    )}
  </div>
)}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBox
              icon={<FaFileAlt />}
              label="CV"
              value={application.cv?.name || application.cv?.url || "No CV attached"}
            />

            <InfoBox
              icon={<FaEnvelope />}
              label="Contact"
              value={application.opportunity?.contact || "Inside messages"}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:flex lg:grid lg:w-[190px]">
          <Link
            to="/messages"
            className="forsa-click forsa-button inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            Messages
            <FaArrowRight className="text-xs" />
          </Link>

          <Link
            to={`/explore?post=${application.opportunityId || application.postId || ""}`}
            className="forsa-click inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700"
          >
            <FaBriefcase className="text-xs" />
            View job
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-all text-sm text-neutral-700">{value}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[22px] bg-[var(--forsa-bg)] p-4">
      <p className="text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}