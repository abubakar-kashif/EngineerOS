/**
 * Lightweight markdown renderer for mentor responses.
 *
 * Renders as plain React elements (no raw HTML injection) and
 * supports the subset engineering education needs:
 * headings, paragraphs, ordered/unordered lists, fenced code blocks,
 * blockquotes, tables, inline code, bold, italic and inline
 * equations written as $V = IR$.
 */

import type { ReactNode } from "react";

/* ── inline parsing ──────────────────────────────────── */

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_PATTERN).filter((p) => p !== "");

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key} className="md-inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      return (
        <span key={key} className="md-equation" role="math">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

/* ── block parsing ───────────────────────────────────── */

function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  const nextKey = () => `md-block-${blockKey++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={nextKey()} className="md-code-block">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const inline = renderInline(text, `h${blockKey}`);
      if (level <= 2) {
        blocks.push(<h3 key={nextKey()} className="md-heading md-heading-lg">{inline}</h3>);
      } else if (level === 3) {
        blocks.push(<h4 key={nextKey()} className="md-heading md-heading-md">{inline}</h4>);
      } else {
        blocks.push(<h5 key={nextKey()} className="md-heading md-heading-sm">{inline}</h5>);
      }
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={nextKey()} className="md-blockquote">
          {renderInline(quoteLines.join(" "), `bq${blockKey}`)}
        </blockquote>,
      );
      continue;
    }

    // Table
    if (line.trim().startsWith("|") && line.includes("|", 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r)) // skip separator row
        .map((r) =>
          r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()),
        );

      if (rows.length > 0) {
        const [header, ...body] = rows;
        blocks.push(
          <div key={nextKey()} className="md-table-wrap">
            <table className="md-table">
              <thead>
                <tr>
                  {header.map((cell, ci) => (
                    <th key={ci}>{renderInline(cell, `th${ci}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{renderInline(cell, `td${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      }
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={nextKey()} className="md-list md-list-unordered">
          {items.map((item, li) => (
            <li key={li}>{renderInline(item, `ul${li}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={nextKey()} className="md-list md-list-ordered">
          {items.map((item, li) => (
            <li key={li}>{renderInline(item, `ol${li}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (merge consecutive plain lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("#") &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p key={nextKey()} className="md-paragraph">
          {renderInline(paraLines.join(" "), `p${blockKey}`)}
        </p>,
      );
    }
  }

  return <div className="md-root">{blocks}</div>;
}

export default MarkdownLite;
