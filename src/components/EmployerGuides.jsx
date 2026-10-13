import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBuilding,
  FaFileAlt,
  FaUsers,
  FaWrench,
  FaExternalLinkAlt,
  FaSearch,
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

// "Start here" guides - the essential first-read guides for new employers
const START_HERE_GUIDE_IDS = [
  "company-profile",
  "post-opportunity",
  "manage-applications",
];

/**
 * Employer Guides: hand-written static content, always available.
 * No provider call, no quota, no authentication needed to read.
 */
export default function EmployerGuides({ account }) {
  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const active = activeId ? getGuide(activeId) : null;

  const categories = useMemo(() => {
    return EMPLOYER_GUIDE_CATEGORIES.map((cat) => ({
      ...cat,
      guides: EMPLOYER_GUIDES.filter((g) => g.category === cat.id),
    })).filter((cat) => cat.guides.length > 0);
  }, []);

  // Filter guides based on search and category selection
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const hasCategoryFilter = selectedCategories.size > 0;

    return categories
      .map((cat) => {
        let guides = cat.guides;

        // Apply search filter
        if (query) {
          guides = guides.filter(
            (g) =>
              g.title.toLowerCase().includes(query) ||
              g.summary.toLowerCase().includes(query)
          );
        }

        // Apply category filter
        if (hasCategoryFilter && !selectedCategories.has(cat.id)) {
          guides = [];
        }

        return { ...cat, guides };
      })
      .filter((cat) => cat.guides.length > 0);
  }, [categories, searchQuery, selectedCategories]);

  // Get "Start here" guides
  const startHereGuides = useMemo(() => {
    return START_HERE_GUIDE_IDS.map((id) => getGuide(id)).filter(Boolean);
  }, []);

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories(new Set());
  };

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategories.size > 0;

  // Article view
  if (active) {
    return (
      <section className="bg-[var(--forsa-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 mb-8"
            >
              <FaArrowLeft aria-hidden="true" className="text-[10px]" />
              Back to all guides
            </button>

            <article className="prose prose-neutral max-w-none">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] border border-[var(--forsa-border)]">
                  {(() => {
                    const Icon = CATEGORY_ICONS[active.category];
                    return <Icon className="text-[10px]" />;
                  })()}
                  {CATEGORY_LABELS[active.category]}
                </span>
                <span className="text-xs text-neutral-500">
                  {active.readMinutes} min read · No AI needed
                </span>
              </div>

              <h1 className="font-['Sora',sans-serif] text-[clamp(2rem,6vw,3rem)] font-bold leading-[1.1] tracking-[-.03em] text-neutral-950 mb-6">
                {active.title}
              </h1>

              <p className="text-base sm:text-lg leading-7 text-neutral-600 mb-10 max-w-2xl">
                {active.summary}
              </p>

              <div className="space-y-10">
                {active.sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="font-['Sora',sans-serif] text-xl font-semibold text-neutral-950 mb-4 pb-3 border-b border-[var(--forsa-border)]">
                      {section.heading}
                    </h2>
                    <p className="text-base leading-7 text-neutral-600">
                      {section.body}
                    </p>
                  </section>
                ))}
              </div>

              {/* Related links */}
              {active.relatedRoutes && active.relatedRoutes.length > 0 && (
                <div className="mt-12 pt-8 border-t border-[var(--forsa-border)]">
                  <p className="text-xs font-semibold uppercase tracking-[.08em] text-neutral-500 mb-4">
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
        </div>
      </section>
    );
  }

  // List view
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--forsa-border)] bg-[var(--forsa-bg)]">
        <div className="absolute inset-0 pointer-events-none opacity-60" style={{
          backgroundImage: "linear-gradient(rgba(109,40,217,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(109,40,217,.04) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom,black,transparent 82%)",
        }} />
        <div className="absolute top-0 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--forsa-primary)]/[0.07] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1100px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-neutral-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--forsa-primary)]/10 text-[var(--forsa-primary)]">
                <FaBuilding className="text-[10px]" />
              </span>
              Employer Guides
            </div>

            <h1 className="mt-5 font-['Sora',sans-serif] text-[clamp(2.25rem,8vw,3.75rem)] font-bold leading-[1.05] tracking-[-.045em] sm:text-6xl">
              Hiring on Forsa, step by step
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
              Hand-written guides for setting up your company, posting opportunities, managing applications, and troubleshooting. No AI, no fluff — just the steps you need.
            </p>

            {account && (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/post"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)]"
                >
                  Post an opportunity <FaArrowRight className="text-[10px]" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-6 py-3 text-sm font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                >
                  Go to dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-[var(--forsa-bg)] py-16 sm:py-20">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
          {/* Search and Filters */}
          <div className="mb-10">
            {/* Search input */}
            <div className="relative mb-4">
              <FaSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search guides by title or summary…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-[var(--forsa-border)] bg-white text-base text-neutral-900 placeholder-neutral-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                aria-label="Search employer guides"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {EMPLOYER_GUIDE_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id];
                const isSelected = selectedCategories.has(cat.id);
                const hasGuides = filteredCategories.some((fc) => fc.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    disabled={!hasGuides && !isSelected}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 ${
                      isSelected
                        ? "bg-[var(--forsa-primary)] text-white"
                        : hasGuides
                        ? "border border-[var(--forsa-border)] bg-white text-neutral-600 hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                        : "border border-[var(--forsa-border)] bg-neutral-50 text-neutral-300 cursor-not-allowed"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <Icon className="text-[10px]" aria-hidden="true" />
                    {CATEGORY_LABELS[cat.id]}
                  </button>
                );
              })}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forsa-border)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Start Here section */}
          {!hasActiveFilters && startHereGuides.length > 0 && (
            <section className="mb-12" aria-labelledby="start-here-heading">
              <h2
                id="start-here-heading"
                className="text-lg font-semibold tracking-[-0.01em] text-neutral-900 mb-4 flex items-center gap-2"
              >
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] p-1.5">
                  <FaArrowRight className="text-xs" aria-hidden="true" />
                </span>
                Start here
              </h2>
              <p className="text-sm text-neutral-500 mb-6 max-w-2xl">
                New to hiring on Forsa? Read these three guides first — they cover
                the essential workflow from profile setup to managing applications.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {startHereGuides.map((guide) => (
                  <Link
                    key={guide.id}
                    to="#"
                    onClick={(e) => { e.preventDefault(); setActiveId(guide.id); }}
                    className="group flex flex-col h-full rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 sm:p-6 transition hover:border-[var(--forsa-primary)]/50 hover:shadow-[0_8px_30px_rgba(109,40,217,0.08)]"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] border border-[var(--forsa-border)]">
                        {(() => {
                          const Icon = CATEGORY_ICONS[guide.category];
                          return <Icon className="text-[9px]" />;
                        })()}
                        {CATEGORY_LABELS[guide.category]}
                      </span>
                    </div>

                    <h3 className="font-['Sora',sans-serif] text-base font-semibold text-neutral-950 leading-tight mb-3 flex-1">
                      {guide.title}
                    </h3>

                    <p className="text-sm leading-6 text-neutral-600 mb-4 flex-1">
                      {guide.summary}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                      <span>{guide.readMinutes} min read</span>
                      <FaArrowRight className="text-[10px] transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Filtered categories */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] mb-6">
                <FaSearch className="h-8 w-8" />
              </div>
              <h2 className="font-['Sora',sans-serif] text-2xl font-semibold text-neutral-950 mb-2">
                {searchQuery ? `No guides found for "${searchQuery}"` : "No guides match the selected filters."}
              </h2>
              <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-neutral-500">
                {searchQuery
                  ? "Try a different search term or clear the filters."
                  : "Try adjusting your category filters or search query."}
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredCategories.map((category) => (
                <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                  <h2
                    id={`cat-${category.id}`}
                    className="text-xs font-semibold uppercase tracking-[.08em] text-neutral-500 mb-6 flex items-center gap-2"
                  >
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] p-1.5"
                    >
                      {(() => {
                        const Icon = CATEGORY_ICONS[category.id];
                        return <Icon className="text-xs" aria-hidden="true" />;
                      })()}
                    </span>
                    {CATEGORY_LABELS[category.id]}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {category.guides.map((guide) => (
                      <Link
                        key={guide.id}
                        to="#"
                        onClick={(e) => { e.preventDefault(); setActiveId(guide.id); }}
                        className="group flex flex-col h-full rounded-[24px] border border-[var(--forsa-border)] bg-white p-5 sm:p-6 transition hover:border-[var(--forsa-primary)]/50 hover:shadow-[0_8px_30px_rgba(109,40,217,0.08)]"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)] border border-[var(--forsa-border)]">
                            {(() => {
                              const Icon = CATEGORY_ICONS[guide.category];
                              return <Icon className="text-[9px]" />;
                            })()}
                            {CATEGORY_LABELS[guide.category]}
                          </span>
                        </div>

                        <h3 className="font-['Sora',sans-serif] text-base font-semibold text-neutral-950 leading-tight mb-3 flex-1">
                          {guide.title}
                        </h3>

                        <p className="text-sm leading-6 text-neutral-600 mb-4 flex-1">
                          {guide.summary}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                          <span>{guide.readMinutes} min read</span>
                          <FaArrowRight className="text-[10px] transition group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {/* Browse all career guides link */}
              <div className="mt-12 pt-8 border-t border-[var(--forsa-border)] text-center">
                <Link
                  to="/guides"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                >
                  Browse all career guides
                  <FaArrowRight aria-hidden="true" className="text-[10px]" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}