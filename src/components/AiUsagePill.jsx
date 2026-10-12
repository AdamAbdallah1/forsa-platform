import { FaBolt } from "react-icons/fa";

/*
 * Server-confirmed usage indicator.
 *
 * Renders only from numbers the backend actually reported — it never shows a
 * hardcoded counter. Before any generation this session it reads the user's
 * own counter document directly (rules allow self-reads), falling back to
 * the plan descriptor when the read is unavailable.
 */

function formatResetLabel(resetAt) {
  if (!resetAt) return "Resets at midnight UTC.";

  const date = new Date(resetAt);

  if (Number.isNaN(date.getTime())) return "Resets at midnight UTC.";

  return `Resets at midnight UTC (${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} your time).`;
}

export default function AiUsagePill({ usage, capacity, className = "" }) {
  /* Shared budget spent: this is the binding constraint, so say so. */
  if (capacity && capacity.used >= capacity.limit) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 ${className}`}
      >
        <FaBolt aria-hidden="true" className="text-[11px] text-[var(--forsa-gold)]" />
        Free daily capacity reached
      </span>
    );
  }

  if (!usage) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 ${className}`}
      >
        <FaBolt aria-hidden="true" className="text-[11px] text-[var(--forsa-primary)]" />
        Free pilot · 10 AI generations a day
      </span>
    );
  }

  const remaining = Math.max(0, usage.limit - usage.used);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 ${className}`}
      title={formatResetLabel(usage.resetAt)}
    >
      <FaBolt aria-hidden="true" className="text-[11px] text-[var(--forsa-primary)]" />
      {remaining} of {usage.limit} AI generations remaining today
    </span>
  );
}
