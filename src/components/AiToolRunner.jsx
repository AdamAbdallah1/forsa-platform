import { useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaCheck, FaCopy, FaRedo } from "react-icons/fa";
import { useReducedMotion } from "framer-motion";
import useForsaAi from "../hooks/useForsaAi";
import { validateToolForm } from "../lib/forsaAiTools";
import {
  AiComposer,
  AiStatusBlock,
  TypingIndicator,
} from "./AiChat";
import AiResult from "./AiResult";
import MiraMark from "./MiraMark";

/*
 * One guided career tool, end to end: stepped form → single generation →
 * structured result → optional follow-up thread.
 *
 * Exactly one provider invocation happens per generation. Selecting the
 * tool, moving between steps, editing fields, and going back cost nothing.
 * Form data is preserved by the parent (keyed by tool id) so leaving for
 * the workspace grid and returning does not wipe user input.
 */

function StepField({ step, value, error, onChange, disabled, describedBy }) {
  const inputId = `forsa-ai-${step.id}`;
  const hintId = step.hint ? `${inputId}-hint` : undefined;

  if (step.options) {
    return (
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${inputId}-label`} aria-describedby={hintId}>
          {step.options.map((option) => {
            const selected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                disabled={disabled}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white shadow-[0_8px_20px_rgba(109,40,217,0.16)]"
                    : "border-[var(--forsa-border)] bg-white text-neutral-700 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  const shared =
    "w-full rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[var(--forsa-primary)] focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400 " +
    (error ? "border-red-300" : "border-[var(--forsa-border)]");

  return (
    <div>
      {step.multiline ? (
        <textarea
          id={inputId}
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={step.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${shared} min-h-[96px] resize-y`}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          inputMode={step.id === "weeklyHours" ? "numeric" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={step.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={shared}
        />
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AiToolRunner({
  tool,
  initialData = {},
  onDataChange,
  onBack,
}) {
  const conversation = useForsaAi({ tool: tool.tool });
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  const updateField = (fieldId, value) => {
    const next = { ...data, [fieldId]: value };
    setData(next);
    onDataChange?.(next);

    if (errors[fieldId]) {
      setErrors((previous) => {
        const rest = { ...previous };
        delete rest[fieldId];
        return rest;
      });
    }
  };

  const handleGenerate = async () => {
    const validation = validateToolForm(tool, data);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      const firstInvalid = document.querySelector(
        "#forsa-ai-runner [aria-invalid='true']"
      );
      firstInvalid?.focus();
      return;
    }

    /* Exactly one provider invocation for the whole tool run. */
    const [userTurn] = tool.buildMessages(data);
    await conversation.sendText(userTurn.content);
    setGenerated(true);
    setCopied(false);

    /* Bring the result into view without yanking a reader mid-scroll on
       subsequent follow-ups: only the first generation scrolls. */
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      });
    });
  };

  const handleCopy = async () => {
    const lastAssistant = [...conversation.messages]
      .reverse()
      .find((message) => message.role === "assistant" && !message.local);

    if (!lastAssistant) return;

    try {
      await navigator.clipboard.writeText(lastAssistant.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable — the text remains selectable. */
    }
  };

  const handleStartOver = () => {
    conversation.reset();
    setErrors({});
    setGenerated(false);
    setCopied(false);
  };

  const completedSteps = tool.steps.filter((step) => {
    const validate = step.validate || (() => null);
    return !validate(data[step.id]);
  }).length;

  return (
    <div id="forsa-ai-runner">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to career tools"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--forsa-border)] bg-white text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
        >
          <FaArrowLeft aria-hidden="true" className="text-xs" />
        </button>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-2xl">
            {tool.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Progress: completed valid steps out of total. */}
      <div
        className="mt-4 flex items-center gap-2"
        aria-label={`${completedSteps} of ${tool.steps.length} steps complete`}
      >
        <div
          aria-hidden="true"
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--forsa-border)]"
        >
          <div
            className="h-full rounded-full bg-[var(--forsa-primary)] transition-all duration-300"
            style={{
              width: `${Math.round((completedSteps / tool.steps.length) * 100)}%`,
            }}
          />
        </div>
        <span className="text-[11px] font-semibold text-neutral-500">
          {completedSteps}/{tool.steps.length}
        </span>
      </div>

      <div className="mt-6 space-y-5">
        {tool.steps.map((step, index) => (
          <div key={step.id}>
            <label
              id={`forsa-ai-${step.id}-label`}
              htmlFor={step.options ? undefined : `forsa-ai-${step.id}`}
              className="mb-1.5 block text-sm font-semibold text-neutral-900"
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[11px] font-bold text-[var(--forsa-primary)]">
                {index + 1}
              </span>
              {step.label}
            </label>

            {step.hint && (
              <p id={`forsa-ai-${step.id}-hint`} className="mb-2 text-xs leading-5 text-neutral-500">
                {step.hint}
              </p>
            )}

            <StepField
              step={step}
              value={data[step.id] || ""}
              error={errors[step.id]}
              onChange={(value) => updateField(step.id, value)}
              disabled={conversation.isSending}
              describedBy={step.hint ? `forsa-ai-${step.id}-hint` : undefined}
            />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={generated ? handleStartOver : handleGenerate}
          disabled={conversation.isSending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full forsa-button px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
        >
          {generated ? (
            <>
              <FaRedo aria-hidden="true" className="text-xs" />
              Start over
            </>
          ) : (
            <>
              Generate
              <FaArrowRight aria-hidden="true" className="text-xs" />
            </>
          )}
        </button>

        <p className="mt-2 text-[11px] leading-5 text-neutral-400">
          Uses 1 of your daily AI generations. Moving between steps and
          editing fields is always free.
        </p>
      </div>

      {(generated || conversation.hasConversation) && (
        <div ref={resultRef} className="mt-8 border-t border-[var(--forsa-border)] pt-6">
          {/* Screen-reader announcement; sighted users get the scroll + card. */}
          <p role="status" className="sr-only">
            {!conversation.isSending && generated
              ? "Your result is ready below."
              : ""}
          </p>

          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full forsa-button text-white"
              >
                <MiraMark className="h-3.5 w-3.5" />
              </span>
              Your result
            </p>

            <button
              type="button"
              onClick={handleCopy}
              aria-live="polite"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
            >
              {copied ? (
                <>
                  <FaCheck aria-hidden="true" className="text-[10px]" />
                  Copied
                </>
              ) : (
                <>
                  <FaCopy aria-hidden="true" className="text-[10px]" />
                  Copy result
                </>
              )}
            </button>
          </div>

          <AiResult messages={conversation.messages} variant={tool.id} />

          {conversation.isSending && (
            <div className="mt-4">
              <TypingIndicator />
            </div>
          )}

          {conversation.isError && (
            <AiStatusBlock
              error={conversation.error}
              sending={conversation.isSending}
              onRetry={conversation.retry}
            />
          )}

          {!conversation.isSending && !conversation.isError && generated && (
            <div className="mt-5 rounded-[18px] border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)]/60 p-3.5">
              <p className="text-xs font-semibold text-neutral-800">
                {tool.followUpLabel}
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-neutral-500">
                Career questions only — each follow-up uses one AI generation.
              </p>
              <div className="mt-2.5">
                <AiComposer
                  id={`forsa-ai-followup-${tool.id}`}
                  label={tool.followUpLabel}
                  placeholder={tool.followUpPlaceholder}
                  compact
                  sending={conversation.isSending}
                  onSend={(text) => conversation.sendText(text)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
