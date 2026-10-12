/* Release Notes tests: content model integrity and routing.
 * Pure data-module tests — no Firebase, no network, no provider. Run with:
 * npm run test:releases
 * (or: node scripts/tests/releases.test.mjs) */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  ".."
);

const releases = await import(
  new URL("../../src/data/releases.js", import.meta.url).href
);

const { RELEASES, RELEASE_CATEGORIES } = releases;

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

check("RELEASE_CATEGORIES has expected categories", () => {
  const ids = RELEASE_CATEGORIES.map((c) => c.id);
  assert.deepEqual(ids.sort(), ["fixed", "improved", "new"]);
});

check("each category has required fields", () => {
  for (const cat of RELEASE_CATEGORIES) {
    assert.ok(cat.id, "category missing id");
    assert.ok(cat.label, "category missing label");
    assert.ok(cat.color, "category missing color");
    assert.match(cat.id, /^[a-z]+$/, "category id should be lowercase");
  }
});

check("RELEASES is an array", () => {
  assert.ok(Array.isArray(RELEASES), "RELEASES should be an array");
});

check("release versions are unique", () => {
  const versions = RELEASES.map((r) => r.version);
  assert.equal(new Set(versions).size, versions.length, "duplicate versions found");
});

check("release versions follow semantic versioning pattern", () => {
  for (const release of RELEASES) {
    assert.match(release.version, /^\d+\.\d+\.\d+$/, `invalid version format: ${release.version}`);
  }
});

check("release dates are valid ISO dates", () => {
  for (const release of RELEASES) {
    const date = new Date(release.date + "T00:00:00");
    assert.ok(!isNaN(date.getTime()), `invalid date: ${release.date}`);
    assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/, `invalid date format: ${release.date}`);
  }
});

check("releases are sorted newest first by date", () => {
  for (let i = 0; i < RELEASES.length - 1; i++) {
    const current = new Date(RELEASES[i].date + "T00:00:00");
    const next = new Date(RELEASES[i + 1].date + "T00:00:00");
    assert.ok(
      current >= next,
      `releases not sorted newest first: ${RELEASES[i].date} before ${RELEASES[i + 1].date}`
    );
  }
});

check("each release has required fields", () => {
  for (const release of RELEASES) {
    assert.ok(release.version, "release missing version");
    assert.ok(release.date, "release missing date");
    assert.ok(Array.isArray(release.entries), "release missing entries array");
  }
});

check("each entry has required fields", () => {
  for (const release of RELEASES) {
    for (const entry of release.entries) {
      assert.ok(entry.category, "entry missing category");
      assert.ok(entry.title, "entry missing title");
      assert.ok(entry.description, "entry missing description");
      assert.ok(entry.title.length >= 5, "entry title too short");
      assert.ok(entry.description.length >= 20, "entry description too short");
    }
  }
});

check("entry categories are valid", () => {
  const validCategories = RELEASE_CATEGORIES.map((c) => c.id);
  for (const release of RELEASES) {
    for (const entry of release.entries) {
      assert.ok(
        validCategories.includes(entry.category),
        `invalid category: ${entry.category}`
      );
    }
  }
});

check("entry descriptions contain no fabricated claims", () => {
  const forbiddenPatterns = [
    /\d+\s?% of \w/i,                          // "X% of users..."
    /\d+\s?% (more|less|higher|lower|faster)/i, // comparative stats
    /studies show|research shows/i,             // appeal to unnamed research
    /\$\s?\d+/,                                 // salary figures
    /\d+\s?(USD|dollars|LBP)/i,                 // currency amounts
    /testimonial|review\(s\) from users/i,      // fake social proof
    /5-star|rated \d/i,                         // fake ratings
    /Harvard|Stanford|MIT graduate/i,           // fabricated credentials
    /law (requires|states|mandates)/i,          // legal claims
    /legally required/i,                        // legal claims
  ];

  for (const release of RELEASES) {
    for (const entry of release.entries) {
      const text = `${entry.title} ${entry.description}`;
      for (const pattern of forbiddenPatterns) {
        assert.ok(!pattern.test(text), `forbidden pattern in "${entry.title}": ${pattern}`);
      }
    }
  }
});

check("relatedRoutes point at real Forsa routes", () => {
  const allowedPatterns = [
    /^\/explore/,
    /^\/profile/,
    /^\/company\//,
    /^\/explore\?/,
    /^\/jobs/,
    /^\/guides/,
    /^\/about/,
    /^\/whats-new/,
    /^\/companies/,
    /^\/post/,
    /^\/dashboard/,
    /^\/applications/,
    /^\/messages/,
    /^\/saved/,
    /^\/people/,
    /^\/ai/,
  ];

  for (const release of RELEASES) {
    for (const entry of release.entries) {
      if (entry.relatedRoutes) {
        for (const route of entry.relatedRoutes) {
          assert.ok(
            allowedPatterns.some((p) => p.test(route)),
            `related route not recognized: ${route} in "${entry.title}"`
          );
        }
      }
    }
  }
});

check("App.jsx registers /whats-new route", async () => {
  const app = await readFile(
    new URL("../../src/App.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(app.includes('path="/whats-new"'), "missing /whats-new route");
  assert.ok(app.includes("WhatsNew"), "WhatsNew component not imported");
});

check("Footer includes What's New link", async () => {
  const footer = await readFile(
    new URL("../../src/components/Footer.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(
    footer.includes('/whats-new"') || footer.includes("'whats-new'"),
    "Footer missing What's New link"
  );
  assert.ok(
    footer.includes("What's New") || footer.includes("What's New"),
    "Footer missing What's New label"
  );
});

check("page is indexable in RobotsController", async () => {
  const app = await readFile(
    new URL("../../src/App.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(
    app.includes('"/whats-new"') && app.includes("INDEXABLE_EXACT_PATHS"),
    "/whats-new not in INDEXABLE_EXACT_PATHS"
  );
});

console.log(`\n${passed}/${passed + failures.length} passed`);

if (failures.length > 0) {
  console.log("Failures:", failures.join(", "));
  process.exitCode = 1;
}