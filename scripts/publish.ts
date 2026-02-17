#!/usr/bin/env bun
/**
 * publish.ts — Converts a markdown file into a beautiful zo.space page.
 *
 * Usage:
 *   bun run Skills/publish-page/scripts/publish.ts <markdown-file> [options]
 *
 * Options:
 *   --path <route>     Custom route path (default: derived from filename)
 *   --title <title>    Override the page title
 *   --style <style>    Style preset: editorial | minimal | warm | mono | precision | bold | sophisticated
 *   --accent <hex>     Custom accent color override (e.g. #FF5733)
 *   --private          Make the page private (default: public)
 *   --list             List all published pages
 *   --unpublish <path> Remove a published page
 *   --help             Show this help
 */

import { parseArgs } from "util";
import { readFileSync, existsSync } from "fs";

interface StylePreset {
  fontImport: string;
  headingFont: string;
  bodyFont: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
  linkColor: string;
  codeFont: string;
  codeBg: string;
  blockquoteBorder: string;
  blockquoteBg: string;
  maxWidth: string;
}

const STYLES: Record<string, StylePreset> = {
  editorial: {
    fontImport: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;1,8..60,300;1,8..60,400&family=JetBrains+Mono:wght@400;500&display=swap",
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Source Serif 4', Georgia, serif",
    bgColor: "#FAFAF7",
    textColor: "#2C2C2A",
    accentColor: "#1A1A18",
    mutedColor: "#8A8A82",
    surfaceColor: "#F0F0EB",
    borderColor: "#E0E0D8",
    linkColor: "#5B4A3F",
    codeFont: "'JetBrains Mono', monospace",
    codeBg: "#F0F0EB",
    blockquoteBorder: "#C8B8A8",
    blockquoteBg: "#F5F2ED",
    maxWidth: "680px",
  },
  minimal: {
    fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
    headingFont: "'Inter', -apple-system, sans-serif",
    bodyFont: "'Inter', -apple-system, sans-serif",
    bgColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#000000",
    mutedColor: "#999999",
    surfaceColor: "#F5F5F5",
    borderColor: "#E5E5E5",
    linkColor: "#0066CC",
    codeFont: "'JetBrains Mono', monospace",
    codeBg: "#F5F5F5",
    blockquoteBorder: "#CCCCCC",
    blockquoteBg: "#FAFAFA",
    maxWidth: "640px",
  },
  warm: {
    fontImport: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
    headingFont: "'Lora', Georgia, serif",
    bodyFont: "'Nunito Sans', sans-serif",
    bgColor: "#FBF8F3",
    textColor: "#3D3229",
    accentColor: "#2A1F14",
    mutedColor: "#9B8E80",
    surfaceColor: "#F3EDE4",
    borderColor: "#E6DDD1",
    linkColor: "#8B5E3C",
    codeFont: "'JetBrains Mono', monospace",
    codeBg: "#F3EDE4",
    blockquoteBorder: "#C4A882",
    blockquoteBg: "#F7F2EA",
    maxWidth: "680px",
  },
  mono: {
    fontImport: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap",
    headingFont: "'IBM Plex Mono', monospace",
    bodyFont: "'IBM Plex Sans', sans-serif",
    bgColor: "#111111",
    textColor: "#E0E0E0",
    accentColor: "#FFFFFF",
    mutedColor: "#777777",
    surfaceColor: "#1A1A1A",
    borderColor: "#333333",
    linkColor: "#80CBC4",
    codeFont: "'IBM Plex Mono', monospace",
    codeBg: "#1A1A1A",
    blockquoteBorder: "#444444",
    blockquoteBg: "#1A1A1A",
    maxWidth: "700px",
  },
  precision: {
    fontImport: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap",
    headingFont: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    bodyFont: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    bgColor: "#FFFFFF",
    textColor: "#1e293b",
    accentColor: "#0f172a",
    mutedColor: "#94a3b8",
    surfaceColor: "#f8fafc",
    borderColor: "rgba(0,0,0,0.08)",
    linkColor: "#2563eb",
    codeFont: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
    codeBg: "#f1f5f9",
    blockquoteBorder: "#2563eb",
    blockquoteBg: "#f8fafc",
    maxWidth: "660px",
  },
  bold: {
    fontImport: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
    headingFont: "'Space Grotesk', system-ui, sans-serif",
    bodyFont: "'Space Grotesk', system-ui, sans-serif",
    bgColor: "#FAFAFA",
    textColor: "#18181B",
    accentColor: "#09090B",
    mutedColor: "#71717A",
    surfaceColor: "#F4F4F5",
    borderColor: "#E4E4E7",
    linkColor: "#DC2626",
    codeFont: "'JetBrains Mono', monospace",
    codeBg: "#F4F4F5",
    blockquoteBorder: "#DC2626",
    blockquoteBg: "#FEF2F2",
    maxWidth: "720px",
  },
  sophisticated: {
    fontImport: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500&display=swap",
    headingFont: "'DM Serif Display', Georgia, serif",
    bodyFont: "'DM Sans', sans-serif",
    bgColor: "#FAFBFC",
    textColor: "#1F2937",
    accentColor: "#111827",
    mutedColor: "#6B7280",
    surfaceColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    linkColor: "#4F46E5",
    codeFont: "'JetBrains Mono', monospace",
    codeBg: "#F3F4F6",
    blockquoteBorder: "#4F46E5",
    blockquoteBg: "#F5F3FF",
    maxWidth: "680px",
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-|-$/g, "");
}

function extractFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta: Record<string, string> = {};
  match[1].split("\n").forEach((line) => {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) meta[key.trim()] = rest.join(":").trim();
  });
  return { meta, body: match[2] };
}

function escapeForJSX(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

function escapeForJSXContent(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

function countWords(text: string): number {
  return text.replace(/```[\s\S]*?```/g, "").replace(/[#*_~`>\-|]/g, " ").split(/\s+/).filter(w => w.length > 0).length;
}

function readingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 250));
  return `${minutes} min read`;
}

interface ParseResult {
  html: string;
  hasMermaid: boolean;
  hasPrism: boolean;
  headings: { level: number; text: string; id: string }[];
}

function markdownToReactElements(md: string, skipTitle?: string): ParseResult {
  const lines = md.split("\n");
  const elements: string[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = "";
  let inList = false;
  let listItems: string[] = [];
  let listType: "ul" | "ol" = "ul";
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let skippedFirstH1 = false;
  let hasMermaid = false;
  let hasPrism = false;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableAligns: string[] = [];
  let tableRows: string[][] = [];
  let paragraphBuffer: string[] = [];
  const headings: { level: number; text: string; id: string }[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ");
    const formatted = inlineFormat(text);
    elements.push(
      `<p className="mb-6 leading-relaxed" style={{ color: "var(--text-color)", fontSize: "1.1rem", lineHeight: 1.8 }}>${formatted}</p>`
    );
    paragraphBuffer = [];
  }

  function flushList() {
    if (!inList) return;
    const tag = listType;
    const listClass = listType === "ul" ? "list-disc" : "list-decimal";
    const items = listItems
      .map((item) => {
        // Task list checkbox support
        const checkMatch = item.match(/^\[([ xX])\]\s+(.*)/);
        if (checkMatch) {
          const checked = checkMatch[1] !== " ";
          const text = checkMatch[2];
          return `<li className="mb-2 leading-relaxed" style={{ listStyle: "none", marginLeft: "-1.5rem" }}><span style={{ marginRight: "0.5rem", opacity: ${checked ? 1 : 0.4} }}>${checked ? "\u2611" : "\u2610"}</span>${inlineFormat(text)}</li>`;
        }
        return `<li className="mb-2 leading-relaxed">${inlineFormat(item)}</li>`;
      })
      .join("\n              ");
    elements.push(`<${tag} className="${listClass} pl-8 mb-8 space-y-1" style={{ color: "var(--text-color)" }}>\n              ${items}\n            </${tag}>`);
    listItems = [];
    inList = false;
  }

  function flushBlockquote() {
    if (!inBlockquote) return;
    const content = blockquoteLines.join(" ");
    elements.push(
      `<blockquote className="border-l-[3px] pl-6 py-4 my-8 italic" style={{ borderColor: "var(--blockquote-border)", backgroundColor: "var(--blockquote-bg)", marginLeft: 0, marginRight: 0, borderRadius: "0 6px 6px 0", padding: "1.25rem 1.5rem" }}>
              <p className="leading-relaxed" style={{ color: "var(--muted-color)", fontSize: "1.05rem" }}>${inlineFormat(content)}</p>
            </blockquote>`
    );
    blockquoteLines = [];
    inBlockquote = false;
  }

  function flushTable() {
    if (!inTable) return;
    const headerCells = tableHeaders
      .map((h, i) => {
        const align = tableAligns[i] || "left";
        return `<th style={{ padding: "0.75rem 1rem", textAlign: "${align}", fontWeight: 600, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-color)", borderBottom: "2px solid var(--border-color)" }}>${inlineFormat(h)}</th>`;
      })
      .join("\n                    ");
    const bodyRows = tableRows
      .map(
        (row) =>
          `<tr>${row
            .map((cell, i) => {
              const align = tableAligns[i] || "left";
              return `<td style={{ padding: "0.75rem 1rem", textAlign: "${align}", borderBottom: "1px solid var(--border-color)", fontSize: "0.95rem" }}>${inlineFormat(cell)}</td>`;
            })
            .join("")}</tr>`
      )
      .join("\n                  ");
    elements.push(
      `<div className="my-8 overflow-x-auto" style={{ borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--body-font)" }}>
                <thead style={{ backgroundColor: "var(--surface-color)" }}>
                  <tr>
                    ${headerCells}
                  </tr>
                </thead>
                <tbody>
                  ${bodyRows}
                </tbody>
              </table>
            </div>`
    );
    tableHeaders = [];
    tableAligns = [];
    tableRows = [];
    inTable = false;
  }

  function inlineFormat(text: string): string {
    return text
      // images with optional title as caption
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => {
        const caption = title || alt;
        return `</p><figure className="my-8"><img src="${url}" alt="${escapeForJSXContent(alt)}" className="w-full rounded-lg shadow-sm" style={{ maxWidth: "100%" }} />${caption ? `<figcaption className="text-center mt-3" style={{ color: "var(--muted-color)", fontSize: "0.875rem", fontStyle: "italic" }}>${escapeForJSXContent(caption)}</figcaption>` : ""}</figure><p>`;
      })
      // links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" className="underline underline-offset-4 decoration-1 transition-colors hover:opacity-70" style={{ color: "var(--link-color)" }}>$1</a>`)
      // bold+italic
      .replace(/\*\*\*(.+?)\*\*\*/g, `<strong><em>$1</em></strong>`)
      // bold (asterisk + underscore)
      .replace(/\*\*(.+?)\*\*/g, `<strong style={{ fontWeight: 600 }}>$1</strong>`)
      .replace(/__(.+?)__/g, `<strong style={{ fontWeight: 600 }}>$1</strong>`)
      // italic (asterisk + underscore)
      .replace(/\*(.+?)\*/g, `<em>$1</em>`)
      .replace(/_(.+?)_/g, `<em>$1</em>`)
      // inline code
      .replace(/`([^`]+)`/g, `<code className="px-1.5 py-0.5 rounded text-sm" style={{ backgroundColor: "var(--code-bg)", fontFamily: "var(--code-font)", fontSize: "0.875em" }}>$1</code>`)
      // strikethrough
      .replace(/~~(.+?)~~/g, `<s>$1</s>`)
      // highlight/mark
      .replace(/==(.+?)==/g, `<mark style={{ backgroundColor: "var(--blockquote-bg)", padding: "0.125em 0.25em", borderRadius: "3px" }}>$1</mark>`);
  }

  function stripInline(text: string): string {
    return text.replace(/\*\*\*(.+?)\*\*\*/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/_(.+?)_/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/~~(.+?)~~/g, "$1").replace(/==(.+?)==/g, "$1");
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushParagraph();
        if (codeLang === "mermaid") {
          hasMermaid = true;
          const mermaidSrc = escapeForJSXContent(codeContent.join("\n"));
          elements.push(
            `<div className="my-8 flex justify-center">
              <div className="mermaid-diagram" data-diagram={\`${mermaidSrc}\`} style={{ minHeight: "100px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <p className="text-sm" style={{ color: "var(--muted-color)" }}>Loading diagram...</p>
              </div>
            </div>`
          );
        } else {
          if (codeLang) hasPrism = true;
          const escaped = escapeForJSXContent(codeContent.join("\n"));
          const langClass = codeLang ? ` language-${codeLang}` : "";
          elements.push(
            `<div className="my-8 rounded-lg overflow-hidden" style={{ backgroundColor: "var(--code-bg)", border: "1px solid var(--border-color)" }}>
              ${codeLang ? `<div className="px-4 py-2 text-xs uppercase tracking-wider" style={{ color: "var(--muted-color)", borderBottom: "1px solid var(--border-color)" }}>${codeLang}</div>` : ""}
              <pre className="p-5 overflow-x-auto${langClass}"><code className="${langClass}" style={{ fontFamily: "var(--code-font)", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text-color)" }}>{\`${escaped}\`}</code></pre>
            </div>`
          );
        }
        codeContent = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        flushBlockquote();
        flushTable();
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // table detection: line with pipes
    const tableRowMatch = line.match(/^\|(.+)\|$/);
    if (tableRowMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const cells = tableRowMatch[1].split("|").map((c) => c.trim());
      // separator row
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        tableAligns = cells.map((c) => {
          if (c.startsWith(":") && c.endsWith(":")) return "center";
          if (c.endsWith(":")) return "right";
          return "left";
        });
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // blockquotes
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      inBlockquote = true;
      blockquoteLines.push(line.slice(2));
      continue;
    } else if (inBlockquote && line.startsWith(">")) {
      blockquoteLines.push(line.slice(1).trim());
      continue;
    } else {
      flushBlockquote();
    }

    // headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const rawText = headingMatch[2];
      if (level === 1 && !skippedFirstH1 && skipTitle) {
        const normalized = stripInline(rawText).trim();
        if (normalized.toLowerCase() === skipTitle.toLowerCase()) {
          skippedFirstH1 = true;
          continue;
        }
      }
      const plainText = stripInline(rawText);
      const headingId = slugify(plainText);
      headings.push({ level, text: plainText, id: headingId });
      const text = inlineFormat(rawText);
      const styles: Record<number, string> = {
        1: `id="${headingId}" className="font-bold mb-6 mt-16 first:mt-0 leading-tight" style={{ fontFamily: "var(--heading-font)", fontSize: "clamp(2rem, 5vw, 2.75rem)", color: "var(--accent-color)", letterSpacing: "-0.02em" }}`,
        2: `id="${headingId}" className="font-semibold mb-5 mt-14 leading-snug" style={{ fontFamily: "var(--heading-font)", fontSize: "clamp(1.5rem, 3.5vw, 2rem)", color: "var(--accent-color)", letterSpacing: "-0.015em" }}`,
        3: `id="${headingId}" className="font-semibold mb-4 mt-10 leading-snug" style={{ fontFamily: "var(--heading-font)", fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", color: "var(--accent-color)", letterSpacing: "-0.01em" }}`,
        4: `id="${headingId}" className="font-medium mb-3 mt-8 uppercase tracking-wider" style={{ fontFamily: "var(--heading-font)", fontSize: "0.9rem", color: "var(--muted-color)" }}`,
        5: `id="${headingId}" className="font-medium mb-3 mt-6" style={{ fontFamily: "var(--heading-font)", fontSize: "0.85rem", color: "var(--muted-color)" }}`,
        6: `id="${headingId}" className="font-normal mb-2 mt-4 uppercase tracking-widest" style={{ fontFamily: "var(--heading-font)", fontSize: "0.75rem", color: "var(--muted-color)" }}`,
      };
      elements.push(`<h${level} ${styles[level]}>${text}</h${level}>`);
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph();
      flushList();
      elements.push(`<hr className="my-12 border-none h-px" style={{ backgroundColor: "var(--border-color)" }} />`);
      continue;
    }

    // unordered list
    const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (!inList || listType !== "ul") {
        flushList();
        inList = true;
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      continue;
    }

    // ordered list
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (!inList || listType !== "ol") {
        flushList();
        inList = true;
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      continue;
    }

    flushList();

    // blank line — flush paragraph buffer
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // accumulate paragraph lines (multi-line paragraph joining)
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();
  flushBlockquote();
  flushTable();

  return { html: elements.join("\n            "), hasMermaid, hasPrism, headings };
}

