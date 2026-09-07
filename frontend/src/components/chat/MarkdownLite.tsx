/**
 * Markdown + KaTeX renderer for mentor and quiz content.
 *
 * Renders as React elements (no raw HTML injection). Markdown subset:
 * headings, paragraphs, lists, fenced code, blockquotes, tables,
 * inline code, bold, italic. Mathematics uses KaTeX for $…$, $$…$$,
 * \(…\), \[…\], and common un-delimited TeX such as \frac{V}{R}.
 */

import { useLayoutEffect, useRef, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

const KATEX_OPTS: katex.KatexOptions = {
  throwOnError: false,
  output: "html",
  strict: "ignore",
  trust: false,
};

function KatexView({ tex, display }: { tex: string; display: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      katex.render(tex, el, { ...KATEX_OPTS, displayMode: display });
    } catch {
      el.textContent = tex;
    }
  }, [tex, display]);

  return (
    <span
      ref={ref}
      className={display ? "md-math md-math-display" : "md-math md-math-inline"}
      role="math"
    />
  );
}

function takeBalancedBraces(source: string, start: number): number {
  if (source[start] !== "{") return -1;
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function takeLatexCommand(source: string, start: number): number {
  if (source[start] !== "\\") return -1;
  const name = source.slice(start + 1).match(/^[a-zA-Z]+/);
  if (!name) return -1;
  let i = start + 1 + name[0].length;
  for (let n = 0; n < 2; n++) {
    while (source[i] === " ") i++;
    if (source[i] !== "{") break;
    const end = takeBalancedBraces(source, i);
    if (end < 0) return -1;
    i = end;
  }
  return i;
}

function takeMathDelim(
  source: string,
  start: number,
  open: string,
  close: string,
): number {
  if (!source.startsWith(open, start)) return -1;
  const from = start + open.length;
  const end = source.indexOf(close, from);
  if (end < 0) return -1;
  return end + close.length;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let i = 0;
  let piece = 0;

  const pushText = (value: string) => {
    if (!value) return;
    nodes.push(<span key={`${keyPrefix}-t${piece++}`}>{value}</span>);
  };

  while (i < text.length) {
    const rest = text.slice(i);

    if (rest.startsWith("**")) {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        nodes.push(
          <strong key={`${keyPrefix}-b${piece++}`}>
            {renderInline(text.slice(i + 2, end), `${keyPrefix}-b${piece}`)}
          </strong>,
        );
        i = end + 2;
        continue;
      }
    }

    if (rest[0] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i) {
        nodes.push(
          <code key={`${keyPrefix}-c${piece++}`} className="md-inline-code">
            {text.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }

    const displayDollar = takeMathDelim(text, i, "$$", "$$");
    if (displayDollar > i + 4) {
      nodes.push(
        <KatexView
          key={`${keyPrefix}-d${piece++}`}
          tex={text.slice(i + 2, displayDollar - 2).trim()}
          display
        />,
      );
      i = displayDollar;
      continue;
    }

    const displayBracket = takeMathDelim(text, i, "\\[", "\\]");
    if (displayBracket > i + 4) {
      nodes.push(
        <KatexView
          key={`${keyPrefix}-k${piece++}`}
          tex={text.slice(i + 2, displayBracket - 2).trim()}
          display
        />,
      );
      i = displayBracket;
      continue;
    }

    const inlineParen = takeMathDelim(text, i, "\\(", "\\)");
    if (inlineParen > i + 4) {
      nodes.push(
        <KatexView
          key={`${keyPrefix}-p${piece++}`}
          tex={text.slice(i + 2, inlineParen - 2).trim()}
          display={false}
        />,
      );
      i = inlineParen;
      continue;
    }

    if (rest[0] === "$" && rest[1] !== "$") {
      const end = text.indexOf("$", i + 1);
      if (end > i + 1) {
        nodes.push(
          <KatexView
            key={`${keyPrefix}-s${piece++}`}
            tex={text.slice(i + 1, end).trim()}
            display={false}
          />,
        );
        i = end + 1;
        continue;
      }
    }

    const latexEnd = takeLatexCommand(text, i);
    if (latexEnd > i) {
      nodes.push(
        <KatexView
          key={`${keyPrefix}-x${piece++}`}
          tex={text.slice(i, latexEnd)}
          display={false}
        />,
      );
      i = latexEnd;
      continue;
    }

    if (rest[0] === "*" && rest[1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1 && !text.slice(i + 1, end).includes("\n")) {
        nodes.push(
          <em key={`${keyPrefix}-e${piece++}`}>
            {renderInline(text.slice(i + 1, end), `${keyPrefix}-e${piece}`)}
          </em>,
        );
        i = end + 1;
        continue;
      }
    }

    const next = text.slice(i + 1).search(/(\*\*|`|\$|\\\(|\\\[|\\[a-zA-Z]|\*)/);
    const cut = next < 0 ? text.length : i + 1 + next;
    pushText(text.slice(i, cut));
    i = cut;
  }

  return nodes;
}

export function MathText({ text }: { text: string }) {
  return <>{renderInline(text, "math")}</>;
}

function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  const nextKey = () => `md-block-${blockKey++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={nextKey()} className="md-code-block">
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (line.trim() === "$$") {
      const texLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "$$") {
        texLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push(<KatexView key={nextKey()} tex={texLines.join("\n").trim()} display />);
      continue;
    }

    const oneLineDisplay = line.trim().match(/^\$\$(.+)\$\$$/);
    if (oneLineDisplay) {
      blocks.push(<KatexView key={nextKey()} tex={oneLineDisplay[1].trim()} display />);
      i++;
      continue;
    }

    if (line.trim() === "\\[" ) {
      const texLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "\\]") {
        texLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push(<KatexView key={nextKey()} tex={texLines.join("\n").trim()} display />);
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const inline = renderInline(headingMatch[2], `h${blockKey}`);
      if (level <= 2) {
        blocks.push(
          <h3 key={nextKey()} className="md-heading md-heading-lg">
            {inline}
          </h3>,
        );
      } else if (level === 3) {
        blocks.push(
          <h4 key={nextKey()} className="md-heading md-heading-md">
            {inline}
          </h4>,
        );
      } else {
        blocks.push(
          <h5 key={nextKey()} className="md-heading md-heading-sm">
            {inline}
          </h5>,
        );
      }
      i++;
      continue;
    }

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

    if (line.trim().startsWith("|") && line.includes("|", 1)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((r) => !/^\s*\|[\s:|-]+\|\s*$/.test(r))
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

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      lines[i].trim() !== "$$" &&
      lines[i].trim() !== "\\[" &&
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
