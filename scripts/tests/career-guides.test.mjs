/* Career Guides tests: content model integrity, search, filtering, routing.
 * Pure data-module tests — no Firebase, no network, no provider. Run with:
 * npm run test:guides (or: node scripts/tests/career-guides.test.mjs) */
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
  new URL("../../src/data/careerGuides.js", import.meta.url).href
);

const {
  CAREER_GUIDES,
  GUIDE_CATEGORIES,
  getGuideBySlug,
  getRelatedGuides,
  getCategoryById,
  getFeaturedGuide,
  guidesByCategory,
  readingMinutes,
  searchGuides,
} = guides;

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

check("slugs are unique and URL-safe", () => {
  const slugs = CAREER_GUIDES.map((g) => g.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/);
  }
});

check("every guide has required fields", () => {
  for (const guide of CAREER_GUIDES) {
    assert.ok(guide.title && guide.title.length > 10, `${guide.slug}: title`);
    assert.ok(guide.summary && guide.summary.length > 20, `${guide.slug}: summary`);
    assert.ok(
      Array.isArray(guide.intro) && guide.intro.length >= 1,
      `${guide.slug}: intro`
    );
    assert.ok(
      Array.isArray(guide.sections) && guide.sections.length >= 4,
      `${guide.slug}: sections`
    );
    assert.ok(guide.nextStep && guide.nextStep.label && guide.nextStep.to, `${guide.slug}: nextStep`);
    assert.match(guide.publishedAt, /^\d{4}-\d{2}-\d{2}$/, `${guide.slug}: date`);

    for (const section of guide.sections) {
      assert.ok(section.heading, `${guide.slug}: section heading`);
      assert.ok(
        Array.isArray(section.blocks) && section.blocks.length > 0,
        `${guide.slug}: section blocks`
      );
      for (const block of section.blocks) {
        assert.ok(
          ["paragraph", "list", "checklist", "callout", "example"].includes(block.type),
          `${guide.slug}: unknown block type ${block.type}`
        );
        if (block.type === "list" || block.type === "checklist") {
          assert.ok(block.items.length >= 2, `${guide.slug}: thin list`);
        } else {
          assert.ok((block.text || "").length > 40, `${guide.slug}: thin body`);
        }
      }
    }
  }
});

check("section headings are unique within each guide", () => {
  // GuideArticle and the TOC use headings as React keys; duplicates would
  // silently collide during rendering.
  for (const guide of CAREER_GUIDES) {
    const headings = guide.sections.map((s) => s.heading);
    assert.equal(
      new Set(headings).size,
      headings.length,
      `${guide.slug}: duplicate section heading`
    );
  }
});

check("every guide belongs to a real category", () => {
  const ids = new Set(GUIDE_CATEGORIES.map((c) => c.id));
  for (const guide of CAREER_GUIDES) {
    assert.ok(ids.has(guide.category), `${guide.slug}: ${guide.category}`);
  }
});

check("every category has at least one guide (no dead filters)", () => {
  for (const category of GUIDE_CATEGORIES) {
    assert.ok(
      guidesByCategory(category.id).length > 0,
      `empty category: ${category.id}`
    );
  }
});

check("exactly one featured guide", () => {
  const featured = CAREER_GUIDES.filter((g) => g.featured);
  assert.equal(featured.length, 1);
  assert.equal(getFeaturedGuide().slug, featured[0].slug);
});

check("related slugs exist and never include self", () => {
  for (const guide of CAREER_GUIDES) {
    const related = getRelatedGuides(guide.slug, 3);
    assert.ok(related.length >= 1, `${guide.slug}: no related`);
    for (const other of related) {
      assert.notEqual(other.slug, guide.slug);
      assert.ok(getGuideBySlug(other.slug), `${guide.slug}: dangling ${other.slug}`);
    }
  }
});

check("related prefers same category", () => {
  // build-cv-no-experience (cv) shares its category with describe-projects-honestly
  const related = getRelatedGuides("build-cv-no-experience", 3).map((g) => g.slug);
  assert.ok(related.includes("describe-projects-honestly"));
});

