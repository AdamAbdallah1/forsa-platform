import { createElement, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  FaArrowRight,
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaCode,
  FaComments,
  FaCompass,
  FaGlobe,
  FaLaptopCode,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";

import SEO from "../components/SEO";
import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";
import { getActivePosts } from "../lib/postService";

const getRelativeTime = (value) => {
  if (!value) return "Posted recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Posted recently";

  const diff = Math.max(0, Date.now() - date.getTime());
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);

  if (m < 1) return "Posted just now";
  if (m < 60) return `Posted ${m}m ago`;
  if (h < 24) return `Posted ${h}h ago`;
  if (d === 1) return "Posted yesterday";
  if (d < 30) return `Posted ${d}d ago`;
  return `Posted ${Math.floor(d / 30)}mo ago`;
};

const getOpportunityIcon = (post) => {
  const value = `${post?.category || ""} ${post?.type || ""} ${post?.title || ""}`
    .toLowerCase();

  if (value.includes("marketing") || value.includes("content")) return FaGlobe;
  if (
    value.includes("developer") ||
    value.includes("software") ||
    value.includes("engineer") ||
    value.includes("tech")
  ) {
    return FaCode;
  }

  if (value.includes("design")) return FaLaptopCode;
  return FaBriefcase;
};

const QUICK_TOPICS = [
  { label: "Full-time", query: "full-time" },
  { label: "Internship", query: "internship" },
  { label: "Freelance", query: "freelance" },
  { label: "Remote", query: "remote" },
];

const HOW_FORSA_WORKS = [
  {
    number: "01",
    title: "Discover",
    copy: "Browse open roles and projects, filtered by what you actually want — full-time, internship, freelance, or a one-off project.",
    cta: "Explore the feed",
    to: "/explore",
    Icon: FaCompass,
  },
  {
    number: "02",
    title: "Understand",
    copy: "Every post shows who is hiring, where the work is, and what the role involves — before you decide to apply.",
    cta: "Browse all opportunities",
    to: "/jobs-in-lebanon",
    Icon: FaSearch,
  },
  {
    number: "03",
    title: "Apply",
    copy: "Apply directly on Forsa, or follow an external link when a company points there — both are tracked.",
    cta: "Create a free account",
    to: "/auth?mode=signup",
    Icon: FaUserCircle,
  },
  {
    number: "04",
    title: "Move forward",
    copy: "Follow your applications, messages, and interview invites in one place instead of scattered inboxes.",
    cta: "See how applications work",
    to: "/applications",
    Icon: FaComments,
  },
];

function OpportunityCard({ post }) {
  const company = post?.company || post?.ownerName || "Lebanon team";
  const location =
    post?.location ||
    (post?.workCountry && post.workCountry !== "lebanon"
      ? post.workCountry
      : "Lebanon");
  const tags = (post?.tags || []).filter(Boolean).slice(0, 2);

  return (
    <Link
      to={`/explore?post=${encodeURIComponent(post.id)}`}
      className="group flex h-full flex-col rounded-3xl border border-[var(--forsa-border)] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--forsa-primary)]/25 hover:shadow-[0_16px_44px_rgba(109,40,217,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
            {post.companyLogo ? (
              <img
                src={post.companyLogo}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              createElement(getOpportunityIcon(post), { className: "text-sm" })
            )}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#111113] transition-colors duration-200 group-hover:text-[var(--forsa-primary)]">
              {post.title || "Untitled opportunity"}
            </h3>

            <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-neutral-500">
              <FaBuilding className="text-[10px] text-neutral-400" />
              {company} · {location}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-[#f5f5f8] px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
          {post.type || "Opportunity"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--forsa-border)] pt-3 text-[12px] text-neutral-500">
        <div className="flex flex-wrap gap-1.5">
          {tags.length ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[#f7f7f9] px-2 py-0.5 text-[11px] text-neutral-600"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-400">
              Browse full details
            </span>
          )}
        </div>

        <span className="flex items-center gap-1">
          <FaClock className="text-[10px]" />
          {getRelativeTime(post.createdAt)}
        </span>
      </div>
    </Link>
  );
}

