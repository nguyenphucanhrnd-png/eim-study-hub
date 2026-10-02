import type { CaseStudy } from "@/schemas/case";

/** Ticked rubric criteria per task: taskId → criterion indices. */
export type RubricChecks = Record<string, number[]>;

/** Self-graded score from the ticked rubric criteria (each task's total is capped at its points). */
export function caseScore(c: CaseStudy, checks: RubricChecks): { total: number; perTask: Record<string, number> } {
  const perTask: Record<string, number> = {};
  for (const task of c.tasks) {
    const crit = c.rubric.find((r) => r.taskId === task.id)?.criteria ?? [];
    const got = (checks[task.id] ?? []).reduce((s, i) => s + (crit[i]?.points ?? 0), 0);
    perTask[task.id] = Math.min(task.points, Math.round(got * 100) / 100);
  }
  const total = Object.values(perTask).reduce((a, b) => a + b, 0);
  return { total: Math.round(total * 100) / 100, perTask };
}
