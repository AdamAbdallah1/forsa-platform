import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight,
  FaBolt,
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaSearch,
  FaSlidersH,
} from "react-icons/fa";

const opportunities = [
  {
    title: "Frontend Developer",
    company: "Digital Studio",
    location: "Beirut · Hybrid",
    type: "Part-time",
    tags: ["React", "JavaScript"],
    match: "Strong fit",
    accent: "C",
  },
  {
    title: "UI/UX Design Intern",
    company: "Creative Agency",
    location: "Beirut · On-site",
    type: "Internship",
    tags: ["Figma", "UI/UX"],
    match: "Good fit",
    accent: "A",
  },
];

export default function HeroProductPreview() {
  const [activeTab, setActiveTab] = useState("opportunities");

  return (
    <div className="relative mx-auto w-full max-w-[620px]">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_50%_35%,rgba(82,39,255,0.13),transparent_65%)] blur-2xl" />

      {/* Product window */}
      <div className="overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_30px_80px_rgba(24,20,40,0.10)]">

        {/* Browser / product chrome */}
        <div className="flex h-11 items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-4 sm:px-5">

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-neutral-200/80 bg-white px-3 py-1 text-[10px] font-medium text-neutral-400 sm:flex">
            <span>forsa.digital</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-neutral-400">
              Live
            </span>
          </div>

        </div>

        {/* Product header */}
        <div className="border-b border-neutral-100 px-5 py-5 sm:px-6">

          <div className="flex items-start justify-between gap-4">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forsa-primary)]">
                Discover
              </p>

              <h3 className="mt-1 text-lg font-bold tracking-[-0.025em] text-neutral-900 sm:text-xl">
                Opportunities for you
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Find work based on your skills, availability and goals.
              </p>
            </div>

            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-[var(--forsa-primary)] sm:flex">
              <FaBolt className="text-xs" />
            </div>

          </div>

          {/* Search */}
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/70 px-3.5 py-2.5">

            <FaSearch className="shrink-0 text-[11px] text-neutral-400" />

            <span className="flex-1 text-xs text-neutral-400">
              Search jobs, skills or companies
            </span>

            <button
              type="button"
              className="hidden h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 sm:flex"
              aria-label="Filter opportunities"
            >
              <FaSlidersH className="text-[10px]" />
            </button>

          </div>

        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 border-b border-neutral-100 px-5 sm:px-6">

          <button
            type="button"
            onClick={() => setActiveTab("opportunities")}
            className={`relative py-3.5 text-xs font-semibold transition-colors ${
              activeTab === "opportunities"
                ? "text-neutral-900"
                : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            Opportunities

            {activeTab === "opportunities" && (
              <motion.span
                layoutId="hero-tab"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--forsa-primary)]"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("companies")}
            className={`relative py-3.5 text-xs font-semibold transition-colors ${
              activeTab === "companies"
                ? "text-neutral-900"
                : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            Companies

            {activeTab === "companies" && (
              <motion.span
                layoutId="hero-tab"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--forsa-primary)]"
              />
            )}
          </button>

        </div>

        {/* Content */}
        <div className="bg-neutral-50/30 p-4 sm:p-5">

          <AnimatePresence mode="wait">

            {activeTab === "opportunities" ? (
              <motion.div
                key="opportunities"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >

                {/* Featured opportunity */}
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_25px_rgba(20,15,40,0.035)]">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-white">
                      C
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h4 className="text-sm font-bold tracking-[-0.015em] text-neutral-900">
                          {opportunities[0].title}
                        </h4>

                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                          <FaCheckCircle className="text-[8px]" />
                          Verified
                        </span>

                      </div>

                      <p className="mt-1 text-[11px] text-neutral-500">
                        {opportunities[0].company}
                      </p>

                    </div>

                    <span className="hidden rounded-full bg-purple-50 px-2 py-1 text-[9px] font-semibold text-[var(--forsa-primary)] sm:block">
                      {opportunities[0].match}
                    </span>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-neutral-500">

                    <span className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-[9px] text-neutral-400" />
                      {opportunities[0].location}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <FaBriefcase className="text-[9px] text-neutral-400" />
                      {opportunities[0].type}
                    </span>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">

                    {opportunities[0].tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-neutral-100 px-2 py-1 text-[9px] font-medium text-neutral-600"
                      >
                        {tag}
                      </span>
                    ))}

                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">

                    <div className="flex items-center gap-2">

                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--forsa-primary)]" />

                      <span className="text-[10px] font-medium text-neutral-500">
                        Based on your profile
                      </span>

                    </div>

                    <span className="text-[10px] font-semibold text-neutral-800">
                      View details →
                    </span>

                  </div>

                </div>

                {/* Secondary opportunity */}
                <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xs font-bold text-[var(--forsa-primary)]">
                      A
                    </div>

                    <div className="min-w-0 flex-1">

                      <h4 className="truncate text-xs font-bold text-neutral-800">
                        {opportunities[1].title}
                      </h4>

                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        {opportunities[1].company} · {opportunities[1].location}
                      </p>

                    </div>

                    <span className="hidden text-[10px] font-semibold text-neutral-500 sm:block">
                      {opportunities[1].match}
                    </span>

                  </div>

                </div>

                {/* Product signal */}
                <div className="flex items-center justify-between px-1 pt-1">

                  <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                    <FaCheckCircle className="text-[var(--forsa-primary)]" />
                    Structured opportunities
                  </span>

                  <span className="text-[10px] font-medium text-neutral-400">
                    2 of 12
                  </span>

                </div>

              </motion.div>
            ) : (

              <motion.div
                key="companies"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >

                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_25px_rgba(20,15,40,0.035)]">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-bold text-[var(--forsa-primary)]">
                      D
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <h4 className="text-sm font-bold text-neutral-900">
                          Digital Studio
                        </h4>

                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                          Verified
                        </span>

                      </div>

                      <p className="mt-1 text-[11px] text-neutral-500">
                        Creative & technology · Beirut
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-[9px] text-neutral-400">
                        Open roles
                      </p>
                      <p className="mt-1 text-sm font-bold text-neutral-900">
                        4
                      </p>
                    </div>

                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-[9px] text-neutral-400">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-bold text-neutral-900">
                        Beirut
                      </p>
                    </div>

                    <div className="rounded-xl bg-neutral-50 p-3">
                      <p className="text-[9px] text-neutral-400">
                        Type
                      </p>
                      <p className="mt-1 text-sm font-bold text-neutral-900">
                        Hybrid
                      </p>
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-xs font-bold text-neutral-700">
                      S
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-neutral-800">
                        Studio & Agency
                      </h4>
                      <p className="mt-0.5 text-[10px] text-neutral-400">
                        Design · Marketing · Beirut
                      </p>
                    </div>

                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Product footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-white px-5 py-3.5 sm:px-6">

          <div className="flex items-center gap-2">

            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-[var(--forsa-primary)]">
              <FaBolt className="text-[9px]" />
            </div>

            <span className="text-[10px] font-medium text-neutral-500">
              Built around your profile
            </span>

          </div>

          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-700">
            Explore
            <FaArrowRight className="text-[8px] text-[var(--forsa-primary)]" />
          </span>

        </div>

      </div>

      {/* Small floating product signal */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3 py-2.5 shadow-[0_12px_30px_rgba(20,15,40,0.10)] sm:flex"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-[var(--forsa-primary)]">
          <FaCheckCircle className="text-xs" />
        </div>

        <div>
          <p className="text-[10px] font-bold text-neutral-800">
            Direct applications
          </p>
          <p className="text-[9px] text-neutral-400">
            No unnecessary steps
          </p>
        </div>
      </motion.div>

    </div>
  );
}