import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../lib/Toast";
import {
  FaArrowLeft,
  FaBriefcase,
  FaFileAlt,
  FaPaperPlane,
  FaTrash,
  FaUser,
  FaInbox,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCircle,
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";

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

const statusOptions = [
  { value: "pending", label: "Pending", icon: FaClock },
  { value: "shortlisted", label: "Shortlisted", icon: FaCheckCircle },
  { value: "accepted", label: "Accepted", icon: FaCheckCircle },
  { value: "rejected", label: "Rejected", icon: FaTimesCircle },
];

const timelineSteps = ["pending", "shortlisted", "accepted"];

const formatDateTime = (value) => {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPresenceText = (value) => {
  if (!value) return "Active recently";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();

  if (Number.isNaN(diff)) return "Active recently";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 2) return "Active now";
  if (minutes < 60) return `Active ${minutes}m ago`;
  if (hours < 24) return `Active ${hours}h ago`;
  return `Active ${days}d ago`;
};

const getStatusLabel = (status) =>
  statusOptions.find((item) => item.value === status)?.label || "Pending";

export default function Messages() {
  const account = safeJson("forsaAccount", null);
  const profile = safeJson("forsaProfile", {
    skills: [],
    lookingFor: [],
    cv: null,
  });

  const [messages, setMessages] = useState(safeJson("forsaMessages", []));
  const [activeId, setActiveId] = useState(messages[0]?.id || null);
  const [reply, setReply] = useState("");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  useEffect(() => {
    if (!account?.email) return;

    const presence = safeJson("forsaPresence", {});
    writeJson("forsaPresence", {
      ...presence,
      [account.email]: {
        lastSeen: new Date().toISOString(),
      },
    });
  }, [account?.email]);

  const presence = safeJson("forsaPresence", {});

  const visibleMessages = useMemo(() => {
    if (!account?.email) return [];

    if (account.accountType === "hiring") {
      return messages.filter(
        (thread) =>
          thread.ownerEmail === account.email ||
          thread.opportunity?.contact === account.email ||
          thread.company === account.name
      );
    }

    return messages.filter(
      (thread) => !thread.seeker?.email || thread.seeker.email === account.email
    );
  }, [messages, account]);

  const sortedMessages = useMemo(() => {
    return [...visibleMessages].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );
  }, [visibleMessages]);

  const activeThread = useMemo(
    () =>
      sortedMessages.find((message) => message.id === activeId) ||
      sortedMessages[0],
    [sortedMessages, activeId]
  );

  const isHiringThread =
    account?.accountType === "hiring" &&
    activeThread &&
    (activeThread.ownerEmail === account.email ||
      activeThread.opportunity?.contact === account.email ||
      activeThread.company === account.name);

  const persistMessages = (nextMessages) => {
    setMessages(nextMessages);
    writeJson("forsaMessages", nextMessages);
  };

  const openThread = (id) => {
    setActiveId(id);
    setMobileThreadOpen(true);
  };

  const notifyStatusChange = (thread, status) => {
    if (!thread?.seeker?.email) return;

    const notifications = safeJson("forsaNotifications", []);
    writeJson("forsaNotifications", [
      {
        id: Date.now(),
        type: "application_status",
        title: "Application status updated",
        text: `Your application for ${thread.title} was marked as ${getStatusLabel(status).toLowerCase()}.`,
        targetEmail: thread.seeker.email,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...notifications,
    ]);
  };

  const updateStatus = (status) => {
    if (!activeThread) return;
    if ((activeThread.status || "pending") === status) return;

    const now = new Date().toISOString();

    const systemMessage = {
      id: Date.now(),
      from: "Forsa",
      role: "system",
      text: `Application status changed to ${getStatusLabel(status)}.`,
      createdAt: now,
    };

    const updated = messages.map((thread) =>
      thread.id === activeThread.id
        ? {
            ...thread,
            status,
            updatedAt: now,
            lastMessage: systemMessage.text,
            conversation: [...(thread.conversation || []), systemMessage],
            statusHistory: [
              ...(thread.statusHistory || []),
              {
                status,
                createdAt: now,
                by: account?.email || "system",
              },
            ],
          }
        : thread
    );

    persistMessages(updated);
    notifyStatusChange(activeThread, status);
    showToast(`Application marked as ${getStatusLabel(status).toLowerCase()}`);
  };

  const sendReply = () => {
    if (!reply.trim() || !activeThread) return;

    const now = new Date().toISOString();

    const newMessage = {
      id: Date.now(),
      from: account?.name || "You",
      role: account?.accountType === "hiring" ? "hiring" : "seeker",
      text: reply.trim(),
      createdAt: now,
    };

    const updated = messages.map((message) => {
      if (message.id !== activeThread.id) return message;

      return {
        ...message,
        lastMessage: reply.trim(),
        updatedAt: now,
        conversation: [...(message.conversation || []), newMessage],
      };
    });

    const nextPresence = safeJson("forsaPresence", {});
    if (account?.email) {
      writeJson("forsaPresence", {
        ...nextPresence,
        [account.email]: {
          lastSeen: now,
        },
      });
    }

    persistMessages(updated);
    showToast("Message sent");
    setReply("");
  };

  const deleteThread = (id) => {
    const confirmed = window.confirm("Delete this message thread?");
    if (!confirmed) return;

    const updated = messages.filter((message) => message.id !== id);
    persistMessages(updated);
    showToast("Thread deleted");
    setActiveId(updated[0]?.id || null);
    setMobileThreadOpen(false);
  };

  if (!account) {
    return (
      <section>
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-14 pb-28 sm:px-6 sm:py-20">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 text-center shadow-sm sm:rounded-[32px] sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <FaPaperPlane />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Create an account to use messages.
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
              You can browse opportunities as a guest, but messaging requires a
              Forsa profile.
            </p>

            <Link
              to="/auth"
              className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
            >
              Create account
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
        <div className="mt-6 sm:mt-8">
          <p className="text-sm font-medium text-neutral-500">Messages</p>

          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
            Applications and messages
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
            Manage applications, candidate conversations, and status updates in
            one place.
          </p>
        </div>

        {sortedMessages.length === 0 ? (
          <EmptyMessages />
        ) : (
          <div className="mt-6 grid gap-4 lg:min-h-[650px] lg:grid-cols-[0.38fr_0.62fr]">
            <InboxPanel
              messages={sortedMessages}
              activeId={activeThread?.id}
              openThread={openThread}
              account={account}
              presence={presence}
            />

            <ThreadPanel
              account={account}
              profile={profile}
              activeThread={activeThread}
              reply={reply}
              setReply={setReply}
              sendReply={sendReply}
              deleteThread={deleteThread}
              mobileThreadOpen={mobileThreadOpen}
              closeMobileThread={() => setMobileThreadOpen(false)}
              isHiringThread={isHiringThread}
              updateStatus={updateStatus}
              presence={presence}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyMessages() {
  return (
    <div className="mt-8 rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-sm sm:rounded-[32px] sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
        <FaPaperPlane />
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
        No messages yet.
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600 sm:text-base">
        Applications and conversations will appear here.
      </p>

      <Link
        to="/explore"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white"
      >
        Explore opportunities
      </Link>
    </div>
  );
}

function InboxPanel({ messages, activeId, openThread, account, presence }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-3 shadow-sm sm:rounded-[32px]">
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-3">
        <div>
          <p className="text-sm font-medium">Inbox</p>
          <p className="mt-1 text-xs text-neutral-500">
            {messages.length} thread{messages.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f7f5] text-neutral-600">
          <FaInbox className="text-sm" />
        </div>
      </div>

      <div className="mt-3 grid max-h-[560px] gap-2 overflow-auto pr-1">
        {messages.map((message) => (
          <ThreadButton
            key={message.id}
            message={message}
            active={activeId === message.id}
            onClick={() => openThread(message.id)}
            account={account}
            presence={presence}
          />
        ))}
      </div>
    </div>
  );
}

function ThreadButton({ message, active, onClick, account, presence }) {
  const otherEmail = getOtherParticipantEmail(message, account);
  const lastSeen = presence?.[otherEmail]?.lastSeen;
  const unread = message.lastMessage && message.updatedAt && !active;

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-4 text-left transition ${
        active ? "bg-black text-white" : "bg-[#f7f7f5] hover:bg-neutral-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`truncate text-xs ${
              active ? "text-neutral-300" : "text-neutral-500"
            }`}
          >
            {message.company}
          </p>

          <h3 className="mt-1 line-clamp-2 font-medium leading-tight">
            {message.title}
          </h3>
        </div>

        <StatusPill status={message.status || "pending"} active={active} />
      </div>

      <p
        className={`mt-3 line-clamp-2 text-sm leading-6 ${
          active ? "text-neutral-300" : "text-neutral-600"
        }`}
      >
        {message.lastMessage}
      </p>

      <div
        className={`mt-3 flex items-center justify-between gap-3 text-[11px] ${
          active ? "text-neutral-300" : "text-neutral-500"
        }`}
      >
        <span>{getPresenceText(lastSeen || message.updatedAt || message.createdAt)}</span>
        {unread && <span className="h-2 w-2 rounded-full bg-black" />}
      </div>
    </button>
  );
}

function ThreadPanel({
  account,
  profile,
  activeThread,
  reply,
  setReply,
  sendReply,
  deleteThread,
  mobileThreadOpen,
  closeMobileThread,
  isHiringThread,
  updateStatus,
  presence,
}) {
  return (
    <div
      className={`${
        mobileThreadOpen ? "fixed inset-0 z-50 flex bg-[#f7f7f5]" : "hidden"
      } lg:static lg:z-auto lg:flex`}
    >
      <div className="flex h-full w-full flex-col rounded-none bg-white shadow-sm lg:rounded-[32px] lg:border lg:border-neutral-200 lg:p-5">
        {activeThread ? (
          <>
            <ThreadHeader
              thread={activeThread}
              account={account}
              presence={presence}
              onDelete={() => deleteThread(activeThread.id)}
              onBack={closeMobileThread}
            />

            <div className="flex-1 overflow-auto px-4 py-4 lg:px-0">
              <StatusTimeline status={activeThread.status || "pending"} />

              {isHiringThread && (
                <StatusControl
                  status={activeThread.status || "pending"}
                  onChange={updateStatus}
                />
              )}

              <ApplicationCard
                account={account}
                profile={profile}
                thread={activeThread}
                isHiringThread={isHiringThread}
              />

              <ConversationList account={account} thread={activeThread} />
            </div>

            <ReplyBox reply={reply} setReply={setReply} sendReply={sendReply} />
          </>
        ) : (
          <div className="hidden h-full items-center justify-center rounded-[28px] bg-[#f7f7f5] p-8 text-center lg:flex">
            <div>
              <FaArrowLeft className="mx-auto text-neutral-400" />
              <p className="mt-4 font-medium">Select a thread</p>
              <p className="mt-2 text-sm text-neutral-500">
                Choose a message from your inbox.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadHeader({ thread, account, presence, onDelete, onBack }) {
  const otherEmail = getOtherParticipantEmail(thread, account);
  const lastSeen = presence?.[otherEmail]?.lastSeen || thread.updatedAt || thread.createdAt;
  const activeNow = getPresenceText(lastSeen) === "Active now";

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white px-4 py-4 lg:static lg:px-0 lg:pb-5 lg:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={onBack}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f7f5] lg:hidden"
          >
            <FaArrowLeft className="text-sm" />
          </button>

          <div className="min-w-0">
            <p className="text-sm text-neutral-500">{thread.company}</p>

            <h2 className="mt-1 line-clamp-2 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
              {thread.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span>Status: {getStatusLabel(thread.status || "pending")}</span>

              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeNow ? "bg-green-500" : "bg-neutral-300"
                  }`}
                />
                {getPresenceText(lastSeen)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onDelete}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-sm text-red-600"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
}

function StatusTimeline({ status }) {
  if (status === "rejected") {
    return (
      <div className="mb-4 rounded-[24px] border border-red-100 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <FaTimesCircle className="text-sm" />
          <p className="text-sm font-medium">Application rejected</p>
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(0, timelineSteps.indexOf(status || "pending"));

  return (
    <div className="mb-4 rounded-[24px] border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Status timeline</p>
          <p className="mt-1 text-sm text-neutral-500">
            Current stage: {getStatusLabel(status)}
          </p>
        </div>

        <span className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs text-neutral-600">
          {currentIndex + 1}/3
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        {timelineSteps.map((step, index) => (
          <div
            key={step}
            className={`h-2 flex-1 rounded-full ${
              index <= currentIndex ? "bg-black" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 text-[11px] uppercase tracking-wide text-neutral-500">
        <span>Pending</span>
        <span className="text-center">Shortlisted</span>
        <span className="text-right">Accepted</span>
      </div>
    </div>
  );
}

function StatusControl({ status, onChange }) {
  return (
    <div className="mb-4 rounded-[24px] border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium">Application status</p>
      <p className="mt-1 text-sm text-neutral-500">
        Update this candidate and notify them automatically.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const active = status === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              <Icon className="text-xs" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConversationList({ account, thread }) {
  const conversation =
    thread.conversation?.length > 0
      ? thread.conversation
      : [
          {
            id: "initial",
            from: thread.seeker?.name || account.name,
            role: "seeker",
            text: thread.lastMessage,
            createdAt: thread.createdAt,
            answers: thread.answers || {},
          },
        ];

  return (
    <div className="mt-4 rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <p className="text-sm font-medium">Conversation</p>

      <div className="mt-4 grid gap-3">
        {conversation.map((item) => {
          const isMine =
            item.from === account.name ||
            (account.accountType === "hiring" && item.role === "hiring") ||
            (account.accountType !== "hiring" && item.role === "seeker");

          const isSystem = item.role === "system";
          const answers = item.answers || {};
          const answerEntries = Object.entries(answers).filter(
            ([question, answer]) => question?.trim() && answer?.trim()
          );

          if (isSystem) {
            return (
              <div key={item.id} className="text-center">
                <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs text-neutral-500">
                  {item.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-4 sm:max-w-[75%] ${
                  isMine ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                      isMine ? "bg-white text-black" : "bg-black text-white"
                    }`}
                  >
                    <FaUser />
                  </div>

                  <p className="text-sm font-medium">{item.from}</p>
                </div>

                <p
                  className={`mt-3 text-sm leading-6 ${
                    isMine ? "text-neutral-200" : "text-neutral-600"
                  }`}
                >
                  {item.text}
                </p>

                {answerEntries.length > 0 && (
                  <ApplicationAnswers answers={answers} dark={isMine} />
                )}

                {item.createdAt && (
                  <p className="mt-3 text-[11px] text-neutral-400">
                    {formatDateTime(item.createdAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationAnswers({ answers, dark = false }) {
  const entries = Object.entries(answers || {}).filter(
    ([question, answer]) => question?.trim() && answer?.trim()
  );

  if (entries.length === 0) return null;

  return (
    <div
      className={`mt-4 rounded-2xl p-3 ${
        dark ? "bg-white/10" : "bg-[#f7f7f5]"
      }`}
    >
      <p
        className={`text-xs font-medium ${
          dark ? "text-neutral-300" : "text-neutral-500"
        }`}
      >
        Application answers
      </p>

      <div className="mt-3 grid gap-3">
        {entries.map(([question, answer]) => (
          <div key={question}>
            <p
              className={`text-xs font-medium ${
                dark ? "text-white" : "text-black"
              }`}
            >
              {question}
            </p>

            <p
              className={`mt-1 text-sm leading-6 ${
                dark ? "text-neutral-200" : "text-neutral-600"
              }`}
            >
              {answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplyBox({ reply, setReply, sendReply }) {
  return (
    <div className="sticky bottom-0 border-t border-neutral-100 bg-white p-4 lg:static lg:mt-4 lg:rounded-[28px] lg:border lg:border-neutral-200">
      <label className="text-sm font-medium">Add a message</label>

      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a follow-up message..."
        className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-black lg:min-h-28"
      />

      <button
        onClick={sendReply}
        disabled={!reply.trim()}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium sm:w-fit ${
          reply.trim()
            ? "bg-black text-white"
            : "cursor-not-allowed bg-neutral-200 text-neutral-400"
        }`}
      >
        <FaPaperPlane className="text-xs" />
        Send message
      </button>
    </div>
  );
}

function ApplicationCard({ account, profile, thread, isHiringThread }) {
  const seeker = thread.seeker || {};
  const cv = thread.cv || profile.cv;
  const displayName = isHiringThread ? seeker.name : account.name;
  const displayCity = isHiringThread ? seeker.city : account.city;
  const displayEmail = isHiringThread ? seeker.email : account.email;
  const displaySkills = isHiringThread ? seeker.skills : profile.skills;
  const displayLookingFor = isHiringThread
    ? seeker.lookingFor
    : profile.lookingFor;

  const answers = thread.answers || {};
  const answerEntries = Object.entries(answers).filter(
    ([question, answer]) => question?.trim() && answer?.trim()
  );

  return (
    <div className="rounded-[24px] bg-black p-4 text-white sm:rounded-[28px] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
          <FaBriefcase />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-neutral-300">
            {isHiringThread ? "Applicant profile" : "Application summary"}
          </p>
          <h3 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em]">
            {displayName || "Applicant"}
          </h3>
          <p className="mt-1 break-all text-sm text-neutral-300">
            {displayCity || "Lebanon"} · {displayEmail || "No email"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <SummaryBox
          title="Skills"
          text={displaySkills?.length ? displaySkills.join(", ") : "No skills"}
        />
        <SummaryBox
          title="Looking for"
          text={
            displayLookingFor?.length
              ? displayLookingFor.join(", ")
              : "Not selected"
          }
        />
      </div>

      {answerEntries.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white/10 p-4">
          <p className="text-xs text-neutral-300">Application answers</p>

          <div className="mt-3 grid gap-3">
            {answerEntries.map(([question, answer]) => (
              <div key={question}>
                <p className="text-sm font-medium text-white">{question}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-300">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 rounded-2xl bg-white/10 p-4">
        <p className="text-xs text-neutral-300">CV metadata</p>

        {cv ? (
          <div className="mt-2 flex min-w-0 items-center gap-3 text-sm">
            <FaFileAlt className="shrink-0" />
            <span className="truncate">{cv.name}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-300">No CV attached.</p>
        )}
      </div>
    </div>
  );
}

function SummaryBox({ title, text }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs text-neutral-300">{title}</p>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}

function StatusPill({ status, active }) {
  const cls =
    status === "shortlisted"
      ? active
        ? "bg-white text-black"
        : "bg-black text-white"
      : status === "accepted"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : active
      ? "bg-white/10 text-white"
      : "bg-white text-neutral-600";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function getOtherParticipantEmail(thread, account) {
  if (!thread || !account) return null;

  if (account.accountType === "hiring") {
    return thread.seeker?.email || null;
  }

  return thread.ownerEmail || thread.opportunity?.contact || null;
}
