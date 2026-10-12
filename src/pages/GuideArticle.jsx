import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaCheck,
  FaChevronRight,
  FaClock,
  FaCopy,
} from "react-icons/fa";
import SEO from "../components/SEO";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import GuideCard from "../components/GuideCard";
import {
  getCategoryById,
  getGuideBySlug,
  getRelatedGuides,
  readingMinutes,
} from "../data/careerGuides";

/*
 * Individual career guide: breadcrumb, header with metadata, optional table
 * of contents for long articles, sectioned body, related guides, and one
 * honest next step into real Forsa functionality. Unknown slugs render a
 * local not-found block (not a redirect) so bad links fail visibly.
 */

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sectionId(index) {
  return `guide-section-${index}`;
}

function GuideBlock({ block }) {
  switch (block.type) {
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--forsa-primary)]">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );

    case "checklist":
      return (
        <ul className="space-y-2.5">
          {block.items.map((item, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]"
              >
                <FaCheck className="text-[10px]" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "callout":
      return (
        <div className="rounded-[18px] border border-[var(--forsa-border)] bg-[var(--forsa-bg-soft)]/60 px-5 py-4">
          {block.title && (
            <p className="text-sm font-semibold tracking-[-0.01em] text-neutral-900">
              {block.title}
            </p>
          )}

          <p className="mt-1 text-sm leading-7 text-neutral-600">
            {block.text}
          </p>
        </div>
      );

    case "example":
      return (
        <div className="rounded-[18px] border border-dashed border-[var(--forsa-border)] bg-white px-5 py-4">
          {block.label && (
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--forsa-primary)]">
              {block.label}
            </p>
          )}

          <p className="mt-1.5 text-sm italic leading-7 text-neutral-600">
            {block.text}
          </p>
        </div>
      );

    case "paragraph":
    default:
      return <p>{block.text}</p>;
  }
}

export default function GuideArticle() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  if (!guide) {
    return (
      <div className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)]">
        <AppHeader />

        <main className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-6">
          <p className="inline-flex rounded-full border border-[var(--forsa-border)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--forsa-primary)]">
            Guide not found
          </p>

          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
            This guide doesn&apos;t exist
          </h1>

          <p className="mt-3 text-sm leading-7 text-neutral-500">
            It may have been moved or renamed. Browse the full library
            instead.
          </p>

          <Link
            to="/guides"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
          >
            <FaArrowLeft aria-hidden="true" className="text-xs" />
            All career guides
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  const category = getCategoryById(guide.category);
  const related = getRelatedGuides(guide.slug, 3);
  const published = formatDate(guide.publishedAt);
  const showToc = guide.sections.length >= 5;

  const shareArticle = async () => {
    const url = `https://forsa.digital/guides/${guide.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* Clipboard unavailable — the URL stays visible in the address bar. */
    }
  };

  return (
    <div className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)]">
      <SEO
        title={`${guide.title} — Forsa Career Guides`}
        description={guide.summary}
        url={`https://forsa.digital/guides/${guide.slug}`}
      />

      <AppHeader />

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-6 sm:pt-14">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-neutral-400">
            <li>
              <Link
                to="/guides"
                className="rounded transition hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
              >
                Career Guides
              </Link>
            </li>

            <li aria-hidden="true">
              <FaChevronRight className="text-[9px]" />
            </li>

            <li aria-current="page" className="text-neutral-600">
              {category ? category.label : guide.category}
            </li>
          </ol>
        </nav>

        <header className="mt-6">
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center rounded-full bg-[var(--forsa-bg-soft)] px-2.5 py-1 text-[var(--forsa-primary)]">
              {category ? category.label : guide.category}
            </span>

            <span className="inline-flex items-center gap-1.5 text-neutral-400">
              <FaClock aria-hidden="true" className="text-[10px]" />
              {readingMinutes(guide)} min read
            </span>

            {published && (
              <span className="inline-flex items-center gap-1.5 text-neutral-400">
                <FaCalendarAlt aria-hidden="true" className="text-[10px]" />
                {published}
              </span>
            )}
          </p>

          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.15] tracking-[-0.04em] text-neutral-900 sm:text-[2.75rem] sm:leading-[1.1]">
            {guide.title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-600">
            {guide.summary}
          </p>

          <button
            type="button"
            onClick={shareArticle}
            aria-live="polite"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
          >
            <FaCopy aria-hidden="true" className="text-[10px]" />
            {copiedLink ? "Link copied" : "Copy link"}
          </button>
        </header>

        <figure className="mt-8 overflow-hidden rounded-[24px] border border-[var(--forsa-border)] bg-[#FAF7F2]">
          <img
            src={guide.cover}
            alt={guide.coverAlt || ""}
            width={1200}
            height={630}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="aspect-[16/10] w-full object-cover sm:aspect-[21/9]"
          />
        </figure>

        {showToc && (
          <nav
            aria-label="Table of contents"
            className="mt-8 rounded-[20px] border border-[var(--forsa-border)] bg-white p-5 sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-400">
              In this guide
            </p>

            <ol className="mt-3 space-y-2">
              {guide.sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#${sectionId(index)}`}
                    className="group inline-flex items-baseline gap-2 rounded text-sm font-medium text-neutral-600 transition hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className="text-xs font-bold text-[var(--forsa-primary)]/50 transition group-hover:text-[var(--forsa-primary)]"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-8 space-y-4">
          {guide.intro.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "text-lg leading-8 text-neutral-700"
                  : "text-base leading-8 text-neutral-600"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-10 space-y-10">
          {guide.sections.map((section, index) => (
            <section
              key={section.heading}
              id={sectionId(index)}
              aria-labelledby={`${sectionId(index)}-heading`}
              className="scroll-mt-28"
            >
              <h2
                id={`${sectionId(index)}-heading`}
                className="flex items-baseline gap-3 text-xl font-semibold tracking-[-0.02em] text-neutral-900 sm:text-2xl"
              >
                <span
                  aria-hidden="true"
                  className="text-sm font-bold text-[var(--forsa-primary)]/40"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>

              <div className="mt-4 space-y-4 text-[15px] leading-8 text-neutral-600">
                {section.blocks.map((block, blockIndex) => (
                  <GuideBlock key={blockIndex} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {guide.nextStep && (
          <section
            aria-label="Next step"
            className="mt-12 rounded-[22px] border border-[var(--forsa-border)] bg-white p-6 sm:p-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--forsa-primary)]">
              Keep going
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-sm leading-6 text-neutral-600">
                Put this guide into practice with Forsa&apos;s tools.
              </p>

              <Link
                to={guide.nextStep.to}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
              >
                {guide.nextStep.label}
                <FaArrowRight aria-hidden="true" className="text-xs" />
              </Link>
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section aria-label="Related guides" className="mt-12">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              Keep reading
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((relatedGuide) => (
                <GuideCard key={relatedGuide.slug} guide={relatedGuide} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
