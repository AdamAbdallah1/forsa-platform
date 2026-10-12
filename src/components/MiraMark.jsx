import { useMiraStatus } from "../lib/miraService";

/*
 * Forsa AI's identity primitives. (The `MiraMark` export name is a retained
 * internal identifier; every user-facing surface renders "Forsa AI".)
 *
 * The mark is a two-part sparkle. It is deliberately NOT a robot or a chat
 * glyph: a robot reads as a support bot and a bubble reads as messaging, so
 * neither communicates "intelligent assistant" on its own. The larger spark
 * carries the shape at launcher sizes (16–20px); the smaller companion spark
 * keeps the set distinctive rather than reading as a generic sparkle.
 *
 * Fill is currentColor so the mark inverts cleanly on the purple launcher and
 * on light surfaces.
 */

export default function MiraMark({ className = "", title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title && <title>{title}</title>}

      {/* Primary spark */}
      <path d="M10 6.5C11.26 7.76 15.74 12.24 17 13.5C15.74 14.76 11.26 19.24 10 20.5C8.74 19.24 4.26 14.76 3 13.5C4.26 12.24 8.74 7.76 10 6.5Z" />

      {/* Companion spark */}
      <path d="M19.5 1.8C20.04 2.34 21.96 4.26 22.5 4.8C21.96 5.34 20.04 7.26 19.5 7.8C18.96 7.26 17.04 5.34 16.5 4.8C17.04 4.26 18.96 2.34 19.5 1.8Z" />
    </svg>
  );
}

/*
 * Honest connection status, driven by the shared service state.
 *
 * Deliberately quiet — a small filled dot plus plain text — so it informs
 * without alarming, and never implies a working model. `unverified` is the
 * truthful default before any call has been observed; it is not a claim that
 * a provider is missing, only that no connection has been confirmed yet.
 */
const STATUS_LABEL = {
  unverified: "Not connected yet",
  connected: "Connected",
  error: "Connection issue",
};

const STATUS_DOT = {
  unverified: "bg-[var(--forsa-gold)]",
  connected: "bg-[var(--forsa-primary)]",
  error: "bg-[var(--forsa-red)]",
};

export function MiraStatusPill({ className = "" }) {
  const { state } = useMiraStatus();

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white px-2.5 py-1 text-[11px] font-semibold leading-4 text-neutral-500 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[state] || STATUS_DOT.unverified}`}
      />
      {STATUS_LABEL[state] || STATUS_LABEL.unverified}
    </span>
  );
}
