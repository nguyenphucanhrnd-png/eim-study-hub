import { CHAPTER_IDS, type ChapterId } from "@/config/chapters";
import { CasesFileSchema, type CaseStudy } from "@/schemas/case";

/** Minimum number of cases per chapter (by the case's first chapter) — PROMPT §6.4. */
export const CASE_TARGETS: Record<ChapterId, number> = { C1: 2, C2: 4, C3: 8, C4: 5, C5: 8, C6: 5, C7: 4, C8: 2 };
/** Minimum number of integrated cases (≥3 chapters). */
export const MIN_INTEGRATED_CASES = 6;

export interface CaseIssue {
  where: string;
  message: string;
}

export function validateCases(content: unknown, opts: { enforceTargets: boolean }): { cases: CaseStudy[]; errors: CaseIssue[]; warnings: CaseIssue[] } {
  const errors: CaseIssue[] = [];
  const warnings: CaseIssue[] = [];
  const parsed = CasesFileSchema.safeParse(content);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push({ where: `cases.json ${i.path.join(".")}`, message: i.message });
    return { cases: [], errors, warnings };
  }
  const cases = parsed.data;
  const seen = new Set<string>();
  for (const c of cases) {
    if (seen.has(c.id)) errors.push({ where: c.id, message: "duplicate case id" });
    seen.add(c.id);
    if (!c.id.startsWith(`CASE-${c.chapters[0]}-`)) errors.push({ where: c.id, message: `id prefix must match first chapter ${c.chapters[0]}` });
    const taskIds = new Set(c.tasks.map((t) => t.id));
    for (const m of c.modelAnswers) if (!taskIds.has(m.taskId)) errors.push({ where: c.id, message: `model answer for unknown task ${m.taskId}` });
    for (const r of c.rubric) if (!taskIds.has(r.taskId)) errors.push({ where: c.id, message: `rubric for unknown task ${r.taskId}` });
  }
  const report = (issue: CaseIssue) => (opts.enforceTargets ? errors : warnings).push(issue);
  for (const ch of CHAPTER_IDS) {
    const n = cases.filter((c) => c.chapters[0] === ch).length;
    if (n < CASE_TARGETS[ch]) report({ where: `cases ${ch}`, message: `${n} case(s), target ≥ ${CASE_TARGETS[ch]}` });
  }
  const integrated = cases.filter((c) => c.chapters.length >= 3).length;
  if (integrated < MIN_INTEGRATED_CASES) report({ where: "cases", message: `${integrated} integrated case(s), target ≥ ${MIN_INTEGRATED_CASES}` });
  return { cases, errors, warnings };
}
