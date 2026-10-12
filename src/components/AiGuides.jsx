import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaBookOpen, FaClock } from "react-icons/fa";
import { FORSA_AI_GUIDES, getGuide } from "../data/forsaAiGuides";

/*
 * Career quick guides: hand-written static content, always available.
 * No provider call, no quota, no authentication needed to read. Rendered as
 * a compact grid on the workspace; selecting a guide replaces the grid with
 * the reader, which links back without losing scroll position concerns.
 */

export default function AiGuides({ compact = false }) {
  const [activeId, setActiveId] = useState(null);
  const active = activeId ? getGuide(activeId) : null;

  if (active) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setActiveId(null)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
        >
          <FaArrowLeft aria-hidden="true" className="text-[10px]" />
          All guides
        </button>

        <article className="mt-4">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-2xl">
            {active.title}
          </h3>

          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
            <FaClock aria-hidden="true" className="text-[10px]" />
            {active.readMinutes} min read · No AI needed
          </p>

          <div className="mt-5 space-y-5">
            {active.sections.map((section) => (
              <section key={section.heading}>
                <h4 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900">
                  {section.heading}
                </h4>
                <p className="mt-1.5 text-sm leading-7 text-neutral-600">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`grid gap-2.5 ${
          compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
      {FORSA_AI_GUIDES.map((guide) => (
        <button
          key={guide.id}
          type="button"
          onClick={() => setActiveId(guide.id)}
          className="group flex items-start gap-3 rounded-[18px] border border-[var(--forsa-border)] bg-white p-4 text-left transition hover:border-[var(--forsa-soft)] hover:shadow-[0_14px_34px_rgba(109,40,217,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] transition group-hover:bg-[var(--forsa-soft)]"
          >
            <FaBookOpen className="text-sm" />
          </span>

          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-[-0.02em] text-neutral-900">
              {guide.title}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-neutral-500">
              {guide.summary}
            </span>
            <span className="mt-1.5 block text-[11px] font-medium text-neutral-400">
              {guide.readMinutes} min read
            </span>
          </span>
        </button>
      ))}
      </div>

      <Link
        to="/guides"
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
      >
        Browse all career guides
        <FaArrowRight aria-hidden="true" className="text-[10px]" />
      </Link>
    </div>
  );
}
