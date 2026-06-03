import { useEffect, useMemo, useState } from "react";
import SEO from "../components/SEO";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import { createNotification } from "../lib/notificationService";
import {
  FaArrowRight,
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaFileAlt,
  FaCalendarAlt,
  FaFilter,
  FaInbox,
  FaSearch,
  FaTimesCircle,
  FaUser,
  FaUsers,
  FaTrophy,
  FaChartLine,
  FaMagic,
  FaSortAmountDown,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";
import { showToast } from "../lib/Toast";
import { calculateApplicantScore } from "../lib/applicantScore";
import {
  listenUserThreads,
  updateThreadStatus,
  scheduleThreadInterview,
} from "../lib/applicationService";

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

const statusOptions = ["all", "pending", "shortlisted", "interview", "accepted", "rejected"];
const statusMeta = {
  interview: {
  label: "Interview",
  tone: "bg-blue-50 text-blue-700 ring-blue-100",
  dot: "bg-blue-500",
},
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

const getRankLabel = (rank, score) => {
  if (rank === 1 && score >= 70) return "Top match";
  if (rank <= 3 && score >= 60) return "Strong candidate";
  if (score >= 50) return "Good potential";
  return "Needs review";
};

const buildRanking = (threads) =>
  threads
    .map((thread) => {
      const fit = calculateApplicantScore(thread);
      const hasCv = Boolean(thread.cv?.name || thread.cv?.url);
      const answered = Object.keys(thread.answers || {}).length;
      const updatedAt = new Date(thread.updatedAt || thread.createdAt || 0).getTime() || 0;

      return {
        thread,
        fit,
        rankingScore:
          fit.score +
          (hasCv ? 6 : 0) +
          (answered > 0 ? 4 : 0) +
          Math.min(5, updatedAt / 1000000000000),
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      label: getRankLabel(index + 1, item.fit.score),
    }));

export default function Applicants() {
  const navigate = useNavigate();
  const account = safeJson("forsaAccount", null);

  const [threads, setThreads] = useState(safeJson("forsaMessagesCache", []));
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("smart");
  const [busyId, setBusyId] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [interviewTarget, setInterviewTarget] = useState(null);
const [interviewForm, setInterviewForm] = useState({
  date: "",
  time: "",
  location: "",
  notes: "",
});

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

    const matches = threads.filter((thread) => {
      const matchesStatus = statusFilter === "all" || (thread.status || "pending") === statusFilter;
      const text = `${thread.title || ""} ${thread.company || ""} ${thread.seeker?.name || ""} ${thread.seeker?.email || ""} ${(thread.seeker?.skills || []).join(" ")}`.toLowerCase();
      return matchesStatus && (!query || text.includes(query));
    });

    if (sortMode === "smart") {
      return buildRanking(matches).map((item) => ({
        ...item.thread,
        _rank: item.rank,
        _rankLabel: item.label,
        _fit: item.fit,
      }));
    }

    if (sortMode === "fit") {
      return matches
        .map((thread) => ({ ...thread, _fit: calculateApplicantScore(thread) }))
        .sort((a, b) => (b._fit?.score || 0) - (a._fit?.score || 0));
    }

    return matches.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [threads, statusFilter, search, sortMode]);

  const topRankedApplicants = useMemo(() => {
    return buildRanking(
      threads.filter((thread) =>
        statusFilter === "all" ? true : (thread.status || "pending") === statusFilter
      )
    ).slice(0, 3);
  }, [threads, statusFilter]);

  const stats = useMemo(() => ({
    interview: threads.filter((item) => item.status === "interview").length,
    total: threads.length,
    pending: threads.filter((item) => (item.status || "pending") === "pending").length,
    shortlisted: threads.filter((item) => item.status === "shortlisted").length,
    accepted: threads.filter((item) => item.status === "accepted").length,
    rejected: threads.filter((item) => item.status === "rejected").length,
  }), [threads]);

  const jobStats = useMemo(() => {
  const map = {};

  threads.forEach((thread) => {
    const key = thread.postId || thread.opportunityId || thread.title || "Unknown job";

    if (!map[key]) {
      map[key] = {
        id: key,
        title: thread.title || "Untitled job",
        total: 0,
        pending: 0,
        shortlisted: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
        scoreTotal: 0,
      };
    }

    const status = thread.status || "pending";
    const applicantScore = calculateApplicantScore(thread).score;

    map[key].total += 1;
    map[key].scoreTotal += applicantScore;
    map[key].avgScore = Math.round(map[key].scoreTotal / map[key].total);
    map[key][status] = (map[key][status] || 0) + 1;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
}, [threads]);

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
      if (thread.seeker?.email) {
  await createNotification({
    type: "application_status",
    title: `Application ${getStatusLabel(status).toLowerCase()}`,
    text: `${thread.company || account.companyName || account.name} marked your application for ${thread.title} as ${getStatusLabel(status)}.`,
    targetEmail: thread.seeker.email,
    actionUrl: "/applications",
    applicationId: thread.id,
  });
}
      showToast(`Marked as ${getStatusLabel(status).toLowerCase()}`);
    } catch (error) {
      console.error("Applicant status error:", error);
      setThreads(previousThreads);
      showToast("Could not update status.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const inviteInterview = async () => {
  if (!interviewTarget || busyId) return;

  if (!interviewForm.date || !interviewForm.time || !interviewForm.location.trim()) {
    showToast("Add date, time, and location.", "error");
    return;
  }

  const now = new Date().toISOString();

  const interview = {
    date: interviewForm.date,
    time: interviewForm.time,
    location: interviewForm.location.trim(),
    notes: interviewForm.notes.trim(),
    createdAt: now,
    createdBy: account.email,
  };

  const systemMessage = {
    id: Date.now(),
    from: "Forsa",
    role: "system",
    text: `Interview invited for ${interview.date} at ${interview.time}.`,
    createdAt: now,
  };

  const previousThreads = threads;

  const optimistic = threads.map((item) =>
    item.id === interviewTarget.id
      ? {
          ...item,
          status: "interview",
          interview,
          updatedAt: now,
          lastMessage: systemMessage.text,
          conversation: [...(item.conversation || []), systemMessage],
          statusHistory: [
            ...(item.statusHistory || []),
            { status: "interview", createdAt: now, by: account.email },
          ],
        }
      : item
  );

  setThreads(optimistic);
  writeJson("forsaMessagesCache", optimistic);
  writeJson("forsaMessages", optimistic);
  setBusyId(interviewTarget.id);

  try {
    await scheduleThreadInterview(interviewTarget.id, {
      interview,
      by: account.email,
      systemMessage,
    });

    if (interviewTarget.seeker?.email) {
  await createNotification({
    type: "interview_invite",
    title: "Interview invitation",
    text: `${interviewTarget.company || account.companyName || account.name} invited you to interview for ${interviewTarget.title} on ${interview.date} at ${interview.time}.`,
    targetEmail: interviewTarget.seeker.email,
    actionUrl: "/applications",
    applicationId: interviewTarget.id,
  });
}

    showToast("Interview invitation sent");
    setInterviewTarget(null);
    setInterviewForm({ date: "", time: "", location: "", notes: "" });
  } catch (error) {
    console.error("Interview invite error:", error);
    setThreads(previousThreads);
    showToast("Could not send interview invite.", "error");
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
        <SmartRankingPanel rankedApplicants={topRankedApplicants} onOpenMessages={() => navigate("/messages")} />
        <JobStatsPanel jobStats={jobStats} />
        <Toolbar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stats={stats}
          sortMode={sortMode}
          setSortMode={setSortMode}
        />

        {loading ? (
          <LoadingState />
        ) : filteredApplicants.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="mt-6 grid gap-4">
            {filteredApplicants.map((thread) => (
              <ApplicantCard
              onInterview={() => {
  setInterviewTarget(thread);
  setInterviewForm({
    date: "",
    time: "",
    location: thread.opportunity?.location || thread.location || "",
    notes: "",
  });
}}
                key={thread.id}
                thread={thread}
                rank={thread._rank}
                rankLabel={thread._rankLabel}
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

<Modal
  open={Boolean(interviewTarget)}
  title="Invite to interview"
  onClose={() => setInterviewTarget(null)}
>
  {interviewTarget && (
    <div>
      <p className="text-sm leading-7 text-neutral-600">
        Send an interview invitation to{" "}
        <span className="font-semibold text-black">
          {interviewTarget.seeker?.name || "this applicant"}
        </span>
        .
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InterviewField
          label="Date"
          type="date"
          value={interviewForm.date}
          onChange={(value) =>
            setInterviewForm((prev) => ({ ...prev, date: value }))
          }
        />

        <InterviewField
          label="Time"
          type="time"
          value={interviewForm.time}
          onChange={(value) =>
            setInterviewForm((prev) => ({ ...prev, time: value }))
          }
        />
      </div>

      <div className="mt-3">
        <InterviewField
          label="Location"
          value={interviewForm.location}
          placeholder="Farouj Restaurant - Jal El Dib"
          onChange={(value) =>
            setInterviewForm((prev) => ({ ...prev, location: value }))
          }
        />
      </div>

      <div className="mt-3">
        <label className="text-sm font-semibold">Notes</label>
        <textarea
          value={interviewForm.notes}
          onChange={(event) =>
            setInterviewForm((prev) => ({
              ...prev,
              notes: event.target.value,
            }))
          }
          placeholder="Example: Please arrive 10 minutes early and bring your CV."
          className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--forsa-primary)]"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          onClick={() => setInterviewTarget(null)}
          className="rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700"
        >
          Cancel
        </button>

        <button
          onClick={inviteInterview}
          disabled={busyId === interviewTarget.id}
          className="forsa-button rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {busyId === interviewTarget.id ? "Sending..." : "Send invite"}
        </button>
      </div>
    </div>
  )}
</Modal>


    </section>
  );
}


function SmartRankingPanel({ rankedApplicants, onOpenMessages }) {
  if (!rankedApplicants.length) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-[0_18px_65px_rgba(109,40,217,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]">
            <FaMagic className="text-[10px]" />
            Smart Applicant Ranking
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            Top candidates to review first
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">
            Forsa ranks applicants using profile fit, CV availability, answers, and activity so companies can decide faster.
          </p>
        </div>

        <button
          onClick={onOpenMessages}
          className="forsa-click inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-5 py-3 text-sm font-semibold text-neutral-700 sm:w-fit"
        >
          <FaEnvelope className="text-xs" />
          Open messages
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {rankedApplicants.map(({ thread, fit, rank, label }) => {
          const seeker = thread.seeker || {};
          return (
            <div key={thread.id} className="rounded-[26px] border border-[var(--forsa-border)] bg-[linear-gradient(135deg,#ffffff,#fbfaff)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--forsa-primary),var(--forsa-glow))] font-semibold text-white">
                    #{rank}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-[-0.03em]">{seeker.name || "Applicant"}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-neutral-500">{thread.title}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-semibold tracking-[-0.05em] text-[var(--forsa-primary)]">{fit.score}%</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">fit</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <FaTrophy className="text-xs text-[var(--forsa-primary)]" />
                <span className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
                  {label}
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                {fit.reasons.slice(0, 3).map((reason) => (
                  <div key={reason} className="flex items-start gap-2 rounded-2xl bg-white px-3 py-2 text-xs leading-5 text-neutral-700 ring-1 ring-[var(--forsa-border)]">
                    <FaCheckCircle className="mt-1 shrink-0 text-[10px] text-[var(--forsa-primary)]" />
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobStatsPanel({ jobStats }) {
  if (!jobStats.length) return null;

  return (
    <div className="mt-5 rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Job performance</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
            Applications by post
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {jobStats.map((job) => (
          <div
            key={job.id}
            className="rounded-[24px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold tracking-[-0.03em]">
                  {job.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {job.total} total applicants
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <MiniStat label="Pending" value={job.pending} />
                <MiniStat label="Shortlisted" value={job.shortlisted} />
                <MiniStat label="Interviews" value={job.interview} />
                <MiniStat label="Avg fit" value={`${job.avgScore || 0}%`} />
                <MiniStat label="Accepted" value={job.accepted} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] font-medium text-neutral-500">{label}</p>
    </div>
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

      <div className="relative mt-7 grid grid-cols-2 gap-2 sm:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Shortlisted" value={stats.shortlisted} />
        <StatCard label="Interviews" value={stats.interview} />
        <StatCard label="Accepted" value={stats.accepted} />
        <StatCard label="Rejected" value={stats.rejected} />
      </div>
    </div>
  );
}

function Toolbar({ search, setSearch, statusFilter, setStatusFilter, stats, sortMode, setSortMode }) {
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
          <button
            onClick={() => setSortMode(sortMode === "smart" ? "newest" : "smart")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${
              sortMode === "smart"
                ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-[0_12px_28px_rgba(109,40,217,0.20)]"
                : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
            }`}
          >
            <FaSortAmountDown className="text-xs" />
            {sortMode === "smart" ? "Smart rank" : "Newest"}
          </button>

          <button
            onClick={() => setSortMode("fit")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition ${
              sortMode === "fit"
                ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-[0_12px_28px_rgba(109,40,217,0.20)]"
                : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
            }`}
          >
            <FaChartLine className="text-xs" />
            Fit score
          </button>

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

function ApplicantCard({ thread, rank, rankLabel, busy, onMessage, onStatus, onInterview }) {
  const seeker = thread.seeker || {};
  const status = thread.status || "pending";
  const answers = Object.entries(thread.answers || {}).filter(([question, answer]) => question?.trim() && answer?.trim());
  const skills = seeker.skills || [];
  const lookingFor = seeker.lookingFor || [];
  const applicantFit = thread._fit || calculateApplicantScore(thread);

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
                  {rank && <RankPill rank={rank} label={rankLabel} />}
                </div>

                <p className="mt-1 break-all text-sm text-neutral-500">{seeker.email || "No email"} · {seeker.city || "Lebanon"}</p>
                <p className="mt-2 text-sm text-neutral-500">Applied to <span className="font-semibold text-neutral-900">{thread.title}</span></p>
              </div>
            </div>

            <p className="shrink-0 rounded-full bg-[var(--forsa-bg)] px-3 py-1.5 text-xs font-medium text-neutral-500">{formatDate(thread.createdAt)}</p>
          </div>

          <ApplicantFitCard fit={applicantFit} />

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
            <button
  onClick={onInterview}
  disabled={busy}
  className="forsa-click inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 disabled:cursor-wait disabled:opacity-60"
>
  <FaCalendarAlt className="text-xs" />
  Invite interview
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



function RankPill({ rank, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)] ring-1 ring-violet-100">
      <FaTrophy className="text-[10px]" />
      #{rank} {label}
    </span>
  );
}

function ApplicantFitCard({ fit }) {
  const score = fit?.score || 0;
  const reasons = fit?.reasons || [];

  return (
    <div className="mt-5 rounded-[24px] border border-[var(--forsa-border)] bg-[linear-gradient(135deg,#ffffff,#fbfaff)] p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Applicant fit
          </p>

          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-[-0.05em] text-[var(--forsa-primary)]">
              {score}%
            </p>

            <span className="rounded-full bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--forsa-primary)]">
              {score >= 80 ? "High-priority applicant" : score >= 60 ? "Good candidate" : "Manual review"}
            </span>
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[#eee8ff] sm:w-[180px]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--forsa-primary),var(--forsa-glow))]"
            style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {reasons.slice(0, 4).map((reason) => (
          <span
            key={reason}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 ring-1 ring-[var(--forsa-border)]"
          >
            <FaCheckCircle className="text-[10px] text-[var(--forsa-primary)]" />
            {reason}
          </span>
        ))}
      </div>
    </div>
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

function InterviewField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[var(--forsa-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--forsa-primary)]"
      />
    </div>
  );
}