import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaWrench,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { EMPLOYER_GUIDES, EMPLOYER_GUIDE_CATEGORIES, getGuide } from "../data/employerGuides";

const CATEGORY_ICONS = {
  "getting-started": FaBuilding,
  posting: FaFileAlt,
  managing: FaUsers,
  troubleshooting: FaWrench,
};

const CATEGORY_LABELS = {
  "getting-started": "Getting Started",
  posting: "Posting",
  managing: "Managing",
  troubleshooting: "Troubleshooting",
};

/**
 * Employer Guides: hand-written static content, always available.
 * No provider call, no quota, no authentication needed to read. Rendered as
 * a compact grid on the dashboard; selecting a guide replaces the grid with
 * the reader, which links back without losing scroll position concerns.
 */
export default function EmployerGuides({ compact = false }) {
  const [activeId, setActiveId] = useState(null);
  const active = activeId ? getGuide(activeId) : null;

  const categories = EMPLOYER_GUIDE_CATEGORIES.map((cat) => {
    return {
      ...cat,
      guides: EMPLOYER_GUIDES.filter((g) => g.category === cat.id),
    };
  }).filter((cat) => cat.guides.length > 0);

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
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] bg-blue-100 text-blue-800">
              <FaBuilding className="text-[10px]" />
              {CATEGORY_LABELS[active.category]}
            </span>
            <span className="text-xs text-neutral-500">
              {active.readMinutes} min read · No AI needed
            </span>
          </div>

          <h3 className="text-xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-2xl">
            {active.title}
          </h3>

          <p className="mt-1.5 text-sm leading-6 text-neutral-600">
            {active.summary}
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

          {/* Related links */}
          {active.relatedRoutes && active.relatedRoutes.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[var(--forsa-border)]">
              <p className="text-xs font-semibold uppercase tracking-[.08em] text-neutral-500 mb-3">
                Related pages
              </p>
              <div className="flex flex-wrap gap-2">
                {active.relatedRoutes.map((route) => (
                  <Link
                    key={route}
                    to={route}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                  >
                    <FaExternalLinkAlt className="text-[10px]" />
                    <span className="font-mono text-[10px]">{route}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
        {categories.map((category) => (
          <div key={category.id}>
            <p className="text-xs font-semibold uppercase tracking-[.08em] text-neutral-500 mb-3">
              {CATEGORY_LABELS[category.id]}
            </p>
            <div
              className={`grid gap-2.5 ${
                compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {category.guides.map((guide) => (
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
                    {(() => {
                      const Icon = CATEGORY_ICONS[guide.category];
                      return <Icon className="text-sm" />;
                    })()}
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
          </div>
        ))}

        <Link
          to="/guides"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
        >
          Browse all career guides
          <FaArrowRight aria-hidden="true" className="text-[10px]" />
        </Link>
      </div>
    </div>
  );
}