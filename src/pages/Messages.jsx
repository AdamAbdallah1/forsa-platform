import { useMemo, useState } from "react";
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
} from "react-icons/fa";
import AppHeader from "../components/AppHeader";

const safeJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

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

  const activeThread = useMemo(
    () => messages.find((message) => message.id === activeId),
    [messages, activeId]
  );

  const openThread = (id) => {
    setActiveId(id);
    setMobileThreadOpen(true);
  };

  const sendReply = () => {
    if (!reply.trim() || !activeThread) return;

    const newMessage = {
      id: Date.now(),
      from: account?.name || "You",
      role: account?.accountType === "hiring" ? "hiring" : "seeker",
      text: reply.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = messages.map((message) => {
      if (message.id !== activeThread.id) return message;

      return {
        ...message,
        status: "sent",
        lastMessage: reply.trim(),
        updatedAt: new Date().toISOString(),
        conversation: [...(message.conversation || []), newMessage],
      };
    });

    setMessages(updated);
    localStorage.setItem("forsaMessages", JSON.stringify(updated));
    showToast("Message sent");
    setReply("");
  };

  const deleteThread = (id) => {
    const confirmed = window.confirm("Delete this message thread?");
    if (!confirmed) return;

    const updated = messages.filter((message) => message.id !== id);
    setMessages(updated);
    localStorage.setItem("forsaMessages", JSON.stringify(updated));
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

      <div className="mx-auto max-w-6xl px-5 pb-28 sm:px-6 lg:pb-20">
        <div className="mt-6 sm:mt-10">
          <p className="text-sm font-medium text-neutral-500">Messages</p>

          <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
            Applications and messages
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 sm:text-base">
            Manage conversations created when you apply or contact an
            opportunity poster.
          </p>
        </div>

        {messages.length === 0 ? (
          <EmptyMessages />
        ) : (
          <div className="mt-6 grid gap-4 lg:min-h-[650px] lg:grid-cols-[0.38fr_0.62fr]">
            <InboxPanel messages={messages} activeId={activeId} openThread={openThread} />

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
        Contact a poster from Explore and your message thread will appear here.
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

function InboxPanel({ messages, activeId, openThread }) {
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
          />
        ))}
      </div>
    </div>
  );
}

function ThreadButton({ message, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-4 text-left transition ${
        active ? "bg-black text-white" : "bg-[#f7f7f5] hover:bg-neutral-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-xs ${active ? "text-neutral-300" : "text-neutral-500"}`}>
            {message.company}
          </p>

          <h3 className="mt-1 line-clamp-2 font-medium leading-tight">
            {message.title}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
            active ? "bg-white/10 text-white" : "bg-white text-neutral-600"
          }`}
        >
          {message.status || "draft"}
        </span>
      </div>

      <p className={`mt-3 line-clamp-2 text-sm leading-6 ${active ? "text-neutral-300" : "text-neutral-600"}`}>
        {message.lastMessage}
      </p>
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
}) {
  return (
    <div className={`${mobileThreadOpen ? "fixed inset-0 z-50 flex bg-[#f7f7f5]" : "hidden"} lg:static lg:z-auto lg:flex`}>
      <div className="flex h-full w-full flex-col rounded-none bg-white shadow-sm lg:rounded-[32px] lg:border lg:border-neutral-200 lg:p-5">
        {activeThread ? (
          <>
            <ThreadHeader
              thread={activeThread}
              onDelete={() => deleteThread(activeThread.id)}
              onBack={closeMobileThread}
            />

            <div className="flex-1 overflow-auto px-4 py-4 lg:px-0">
              <ApplicationCard account={account} profile={profile} thread={activeThread} />
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

function ThreadHeader({ thread, onDelete, onBack }) {
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

            <p className="mt-2 text-sm text-neutral-500">
              Status: {thread.status || "draft"}
            </p>
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

function ConversationList({ account, thread }) {
  const conversation =
    thread.conversation?.length > 0
      ? thread.conversation
      : [
          {
            id: "initial",
            from: account.name,
            role: "seeker",
            text: thread.lastMessage,
            createdAt: thread.createdAt,
          },
        ];

  return (
    <div className="mt-4 rounded-[24px] bg-[#f7f7f5] p-4 sm:rounded-[28px] sm:p-5">
      <p className="text-sm font-medium">Conversation</p>

      <div className="mt-4 grid gap-3">
        {conversation.map((item) => {
          const isMine = item.from === account.name;

          return (
            <div key={item.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[92%] rounded-2xl p-4 sm:max-w-[75%] ${
                  isMine ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${isMine ? "bg-white text-black" : "bg-black text-white"}`}>
                    <FaUser />
                  </div>

                  <p className="text-sm font-medium">{item.from}</p>
                </div>

                <p className={`mt-3 text-sm leading-6 ${isMine ? "text-neutral-200" : "text-neutral-600"}`}>
                  {item.text}
                </p>

                {item.createdAt && (
                  <p className="mt-3 text-[11px] text-neutral-400">
                    {new Date(item.createdAt).toLocaleString()}
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
          reply.trim() ? "bg-black text-white" : "cursor-not-allowed bg-neutral-200 text-neutral-400"
        }`}
      >
        <FaPaperPlane className="text-xs" />
        Send message
      </button>
    </div>
  );
}

function ApplicationCard({ account, profile, thread }) {
  const cv = thread.cv || profile.cv;

  return (
    <div className="rounded-[24px] bg-black p-4 text-white sm:rounded-[28px] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black">
          <FaBriefcase />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-neutral-300">Application summary</p>
          <h3 className="mt-1 truncate text-xl font-semibold tracking-[-0.03em]">
            {account.name}
          </h3>
          <p className="mt-1 break-all text-sm text-neutral-300">
            {account.city} · {account.email}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <SummaryBox title="Skills" text={profile.skills?.length ? profile.skills.join(", ") : "No skills"} />
        <SummaryBox title="Looking for" text={profile.lookingFor?.length ? profile.lookingFor.join(", ") : "Not selected"} />
      </div>

      <div className="mt-3 rounded-2xl bg-white/10 p-4">
        <p className="text-xs text-neutral-300">CV metadata</p>

        {cv ? (
          <div className="mt-2 flex min-w-0 items-center gap-3 text-sm">
            <FaFileAlt className="shrink-0" />
            <span className="truncate">{cv.name}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-300">
            No CV attached. Upload a CV from your profile to include it in
            future applications.
          </p>
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