function OpportunitySkeleton() {
  return (
    <div className="h-full animate-pulse rounded-3xl border border-[var(--forsa-border)] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-2xl bg-[#f0eef6]" />
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-[#f0eef6]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-[#f4f3f8]" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[var(--forsa-border)] pt-4">
        <div className="h-3 w-1/3 rounded bg-[#f0eef6]" />
        <div className="h-3 w-16 rounded bg-[#f0eef6]" />
      </div>
    </div>
  );
}

export default function Home() {
  const reduce = useReducedMotion();
  const [livePosts, setLivePosts] = useState([]);
  const [livePostsLoading, setLivePostsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const posts = await getActivePosts();

        if (!active) return;

        setLivePosts(
          [...posts]
            .filter((post) => post?.status !== "closed")
            .sort(
              (a, b) =>
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )
            .slice(0, 3)
        );
      } catch (error) {
        console.error("Homepage live feed error:", error);
        if (active) setLivePosts([]);
      } finally {
        if (active) setLivePostsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const fade = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay },
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfbfd] font-['Geist',sans-serif] text-[#111113] selection:bg-[var(--forsa-soft)] selection:text-[#111113]">
      <SEO />
      <HomeNavbar />

      <main>
        {/* Hero */}
        <section className="border-b border-[#ececf1] bg-[#fbfbfd]">
          <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="mx-auto max-w-4xl text-center">
              <motion.div
                {...fade(0)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)] shadow-[0_0_0_4px_rgba(109,40,217,0.1)]" />
                Lebanon&apos;s opportunity network
              </motion.div>

              <motion.h1
                {...fade(0.05)}
                className="mx-auto mt-6 max-w-3xl text-[clamp(2.5rem,11vw,4.5rem)] font-black leading-[1.04] tracking-[-0.055em] text-[#111113] sm:text-6xl lg:text-[72px]"
              >
                The next opportunity{" "}
                <span className="text-[var(--forsa-primary)]">starts here.</span>
              </motion.h1>

              <motion.p
                {...fade(0.1)}
                className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-neutral-500 sm:text-base"
              >
                Discover jobs, internships, freelance work, and early-career
                opportunities — built around real people, real teams, and real
                work.
              </motion.p>

              <motion.div
                {...fade(0.15)}
                className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Link
                  to="/explore"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(109,40,217,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Explore opportunities
                  <FaArrowRight className="text-[11px]" />
                </Link>

                <Link
                  to="/auth?mode=signup"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#e2e0e8] bg-white px-7 py-3 text-sm font-semibold text-[#111113] transition duration-200 hover:border-[var(--forsa-primary)]/30 hover:bg-[#f7f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  I&apos;m hiring
                </Link>
              </motion.div>

              <motion.p
                {...fade(0.2)}
                className="mt-6 text-[13px] font-medium text-neutral-500"
              >
                Jobs · Internships · Freelance · Projects
              </motion.p>
            </div>
          </div>
        </section>

        {/* Real opportunities */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--forsa-primary)]">
                  Live on Forsa
                </p>

                <h2 className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-[-0.035em] text-[#111113]">
                  Opportunities worth looking at
                </h2>

                <p className="mt-3 text-[15px] leading-6 text-neutral-500">
                  Recent openings from companies and teams in Lebanon — real
                  posts, reviewed before they go live.
                </p>
              </div>

              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--forsa-primary)] transition hover:bg-[var(--forsa-bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
              >
                View all opportunities
                <FaArrowRight className="text-[11px]" />
              </Link>
            </div>

            {livePostsLoading ? (
              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <OpportunitySkeleton />
                <OpportunitySkeleton />
                <OpportunitySkeleton />
              </div>
            ) : livePosts.length ? (
              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {livePosts.map((post) => (
                  <OpportunityCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-3xl border border-dashed border-[var(--forsa-border)] bg-[#fafafc] p-10 text-center">
                <p className="text-sm font-medium text-[#111113]">
                  New opportunities are being added this week.
                </p>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  Forsa reviews every post before it goes live. Check the full
                  feed or sign up to be first when the next one drops.
                </p>

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    to="/explore"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    Browse the full feed
                    <FaArrowRight className="text-[11px]" />
                  </Link>

                  <Link
                    to="/auth?mode=signup"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e2e0e8] bg-white px-5 py-2.5 text-sm font-semibold text-[#111113] transition hover:border-[var(--forsa-primary)]/30 hover:bg-[#f7f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    Create a free account
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-neutral-500">
                Looking for:
              </span>

              {QUICK_TOPICS.map((topic) => (
                <Link
                  key={topic.label}
                  to={`/explore?q=${encodeURIComponent(topic.query)}`}
                  className="rounded-full border border-[var(--forsa-border)] bg-white px-3.5 py-1.5 text-[13px] font-medium text-neutral-600 transition duration-200 hover:border-[var(--forsa-primary)]/40 hover:text-[var(--forsa-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Forsa */}
        <section className="bg-[#fbfbfd] py-16 sm:py-24">
          <div className="mx-auto max-w-[960px] px-5 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--forsa-primary)]">
                Why Forsa
              </p>

              <h2 className="mx-auto mt-2 max-w-2xl text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-[-0.035em] text-[#111113]">
                Finding work in Lebanon is scattered. It doesn&apos;t have to be.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-neutral-500 sm:text-base">
                The best roles travel through LinkedIn&nbsp;DMs, Facebook
                groups, WhatsApp chains, and word of mouth. By the time an
                opportunity reaches you, part of it is already gone — or half
                filled without anyone knowing who fought for it.
              </p>

              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-neutral-500 sm:text-base">
                Forsa puts opportunities, companies, and people in one place —
                posted openly, kept current, and matched to the way Lebanon
                actually works.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div className="border-t border-[#e5e3eb] pt-5 text-left">
                <p className="text-sm font-bold text-[#111113]">
                  One honest feed
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Every post is real and reviewed, with statuses that stay
                  current. No recycled listings.
                </p>
              </div>

              <div className="border-t border-[#e5e3eb] pt-5 text-left">
                <p className="text-sm font-bold text-[#111113]">
                  Clear ways to apply
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Apply on Forsa or follow an external link — Forsa keeps track
                  either way.
                </p>
              </div>

              <div className="border-t border-[#e5e3eb] pt-5 text-left">
                <p className="text-sm font-bold text-[#111113]">
                  Real teams, real names
                </p>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  You see who&apos;s hiring and where the work is before you
                  commit your time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Two-sided */}
        <section className="border-y border-[#ececf1] bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-[1100px] px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--forsa-primary)]">
                Built for both sides
              </p>

              <h2 className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-[-0.035em] text-[#111113]">
                One platform. Two ways forward.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-[var(--forsa-border)] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
                  <FaUserCircle className="text-base" />
                </span>

                <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-[#111113]">
                  For talent
                </h3>

                <p className="mt-2 text-[15px] leading-7 text-neutral-500">
                  Browse work that fits your skills and your situation — from
                  internships to freelance projects to full-time roles — and
                  send applications that actually reach the person hiring.
                </p>

                <Link
                  to="/explore"
                  className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--forsa-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                >
                  Explore opportunities
                  <FaArrowRight className="text-[11px]" />
                </Link>
              </div>

              <div className="flex flex-col rounded-3xl border border-[var(--forsa-border)] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
                  <FaBuilding className="text-base" />
                </span>

                <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-[#111113]">
                  For companies &amp; teams
                </h3>

                <p className="mt-2 text-[15px] leading-7 text-neutral-500">
                  Post open roles and reach Lebanese talent directly — no
                  group-chat chaos, no lost applications, and a clear view of
                  who applied.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to="/auth?mode=signup"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e2e0e8] bg-white px-5 py-2.5 text-sm font-semibold text-[#111113] transition hover:border-[var(--forsa-primary)]/30 hover:bg-[#f7f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    Post an opportunity
                  </Link>

                  <Link
                    to="/companies"
                    className="inline-flex min-h-11 items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold text-[var(--forsa-primary)] transition hover:bg-[var(--forsa-bg-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    Browse companies
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[#fbfbfd] py-16 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--forsa-primary)]">
                How Forsa works
              </p>

              <h2 className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-[-0.035em] text-[#111113]">
                From first look to next step.
              </h2>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {HOW_FORSA_WORKS.map((step) => {
                const Icon = step.Icon;

                return (
                  <div
                    key={step.number}
                    className="flex flex-col rounded-3xl border border-[var(--forsa-border)] bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--forsa-bg-soft)] text-[var(--forsa-primary)]">
                        <Icon className="text-sm" />
                      </span>

                      <span className="font-mono text-[11px] font-semibold text-neutral-400">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-5 text-[17px] font-bold tracking-[-0.02em] text-[#111113]">
                      {step.title}
                    </h3>

                    <p className="mt-2 flex-1 text-sm leading-6 text-neutral-500">
                      {step.copy}
                    </p>

                    <Link
                      to={step.to}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--forsa-primary)] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                    >
                      {step.cta}
                      <FaArrowRight className="text-[10px]" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Career community */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[960px] px-5 sm:px-6 lg:px-8">
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--forsa-primary)]">
                  Career community
                </p>

                <h2 className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-[-0.035em] text-[#111113]">
                  More than a job board.
                </h2>

                <p className="mt-5 text-[15px] leading-7 text-neutral-500 sm:text-base">
                  Forsa is growing into a career community — profiles,
                  connections, and messages living alongside the jobs. Some
                  parts are built and live today; others are still on the way.
                  We&apos;re clear about the difference.
                </p>

                <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                  <Link
                    to="/companies"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--forsa-primary)] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    Meet companies
                    <FaArrowRight className="text-[10px]" />
                  </Link>

                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--forsa-primary)] transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary)] focus-visible:ring-offset-2"
                  >
                    About Forsa
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  {
                    title: "Verified companies",
                    copy: "Company accounts and high-signal posts are checked before trust is shown to applicants.",
                    built: true,
                  },
                  {
                    title: "Apply tracking",
                    copy: "Every application — on Forsa or external — is kept in one trail you can actually follow.",
                    built: true,
                  },
                  {
                    title: "People directory & messaging",
                    copy: "Profiles, connections, and direct messages between talent and teams are rolling out.",
                    built: false,
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--forsa-border)] bg-white p-4"
                  >
                    <span
                      className={
                        item.built
                          ? "mt-0.5 text-[var(--forsa-primary)]"
                          : "mt-0.5 text-neutral-300"
                      }
                    >
                      <FaCheckCircle className="text-sm" />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-[#111113]">
                        {item.title}
                        {!item.built && (
                          <span className="ml-2 rounded-full bg-[#f5f5f8] px-2 py-0.5 text-[11px] font-medium text-neutral-500">
                            On the way
                          </span>
                        )}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {item.copy}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#16121f] py-16 text-center sm:py-24">
          <div className="mx-auto max-w-2xl px-5 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--forsa-primary-light)]">
              Your next move
            </p>

            <h2 className="mt-3 text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight tracking-[-0.035em] text-white">
              Find the opportunity you&apos;re ready for.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-neutral-400">
              Browse the feed, or post your own opening. Either way, it starts
              in one place.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/explore"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--forsa-primary)] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(109,40,217,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--forsa-primary-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forsa-primary-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16121f] sm:w-auto"
              >
                Explore opportunities
                <FaArrowRight className="text-[11px]" />
              </Link>

              <Link
                to="/auth?mode=signup"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#16121f] sm:w-auto"
              >
                I&apos;m hiring
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}