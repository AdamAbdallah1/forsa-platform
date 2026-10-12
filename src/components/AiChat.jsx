import { useRef, useState } from "react";
import {
  FaArrowUp,
  FaExclamationTriangle,
  FaPlug,
  FaSpinner,
} from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import MiraMark from "./MiraMark";
import AiMarkdown from "./AiMarkdown";
import { describeError } from "../lib/forsaAiErrors";

/*
 * Forsa AI conversation primitives.
 *
 * Presentational building blocks shared by the workspace runner and the
 * floating widget: transcript rendering, the message composer, and honest
 * error states. State lives in `useForsaAi` instances owned by the caller —
 * this file never calls the provider itself.
 *
 * No reply is ever invented here. Assistant turns render only what the
 * server returned; every failure renders copy describing what happened.
 */

const MAX_MESSAGE_LENGTH = 2000;

/* Keeps inline actions aligned with the assistant avatar (h-8 w-8 + gap). */
const ACTION_INDENT = "pl-[42px]";

const ACTION_BUTTON_CLASS =
  "rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export function MessageRow({ children, align = "assistant" }) {
  const isUser = align === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[88%] gap-2.5 sm:max-w-[74%] ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {!isUser && (
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full forsa-button text-white"
          >
            <MiraMark className="h-4 w-4" />
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

export function AssistantBody({ title, tone = "neutral", icon, children }) {
  const isError = tone === "error";

  return (
    <div
      className={`min-w-0 rounded-[20px] border p-4 ${
        isError
          ? "border-red-200 bg-red-50"
          : "border-[var(--forsa-border)] bg-white"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isError
              ? "bg-red-100 text-red-600"
              : "bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
          }`}
        >
          {icon}
        </span>

        <div className="min-w-0">
          <p
            className={`text-sm font-semibold tracking-[-0.02em] ${
              isError ? "text-red-900" : "text-neutral-900"
            }`}
          >
            {title}
          </p>

          <div
            className={`mt-1 whitespace-pre-line break-words text-sm leading-6 ${
              isError ? "text-red-700" : "text-neutral-600"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <MessageRow>
      <div className="rounded-[20px] border border-[var(--forsa-border)] bg-white px-4 py-3.5">
        <span className="sr-only">Forsa AI is preparing a reply</span>

        <span aria-hidden="true" className="flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)] motion-safe:animate-pulse"
              style={{ animationDelay: `${dot * 160}ms` }}
            />
          ))}
        </span>
      </div>
    </MessageRow>
  );
}

export function AiStatusBlock({ error, onRetry, sending }) {
  if (!error) return null;

  const described = describeError(error);

  return (
    <div className="mt-4">
      <MessageRow>
        <AssistantBody
          title={described.title}
          tone={described.tone}
          icon={
            described.tone === "error" ? (
              <FaExclamationTriangle className="text-xs" />
            ) : (
              <FaPlug className="text-xs" />
            )
          }
        >
          {described.body}
        </AssistantBody>
      </MessageRow>

      {described.retryable && (
        <div className={`mt-2 flex justify-start ${ACTION_INDENT}`}>
          <button
            type="button"
            onClick={onRetry}
            disabled={sending}
            className={ACTION_BUTTON_CLASS}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export function AiTranscript({ messages, showTimestamps = true }) {
  const reduceMotion = useReducedMotion();

  const appear = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.18, ease: "easeOut" },
      };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <motion.div key={message.id} {...appear}>
          <MessageRow align={message.role}>
            {message.role === "user" ? (
              <div className="flex min-w-0 flex-col items-end">
                <div className="rounded-[20px] forsa-button px-4 py-3 text-sm leading-6 text-white">
                  <p className="whitespace-pre-line break-words">
                    {message.content}
                  </p>
                </div>

                {showTimestamps && (
                  <span className="mt-1 px-1 text-[10px] leading-4 text-neutral-400">
                    {formatTime(message.createdAt)}
                  </span>
                )}
              </div>
            ) : (
              <div className="min-w-0">
                <AssistantBody
                  title="Forsa AI"
                  icon={<MiraMark className="h-3.5 w-3.5" />}
                >
                  <AiMarkdown text={message.content} />
                </AssistantBody>

                {showTimestamps && (
                  <span className="mt-1 block px-1 text-[10px] leading-4 text-neutral-400">
                    {formatTime(message.createdAt)}
                  </span>
                )}
              </div>
            )}
          </MessageRow>
        </motion.div>
      ))}
    </div>
  );
}

/*
 * Self-contained composer: owns the draft, validates locally, and calls
 * `onSend(text)` once per submission. The send button and Enter key are both
 * disabled while `sending` so a duplicate submission cannot fire a second
 * provider invocation.
 */
export function AiComposer({
  id,
  onSend,
  sending = false,
  placeholder = "Ask about your CV, an interview, or your next role",
  label = "Message Forsa AI",
  compact = false,
}) {
  const [draft, setDraft] = useState("");
  const [composerError, setComposerError] = useState("");
  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const node = textareaRef.current;
    if (!node) return;

    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 128)}px`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (sending) return;

    const value = draft.trim();

    if (!value) {
      setComposerError("Write a message before sending.");
      return;
    }

    if (value.length > MAX_MESSAGE_LENGTH) {
      setComposerError(
        `Keep messages under ${MAX_MESSAGE_LENGTH} characters.`
      );
      return;
    }

    setComposerError("");
    setDraft("");

    const node = textareaRef.current;
    if (node) node.style.height = "auto";

    onSend(value);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-2 rounded-[22px] border border-[var(--forsa-border)] bg-white p-2 transition focus-within:border-[var(--forsa-primary)] focus-within:ring-2 focus-within:ring-purple-100">
          <label htmlFor={id} className="sr-only">
            {label}
          </label>

          <textarea
            id={id}
            ref={textareaRef}
            rows={1}
            value={draft}
            enterKeyHint="send"
            onChange={(event) => {
              setDraft(event.target.value);
              if (composerError) setComposerError("");
              resizeTextarea();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder={placeholder}
            maxLength={MAX_MESSAGE_LENGTH}
            className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 text-neutral-800 outline-none placeholder:text-neutral-400"
          />

          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full forsa-button text-white transition active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
          >
            {sending ? (
              <FaSpinner aria-hidden="true" className="animate-spin text-sm" />
            ) : (
              <FaArrowUp aria-hidden="true" className="text-sm" />
            )}
          </button>
        </div>
      </form>

      {composerError ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {composerError}
        </p>
      ) : (
        !compact && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-neutral-400">
            <span className="hidden sm:inline">
              Enter to send · Shift + Enter for a new line
            </span>
            <span className="sm:hidden">Shift + Enter for a new line</span>
            <span
              aria-hidden="true"
              className="hidden text-neutral-300 sm:inline"
            >
              ·
            </span>
            <span>
              {draft.length > 0
                ? `${draft.length} / ${MAX_MESSAGE_LENGTH}`
                : `${MAX_MESSAGE_LENGTH} character limit`}
            </span>
          </p>
        )
      )}
    </div>
  );
}
