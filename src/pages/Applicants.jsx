import { useEffect, useMemo, useState } from "react";
import SEO from "../components/SEO";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaFileAlt,
  FaFilter,
  FaInbox,
  FaSearch,
  FaTimesCircle,
  FaUser,
  FaUsers,
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

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const statusOptions = ["all", "pending", "shortlisted", "accepted", "rejected"];

const statusMeta = {
  pending: { label: "Pending", tone: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  shortlisted: { label: "Shortlisted", tone: "bg-violet-50 text-[var(--forsa-primary)] ring-violet-100", dot: "bg-[var(--forsa-primary)]" },
  accepted: { label: "Accepted", tone: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", tone: "bg-red-50 text-red-600 ring-red-100", dot: "bg-red-500" },
};

const getStatusLabel = (status) => statusMeta[status]?.label || "Pending";

const formatDate = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function Applicants() {
  const navigate = useNavigate();
  const account = safeJson("forsaAccount", null);

  const [threads, setThreads] = useState(safeJson("forsaMessagesCache", []));
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);

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
        writeJson("forsaMessagesCache", items);
        setLoading(false);
      },
      (error) => {
        console.error("Applicants load error:", error);
        setThreads(safeJson("forsaMessagesCache", []));
        showToast("Could not load applicants.", "error");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [account?.email, account?.uid, isHiring]);

  const filteredApplicants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return threads
      .filter((thread) => {
        const matchesStatus = statusFilter === "all" || (thread.status || "pending") === statusFilter;
        const text = `${thread.title || ""} ${thread.company || ""} ${thread.seeker?.name || ""} ${thread.seeker?.email || ""} ${(thread.seeker?.skills || []).join(" ")}`.toLowerCase();
        return matchesStatus && (!query || text.includes(query));
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [threads, statusFilter, search]);

  const stats = useMemo(() => ({
    total: threads.length,
    pending: threads.filter((item) => (item.status || "pending") === "pending").length,
    shortlisted: threads.filter((item) => item.status === "shortlisted").length,
    accepted: threads.filter((item) => item.status === "accepted").length,
    rejected: threads.filter((item) => item.status === "rejected").length,
  }), [threads]);

  const changeStatus = async (thread, status) => {
    if ((thread.status || "pending") === status) return;

    const now = new Date().toISOString();
    const systemMessage = {
      id: Date.now(),
      from: "Forsa",
      role: "system",
      text: `Application status changed to ${getStatusLabel(status)}.`,
      createdAt: now,
    };

    const previousThreads = threads;
    const optimistic = threads.map((item) =>
      item.id === thread.id
        ? {
            ...item,
            status,
            updatedAt: now,
            lastMessage: systemMessage.text,
            conversation: [...(item.conversation || []), systemMessage],
            statusHistory: [...(item.statusHistory || []), { status, createdAt: now, by: account.email }],
          }
        : item
    );

    setThreads(optimistic);
    writeJson("forsaMessagesCache", optimistic);
    writeJson("forsaMessages", optimistic);
    setBusyId(thread.id);

    try {
      await updateThreadStatus(thread.id, { status, by: account.email, systemMessage });
      showToast(`Marked as ${getStatusLabel(status).toLowerCase()}`);
    } catch (error) {
      console.error("Applicant status error:", error);
      setThreads(previousThreads);
      showToast("Could not update status.", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (!account) {
    return <AccessState title="Login required" text="You need a Forsa account to access applicants." actionLabel="Login" to="/auth" />;
  }

  if (!isHiring) {
    return <AccessState title="Hiring account needed" text="Applicants dashboard is only available for company accounts." actionLabel="Back to explore" to="/explore" />;
  }

  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <SEO title="Applicants" />
      <AppHeader />

      <div className="mx-auto max-w-[1180px] px-4 pb-28 sm:px-6 lg:pb-20">
        <HeroPanel stats={stats} />
        <Toolbar search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} stats={stats} />

        {loading ? (
          <LoadingState />
        ) : filteredApplicants.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="mt-6 grid gap-4">
            {filteredApplicants.map((thread) => (
              <ApplicantCard
                key={thread.id}
                thread={thread}
                busy={busyId === thread.id}
                onMessage={() => navigate("/messages")}
                onStatus={(status) =>
  setStatusConfirm({
    thread,
    status,
  })
}
              />
            ))}
          </div>
        )}
      </div>
      <Modal
  open={Boolean(statusConfirm)}
  title="Update applicant status"
  onClose={() => setStatusConfirm(null)}
>
  {statusConfirm && (
    <div>
      <p className="text-sm leading-7 text-neutral-600">
        Are you sure you want to mark{" "}
        <span className="font-semibold text-black">
          {statusConfirm.thread.seeker?.name || "this applicant"}
        </span>{" "}
        as{" "}
        <span className="font-semibold text-[var(--forsa-primary)]">
          {getStatusLabel(statusConfirm.status)}
        </span>
        ?
      </p>

      <div className="mt-5 rounded-2xl bg-[var(--forsa-bg)] p-4">
        <p className="text-sm font-semibold">
          {statusConfirm.thread.title}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {statusConfirm.thread.seeker?.email || "No email"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => setStatusConfirm(null)}
          className="rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            changeStatus(statusConfirm.thread, statusConfirm.status);
            setStatusConfirm(null);
          }}
          className={`rounded-full px-5 py-3 text-sm font-semibold text-white ${
            statusConfirm.status === "rejected"
              ? "bg-red-600"
              : "forsa-button"
          }`}
        >
          Confirm
        </button>
      </div>
    </div>
  )}
</Modal>
    </section>
  );
}

