/*
 * Forsa AI Markdown: dependency-free parsing for model-generated replies.
 *
 * Why this exists: the provider returns Markdown-ish text (headings, lists,
 * emphasis), but occasionally with escaped markers such as `\*\*Title\*\*`
 * — a known quirk of the current model family when it hedges on formatting.
 * Rendering everything as one dense paragraph buries that structure, so we
 * parse a safe subset into an AST and render real elements.
 *
 * Safety model (deliberate):
 * - No HTML parsing, no `dangerouslySetInnerHTML` anywhere. The renderer
 *   builds React elements from text nodes only, so injected markup such as
 *   `<script>` or `<img onerror>` can only ever appear as visible text.
 * - Escape handling follows CommonMark for backslash + ASCII punctuation
 *   (renders the literal character), PLUS one documented normalization: a
 *   backslash before `*` is treated as a plain asterisk, because in this
 *   product's model output `\*` is overwhelmingly the escaping quirk, not an
 *   intentional literal. `\\` still yields one backslash, and `\` before any
 *   non-punctuation character (e.g. `\n` in `C:\new`) is left untouched.
 * - Anything unrecognized degrades to plain paragraphs. The parser never
 *   throws on model output and never drops content.
 *
 * Supported: ATX headings (#–######), unordered lists (-, *, +, •),
 * ordered lists (1. and 1) styles, fenced code blocks, quotes, horizontal
 * rules, **bold**, *italic* (_italic_ with word-boundary guards), `code`,
 * and single-newline breaks inside paragraphs (chat convention).
 */

const SENTINEL = "\uE000";

export function normalizeModelText(input) {
  if (typeof input !== "string") return "";

  let text = input.replace(/\r\n?/g, "\n");

  // Protect escaped backslashes first so later rules can't consume them.
  text = text.split("\\\\").join(SENTINEL);

  // Model quirk: `\` before `*` is formatting noise, not a literal marker.
  text = text.split("\\*").join("*");

  // CommonMark backslash escapes: `\` + ASCII punctuation → the character.
  text = text.replace(
    /\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,
    "$1"
  );

  return text.split(SENTINEL).join("\\");
}

/* ---------------- inline parsing ---------------- */

