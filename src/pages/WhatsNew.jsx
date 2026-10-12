import { Link } from "react-router-dom";
import { FaNewspaper, FaArrowRight, FaCalendar, FaTag } from "react-icons/fa";
import { RELEASES } from "../data/releases";
import WhatsNewCard from "../components/WhatsNewCard";
import SEO from "../components/SEO";
import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatVersion(version) {
  return `v${version}`;
}

export default function WhatsNew() {
  return (
    <div className="min-h-screen bg-[var(--forsa-bg)] text-[var(--forsa-text)] antialiased">
      <SEO
        title="What's New in Forsa — Release Notes"
        description="Track improvements, new features, and bug fixes in Forsa. Stay up to date with the latest platform changes."
      />

      <HomeNavbar />

      <main className="min-h-screen">
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
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Release Notes
              </div>

              <h1 className="mt-5 max-w-3xl font-['Sora',sans-serif] text-[clamp(2.25rem,8vw,3.75rem)] font-bold leading-[1.05] tracking-[-.045em] sm:text-6xl">
                What&apos;s New in Forsa
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
                This page tracks improvements, new features, and bug fixes in Forsa.
                We update it when changes go live so you always know what&apos;s new.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)]"
                >
                  Explore opportunities <FaArrowRight className="text-[10px]" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-6 py-3 text-sm font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                >
                  About Forsa
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Release Entries */}
        <section className="bg-[var(--forsa-bg)] py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
            {RELEASES.length === 0 ? (
              <div className="text-center py-20">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V6a2 2 0 012 2z" />
                  </svg>
                </div>
                <h2 className="mt-6 font-['Sora',sans-serif] text-2xl font-semibold text-neutral-950">
                  No release notes yet
                </h2>
                <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-neutral-500">
                  We&apos;ll publish release notes here when new features, improvements, or fixes go live.
                  Check back soon!
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)]"
                  >
                    Explore opportunities <FaArrowRight className="text-[10px]" />
                  </Link>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-6 py-3 text-sm font-semibold text-neutral-600 transition hover:border-[var(--forsa-primary)] hover:text-[var(--forsa-primary)]"
                  >
                    About Forsa
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {RELEASES.map((release) => (
                  <section key={release.version} className="rounded-[28px] border border-[var(--forsa-border)] bg-white p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--forsa-primary)] bg-[var(--forsa-bg-soft)] px-3 py-1 text-xs font-bold text-[var(--forsa-primary)]">
                        <FaNewspaper className="text-xs" />
                        {formatVersion(release.version)}
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-500">
                        <FaCalendar className="text-xs text-neutral-400" />
                        <time dateTime={release.date}>{formatDate(release.date)}</time>
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-neutral-500">
                        <FaTag className="text-xs text-neutral-400" />
                        {release.entries.length} {release.entries.length === 1 ? "change" : "changes"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {release.entries.map((entry, index) => (
                        <WhatsNewCard
                          key={`${release.version}-${index}`}
                          entry={entry}
                          version={release.version}
                          date={release.date}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* Footer CTA */}
            <div className="mt-16 text-center">
              <p className="text-sm text-neutral-500">
                Want to share feedback or suggest a feature?
              </p>
              <a
                href="mailto:support.forsa@gmail.com"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--forsa-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)]"
              >
                Email us <FaArrowRight className="text-[10px]" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}