function HeroPanel({ stats }) {
  return (
    <div className="relative mt-6 overflow-hidden rounded-[34px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(109,40,217,0.10)] backdrop-blur-2xl sm:mt-8 sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--forsa-glow)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-[var(--forsa-primary)]/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--forsa-primary)] shadow-sm">
            <FaUsers className="text-xs" />
            Company dashboard
          </div>

          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-4xl md:text-5xl">
            Review applicants with a cleaner hiring workflow.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Search candidates, read application answers, check CV metadata, and move every applicant through your hiring pipeline.
          </p>
        </div>

        <Link to="/post" className="forsa-button inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 sm:w-fit">
          Post new role
          <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="relative mt-7 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Shortlisted" value={stats.shortlisted} />
        <StatCard label="Accepted" value={stats.accepted} />
        <StatCard label="Rejected" value={stats.rejected} />
      </div>
    </div>
  );
}

function Toolbar({ search, setSearch, statusFilter, setStatusFilter, stats }) {
  return (
    <div className="sticky top-[74px] z-20 -mx-4 mt-5 border-y border-[var(--forsa-border)] bg-white/92 px-4 py-3 shadow-[0_12px_40px_rgba(109,40,217,0.06)] backdrop-blur-2xl sm:mx-0 sm:rounded-[28px] sm:border sm:p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-center gap-3 rounded-full border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)]/65 px-4 py-3 transition focus-within:border-[var(--forsa-primary)] focus-within:bg-white">
          <FaSearch className="text-sm text-[var(--forsa-primary)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search applicant, email, role, skill..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />

          {search && (
            <button type="button" onClick={() => setSearch("")} className="rounded-full bg-white px-2 py-1 text-xs text-neutral-500">
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold capitalize transition ${
                statusFilter === status
                  ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-[0_12px_28px_rgba(109,40,217,0.20)]"
                  : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
              }`}
            >
              {status === "all" && <FaFilter className="text-xs" />}
              {status === "all" ? "All" : getStatusLabel(status)}
              {status !== "all" && <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px]">{stats[status] || 0}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({ thread, busy, onMessage, onStatus }) {
  const seeker = thread.seeker || {};
  const status = thread.status || "pending";
  const answers = Object.entries(thread.answers || {}).filter(([question, answer]) => question?.trim() && answer?.trim());
  const skills = seeker.skills || [];
  const lookingFor = seeker.lookingFor || [];

  return (
    <article className="forsa-card overflow-hidden rounded-[30px] border border-[var(--forsa-border)] bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_290px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] text-white shadow-[0_14px_32px_rgba(109,40,217,0.22)]">
                <FaUser />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-2xl">{seeker.name || "Applicant"}</h2>
                  <StatusPill status={status} />
                </div>

                <p className="mt-1 break-all text-sm text-neutral-500">{seeker.email || "No email"} · {seeker.city || "Lebanon"}</p>
                <p className="mt-2 text-sm text-neutral-500">Applied to <span className="font-semibold text-neutral-900">{thread.title}</span></p>
              </div>
            </div>

            <p className="shrink-0 rounded-full bg-[var(--forsa-bg)] px-3 py-1.5 text-xs font-medium text-neutral-500">{formatDate(thread.createdAt)}</p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <InfoBox title="Skills" items={skills} empty="No skills added" />
            <InfoBox title="Looking for" items={lookingFor} empty="Not selected" />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <CvBox cv={thread.cv} />
            <LastMessage text={thread.lastMessage} />
          </div>

          {answers.length > 0 && (
            <div className="mt-3 rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Application answers</p>

              <div className="mt-3 grid gap-3">
                {answers.slice(0, 3).map(([question, answer]) => (
                  <div key={question} className="rounded-2xl bg-white p-3">
                    <p className="text-sm font-semibold text-neutral-900">{question}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">{answer}</p>
                  </div>
                ))}

                {answers.length > 3 && (
                  <button type="button" onClick={onMessage} className="text-left text-sm font-semibold text-[var(--forsa-primary)]">
                    View all answers in messages
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="border-t border-[var(--forsa-border)] bg-[#fbfaff] p-5 lg:border-l lg:border-t-0">
          <p className="text-sm font-semibold">Hiring actions</p>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Update status and continue the conversation.</p>

          <div className="mt-4 grid gap-2">
            <button onClick={onMessage} className="forsa-click forsa-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white">
              <FaEnvelope className="text-xs" />
              Open messages
            </button>

            <StatusAction disabled={busy} active={status === "shortlisted"} icon={<FaCheckCircle />} label="Shortlist" onClick={() => onStatus("shortlisted")} />
            <StatusAction disabled={busy} active={status === "accepted"} icon={<FaCheckCircle />} label="Accept" onClick={() => onStatus("accepted")} />
            <StatusAction disabled={busy} danger active={status === "rejected"} icon={<FaTimesCircle />} label="Reject" onClick={() => onStatus("rejected")} />
          </div>
        </aside>
      </div>
    </article>
  );
}

function StatusAction({ icon, label, active, danger, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
        active
          ? danger
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          : danger
          ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
          : "border-[var(--forsa-border)] bg-white text-neutral-700 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
      } ${disabled ? "cursor-wait opacity-60" : ""}`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoBox({ title, items, empty }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items?.length ? (
          items.slice(0, 6).map((item) => (
            <span key={item} className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-medium text-[var(--forsa-primary)]">{item}</span>
          ))
        ) : (
          <p className="text-sm text-neutral-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function CvBox({ cv }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">CV metadata</p>
      {cv ? (
        <div className="mt-3 flex min-w-0 items-center gap-2 text-sm text-neutral-700">
          <FaFileAlt className="shrink-0 text-[var(--forsa-primary)]" />
          <span className="truncate">{cv.name}</span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">No CV attached.</p>
      )}
    </div>
  );
}

function LastMessage({ text }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Latest message</p>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-600">{text || "No message yet."}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const meta = statusMeta[status] || statusMeta.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--forsa-border)] bg-white/78 p-4 shadow-sm backdrop-blur-xl">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 rounded-[30px] border border-[var(--forsa-border)] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[var(--forsa-bg-soft)]" />
      <p className="mt-5 font-semibold">Loading applicants...</p>
      <p className="mt-2 text-sm text-neutral-500">Fetching latest applications.</p>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="mt-6 rounded-[30px] border border-[var(--forsa-border)] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
        <FaInbox />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">No applicants found.</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">{search ? "Try another search or clear your filters." : "Applicants will appear here when seekers apply to your posts."}</p>
    </div>
  );
}

function AccessState({ title, text, actionLabel, to }) {
  return (
    <section className="min-h-screen bg-[var(--forsa-bg)]">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-5 py-20">
        <div className="rounded-[30px] border border-[var(--forsa-border)] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
            <FaBriefcase />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">{text}</p>
          <Link to={to} className="forsa-button mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white">
            {actionLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