function generatePageCode(title: string, body: string, style: StylePreset, meta: Record<string, string>, accentOverride?: string): string {
  const effectiveStyle = accentOverride ? { ...style, linkColor: accentOverride, blockquoteBorder: accentOverride } : style;
  const { html: contentElements, hasMermaid, hasPrism, headings } = markdownToReactElements(body, title);
  const subtitle = meta.subtitle || meta.description || "";
  const date = meta.date || "";
  const author = meta.author || "";
  const wordCount = countWords(body);
  const readTime = readingTime(wordCount);

  // Generate TOC if there are 3+ headings
  const hasToc = headings.length >= 3;
  const tocHtml = hasToc
    ? headings
        .map((h) => {
          const indent = (h.level - 2) * 16;
          return `<a href="#${h.id}" style={{ display: "block", padding: "0.3rem 0", paddingLeft: "${indent}px", color: "var(--muted-color)", textDecoration: "none", fontSize: "${h.level <= 2 ? "0.875rem" : "0.8125rem"}", fontWeight: ${h.level <= 2 ? 500 : 400}, transition: "color 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--link-color)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted-color)"}>${escapeForJSX(h.text)}</a>`;
        })
        .join("\n                ")
    : "";

  const mermaidEffect = hasMermaid ? `
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/beautiful-mermaid/dist/beautiful-mermaid.browser.global.js";
    script.onload = async () => {
      const { renderMermaid } = (window as any).beautifulMermaid;
      const diagrams = document.querySelectorAll(".mermaid-diagram");
      for (const el of diagrams) {
        const src = el.getAttribute("data-diagram");
        if (!src) continue;
        try {
          const svg = await renderMermaid(src, {
            bg: "${effectiveStyle.bgColor}",
            fg: "${effectiveStyle.textColor}",
            accent: "${effectiveStyle.linkColor}",
            muted: "${effectiveStyle.mutedColor}",
            border: "${effectiveStyle.borderColor}",
            font: '${effectiveStyle.bodyFont.split(",")[0].replace(/'/g, "")}',
          });
          el.innerHTML = svg;
          const svgEl = el.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
        } catch (e) {
          el.innerHTML = '<pre style="color: var(--muted-color); font-size: 0.85rem;">' + src + '</pre>';
        }
      }
    };
    document.head.appendChild(script);
  }, []);` : "";

  const prismEffect = hasPrism ? `
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/prismjs@1/themes/prism${effectiveStyle.bgColor === "#111111" ? "-tomorrow" : ""}.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/prismjs@1/prism.min.js";
    script.onload = () => {
      const autoloader = document.createElement("script");
      autoloader.src = "https://unpkg.com/prismjs@1/plugins/autoloader/prism-autoloader.min.js";
      autoloader.onload = () => {
        if ((window as any).Prism) (window as any).Prism.highlightAll();
      };
      document.head.appendChild(autoloader);
    };
    document.head.appendChild(script);
  }, []);` : "";

  // OG meta tags
  const ogDescription = subtitle || `${body.replace(/[#*_~`>\-|\[\]()!]/g, "").slice(0, 150).trim()}...`;

  // Dark mode: compute inverted colors for light themes, or lighter variant for dark themes
  const isDark = effectiveStyle.bgColor === "#111111";
  const darkBg = isDark ? "#FAFAF7" : "#111111";
  const darkText = isDark ? "#2C2C2A" : "#E0E0E0";
  const darkAccent = isDark ? "#1A1A18" : "#FFFFFF";
  const darkMuted = isDark ? "#8A8A82" : "#777777";
  const darkSurface = isDark ? "#F0F0EB" : "#1A1A1A";
  const darkBorder = isDark ? "#E0E0D8" : "#333333";
  const darkCodeBg = isDark ? "#F0F0EB" : "#1A1A1A";
  const darkBlockquoteBorder = isDark ? "#C8B8A8" : "#444444";
  const darkBlockquoteBg = isDark ? "#F5F2ED" : "#1A1A1A";
  const darkLink = isDark ? "#5B4A3F" : "#80CBC4";

  return `import { useState, useEffect } from "react";

