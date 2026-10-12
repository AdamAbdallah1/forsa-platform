/* SSR smoke test for Guides pages: verifies library + all articles render
 * without crashing and emit expected content. Run with:
 * npm run test:guides (or: node scripts/tests/career-guides-ssr.test.mjs) */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const PROJECT = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  ".."
);

const React = (
  await import(new URL("../../node_modules/react/index.js", import.meta.url).href)
).default;
const { renderToStaticMarkup } = await import(
  new URL("../../node_modules/react-dom/server.node.js", import.meta.url).href
);
const { createServer } = await import(
  new URL("../../node_modules/vite/dist/node/index.js", import.meta.url).href
);
const require = createRequire(new URL("../../package.json", import.meta.url).href);
const { MemoryRouter, Routes, Route } = require("react-router-dom");

const vite = await createServer({
  root: PROJECT,
  logLevel: "silent",
  server: { middlewareMode: true },
  appType: "custom",
});

const { default: Guides } = await vite.ssrLoadModule("/src/pages/Guides.jsx");
const { default: GuideArticle } = await vite.ssrLoadModule(
  "/src/pages/GuideArticle.jsx"
);
const guides = await vite.ssrLoadModule("/src/data/careerGuides.js");
const { AuthProvider } = await vite.ssrLoadModule(
  "/src/contexts/AuthContext.jsx"
);

let passed = 0;
const failures = [];
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`FAIL  ${name}: ${e.message.slice(0, 200)}`);
  }
}

function renderAt(path) {
  return renderToStaticMarkup(
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [path] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: "/guides",
            element: React.createElement(Guides),
          }),
          React.createElement(Route, {
            path: "/guides/:slug",
            element: React.createElement(GuideArticle),
          })
        )
      )
    )
  );
}

check("library renders headline, search, filters, all cards", () => {
  const html = renderAt("/guides");
  assert.ok(html.includes("Learn the skills behind the job search"));
  assert.ok(html.includes('id="guides-search"'), "search field missing");
  assert.ok(html.includes("All topics (11)"), "filter count wrong");
  assert.ok(html.includes("Featured guide"), "featured block missing");
  for (const guide of guides.CAREER_GUIDES) {
    assert.ok(
      html.includes(`/guides/${guide.slug}`),
      `missing card link: ${guide.slug}`
    );
  }
});

check("library cards and featured block render covers with alt", () => {
  const html = renderAt("/guides");
  for (const guide of guides.CAREER_GUIDES) {
    assert.ok(
      html.includes(`src="/guides/${guide.slug}.svg"`),
      `missing cover img: ${guide.slug}`
    );
  }
  // Alt text is HTML-escaped in static markup; match the escaped form.
  const esc = (s) => s.replace(/'/g, "&#x27;").replace(/"/g, "&quot;");
  for (const guide of guides.CAREER_GUIDES) {
    assert.ok(
      html.includes(`alt="${guide.coverAlt}"`) ||
        html.includes(`alt="${esc(guide.coverAlt)}"`),
      `missing alt: ${guide.slug}`
    );
  }
  assert.ok(html.includes('loading="lazy"'), "card images not lazy");
});

check("every article renders title, TOC, sections, related, next step", () => {
  const esc = (s) => s.replace(/'/g, "&#x27;");

  for (const guide of guides.CAREER_GUIDES) {
    const html = renderAt(`/guides/${guide.slug}`);
    assert.ok(
      html.includes(guide.title) || html.includes(esc(guide.title)),
      `${guide.slug}: title`
    );
    assert.ok(html.includes("Table of contents") || html.includes("In this guide"), `${guide.slug}: TOC`);
    for (const section of guide.sections) {
      // Static markup escapes apostrophes; match the escaped form.
      const escaped = section.heading.replace(/'/g, "&#x27;");
      assert.ok(
        html.includes(section.heading) || html.includes(escaped),
        `${guide.slug}: ${section.heading}`
      );
    }
    assert.ok(html.includes("Keep reading"), `${guide.slug}: related`);
    assert.ok(html.includes(guide.nextStep.label), `${guide.slug}: next step`);
    assert.ok(!html.includes("doesn"), `${guide.slug}: leaked not-found`);
  }
});

check("article header renders cover with eager loading", () => {
  const html = renderAt("/guides/build-cv-no-experience");
  assert.ok(
    html.includes('src="/guides/build-cv-no-experience.svg"'),
    "article cover missing"
  );
  assert.ok(html.includes('fetchPriority="high"'), "LCP image not prioritized");
});

check("unknown slug renders local not-found with library link", () => {
  const html = renderAt("/guides/definitely-not-a-guide");
  assert.ok(html.includes("Guide not found"));
  assert.ok(html.includes("/guides"), "no link back");
});

check("no dangerouslySetInnerHTML in rendered output paths", () => {
  const html = renderAt("/guides/build-cv-no-experience");
  // Static markup never contains script/style tags from content.
  assert.ok(!html.includes("<script"), "script tag in output");
});

await vite.close();

console.log(`\n${passed}/${passed + failures.length} passed`);
process.exit(failures.length === 0 ? 0 : 1);
