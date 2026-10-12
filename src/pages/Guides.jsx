import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaSearch } from "react-icons/fa";
import SEO from "../components/SEO";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import GuideCard from "../components/GuideCard";
import {
  CAREER_GUIDES,
  GUIDE_CATEGORIES,
  getCategoryById,
  getFeaturedGuide,
  readingMinutes,
  searchGuides,
} from "../data/careerGuides";

/*
 * Career Guides library: search + topic filters over the real collection,
 * a single featured highlight, and a responsive card grid. Selecting a
 * tool, typing, or filtering never touches the network — everything is
 * local, instant, and works signed out.
 */

function matchesCategory(guide, categoryId) {
  return !categoryId || guide.category === categoryId;
}

export default function Guides() {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const hasFilter = query.trim().length > 0 || categoryId.length > 0;

  const results = useMemo(() => {
    const searched = searchGuides(query);
    return searched.filter((guide) => matchesCategory(guide, categoryId));
  }, [query, categoryId]);

  const featured = getFeaturedGuide();
  const showFeatured = !hasFilter;

  const counts = useMemo(() => {
    const map = {};
    for (const guide of CAREER_GUIDES) {
      map[guide.category] = (map[guide.category] || 0) + 1;
    }
    return map;
  }, []);

  return (
    <div className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)]">
      <SEO
        title="Career Guides | Practical Career Advice — Forsa"
        description="Practical career guides for students and early-career professionals in Lebanon: CVs, interviews, job search, portfolios, and career planning."
        url="https://forsa.digital/guides"
      />

      <AppHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-6 sm:pt-16">
        <section className="max-w-3xl">
          <p className="text-sm font-semibold text-[var(--forsa-primary)]">
            Career Guides
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Learn the skills behind the job search
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600">
            Short, practical guides written for students and early-career
            professionals in Lebanon. Read one before your next application —
            no account needed.
          </p>
        </section>

        <section aria-label="Search and filter guides" className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="guides-search" className="sr-only">
              Search career guides
            </label>

            <div className="relative flex-1">
              <FaSearch
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400"
              />

              <input
                id="guides-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides — try “interview” or “CV”…"
                autoComplete="off"
                className="w-full rounded-full border border-[var(--forsa-border)] bg-white py-3 pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[var(--forsa-primary)] focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          <div
            className="mt-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Filter guides by topic"
          >
            <button
              type="button"
              onClick={() => setCategoryId("")}
              aria-pressed={categoryId === ""}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 ${
                categoryId === ""
                  ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                  : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
              }`}
            >
              All topics ({CAREER_GUIDES.length})
            </button>

            {GUIDE_CATEGORIES.map((category) => {
              const active = categoryId === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(active ? "" : category.id)}
                  aria-pressed={active}
                  title={category.description}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 ${
                    active
                      ? "border-[var(--forsa-primary)] bg-[var(--forsa-primary)] text-white"
                      : "border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                  }`}
                >
                  {category.label} ({counts[category.id] || 0})
                </button>
              );
            })}
          </div>
        </section>

        {showFeatured && featured && (
          <section aria-label="Featured guide" className="mt-10">
            <Link
              to={`/guides/${featured.slug}`}
              className="group flex flex-col gap-5 overflow-hidden rounded-[24px] border border-[var(--forsa-border)] bg-white transition hover:border-[var(--forsa-soft)] hover:shadow-[0_14px_34px_rgba(109,40,217,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 sm:flex-row sm:items-stretch sm:gap-0"
            >
              <span className="block aspect-[16/9] overflow-hidden bg-[#FAF7F2] sm:aspect-auto sm:w-[44%] sm:min-h-[260px]">
                <img
                  src={featured.cover}
                  alt={featured.coverAlt || ""}
                  width={1200}
                  height={630}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
              </span>

              <span className="flex min-w-0 flex-1 flex-col justify-center p-6 sm:p-8">
                <span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-[var(--forsa-gold-soft)] px-2.5 py-1 text-[#8a6d1c]">
                    Featured guide
                  </span>

                  <span className="text-neutral-400">
                    {(getCategoryById(featured.category) || {}).label || featured.category}
                    {" · "}
                    {readingMinutes(featured)} min read
                  </span>
                </span>

                <span className="mt-2 block text-xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-2xl">
                  {featured.title}
                </span>

                <span className="mt-1.5 block max-w-2xl text-sm leading-6 text-neutral-500">
                  {featured.summary}
                </span>

                <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-3 text-sm font-semibold text-white">
                  Read guide
                  <FaArrowRight
                    aria-hidden="true"
                    className="text-xs transition group-hover:translate-x-0.5"
                  />
                </span>
              </span>
            </Link>
          </section>
        )}

        <section aria-label="All guides" aria-live="polite" className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              {hasFilter ? "Results" : "Browse all guides"}
            </h2>

            <p className="shrink-0 text-xs text-neutral-400" aria-hidden="true">
              {results.length} of {CAREER_GUIDES.length}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-[var(--forsa-border)] bg-white px-6 py-14 text-center">
              <p className="text-base font-semibold text-neutral-900">
                No guides match your search
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                {query.trim()
                  ? `Nothing found for “${query.trim()}”. Try a shorter keyword like “CV”, “interview”, or “portfolio”.`
                  : "No guides in this topic yet. Try another topic."}
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategoryId("");
                }}
                className="mt-6 inline-flex rounded-full border border-[var(--forsa-border)] bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(showFeatured
                ? results.filter((guide) => guide.slug !== featured.slug)
                : results
              ).map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          )}

          {showFeatured && results.length > 0 && (
            <p className="mt-4 text-xs text-neutral-400">
              Showing {results.length - 1} more{" "}
              {results.length - 1 === 1 ? "guide" : "guides"} below the
              featured article.
            </p>
          )}
        </section>

        <section className="mt-14 rounded-[22px] border border-[var(--forsa-border)] bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
            Want feedback on your own materials?
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            Forsa AI reviews CVs, rehearses interviews, and drafts
            applications based on what you provide. Sign in to try it.
          </p>

          <Link
            to="/ai"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
          >
            Try Forsa AI
            <FaArrowRight aria-hidden="true" className="text-xs" />
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