function parseInline(src) {
  const nodes = [];
  let i = 0;
  let buf = "";

  const flush = () => {
    if (buf) {
      nodes.push({ t: "text", v: buf });
      buf = "";
    }
  };

  const findStrongClose = (from) => src.indexOf("**", from);

  const findStarClose = (from) => {
    let j = from;
    while (j < src.length) {
      const k = src.indexOf("*", j);
      if (k === -1) return -1;
      // A star that is part of a `**` pair cannot close single emphasis.
      if (src[k + 1] === "*") {
        j = k + 2;
        continue;
      }
      // Closer must not be preceded by whitespace.
      if (src[k - 1] === " " || src[k - 1] === "\t" || src[k - 1] === "\n") {
        j = k + 1;
        continue;
      }
      return k;
    }
    return -1;
  };

  const isWordChar = (ch) => ch != null && /[\w]/.test(ch);

  while (i < src.length) {
    const ch = src[i];

    // Code spans bind tightest so formatting inside code stays literal.
    if (ch === "`") {
      let run = 0;
      while (src[i + run] === "`") run += 1;
      const fence = "`".repeat(run);
      const close = src.indexOf(fence, i + run);
      if (close === -1) {
        buf += fence;
        i += run;
        continue;
      }
      flush();
      nodes.push({
        t: "code",
        v: src.slice(i + run, close).replace(/\n/g, " "),
      });
      i = close + run;
      continue;
    }

    // Strong with **.
    if (ch === "*" && src[i + 1] === "*") {
      const close = findStrongClose(i + 2);
      if (close === -1 || close === i + 2) {
        buf += "**";
        i += 2;
        continue;
      }
      flush();
      nodes.push({ t: "strong", c: parseInline(src.slice(i + 2, close)) });
      i = close + 2;
      continue;
    }

    // Strong with __ (word-boundary guarded so snake_case survives).
    if (ch === "_" && src[i + 1] === "_") {
      const prevOk = i === 0 || !isWordChar(src[i - 1]);
      const close = src.indexOf("__", i + 2);
      const nextOk =
        close !== -1 &&
        (close + 2 >= src.length || !isWordChar(src[close + 2]));
      if (!prevOk || close === -1 || close === i + 2 || !nextOk) {
        buf += "__";
        i += 2;
        continue;
      }
      flush();
      nodes.push({ t: "strong", c: parseInline(src.slice(i + 2, close)) });
      i = close + 2;
      continue;
    }

    // Emphasis with * (opener must not be followed by whitespace).
    if (
      ch === "*" &&
      src[i + 1] !== " " &&
      src[i + 1] !== "\t" &&
      src[i + 1] !== "\n" &&
      src[i + 1] !== undefined
    ) {
      const close = findStarClose(i + 1);
      if (close === -1 || close === i + 1) {
        buf += "*";
        i += 1;
        continue;
      }
      flush();
      nodes.push({ t: "em", c: parseInline(src.slice(i + 1, close)) });
      i = close + 1;
      continue;
    }

    // Emphasis with _ (word-boundary guarded both sides).
    if (ch === "_") {
      const prevOk = i === 0 || !isWordChar(src[i - 1]);
      if (prevOk && src[i + 1] !== " " && src[i + 1] !== undefined) {
        let k = src.indexOf("_", i + 1);
        let close = -1;
        while (k !== -1) {
          const afterOk = k + 1 >= src.length || !isWordChar(src[k + 1]);
          const beforeOk = src[k - 1] !== " " && src[k - 1] !== "\t";
          if (afterOk && beforeOk && k > i + 1) {
            close = k;
            break;
          }
          k = src.indexOf("_", k + 1);
        }
        if (close !== -1) {
          flush();
          nodes.push({ t: "em", c: parseInline(src.slice(i + 1, close)) });
          i = close + 1;
          continue;
        }
      }
      buf += "_";
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }

  flush();
  return nodes;
}

/* ---------------- block parsing ---------------- */

const isBlank = (line) => /^\s*$/.test(line);

function isBlockStart(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(`{3,})/.test(line)) return true;
  if (/^#{1,6}\s/.test(trimmed)) return true;
  if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) return true;
  if (/^\s*>/.test(line)) return true;
  if (/^\s*[-*+•]\s+/.test(line)) return true;
  // Ordered markers need a space after the delimiter; numbers above 99 are
  // treated as plain text (years like "2024." must not become list items).
  const ordered = line.match(/^\s*(\d+)[.)]\s+/);
  if (ordered && Number(ordered[1]) < 100) return true;
  return false;
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    // Fenced code block (unclosed fence still yields a block — graceful).
    const fence = line.match(/^(`{3,})(\w*)\s*$/);
    if (fence) {
      const collected = [];
      i += 1;
      while (i < lines.length && !new RegExp(`^${fence[1]}\\s*$`).test(lines[i])) {
        collected.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // consume closing fence
      blocks.push({
        type: "code",
        lang: fence[2] || "",
        text: collected.join("\n"),
        source: [line, ...collected].join("\n"),
      });
      continue;
    }

    // ATX heading.
    const heading = line.trim().match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const text = heading[2].replace(/\s+#+\s*$/, "");
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 6),
        children: parseInline(text),
        source: line,
      });
      i += 1;
      continue;
    }

    // Horizontal rule.
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ type: "hr", source: line });
      i += 1;
      continue;
    }

    // Blockquote (recursive, so quotes can hold lists and headings).
    if (/^\s*>/.test(line)) {
      const inner = [];
      const source = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        source.push(lines[i]);
        inner.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", children: parseBlocks(inner), source: source.join("\n") });
      continue;
    }

    // Lists (unordered and ordered). Each item keeps its own raw lines so
    // continuations render as well as copy.
    const ulOpen = line.match(/^\s*[-*+•]\s+(.*)$/);
    const olOpen = (() => {
      const m = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (m && Number(m[1]) < 100) return { content: m[2], start: Number(m[1]) };
      return null;
    })();

    if (ulOpen || olOpen) {
      const ordered = !ulOpen;
      const items = [];
      const source = [];
      let start = 1;
      if (ordered && olOpen) start = olOpen.start;

      let currentLines = null;
      const flushItem = () => {
        if (currentLines && currentLines.length > 0) {
          items.push(parseInline(currentLines.join("\n")));
          currentLines = null;
        }
      };

      while (i < lines.length) {
        const current = lines[i];

        if (isBlank(current)) {
          // A blank line continues the list only if another item follows.
          let j = i + 1;
          while (j < lines.length && isBlank(lines[j])) j += 1;
          if (
            j < lines.length &&
            (/^\s*[-*+•]\s+/.test(lines[j]) ||
              (() => {
                const m = lines[j].match(/^\s*(\d+)[.)]\s+/);
                return m && Number(m[1]) < 100;
              })())
          ) {
            source.push(current);
            i = j;
            continue;
          }
          break;
        }

        const nextUl = current.match(/^\s*[-*+•]\s+(.*)$/);
        const nextOlRaw = current.match(/^\s*(\d+)[.)]\s+(.*)$/);
        const nextOl =
          nextOlRaw && Number(nextOlRaw[1]) < 100
            ? { content: nextOlRaw[2] }
            : null;

        if (nextUl || nextOl) {
          // A different list kind ends this list; the outer loop re-reads it.
          if (currentLines && ((ordered && nextUl) || (!ordered && nextOl))) {
            break;
          }
          flushItem();
          source.push(current);
          currentLines = [nextUl ? nextUl[1] : nextOl.content];
          i += 1;
          continue;
        }

        if (!isBlockStart(current) && currentLines) {
          // Lazy continuation: plain text belongs to the open item.
          source.push(current);
          currentLines.push(current.trim());
          i += 1;
          continue;
        }

        break;
      }

      flushItem();

      // A marker with no parseable items degrades to a paragraph, not silence.
      if (items.length === 0) {
        blocks.push({
          type: "paragraph",
          children: parseInline(source.join("\n") || line),
          source: source.join("\n") || line,
        });
        continue;
      }

      blocks.push({
        type: ordered ? "ol" : "ul",
        start,
        items,
        source: source.join("\n"),
      });
      continue;
    }

    // Paragraph: gather until blank or a new block starts.
    const collected = [line];
    i += 1;
    while (i < lines.length && !isBlank(lines[i]) && !isBlockStart(lines[i])) {
      collected.push(lines[i]);
      i += 1;
    }
    blocks.push({
      type: "paragraph",
      children: parseInline(collected.join("\n")),
      source: collected.join("\n"),
    });
  }

  return blocks;
}

