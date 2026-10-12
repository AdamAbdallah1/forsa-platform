import { useMemo } from "react";
import { parseMarkdown } from "../lib/forsaAiMarkdown";

/*
 * Plain rich-text rendering for Forsa AI replies.
 *
 * Takes the AST from `parseMarkdown` and emits React elements built from
 * text nodes only — there is deliberately no `dangerouslySetInnerHTML`
 * anywhere in this file, so model-supplied markup such as `<script>` or
 * `<img onerror>` can only ever appear as visible, inert text.
 *
 * No animation or browser hooks here, so this component is safe to render
 * with `react-dom/server` in tests. Styling follows the existing Forsa
 * tokens and the assistant-bubble type scale (text-sm/leading-6).
 */

function renderInline(nodes, keyPrefix) {
  const out = [];

  nodes.forEach((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.t === "text") {
      out.push(node.v);
      return;
    }

    if (node.t === "code") {
      out.push(
        <code
          key={key}
          className="rounded bg-[var(--forsa-bg-soft)] px-1 py-0.5 font-mono text-[12px] text-[var(--forsa-primary)]"
        >
          {node.v}
        </code>
      );
      return;
    }

    if (node.t === "strong") {
      out.push(
        <strong key={key} className="font-semibold text-neutral-900">
          {renderInline(node.c, key)}
        </strong>
      );
      return;
    }

    if (node.t === "em") {
      out.push(<em key={key}>{renderInline(node.c, key)}</em>);
      return;
    }

    // Unknown node kinds degrade to their text content, never vanish.
    out.push(node.v ?? "");
  });

  return out;
}

function renderParagraphBody(children, keyPrefix) {
  // Single newlines inside a paragraph are chat line breaks.
  const out = [];

  children.forEach((node, index) => {
    if (node.t === "text" && node.v.includes("\n")) {
      node.v.split("\n").forEach((part, partIndex) => {
        if (partIndex > 0) {
          out.push(
            <br key={`${keyPrefix}-${index}-br-${partIndex}`} />
          );
        }
        if (part) out.push(part);
      });
      return;
    }

    out.push(...renderInline([node], `${keyPrefix}-${index}`));
  });

  return out;
}

export function MarkdownBlocks({ blocks }) {
  return <>{(blocks || []).map((block, index) => renderBlock(block, `b${index}`))}</>;
}

function renderBlock(block, key) {
  switch (block.type) {
    case "heading": {
      const sizeClass = block.level <= 1 ? "text-[15px]" : "text-sm";
      return (
        <h3
          key={key}
          className={`${sizeClass} mt-4 font-semibold tracking-[-0.01em] text-neutral-900 first:mt-0`}
          data-forsa-heading={block.level}
        >
          {renderInline(block.children || [], key)}
        </h3>
      );
    }

    case "ul":
      return (
        <ul
          key={key}
          className="list-disc space-y-1.5 pl-5 marker:text-[var(--forsa-primary)]"
        >
          {(block.items || []).map((item, itemIndex) => (
            <li key={`${key}-i${itemIndex}`}>
              {renderInline(item, `${key}-i${itemIndex}`)}
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol
          key={key}
          start={block.start && block.start !== 1 ? block.start : undefined}
          className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-[var(--forsa-primary)]"
        >
          {(block.items || []).map((item, itemIndex) => (
            <li key={`${key}-i${itemIndex}`}>
              {renderInline(item, `${key}-i${itemIndex}`)}
            </li>
          ))}
        </ol>
      );

    case "code":
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-xl bg-neutral-900 px-3.5 py-3 font-mono text-[12px] leading-5 text-neutral-100"
        >
          <code>{block.text}</code>
        </pre>
      );

    case "hr":
      return (
        <hr key={key} className="border-t border-[var(--forsa-border)]" />
      );

    case "quote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-[var(--forsa-border)] pl-3 text-neutral-500"
        >
          <MarkdownBlocks blocks={block.children || []} />
        </blockquote>
      );

    case "paragraph":
    default:
      return <p key={key}>{renderParagraphBody(block.children || [], key)}</p>;
  }
}

export default function AiMarkdown({ text, className = "" }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);

  if (blocks.length === 0) return null;

  return (
    <div
      className={`space-y-3 break-words text-sm leading-6 text-neutral-600 ${className}`}
    >
      <MarkdownBlocks blocks={blocks} />
    </div>
  );
}
