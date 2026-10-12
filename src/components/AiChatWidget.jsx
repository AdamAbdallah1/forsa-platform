import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaArrowRight, FaTimes } from "react-icons/fa";
import useForsaAi from "../hooks/useForsaAi";
import { AiStatusBlock, AiTranscript, TypingIndicator } from "./AiChat";
import MiraMark, { MiraStatusPill } from "./MiraMark";
import AiUsagePill from "./AiUsagePill";
import { useAuth } from "../contexts/AuthContext";

/*
 * Forsa AI's floating entry point.
 *
 * A lightweight doorway into the workspace, not a second chatbot: three
 * self-contained quick actions, each costing exactly one generation only
 * when tapped. Opening the panel never invokes the provider. The full
 * workspace at /ai handles forms, guides, and follow-ups.
 *
 * Rendered app-wide but self-gating: authenticated users only, never on the
 * workspace itself or on authentication/password-reset screens.
 *
 * Layering: z-[60] sits above MobileNav (z-50) and well below Modal
 * (z-[999]). The launcher unmounts while the panel is open so it can never
 * overlap it. Focus moves into the panel on open and back on close; Escape
 * closes; background scroll locks while open.
 */

const HIDDEN_PATHS = new Set([
  "/ai",
  "/auth",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
]);

const QUICK_ACTIONS = [
  {
    id: "tips",
    label: "Interview tips",
    prompt:
      "Give me 5 practical interview tips for a junior job seeker in Lebanon. Keep each tip to one or two sentences.",
  },
  {
    id: "cv",
    label: "CV essentials",
    prompt:
      "List the essential sections of a strong junior CV in Lebanon, with one sentence on what belongs in each.",
  },
  {
    id: "start",
    label: "Start applying",
    prompt:
      "Give me a short, actionable plan for starting a job search as a fresh graduate in Lebanon.",
  },
];

const normalizePathname = (pathname) => {
  const trimmed = String(pathname || "/").replace(/\/+$/, "");

  return trimmed || "/";
};

const PANEL_MOTION_CLASS =
  "fixed z-[60] flex flex-col overflow-hidden rounded-[26px] border border-[var(--forsa-border)] bg-[var(--forsa-bg)] shadow-[0_24px_70px_rgba(109,40,217,0.22)] outline-none inset-x-2 top-2 bottom-[calc(env(safe-area-inset-bottom,0px)+78px)] md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:h-[min(72dvh,600px)] md:w-[400px]";

const LAUNCHER_CLASS =
  "fixed bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full forsa-button text-white shadow-[0_14px_36px_rgba(109,40,217,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 md:bottom-6 md:right-6";

const ICON_BUTTON_CLASS =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-bg)] text-neutral-600 transition hover:bg-[var(--forsa-bg-soft)] hover:text-[var(--forsa-primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2";

export default function AiChatWidget() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const conversation = useForsaAi({ tool: "general" });

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const wasOpenRef = useRef(false);

  const pathname = normalizePathname(location.pathname);
  const isHiddenRoute = HIDDEN_PATHS.has(pathname);
  const isVisible = !loading && Boolean(user) && !isHiddenRoute;

  /*
   * Close on navigation, done during render (React's documented pattern for
   * adjusting state when a value changes) so a route change never queues a
   * second render pass purely to close the panel.
   */
  const [renderedPathname, setRenderedPathname] = useState(pathname);

  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setOpen(false);
  }

  /* Lock background scroll while the panel is open. */
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /*
   * Move focus into the panel on open and back to the launcher on close. The
   * close path is deferred a frame so it runs after the launcher re-mounts.
   */
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;

      const frame = requestAnimationFrame(() => {
        panelRef.current?.focus();
      });

      return () => cancelAnimationFrame(frame);
    }

    if (!wasOpenRef.current) return undefined;

    wasOpenRef.current = false;

    const frame = requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!isVisible) return null;

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 12 },
      };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            id="forsa-ai-panel"
            ref={panelRef}
            role="dialog"
            aria-label="Forsa AI assistant"
            tabIndex={-1}
            {...panelMotion}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={PANEL_MOTION_CLASS}
          >
            <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--forsa-border)] bg-white px-3.5 py-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full forsa-button text-white"
              >
                <MiraMark className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-[-0.02em] text-neutral-900">
                  Forsa AI
                </p>
                <p className="truncate text-[10px] leading-4 text-neutral-500">
                  Career help, one tap away
                </p>
              </div>

              <MiraStatusPill />

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Forsa AI assistant"
                className={ICON_BUTTON_CLASS}
              >
                <FaTimes aria-hidden="true" className="text-sm" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-4">
              <p className="text-xs font-semibold text-neutral-800">
                Quick answers
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-neutral-500">
                Each uses one AI generation. Opening this panel costs nothing.
              </p>

              <div className="mt-2.5 grid grid-cols-1 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={conversation.isSending}
                    onClick={() => conversation.sendText(action.prompt)}
                    className="rounded-[16px] border border-[var(--forsa-border)] bg-white px-3.5 py-2.5 text-left text-[13px] font-semibold text-neutral-800 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {conversation.hasConversation && (
                <div className="mt-4">
                  <AiTranscript
                    messages={conversation.messages}
                    showTimestamps={false}
                  />
                </div>
              )}

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

              <div className="mt-4 border-t border-[var(--forsa-border)] pt-3">
                <AiUsagePill
                  usage={conversation.usage}
                  capacity={conversation.capacity}
                  className="w-full justify-center"
                />

                <Link
                  to="/ai"
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full forsa-button px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                >
                  Open full workspace
                  <FaArrowRight aria-hidden="true" className="text-xs" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="forsa-ai-panel"
          aria-label="Open Forsa AI assistant"
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          className={LAUNCHER_CLASS}
        >
          {/* Forsa AI's sparkle mark — deliberately not a chat/message icon. */}
          <MiraMark className="h-[21px] w-[21px]" />
        </motion.button>
      )}
    </>
  );
}
