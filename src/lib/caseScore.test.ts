import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CasesFileSchema } from "@/schemas/case";
import { caseScore } from "./caseScore";
import { validateCases } from "./bank/validateCases";

const cases = CasesFileSchema.parse(JSON.parse(readFileSync(join(process.cwd(), "src", "data", "cases", "cases.json"), "utf8")));

describe("cases.json", () => {
  it("is valid, with unique ids that match their first chapter", () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    for (const c of cases) expect(c.id.startsWith(`CASE-${c.chapters[0]}-`)).toBe(true);
  });
  it("every case has ≥3 tasks and ≥3 common mistakes", () => {
    for (const c of cases) {
      expect(c.tasks.length).toBeGreaterThanOrEqual(3);
      expect(c.commonMistakes.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("caseScore", () => {
  const c = cases[0]!;
  it("is 0 with nothing ticked and 10 with every criterion ticked", () => {
    expect(caseScore(c, {}).total).toBe(0);
    const all = Object.fromEntries(c.rubric.map((r) => [r.taskId, r.criteria.map((_, i) => i)]));
    expect(caseScore(c, all).total).toBe(10);
  });
  it("adds the points of ticked criteria per task", () => {
    const r = c.rubric[0]!;
    const res = caseScore(c, { [r.taskId]: [0] });
    expect(res.perTask[r.taskId]).toBe(r.criteria[0]!.points);
    expect(res.total).toBe(r.criteria[0]!.points);
  });
});

describe("validateCases", () => {
  it("passes the real file with targets enforced", () => {
    const res = validateCases(cases, { enforceTargets: true });
    expect(res.errors).toEqual([]);
  });
  it("flags bad ids, unknown task refs and missing targets", () => {
    const bad = structuredClone(cases.slice(0, 1));
    bad[0]!.id = "CASE-C9-01";
    const res = validateCases(bad, { enforceTargets: true });
    expect(res.errors.length).toBeGreaterThan(0);
    const wrongPrefix = structuredClone(cases.slice(0, 1));
    wrongPrefix[0]!.chapters = ["C2"];
    expect(validateCases(wrongPrefix, { enforceTargets: false }).errors.map((e) => e.message).join()).toMatch(/prefix/);
    expect(validateCases(cases.slice(0, 1), { enforceTargets: false }).warnings.length).toBeGreaterThan(0);
  });
});