export default function PublishedPage() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
${mermaidEffect}
${prismEffect}

  return (
    <>
      <style>{\`
        @import url('${effectiveStyle.fontImport}');
        :root {
          --heading-font: ${effectiveStyle.headingFont};
          --body-font: ${effectiveStyle.bodyFont};
          --bg-color: ${effectiveStyle.bgColor};
          --text-color: ${effectiveStyle.textColor};
          --accent-color: ${effectiveStyle.accentColor};
          --muted-color: ${effectiveStyle.mutedColor};
          --surface-color: ${effectiveStyle.surfaceColor};
          --border-color: ${effectiveStyle.borderColor};
          --link-color: ${effectiveStyle.linkColor};
          --code-font: ${effectiveStyle.codeFont};
          --code-bg: ${effectiveStyle.codeBg};
          --blockquote-border: ${effectiveStyle.blockquoteBorder};
          --blockquote-bg: ${effectiveStyle.blockquoteBg};
        }
        .dark-mode {
          --bg-color: ${darkBg};
          --text-color: ${darkText};
          --accent-color: ${darkAccent};
          --muted-color: ${darkMuted};
          --surface-color: ${darkSurface};
          --border-color: ${darkBorder};
          --link-color: ${darkLink};
          --code-bg: ${darkCodeBg};
          --blockquote-border: ${darkBlockquoteBorder};
          --blockquote-bg: ${darkBlockquoteBg};
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        ::selection { background: ${effectiveStyle.accentColor}22; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          article { max-width: 100% !important; padding: 0 !important; }
          a { color: inherit !important; text-decoration: underline !important; }
          a::after { content: " (" attr(href) ")"; font-size: 0.8em; }
          pre { white-space: pre-wrap !important; word-break: break-all; }
        }
      \`}</style>

      <head>
        <meta property="og:title" content="${escapeForJSX(title)}" />
        <meta property="og:description" content="${escapeForJSX(ogDescription)}" />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="${escapeForJSX(title)}" />
        <meta name="twitter:description" content="${escapeForJSX(ogDescription)}" />
      </head>

      <div
        className={\`min-h-screen \${darkMode ? "dark-mode" : ""}\`}
        style={{
          backgroundColor: "var(--bg-color)",
          fontFamily: "var(--body-font)",
          color: "var(--text-color)",
          transition: "background-color 0.3s, color 0.3s",
        }}
      >
        {/* Reading progress bar */}
        <div
          className="no-print"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: \`\${progress}%\`,
            height: "2px",
            backgroundColor: "var(--link-color)",
            zIndex: 100,
            transition: "width 0.1s linear",
          }}
        />

        {/* Header */}
        <header
          className="pt-8 pb-4 px-6 no-print"
          style={{
            maxWidth: "${effectiveStyle.maxWidth}",
            margin: "0 auto",
            animation: mounted ? "fadeUp 0.6s ease-out both" : "none",
          }}
        >
          <nav className="flex items-center justify-between mb-16">
            <a
              href="/"
              className="text-sm tracking-wider uppercase no-underline transition-opacity hover:opacity-60"
              style={{ color: "var(--muted-color)", fontFamily: "var(--heading-font)", letterSpacing: "0.1em", fontWeight: 500, textDecoration: "none" }}
            >
              Home
            </a>
            <div className="flex items-center gap-3">
              ${hasToc ? `<button
                onClick={() => setShowToc(!showToc)}
                className="text-sm transition-opacity hover:opacity-60"
                style={{ color: "var(--muted-color)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--body-font)", padding: "0.25rem 0.5rem" }}
              >
                Contents
              </button>` : ""}
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "0.25rem", lineHeight: 1 }}
                aria-label="Toggle dark mode"
              >
                {darkMode ? "\u2600\uFE0F" : "\uD83C\uDF19"}
              </button>
            </div>
          </nav>
        </header>

        ${hasToc ? `{/* Table of Contents Dropdown */}
        {showToc && (
          <div
            className="no-print"
            style={{
              maxWidth: "${effectiveStyle.maxWidth}",
              margin: "0 auto -2rem",
              padding: "0 1.5rem 2rem",
            }}
          >
            <div style={{ backgroundColor: "var(--surface-color)", borderRadius: "8px", padding: "1.25rem 1.5rem", border: "1px solid var(--border-color)" }}>
              <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-color)", marginBottom: "0.75rem", fontWeight: 600 }}>On this page</p>
              <nav style={{ display: "flex", flexDirection: "column" }}>
                ${tocHtml}
              </nav>
            </div>
          </div>
        )}` : ""}

        {/* Hero */}
        <div
          style={{
            maxWidth: "${effectiveStyle.maxWidth}",
            margin: "0 auto",
            padding: "0 1.5rem",
            animation: mounted ? "fadeUp 0.6s ease-out 0.1s both" : "none",
          }}
        >
          <h1
            className="font-bold leading-tight"
            style={{
              fontFamily: "var(--heading-font)",
              fontSize: "clamp(2.25rem, 6vw, 3.25rem)",
              color: "var(--accent-color)",
              letterSpacing: "-0.025em",
              marginBottom: "${subtitle ? "1rem" : "1.5rem"}",
              lineHeight: 1.15,
            }}
          >
            ${escapeForJSX(title)}
          </h1>
          ${subtitle ? `<p className="text-lg mb-6" style={{ color: "var(--muted-color)", fontSize: "1.2rem", lineHeight: 1.5, fontFamily: "var(--body-font)" }}>${escapeForJSX(subtitle)}</p>` : ""}
          <div className="flex items-center gap-3 mb-8 text-sm" style={{ color: "var(--muted-color)" }}>
            ${author ? `<span>${escapeForJSX(author)}</span>` : ""}
            ${date && author ? `<span style={{ opacity: 0.4 }}>&middot;</span>` : ""}
            ${date ? `<time>${escapeForJSX(date)}</time>` : ""}
            ${(date || author) ? `<span style={{ opacity: 0.4 }}>&middot;</span>` : ""}
            <span>${readTime}</span>
          </div>
          <hr className="mb-12 border-none h-px" style={{ backgroundColor: "var(--border-color)" }} />
        </div>

        {/* Content */}
        <article
          style={{
            maxWidth: "${effectiveStyle.maxWidth}",
            margin: "0 auto",
            padding: "0 1.5rem 6rem",
            animation: mounted ? "fadeUp 0.6s ease-out 0.2s both" : "none",
          }}
        >
            ${contentElements}
        </article>

        {/* Footer */}
        <footer
          className="py-12 px-6 text-center"
          style={{
            borderTop: "1px solid var(--border-color)",
            maxWidth: "${effectiveStyle.maxWidth}",
            margin: "0 auto",
          }}
        >
          <p className="text-xs tracking-wider uppercase" style={{ color: "var(--muted-color)", letterSpacing: "0.15em" }}>
            Published on Zo
          </p>
        </footer>
      </div>
    </>
  );
}`;
}

