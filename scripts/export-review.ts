/**
 * npm run review:bank [-- --chapters C3,C5] [-- --sample 10] [-- --seed 1] [-- --out review/name.md]
 * Renders questions as readable Markdown (explanation layout per PROMPT §5.3) for human review.
 * --sample N picks N random questions (seeded) — used for the 10% self-review after each chapter.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { validateBank } from "../src/lib/bank/validate.ts";
import { createRng, shuffle } from "../src/lib/rng.ts";
import { topicLabel } from "../src/config/chapters.ts";
import type { MCQ } from "../src/schemas/mcq.ts";
import { DEFAULT_BANK_DIR, ROOT, parseArgs, readBank } from "./lib/io.ts";

const args = parseArgs(process.argv.slice(2));
const { questions } = validateBank(readBank(DEFAULT_BANK_DIR), { completeChapters: [] });

let qs: MCQ[] = questions;
if (typeof args.chapters === "string") {
  const set = new Set(args.chapters.toUpperCase().split(","));
  qs = qs.filter((q) => set.has(q.chapter));
}
if (typeof args.sample === "string") qs = shuffle(qs, createRng(Number(args.seed ?? 1))).slice(0, Number(args.sample));

const L = ["A", "B", "C", "D"] as const;
const render = (q: MCQ, n: number) => {
  const letter = (id: string) => L[q.options.findIndex((o) => o.id === id)];
  const ex = q.explanation;
  return [
    `### ${n}. \`${q.id}\` · ${q.chapter} · ${topicLabel(q.chapter, q.topic)} · độ khó ${q.difficulty} (${q.cognitive})${q.tags.length ? ` · tags: ${q.tags.join(", ")}` : ""}`,
    "",
    `**${q.stem}**`,
    "",
    ...q.options.map((o, i) => `- ${L[i]}. ${o.text}${o.id === q.correct ? "  ✅" : ""}`),
    "",
    `✔ **Đáp án đúng: ${letter(q.correct)}**`,
    `**Tóm tắt:** ${ex.summary}`,
    "",
    `**Vì sao đúng:** ${ex.whyCorrect}`,
    "",
    "**Vì sao các phương án khác sai:**",
    ...q.options.filter((o) => o.id !== q.correct).map((o) => `- ${letter(o.id)}: ${ex.whyWrong[o.id]}`),
    ...(ex.trap ? ["", `⚠ **Bẫy thường gặp:** ${ex.trap}`] : []),
    "",
    `📘 **Nguồn:** ${ex.source}`,
    ...(ex.extNote ? ["", `➕ **Lưu ý mở rộng:** ${ex.extNote}`] : []),
    ...(q.calc ? ["", `🧮 calc: \`${q.calc.kind}\` ${JSON.stringify(q.calc.inputs)} → ${q.calc.expected}`] : []),
    "",
    "---",
    "",
  ].join("\n");
};

const out = join(ROOT, typeof args.out === "string" ? args.out : "review/review.md");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `# Review – ${qs.length} câu hỏi\n\n` + qs.map((q, i) => render(q, i + 1)).join(""));
console.log(`Wrote ${qs.length} question(s) to ${relative(ROOT, out)}`);