check("nextStep links point at real Forsa routes only", () => {
  const allowed = [/^\/explore$/, /^\/ai\?tool=(cv|interview|roadmap|application)$/];
  for (const guide of CAREER_GUIDES) {
    assert.ok(
      allowed.some((pattern) => pattern.test(guide.nextStep.to)),
      `${guide.slug}: ${guide.nextStep.to}`
    );
  }
});

check("getGuideBySlug returns null for unknown slugs", () => {
  assert.equal(getGuideBySlug("nope-not-real"), null);
  assert.deepEqual(getRelatedGuides("nope-not-real"), []);
});

check("no fabricated credibility signals in content", () => {
  const text = JSON.stringify(CAREER_GUIDES);
  // Research-style claims ("X% of employers…", "N% more likely…").
  // Bare illustrative mentions (e.g. arguing against "Photoshop: 90%"
  // skill bars) are legitimate instructional content, not statistics.
  assert.ok(!/\d+\s?% of \w/i.test(text), "percentage-of claim");
  assert.ok(!/\d+\s?% (more|less|higher|lower|faster)/i.test(text), "comparative statistic");
  assert.ok(!/studies show|research shows|according to (a )?survey/i.test(text), "appeal to unnamed research");
  assert.ok(!/\$\s?\d|\d+\s?(USD|dollars|LBP)/.test(text), "salary figure");
  assert.ok(
    !/testimonial|review\(s\) from users|5-star|rated \d/i.test(text),
    "fake social proof"
  );
  assert.ok(
    !/Harvard|Stanford|MIT graduate|PhD| Rhodes Scholar/i.test(text),
    "fabricated credentials"
  );
  assert.ok(!/law (requires|states|mandates)|legally required/i.test(text), "legal claims");
});

check("reading time is computed from real word count", () => {
  for (const guide of CAREER_GUIDES) {
    const minutes = readingMinutes(guide);
    assert.ok(minutes >= 2 && minutes <= 12, `${guide.slug}: ${minutes} min`);
  }
});

/* ---------------- search & filter ---------------- */

check("empty query returns the whole collection", () => {
  assert.equal(searchGuides("").length, CAREER_GUIDES.length);
  assert.equal(searchGuides("   ").length, CAREER_GUIDES.length);
});

check("search matches titles", () => {
  const hits = searchGuides("portfolio").map((g) => g.slug);
  assert.ok(hits.includes("build-portfolio"));
});

check("search matches section bodies, not just titles", () => {
  const hits = searchGuides("transport").map((g) => g.slug);
  assert.ok(hits.includes("first-job-interview"));
});

check("multi-term search requires every term", () => {
  const hits = searchGuides("cv photo").map((g) => g.slug);
  assert.ok(hits.includes("build-cv-no-experience"));
  assert.ok(!hits.includes("first-tech-job"));
});

check("search is case-insensitive and punctuation-tolerant", () => {
  const lower = searchGuides("interview").map((g) => g.slug).sort();
  const upper = searchGuides("INTERVIEW?").map((g) => g.slug).sort();
  assert.deepEqual(lower, upper);
});

check("gibberish returns nothing", () => {
  assert.equal(searchGuides("xqzvwtj").length, 0);
});

check("category filter partitions the collection", () => {
  const total = GUIDE_CATEGORIES.reduce(
    (sum, c) => sum + guidesByCategory(c.id).length,
    0
  );
  assert.equal(total, CAREER_GUIDES.length);
});

/* ---------------- routing & sitemap ---------------- */