// --- CLI ---

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    path: { type: "string" },
    title: { type: "string" },
    style: { type: "string", default: "editorial" },
    accent: { type: "string" },
    private: { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    unpublish: { type: "string" },
    help: { type: "boolean", default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
publish.ts — Publish markdown files as beautiful zo.space pages

USAGE:
  bun run Skills/publish-page/scripts/publish.ts <markdown-file> [options]

OPTIONS:
  --path <route>     Custom route path (default: derived from filename)
  --title <title>    Override the page title
  --style <style>    Style preset (see below)
  --accent <hex>     Custom accent/link color (e.g. #FF5733)
  --private          Make the page private (default: public)
  --list             List all published pages
  --unpublish <path> Remove a published page
  --help             Show this help

STYLES:
  editorial      Serif typography, warm off-white, magazine feel (default)
  minimal        Clean sans-serif, white background, Swiss design
  warm           Serif headings + sans body, cream tones, cozy
  mono           Monospace headings, dark background, techy
  precision      System UI, cool slate, borders-only, technical
  bold           Space Grotesk, high contrast, red accents, dramatic
  sophisticated  DM Serif Display + DM Sans, indigo accents, premium

EXAMPLES:
  bun run Skills/publish-page/scripts/publish.ts Documents/my-essay.md
  bun run Skills/publish-page/scripts/publish.ts Documents/my-essay.md --style bold
  bun run Skills/publish-page/scripts/publish.ts Documents/my-essay.md --accent "#2563eb"
  bun run Skills/publish-page/scripts/publish.ts Documents/my-essay.md --path /notes/essay
  bun run Skills/publish-page/scripts/publish.ts --list
  bun run Skills/publish-page/scripts/publish.ts --unpublish /my-essay
  `);
  process.exit(0);
}

if (values.list) {
  console.log("LIST_PAGES");
  process.exit(0);
}

if (values.unpublish) {
  console.log(`UNPUBLISH:${values.unpublish}`);
  process.exit(0);
}

const filePath = positionals[0];
if (!filePath) {
  console.error("Error: No markdown file specified. Use --help for usage.");
  process.exit(1);
}

const fullPath = filePath.startsWith("/") ? filePath : `/home/workspace/${filePath}`;
if (!existsSync(fullPath)) {
  console.error(`Error: File not found: ${fullPath}`);
  process.exit(1);
}

const rawContent = readFileSync(fullPath, "utf-8");
const { meta, body } = extractFrontmatter(rawContent);

const styleName = (values.style || "editorial") as string;
const style = STYLES[styleName];
if (!style) {
  console.error(`Error: Unknown style "${styleName}". Available: ${Object.keys(STYLES).join(", ")}`);
  process.exit(1);
}

const filename = fullPath.split("/").pop()!.replace(/\.md$/, "");
const title = values.title || meta.title || filename.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const routePath = values.path || `/${slugify(title)}`;
const isPublic = !values.private;

const pageCode = generatePageCode(title, body, style, meta, values.accent);

// Output the generated code and metadata as JSON for the skill to use
const output = {
  routePath,
  title,
  style: styleName,
  public: isPublic,
  code: pageCode,
};

console.log("PUBLISH_OUTPUT:" + JSON.stringify(output));
