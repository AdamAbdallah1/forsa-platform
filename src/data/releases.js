/*
 * Forsa Release Notes — hand-written editorial content.
 *
 * Local data by design: a small curated collection does not need a database,
 * a backend, or authentication. Every entry is readable without signing in,
 * and the collection ships with the bundle so the page works offline after load.
 *
 * Content rules enforced by tests in scripts/tests/releases.test.mjs:
 * - versions unique, dates valid, categories valid, required fields present
 * - descriptions meaningful, no fabricated claims or internal terminology
 * - related routes point at real Forsa routes only
 * - version numbers are semantic but do NOT claim to be the application version
 */

export const RELEASE_CATEGORIES = [
  {
    id: "new",
    label: "New",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "improved",
    label: "Improved",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "fixed",
    label: "Fixed",
    color: "bg-amber-100 text-amber-800",
  },
];

/**
 * Release entries, newest first, grouped by version.
 * Version numbers are semantic (major.minor.patch) for release-note purposes only;
 * they do NOT represent the Forsa application version.
 * Do not publish entries until the corresponding changes are confirmed live in production.
 */
export const RELEASES = [
  {
    version: "1.0.0",
    date: "2026-10-12",
    entries: [
      {
        category: "new",
        title: "Forsa AI Career Assistant",
        description:
          "A new AI-powered workspace at /ai with four guided tools: CV Review, Interview Practice, Career Roadmap, and Job Application Helper. Each tool walks you through a focused form and generates tailored guidance in one generation — no chat maze, no wasted generations.",
        relatedRoutes: ["/ai"],
      },
      {
        category: "new",
        title: "Forsa AI Chat Assistant",
        description:
          "A floating AI chat widget available site-wide (except on auth pages). Tap the sparkle button for quick answers: Interview Tips, CV Essentials, or Start Applying — or open the full workspace for guided tools and career guides.",
        relatedRoutes: ["/ai"],
      },
      {
        category: "new",
        title: "Career Guides",
        description:
          "Six practical, no-AI-needed guides built into the AI workspace: CV Basics, Application Message, Interview Checklist, Beginner Portfolio, First Tech Job, and Organize Your Job Search. Always available, no quota used.",
        relatedRoutes: ["/guides"],
      },
      {
        category: "improved",
        title: "Why This Matches — Opportunity Explanations",
        description:
          "Opportunity cards on Explore now show a \"Why this matches\" section breaking down exactly which of your skills, goals, and location preferences drove the match — so you can see why an opportunity surfaced.",
        relatedRoutes: ["/explore"],
      },
      {
        category: "fixed",
        title: "Active Opportunity Count Accuracy",
        description:
          "Company profiles now count only truly active opportunities (status = \"active\"), excluding pending, suspended, or closed listings. The \"Active posts\" stat now reflects what job seekers can actually apply to.",
        relatedRoutes: ["/company/:email"],
      },
    ],
  },
];