/**
 * Parse model output into blocks. Never throws on unexpected input and never
 * drops content: anything unrecognized becomes a paragraph.
 */
export function parseMarkdown(input) {
  if (typeof input !== "string" || !input.trim()) return [];

  try {
    return parseBlocks(normalizeModelText(input).split("\n"));
  } catch {
    return [{ type: "paragraph", children: [{ t: "text", v: input }], source: input }];
  }
}

/**
 * Group top-level blocks under ATX level-1/2 headings for sectioned
 * rendering (cards + per-section copy). Blocks before the first heading
 * form an intro group with `heading: null`. Content is never reordered or
 * dropped — grouping is presentational only.
 */
export function splitSections(blocks) {
  const sections = [];
  let current = null;

  for (const block of blocks) {
    if (block.type === "heading" && block.level <= 2) {
      current = { heading: block, blocks: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { heading: null, blocks: [] };
      sections.push(current);
    }

    current.blocks.push(block);
  }

  return sections.filter(
    (section) => section.blocks.length > 0 || section.heading
  );
}

/** Raw source text of a section, for clipboard copy (clean Markdown). */
export function sectionText(section) {
  const parts = [];

  if (section.heading) parts.push(section.heading.source);

  for (const block of section.blocks) {
    if (block.source) parts.push(block.source);
  }

  return parts.join("\n\n");
}

/**
 * For interview results: find a trailing practice question. Returns the
 * block when the last top-level block is a paragraph or quote whose text
 * ends with "?", otherwise null. Callers must render everything regardless
 * — this only decides emphasis, never visibility.
 */
export function splitPracticePrompt(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { main: blocks || [], prompt: null };
  }

  const last = blocks[blocks.length - 1];

  if (last.type !== "paragraph" && last.type !== "quote") {
    return { main: blocks, prompt: null };
  }

  const text = inlineText(
    last.type === "paragraph" ? last.children : flattenQuote(last)
  ).trim();

  if (!text.endsWith("?")) return { main: blocks, prompt: null };

  return { main: blocks.slice(0, -1), prompt: last };
}

function flattenQuote(quoteBlock) {
  const out = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.t === "text" || node.t === "code") out.push(node);
      else if (node.c) walk(node.c);
      else if (node.children) {
        for (const child of node.children) {
          if (child.children) walk(child.children);
        }
      }
    }
  };
  for (const block of quoteBlock.children || []) {
    if (block.children) walk(block.children);
  }
  return out;
}

/** Plain-text rendering of inline nodes (copy helpers, tests, heuristics). */
export function inlineText(nodes) {
  let out = "";
  for (const node of nodes || []) {
    if (node.t === "text" || node.t === "code") out += node.v;
    else if (node.c) out += inlineText(node.c);
  }
  return out;
}
