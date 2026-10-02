import type { CalloutKind } from "@/components/ui/Callout";

/**
 * Theory markdown conventions (src/content/theory/cXX.md):
 *   ## Section title {#section-id}     → a TOC section with a "mark as learned" button
 *   > [!EXT] Optional title            → callout block (EXT | TRAP | ERRATA | NOTE | TAKEAWAYS)
 *   > content…
 *   ::embed[component-name]            → interactive tool or visual summary
 * Everything before the first "##" is the intro (key takeaways).
 */
export type Block =
  | { type: "md"; text: string }
  | { type: "callout"; kind: CalloutKind; title?: string; text: string }
  | { type: "embed"; name: string };

export interface TheorySection {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Theory {
  intro: Block[];
  sections: TheorySection[];
}

const CALLOUT_RE = /^>\s*\[!(EXT|TRAP|ERRATA|NOTE|TAKEAWAYS)\]\s*(.*)$/;
const EMBED_RE = /^::embed\[([a-z0-9-:]+)\]\s*$/;
const HEADING_RE = /^##\s+(.+?)\s*\{#([a-z0-9-]+)\}\s*$/;

export function parseBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let md: string[] = [];
  const flush = () => {
    const t = md.join("\n").trim();
    if (t) blocks.push({ type: "md", text: t });
    md = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const callout = CALLOUT_RE.exec(line);
    const embed = EMBED_RE.exec(line);
    if (callout) {
      flush();
      const body: string[] = [];
      while (i + 1 < lines.length && /^>/.test(lines[i + 1]!)) body.push(lines[++i]!.replace(/^>\s?/, ""));
      blocks.push({
        type: "callout",
        kind: callout[1]!.toLowerCase() as CalloutKind,
        title: callout[2] || undefined,
        text: body.join("\n").trim(),
      });
    } else if (embed) {
      flush();
      blocks.push({ type: "embed", name: embed[1]! });
    } else md.push(line);
  }
  flush();
  return blocks;
}

export function parseTheory(source: string): Theory {
  const lines = source.split(/\r?\n/);
  const intro: string[] = [];
  const sections: { id: string; title: string; lines: string[] }[] = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      const m = HEADING_RE.exec(line);
      if (!m) throw new Error(`Theory heading needs an id, e.g. "## Title {#my-id}": ${line}`);
      sections.push({ title: m[1]!, id: m[2]!, lines: [] });
    } else if (sections.length) sections[sections.length - 1]!.lines.push(line);
    else if (!line.startsWith("# ")) intro.push(line); // the H1 comes from the page header
  }
  const ids = new Set<string>();
  for (const s of sections) {
    if (ids.has(s.id)) throw new Error(`Duplicate theory section id: ${s.id}`);
    ids.add(s.id);
  }
  return {
    intro: parseBlocks(intro.join("\n")),
    sections: sections.map((s) => ({ id: s.id, title: s.title, blocks: parseBlocks(s.lines.join("\n")) })),
  };
}
