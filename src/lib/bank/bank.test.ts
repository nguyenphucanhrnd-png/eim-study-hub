import { BLUEPRINT, EXAM_COUNT, groupOf, topicCapPerExam, bankTargets } from "@/config/blueprint";
import type { MCQ } from "@/schemas/mcq";
import { buildExams, letterDistribution } from "./buildExams";
import { makeFixtureBank } from "./fixture";
import { validateBank } from "./validate";

const bank = makeFixtureBank(7);
const byId = new Map(bank.map((q) => [q.id, q]));

describe("blueprint targets", () => {
  it("sum to 240/240/120 across groups", () => {
    const t = Object.values(bankTargets());
    expect(t.reduce((s, x) => s + x[1], 0)).toBe(240);
    expect(t.reduce((s, x) => s + x[2], 0)).toBe(240);
    expect(t.reduce((s, x) => s + x[3], 0)).toBe(120);
  });
});

describe("validateBank", () => {
  const file = (content: unknown) => [{ path: "src/data/questions/c05.json", content }];
  const base = bank.find((q) => q.chapter === "C5")!;

  it("accepts the full fixture bank with no errors", () => {
    const files = [1, 2, 3, 4, 5, 6, 7, 8].map((c) => ({
      path: `x/c0${c}.json`,
      content: bank.filter((q) => q.chapter === `C${c}`),
    }));
    expect(validateBank(files).errors).toEqual([]);
  });

  it("flags a missing whyWrong, duplicate id and (N) erratum", () => {
    const { whyWrong } = base.explanation;
    const missing = Object.keys(whyWrong)[0] as keyof typeof whyWrong;
    const broken: MCQ = { ...base, explanation: { ...base.explanation, whyWrong: { ...whyWrong, [missing]: undefined } } };
    const errata: MCQ = { ...base, tags: ["errata-E04"] };
    const msgs = validateBank(file([broken, base, errata]), { completeChapters: [] }).errors.map((e) => e.message);
    expect(msgs.some((m) => m.includes("missing whyWrong"))).toBe(true);
    expect(msgs).toContain("duplicate id");
    expect(msgs.some((m) => m.includes("(N) erratum E04"))).toBe(true);
  });

  it("requires extNote for (T) errata that carry one", () => {
    const q: MCQ = { ...base, tags: ["errata-E06"] };
    const msgs = validateBank(file([q]), { completeChapters: [] }).errors.map((e) => e.message);
    expect(msgs.some((m) => m.includes("requires an extNote"))).toBe(true);
  });

  it("re-computes calculation questions", () => {
    const q: MCQ = {
      ...base,
      tags: ["calculation"],
      options: [
        { id: "a", text: "VND 100 million gain" },
        { id: "b", text: "VND 100 million loss" },
        { id: "c", text: "VND 200 million loss" },
        { id: "d", text: "No change" },
      ],
      correct: "b",
      explanation: { ...base.explanation, whyWrong: { a: "x", c: "x", d: "x" } },
      calc: { kind: "fx-gain-loss", inputs: { amount: 50000, rateAtContract: 30000, rateAtPayment: 28000 }, expected: -200_000_000 },
    };
    const msgs = validateBank(file([q]), { completeChapters: [] }).errors.map((e) => e.message);
    expect(msgs.some((m) => m.includes("≠ expected"))).toBe(true);
  });

  it("reports blueprint mismatches as errors only for complete chapters", () => {
    const res = validateBank(file([base]), { completeChapters: ["C5"] });
    expect(res.errors.some((e) => e.where === "blueprint C5")).toBe(true);
    expect(res.errors.some((e) => e.where === "blueprint C1")).toBe(false);
    expect(res.warnings.some((e) => e.where === "blueprint C1")).toBe(true);
  });
});

describe("buildExams", () => {
  const { exams, warnings } = buildExams(bank, { seed: 42 });

  it("builds EXAM_COUNT exams of 50 with no overlap that cover the whole bank", () => {
    expect(exams).toHaveLength(EXAM_COUNT);
    const all = exams.flatMap((e) => e.questionIds);
    expect(exams.every((e) => e.questionIds.length === 50)).toBe(true);
    expect(new Set(all).size).toBe(bank.length);
    expect(warnings).toEqual([]);
  });

  it("follows the blueprint per exam: group quotas, 20/20/10, topic caps", () => {
    for (const ex of exams) {
      const qs = ex.questionIds.map((id) => byId.get(id)!);
      expect([1, 2, 3].map((d) => qs.filter((q) => q.difficulty === d).length)).toEqual([20, 20, 10]);
      for (const g of BLUEPRINT) {
        const inG = qs.filter((q) => groupOf(q.chapter, q.topic).id === g.id);
        expect(inG).toHaveLength(g.perExam);
        const counts = new Map<string, number>();
        for (const q of inG) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
        expect(Math.max(...counts.values())).toBeLessThanOrEqual(topicCapPerExam(g));
      }
    }
  });

  it("keeps each correct letter between 20% and 30% per exam", () => {
    for (const ex of exams) {
      for (const n of Object.values(letterDistribution(ex, byId))) {
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(15);
      }
    }
  });

  it("is reproducible for a given seed", () => {
    expect(buildExams(bank, { seed: 42 }).exams).toEqual(exams);
  });
});
