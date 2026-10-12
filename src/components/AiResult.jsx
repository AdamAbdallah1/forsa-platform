import { useMemo, useState } from "react";
import { FaCheck, FaCopy } from "react-icons/fa";
import {
  inlineText,
  parseMarkdown,
  sectionText,
  splitPracticePrompt,
  splitSections,
} from "../lib/forsaAiMarkdown";
import { MarkdownBlocks } from "./AiMarkdown";
import MiraMark from "./MiraMark";

/*
 * Structured result rendering for guided tool generations.
 *
 * Assistant messages are split into sections at top-level headings and each
 * section renders as a scannable card with its own copy button (clean
 * Markdown source, so pasting elsewhere preserves formatting). Content
 * before the first heading renders plainly as an introduction. Nothing is
 * reordered, dropped, or rewritten — grouping is presentational only.
 *
 * Interview variant: when the trailing block of the first assistant reply is
 * a paragraph or quote ending in "?", it renders as an emphasized practice
 * card that points at the follow-up composer. The rule is deliberately
 * narrow (last block only, question-shaped only) and degrades to normal
 * rendering when it doesn't match — no content is ever hidden by it.
 *
 * User turns render as plain bubbles, identical to the transcript. Copy
 * uses the clipboard API with a silent fallback to selectable text.
 */

function useCopyButton() {
  const [copiedKey, setCopiedKey] = useState(null);

  const copy = async (key, text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2000);
    } catch {
      /* Clipboard unavailable — the text remains selectable. */
    }
  };

  return [copiedKey, copy];
}

function SectionCopyButton({ copyKey, copiedKey, onCopy, label }) {
  const copied = copiedKey === copyKey;

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      aria-live="polite"
      title={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white px-3 py-2 text-[11px] font-semibold text-neutral-500 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
    >
      {copied ? (
        <>
          <FaCheck aria-hidden="true" className="text-[10px]" />
          Copied
        </>
      ) : (
        <>
          <FaCopy aria-hidden="true" className="text-[10px]" />
          Copy
        </>
      )}
    </button>
  );
}

function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-[20px] forsa-button px-4 py-3 text-sm leading-6 text-white sm:max-w-[74%]">
        <p className="whitespace-pre-line break-words">{content}</p>
      </div>
    </div>
  );
}

function AssistantSections({ text, variant, isFirstReply }) {
  const [copiedKey, copy] = useCopyButton();

  const { sections, practice } = useMemo(() => {
    const blocks = parseMarkdown(text);

    if (variant === "interview" && isFirstReply) {
      const { main, prompt } = splitPracticePrompt(blocks);
      return { sections: splitSections(main), practice: prompt };
    }

    return { sections: splitSections(blocks), practice: null };
  }, [text, variant, isFirstReply]);

  if (sections.length === 0 && !practice) return null;

  return (
    <div className="max-w-[75ch] space-y-3">
      {sections.map((section, index) => {
        const key = `s${index}`;

        // Introductory content before any heading renders plainly.
        if (!section.heading) {
          return (
            <div key={key} className="space-y-3">
              <MarkdownBlocks blocks={section.blocks} />
            </div>
          );
        }

        return (
          <section
            key={key}
            aria-label={inlineText(section.heading.children)}
            className="rounded-2xl border border-[var(--forsa-border)] bg-white p-4 sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-[15px] font-semibold tracking-[-0.01em] text-neutral-900">
                {inlineText(section.heading.children)}
              </h3>

              <SectionCopyButton
                copyKey={key}
                copiedKey={copiedKey}
                label={`Copy section: ${inlineText(section.heading.children).slice(0, 60)}`}
                onCopy={() => copy(key, sectionText(section))}
              />
            </div>

            <div className="space-y-3">
              <MarkdownBlocks blocks={section.blocks} />
            </div>
          </section>
        );
      })}

      {practice && (
        <section
          aria-label="Practice question"
          className="rounded-2xl border border-[var(--forsa-primary)]/30 bg-[var(--forsa-bg-soft)] p-4 sm:p-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--forsa-primary)]">
            Your turn — answer below
          </p>

          <div className="mt-2 space-y-3 text-[15px] font-medium leading-7 text-neutral-900">
            <MarkdownBlocks blocks={[practice]} />
          </div>

          <p className="mt-3 text-xs leading-5 text-neutral-500">
            Type your answer in the follow-up box — it uses one AI generation.
          </p>
        </section>
      )}
    </div>
  );
}

export default function AiResult({ messages, variant = "general" }) {
  const assistantSeen = useMemo(() => {
    let count = 0;
    const flags = new Map();
    for (const message of messages || []) {
      if (message.role === "assistant") {
        flags.set(message.id, count === 0);
        count += 1;
      }
    }
    return flags;
  }, [messages]);

  return (
    <div className="space-y-4">
      {(messages || []).map((message) =>
        message.role === "user" ? (
          <UserBubble key={message.id} content={message.content} />
        ) : (
          <div key={message.id} className="flex justify-start">
            <div className="flex min-w-0 max-w-full gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full forsa-button text-white"
              >
                <MiraMark className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <AssistantSections
                  text={message.content}
                  variant={variant}
                  isFirstReply={assistantSeen.get(message.id) === true}
                />

                {message.truncated === true && (
                  <p
                    role="note"
                    className="mt-3 rounded-xl border border-[var(--forsa-gold)]/60 bg-[var(--forsa-gold-soft)] px-3.5 py-2.5 text-xs leading-5 text-neutral-700"
                  >
                    This answer was cut short at the response limit. Ask a
                    follow-up below to continue from where it stopped — it
                    uses one AI generation.
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
