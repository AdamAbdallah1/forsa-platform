/* Employer Guides tests: content model integrity and routing.
 * Pure data-module tests — no Firebase, no network, no provider. Run with:
 * npm run test:employer-guides
 * (or: node scripts/tests/employer-guides.test.mjs) */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  ".."
);

const guides = await import(
  new URL("../../src/data/employerGuides.js", import.meta.url).href
);

const { EMPLOYER_GUIDES, EMPLOYER_GUIDE_CATEGORIES, getGuide } = guides;

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}

/* ---------------- model integrity ---------------- */

check("EMPLOYER_GUIDE_CATEGORIES has expected categories", () => {
  const ids = EMPLOYER_GUIDE_CATEGORIES.map((c) => c.id);
  assert.deepEqual(ids.sort(), ["getting-started", "managing", "posting", "troubleshooting"]);
});

check("each category has required fields", () => {
  for (const cat of EMPLOYER_GUIDE_CATEGORIES) {
    assert.ok(cat.id, "category missing id");
    assert.ok(cat.label, "category missing label");
    assert.ok(cat.description, "category missing description");
    assert.match(cat.id, /^[a-z-]+$/, "category id should be lowercase with hyphens");
  }
});

check("EMPLOYER_GUIDES is an array", () => {
  assert.ok(Array.isArray(EMPLOYER_GUIDES), "EMPLOYER_GUIDES should be an array");
});

check("guide ids are unique", () => {
  const ids = EMPLOYER_GUIDES.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate guide ids found");
});

check("guide ids follow slug pattern", () => {
  for (const guide of EMPLOYER_GUIDES) {
    assert.match(guide.id, /^[a-z0-9-]+$/, `invalid id format: ${guide.id}`);
  }
});

check("each guide has required fields", () => {
  for (const guide of EMPLOYER_GUIDES) {
    assert.ok(guide.id, "guide missing id");
    assert.ok(guide.title, "guide missing title");
    assert.ok(guide.summary, "guide missing summary");
    assert.ok(typeof guide.readMinutes === "number", "guide missing readMinutes");
    assert.ok(guide.category, "guide missing category");
    assert.ok(Array.isArray(guide.sections), "guide missing sections array");
    assert.ok(guide.sections.length > 0, "guide has empty sections");
  }
});

check("guide categories are valid", () => {
  const validCategories = EMPLOYER_GUIDE_CATEGORIES.map((c) => c.id);
  for (const guide of EMPLOYER_GUIDES) {
    assert.ok(
      validCategories.includes(guide.category),
      `invalid category: ${guide.category} for guide ${guide.id}`
    );
  }
});

check("guide sections have required fields", () => {
  for (const guide of EMPLOYER_GUIDES) {
    for (const section of guide.sections) {
      assert.ok(section.heading, "section missing heading");
      assert.ok(section.body, "section missing body");
      assert.ok(section.body.length >= 20, "section body too short");
    }
  }
});

check("guide readMinutes is reasonable", () => {
  for (const guide of EMPLOYER_GUIDES) {
    assert.ok(guide.readMinutes >= 2 && guide.readMinutes <= 10, `readMinutes out of range: ${guide.readMinutes} for ${guide.id}`);
  }
});

check("guide sections are non-empty", () => {
  for (const guide of EMPLOYER_GUIDES) {
    assert.ok(guide.sections.length > 0, `guide ${guide.id} has no sections`);
    for (const section of guide.sections) {
      assert.ok(section.heading.length > 0, `empty heading in ${guide.id}`);
      assert.ok(section.body.length > 0, `empty body in ${guide.id}`);
    }
  }
});

check("no duplicate guide IDs", () => {
  const ids = EMPLOYER_GUIDES.map((g) => g.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate guide IDs found");
});

check("guide categories reference valid category IDs", () => {
  const validCategories = EMPLOYER_GUIDE_CATEGORIES.map((c) => c.id);
  for (const guide of EMPLOYER_GUIDES) {
    assert.ok(
      validCategories.includes(guide.category),
      `guide ${guide.id} has invalid category: ${guide.category}`
    );
  }
});

/* ---------------- routing ---------------- */

check("getGuide returns correct guide", () => {
  const guide = getGuide("company-profile");
  assert.ok(guide, "getGuide returned null for valid id");
  assert.equal(guide.id, "company-profile");
  assert.equal(guide.title, "Company Profile Setup");
});

check("getGuide returns null for unknown id", () => {
  const guide = getGuide("non-existent");
  assert.equal(guide, null);
});

check("related routes point at real Forsa routes", () => {
  const allowedPatterns = [
    /^\/dashboard/,
    /^\/post/,
    /^\/company\//,
    /^\/explore/,
    /^\/guides/,
    /^\/about/,
    /^\/whats-new/,
    /^\/companies/,
    /^\/post/,
    /^\/dashboard/,
    /^\/applicants/,
    /^\/messages/,
    /^\/saved/,
    /^\/people/,
    /^\/ai/,
  ];

  for (const guide of EMPLOYER_GUIDES) {
    if (guide.relatedRoutes) {
      for (const route of guide.relatedRoutes) {
        assert.ok(
          allowedPatterns.some((p) => p.test(route)),
          `related route not recognized: ${route} in "${guide.title}"`
        );
      }
    }
  }
});

check("no fabricated claims in descriptions", () => {
  const forbiddenPatterns = [
    /\d+\s?% of \w/i,                          // "X% of users..."
    /\d+\s?% (more|less|higher|lower|faster)/i, // comparative stats
    /studies show|research shows/i,             // appeal to unnamed research
    /\$\s?\d{2,3}(?:,\d{3})*(?:\.\d+)?\s*(?:per|\/)\s*(?:year|month|hour|day)/i, // salary claims like "$50,000/year" or "$800/month" (but not "$800–$1,500/month")
    /\$\s?\d+(?:,\d{3})*(?:\.\d+)?\s*(?:USD|dollars|LBP)/i, // currency amounts with units like "$50,000 USD"
    /testimonial|review\(s\) from users/i,      // fake social proof
    /5-star|rated \d/i,                         // fake ratings
    /Harvard|Stanford|MIT graduate/i,           // fabricated credentials
    /law (requires|states|mandates)/i,          // legal claims
    /\b(it is|is|must be) legally required\b/i, // fabricated legal claims (not "unless legally required")
  ];

  for (const guide of EMPLOYER_GUIDES) {
    for (const section of guide.sections) {
      const text = `${section.heading} ${section.body}`;
      for (const pattern of forbiddenPatterns) {
        assert.ok(!pattern.test(text), `forbidden pattern in "${guide.title}": ${pattern}`);
      }
    }
  }
});

console.log(`\n${passed}/${passed + failures.length} passed`);

if (failures.length > 0) {
  console.log("Failures:", failures.join(", "));
  process.exitCode = 1;
}