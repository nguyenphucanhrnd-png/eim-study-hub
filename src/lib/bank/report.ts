import type { MCQ } from "@/schemas/mcq";
import type { Exam } from "@/schemas/exam";
import { BLUEPRINT, DIFFICULTIES, EXAM_COUNT, bankTargets, groupOf, topicCapPerExam } from "@/config/blueprint";
import { CHAPTERS } from "@/config/chapters";
import { letterDistribution } from "./buildExams";

/** Render a plain-text table with padded columns. */
export function table(head: string[], rows: (string | number)[][]): string {
  const all = [head, ...rows.map((r) => r.map(String))];
  const widths = head.map((_, i) => Math.max(...all.map((r) => (r[i] ?? "").length)));
  const line = (r: string[]) => "| " + r.map((c, i) => c.padEnd(widths[i]!)).join(" | ") + " |";
  const sep = "|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|";
  return [line(head), sep, ...all.slice(1).map(line)].join("\n");
}

export function bankReport(questions: MCQ[], exams: Exam[] = [], examCount = EXAM_COUNT): string {
  const out: string[] = [];
  const targets = bankTargets(examCount);

  out.push(`## Bank: ${questions.length} questions (target ${BLUEPRINT.reduce((s, g) => s + g.perExam, 0) * examCount})\n`);
  const rows = BLUEPRINT.map((g) => {
    const inG = questions.filter((q) => groupOf(q.chapter, q.topic).id === g.id);
    const cells = DIFFICULTIES.map((d) => `${inG.filter((q) => q.difficulty === d).length}/${targets[g.id]![d]}`);
    const total = g.perExam * examCount;
    return [g.label, ...cells, `${inG.length}/${total}`, inG.length === total ? "✓" : "…"];
  });
  out.push(table(["Group", "D1 easy", "D2 medium", "D3 hard", "Total", ""], rows));

  out.push("\n## Topics per chapter\n");
  for (const ch of CHAPTERS) {
    const inC = questions.filter((q) => q.chapter === ch.id);
    if (inC.length === 0) continue;
    const trows = ch.topics.map((tp) => {
      const qs = inC.filter((q) => q.topic === tp.id);
      const g = groupOf(ch.id, tp.id);
      return [tp.id, ...DIFFICULTIES.map((d) => qs.filter((q) => q.difficulty === d).length), qs.length, `≤${topicCapPerExam(g) * examCount}`];
    });
    out.push(`### ${ch.id} ${ch.titleEn} (${inC.length})`);
    out.push(table(["Topic", "D1", "D2", "D3", "Total", "Cap"], trows));
    out.push("");
  }

  const tagged = (prefix: string) => questions.filter((q) => q.tags.some((t) => t.startsWith(prefix))).length;
  out.push(
    `Calculation: ${tagged("calculation")} · extNote: ${questions.filter((q) => q.explanation.extNote).length} · ` +
      `errata-tagged: ${tagged("errata-")} · lockOrder: ${questions.filter((q) => q.lockOrder).length} · ` +
      `NOT/EXCEPT stems: ${questions.filter((q) => /\b(NOT|EXCEPT)\b/.test(q.stem)).length}`,
  );

  if (exams.length > 0) {
    const byId = new Map(questions.map((q) => [q.id, q]));
    out.push("\n## Exams — difficulty mix & correct-letter distribution\n");
    const erows = exams.map((ex) => {
      const qs = ex.questionIds.map((id) => byId.get(id)).filter((q): q is MCQ => !!q);
      const dist = letterDistribution(ex, byId);
      const pct = (n: number) => `${n} (${Math.round((n / qs.length) * 100)}%)`;
      const okLetters = Object.values(dist).every((n) => n / qs.length >= 0.2 && n / qs.length <= 0.3);
      return [
        ex.id,
        qs.length,
        DIFFICULTIES.map((d) => qs.filter((q) => q.difficulty === d).length).join("/"),
        pct(dist.A),
        pct(dist.B),
        pct(dist.C),
        pct(dist.D),
        okLetters ? "✓" : "✗",
      ];
    });
    out.push(table(["Exam", "N", "D1/D2/D3", "A", "B", "C", "D", "20–30%"], erows));
  }
  return out.join("\n");
}
