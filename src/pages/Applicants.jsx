import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaFileAlt,
  FaSearch,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";
import { listenUserThreads, updateThreadStatus } from "../lib/applicationService";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const statusOptions = ["all", "pending", "shortlisted", "accepted", "rejected"];

const getStatusLabel = (status) => {
  const labels = {
    pending: "Pending",
    shortlisted: "Shortlisted",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  return labels[status] || "Pending";
};

export default function Applicants() {
  const navigate = useNavigate();
  const account = safeJson("forsaAccount", null);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const isHiring = account?.accountType === "hiring";

  useEffect(() => {
    if (!account?.email || !isHiring) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    const unsubscribe = listenUserThreads(
      account,
      (items) => {
        setThreads(items);
        setLoading(false);
      },
      (error) => {
        console.error("Applicants load error:", error);
        showToast("Could not load applicants.", "error");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [account?.email, account?.uid, isHiring]);

  const filteredApplicants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return threads.filter((thread) => {
      const matchesStatus =
        statusFilter === "all" || (thread.status || "pending") === statusFilter;

      const text = `${thread.title} ${thread.company} ${thread.seeker?.name} ${thread.seeker?.email} ${(thread.seeker?.skills || []).join(" ")}`.toLowerCase();

      const matchesSearch = !query || text.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [threads, statusFilter, search]);

  const stats = useMemo(() => {
    return {
      total: threads.length,
      pending: threads.filter((item) => (item.status || "pending") === "pending").length,
      shortlisted: threads.filter((item) => item.status === "shortlisted").length,
      accepted: threads.filter((item) => item.status === "accepted").length,
    };
  }, [threads]);

  const changeStatus = async (thread, status) => {
    const systemMessage = {
      id: Date.now(),
      from: "Forsa",
      role: "system",
      text: `Application status changed to ${getStatusLabel(status)}.`,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateThreadStatus(thread.id, {
        status,
        by: account.email,
        systemMessage,
      });

      showToast(`Marked as ${getStatusLabel(status).toLowerCase()}`);
    } catch (error) {
      console.error("Applicant status error:", error);
      showToast("Could not update status.", "error");
    }
  };

  if (!account) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold">Login required</h1>
            <Link
              to="/auth"
              className="mt-6 inline-flex rounded-full bg-[var(--forsa-green)] px-6 py-3 text-sm font-medium text-white"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!isHiring) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-20">
          <div className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold">Hiring account needed</h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              Applicants dashboard is only available for company accounts.
            </p>
            <Link
              to="/explore"
              className="mt-6 inline-flex rounded-full bg-[var(--forsa-green)] px-6 py-3 text-sm font-medium text-white"
            >
              Back to explore
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-8 overflow-hidden rounded-[30px] border border-[var(--forsa-border)] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Company dashboard</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
            Applicants
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600">
            Review people who applied to your opportunities, check answers, manage status, and open conversations.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Shortlisted" value={stats.shortlisted} />
            <StatCard label="Accepted" value={stats.accepted} />
          </div>
        </div>

        <div className="sticky top-[58px] z-20 mt-5 rounded-[26px] border border-[var(--forsa-border)] bg-white/90 p-3 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg)] px-4 py-3">
              <FaSearch className="text-sm text-neutral-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search applicant, email, role, skill..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    statusFilter === status
                      ? "border-[var(--forsa-green)] bg-[var(--forsa-green)] text-white"
                      : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-green)]"
                  }`}
                >
                  {status === "all" ? "All" : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-10 text-center">
            <p className="font-medium">Loading applicants...</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-[var(--forsa-border)] bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-neutral-500">
              <FaUser />
            </div>

            <h2 className="mt-5 text-2xl font-semibold">No applicants found.</h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">
              Applicants will appear here when seekers apply to your posts.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {filteredApplicants.map((thread) => (
              <ApplicantCard
                key={thread.id}
                thread={thread}
                onMessage={() => navigate("/messages")}
                onStatus={(status) => changeStatus(thread, status)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ApplicantCard({ thread, onMessage, onStatus }) {
  const seeker = thread.seeker || {};
  const answers = Object.entries(thread.answers || {}).filter(
    ([question, answer]) => question?.trim() && answer?.trim()
  );

  return (
    <article className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm transition hover:shadow-[0_14px_35px_rgba(18,60,47,0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-green)] text-white">
              <FaUser />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-[-0.03em]">
                  {seeker.name || "Applicant"}
                </h2>
                <StatusPill status={thread.status || "pending"} />
              </div>

              <p className="mt-1 break-all text-sm text-neutral-500">
                {seeker.email || "No email"} · {seeker.city || "Lebanon"}
              </p>

              <p className="mt-2 text-sm text-neutral-500">
                Applied to: <span className="font-medium text-black">{thread.title}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <InfoBox
              title="Skills"
              text={seeker.skills?.length ? seeker.skills.join(", ") : "No skills added"}
            />
            <InfoBox
              title="Looking for"
              text={seeker.lookingFor?.length ? seeker.lookingFor.join(", ") : "Not selected"}
            />
          </div>

          {thread.cv && (
            <div className="mt-3 rounded-2xl bg-[var(--forsa-bg)] p-4">
              <p className="text-xs text-neutral-500">CV metadata</p>
              <div className="mt-2 flex min-w-0 items-center gap-2 text-sm">
                <FaFileAlt className="shrink-0 text-neutral-500" />
                <span className="truncate">{thread.cv.name}</span>
              </div>
            </div>
          )}

          {answers.length > 0 && (
            <div className="mt-3 rounded-2xl bg-[var(--forsa-bg)] p-4">
              <p className="text-xs text-neutral-500">Application answers</p>

              <div className="mt-3 grid gap-3">
                {answers.map(([question, answer]) => (
                  <div key={question}>
                    <p className="text-sm font-medium">{question}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      {answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full shrink-0 lg:w-[260px]">
          <div className="rounded-[24px] bg-[var(--forsa-bg)] p-4">
            <p className="text-sm font-medium">Actions</p>

            <div className="mt-4 grid gap-2">
              <button
                onClick={onMessage}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--forsa-green)] px-4 py-3 text-sm font-medium text-white"
              >
                <FaEnvelope className="text-xs" />
                Open messages
              </button>

              <button
                onClick={() => onStatus("shortlisted")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm font-medium"
              >
                <FaCheckCircle className="text-xs text-[var(--forsa-green)]" />
                Shortlist
              </button>

              <button
                onClick={() => onStatus("accepted")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm font-medium"
              >
                <FaClock className="text-xs text-[var(--forsa-gold)]" />
                Accept
              </button>

              <button
                onClick={() => onStatus("rejected")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600"
              >
                <FaTimesCircle className="text-xs" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  const styles = {
    pending: "bg-[var(--forsa-bg)] text-neutral-600",
    shortlisted: "bg-[var(--forsa-green)] text-white",
    accepted: "bg-[var(--forsa-gold)] text-black",
    rejected: "bg-red-50 text-red-600",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function InfoBox({ title, text }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] p-4">
      <p className="text-xs text-neutral-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-700">{text}</p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--forsa-bg)] p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
    </div>
  );
}