check("App.jsx registers /guides and /guides/:slug", async () => {
  const app = await readFile(
    new URL("../../src/App.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(app.includes('path="/guides"'), "missing /guides route");
  assert.ok(app.includes('path="/guides/:slug"'), "missing /guides/:slug route");
  assert.ok(app.includes("GuideArticle"), "GuideArticle not wired");
});

check("guides stay on the apex (not in APPLICATION_PATHS)", async () => {
  const redirect = await readFile(
    new URL("../../src/components/ApexAppRedirect.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(!redirect.includes('"/guides"'), "/guides would redirect off apex");
});

check("guides are indexable", async () => {
  const app = await readFile(
    new URL("../../src/App.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(app.includes('"/guides"'), "/guides not indexable");
  assert.ok(
    app.includes('pathname.startsWith("/guides/")'),
    "/guides/:slug not indexable"
  );
});

check("sitemap lists /guides and every article", async () => {
  const sitemap = await readFile(
    new URL("../../public/sitemap.xml", import.meta.url),
    "utf8"
  );
  assert.ok(sitemap.includes("https://forsa.digital/guides<") || sitemap.includes("https://forsa.digital/guides\n") || sitemap.includes("<loc>https://forsa.digital/guides</loc>"));
  for (const guide of CAREER_GUIDES) {
    assert.ok(
      sitemap.includes(`https://forsa.digital/guides/${guide.slug}`),
      `missing sitemap entry: ${guide.slug}`
    );
  }
});

check("footer links to /guides", async () => {
  const footer = await readFile(
    new URL("../../src/components/Footer.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(footer.includes('href: "/guides"') || footer.includes('"/guides"'));
});

/* ---------------- cover assets ---------------- */

check("every guide has a cover path matching its slug", () => {
  for (const guide of CAREER_GUIDES) {
    assert.equal(
      guide.cover,
      `/guides/${guide.slug}.svg`,
      `${guide.slug}: cover path`
    );
  }
});

check("cover paths are unique across guides", () => {
  const covers = CAREER_GUIDES.map((g) => g.cover);
  assert.equal(new Set(covers).size, covers.length);
});

check("every guide has meaningful alt text", () => {
  for (const guide of CAREER_GUIDES) {
    assert.ok(
      typeof guide.coverAlt === "string" && guide.coverAlt.length >= 20,
      `${guide.slug}: coverAlt too short or missing`
    );
    assert.ok(
      !/^(image|photo|picture|cover)[\s.]*$/i.test(guide.coverAlt),
      `${guide.slug}: generic alt text`
    );
  }
});

check("cover files exist, are valid SVG, and stay small", async () => {
  const { stat } = await import("node:fs/promises");
  let totalBytes = 0;

  for (const guide of CAREER_GUIDES) {
    const fileUrl = new URL(`../../public${guide.cover}`, import.meta.url);
    const content = await readFile(fileUrl, "utf8");
    const { size } = await stat(fileUrl);
    totalBytes += size;

    assert.ok(
      content.trimStart().startsWith("<svg"),
      `${guide.slug}: not an SVG document`
    );
    assert.ok(
      content.includes('viewBox="0 0 1200 630"'),
      `${guide.slug}: unexpected canvas size`
    );
    assert.ok(
      !content.includes("<text") && !content.includes("<image"),
      `${guide.slug}: embedded text or raster content`
    );
    assert.ok(size < 15 * 1024, `${guide.slug}: ${size} bytes exceeds budget`);
  }

  assert.ok(
    totalBytes < 150 * 1024,
    `combined covers ${totalBytes} bytes exceed budget`
  );
});

check("GuideCard renders cover with alt and lazy loading", async () => {
  const card = await readFile(
    new URL("../../src/components/GuideCard.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(card.includes("guide.cover"), "card ignores cover field");
  assert.ok(
    card.includes("guide.coverAlt"),
    "card ignores alt text"
  );
  assert.ok(card.includes('loading="lazy"'), "card image not lazy");
  assert.ok(card.includes("aspect-[16/10]"), "card ratio missing");
});

check("article page renders cover near the header", async () => {
  const article = await readFile(
    new URL("../../src/pages/GuideArticle.jsx", import.meta.url),
    "utf8"
  );
  assert.ok(article.includes("guide.cover"), "article ignores cover field");
  assert.ok(
    article.includes("aspect-[21/9]") || article.includes("aspect-[16/10]"),
    "article cover ratio missing"
  );
});

console.log(`\n${passed}/${passed + failures.length} passed`);
process.exit(failures.length === 0 ? 0 : 1);
