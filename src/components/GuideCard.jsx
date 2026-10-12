import { Link } from "react-router-dom";
import { FaArrowRight, FaClock } from "react-icons/fa";
import { getCategoryById, readingMinutes } from "../data/careerGuides";

/*
 * Shared article card for the Career Guides library and related-article
 * grids. Purely presentational: all data comes from the guide object, and
 * reading time is computed from actual word count, never hardcoded.
 */

export default function GuideCard({ guide }) {
  const category = getCategoryById(guide.category);

  return (
    <Link
      to={`/guides/${guide.slug}`}
      aria-label={`Read guide: ${guide.title}`}
      className="group flex min-h-full flex-col overflow-hidden rounded-[22px] border border-[var(--forsa-border)] bg-white text-left transition hover:-translate-y-0.5 hover:border-[var(--forsa-soft)] hover:shadow-[0_14px_34px_rgba(109,40,217,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
    >
      <span className="block aspect-[16/10] overflow-hidden bg-[#FAF7F2]">
        <img
          src={guide.cover}
          alt={guide.coverAlt || ""}
          width={1200}
          height={630}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
        />
      </span>

      <span className="flex flex-1 flex-col p-5">
        <span className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-[var(--forsa-bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--forsa-primary)]">
            {category ? category.label : guide.category}
          </span>

          <FaArrowRight
            aria-hidden="true"
            className="shrink-0 text-xs text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--forsa-primary)]"
          />
        </span>

        <span className="mt-3 block text-base font-semibold leading-6 tracking-[-0.02em] text-neutral-900">
          {guide.title}
        </span>

        <span className="mt-1.5 block flex-1 text-sm leading-6 text-neutral-500">
          {guide.summary}
        </span>

        <span className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
          <FaClock aria-hidden="true" className="text-[10px]" />
          {readingMinutes(guide)} min read
        </span>
      </span>
    </Link>
  );
}
