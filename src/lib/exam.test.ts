import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BLUEPRINT, EXAM_COUNT, EXAM_SIZE, groupOf, topicCapPerExam } from "@/config/blueprint";
import { CHAPTERS } from "@/config/chapters";
import { McqFileSchema, type MCQ } from "@/schemas/mcq";
import { ExamsFileSchema } from "@/schemas/exam";
import { buildRandomExam, formatClock, formatDurationVi, randomExamQuotas, remainingSeconds, scoreAttempt } from "./exam";

const dataDir = join(process.cwd(), "src", "data");
const bank: MCQ[] = CHAPTERS.flatMap((c) =>
  McqFileSchema.parse(JSON.parse(readFileSync(join(dataDir, "questions", `c0${c.id.slice(1)}.json`), "utf8"))),
);
const byId = new Map(bank.map((q) => [q.id, q]));

describe("scoreAttempt", () => {
  const qs = bank.slice(0, 4);
  const [q0, q1, q2, q3] = qs as [MCQ, MCQ, MCQ, MCQ];
  const wrongOf = (q: MCQ) => (q.correct === "a" ? "b" : "a");

  it("counts correct, wrong and unanswered", () => {
    const s = scoreAttempt(qs, { [q0.id]: q0.correct, [q1.id]: q1.correct, [q2.id]: wrongOf(q2) });
    expect(s.correct).toBe(2);
    expect(s.answered).toBe(3);
    expect(s.total).toBe(4);
    expect(s.score10).toBe(5);
    expect(s.pct).toBe(50);
    expect(s.wrongIds).toEqual([q2.id]);
    expect(s.unansweredIds).toEqual([q3.id]);
  });

  it("breaks down by chapter and difficulty with consistent totals", () => {
    const sample = bank.filter((_, i) => i % 12 === 0).slice(0, 50);
    const answers = Object.fromEntries(sample.map((q, i) => [q.id, i % 3 ? q.correct : wrongOf(q)]));
    const s = scoreAttempt(sample, answers);
    expect(s.byChapter.reduce((a, t) => a + t.total, 0)).toBe(50);
    expect(s.byChapter.reduce((a, t) => a + t.correct, 0)).toBe(s.correct);
    expect(s.byDifficulty.reduce((a, t) => a + t.total, 0)).toBe(50);
  });

  it("gives 10 for a perfect exam and 0 for an empty one", () => {
    expect(scoreAttempt(qs, Object.fromEntries(qs.map((q) => [q.id, q.correct]))).score10).toBe(10);
    expect(scoreAttempt(qs, {}).score10).toBe(0);
  });
});

describe("random exam", () => {
  it("quotas sum to the blueprint and to 20/20/10", () => {
    const quotas = randomExamQuotas();
    const sum = { 1: 0, 2: 0, 3: 0 };
    for (const g of BLUEPRINT) {
      const q = quotas[g.id]!;
      expect(q[1] + q[2] + q[3]).toBe(g.perExam);
      expect(Math.min(q[1], q[2], q[3])).toBeGreaterThanOrEqual(0);
      sum[1] += q[1];
      sum[2] += q[2];
      sum[3] += q[3];
    }
    expect(sum).toEqual({ 1: 20, 2: 20, 3: 10 });
  });

  it.each([1, 42, 20260101, 987654])("seed %i: 50 unique questions per blueprint, balanced letters", (seed) => {
    const exam = buildRandomExam(bank, seed);
    expect(exam.questionIds).toHaveLength(EXAM_SIZE);
    expect(new Set(exam.questionIds).size).toBe(EXAM_SIZE);
    const qs = exam.questionIds.map((id) => byId.get(id)!);
    const quotas = randomExamQuotas();
    for (const g of BLUEPRINT) {
      const inGroup = qs.filter((q) => groupOf(q.chapter, q.topic).id === g.id);
      expect(inGroup).toHaveLength(g.perExam);
      for (const d of [1, 2, 3] as const) expect(inGroup.filter((q) => q.difficulty === d)).toHaveLength(quotas[g.id]![d]);
      const perTopic = new Map<string, number>();
      for (const q of inGroup) perTopic.set(q.topic, (perTopic.get(q.topic) ?? 0) + 1);
      expect(Math.max(...perTopic.values())).toBeLessThanOrEqual(topicCapPerExam(g));
    }
    const letters = [0, 0, 0, 0];
    for (const q of qs) letters[exam.optionOrder![q.id]!.indexOf(q.correct)]!++;
    expect(Math.max(...letters) - Math.min(...letters)).toBeLessThanOrEqual(1);
  });

  it("is deterministic for a seed", () => {
    expect(buildRandomExam(bank, 7)).toEqual(buildRandomExam(bank, 7));
    expect(buildRandomExam(bank, 7).questionIds).not.toEqual(buildRandomExam(bank, 8).questionIds);
  });
});

describe("exams.json", () => {
  const file = ExamsFileSchema.parse(JSON.parse(readFileSync(join(dataDir, "exams", "exams.json"), "utf8")));

  it(`has ${EXAM_COUNT} exams of ${EXAM_SIZE} questions, each question in exactly one exam`, () => {
    expect(file.exams).toHaveLength(EXAM_COUNT);
    const all = file.exams.flatMap((e) => e.questionIds);
    for (const e of file.exams) expect(e.questionIds).toHaveLength(EXAM_SIZE);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(bank.length);
    for (const id of all) expect(byId.has(id)).toBe(true);
  });

  it("option orders are permutations of a–d", () => {
    for (const e of file.exams)
      for (const id of e.questionIds) expect([...(e.optionOrder?.[id] ?? [])].sort()).toEqual(["a", "b", "c", "d"]);
  });
});

describe("timer helpers", () => {
  it("computes remaining seconds from wall clock", () => {
    expect(remainingSeconds(0, 3600, 0)).toBe(3600);
    expect(remainingSeconds(0, 3600, 1500)).toBe(3599);
    expect(remainingSeconds(0, 60, 61_000)).toBe(0);
  });
  it("formats clocks and durations", () => {
    expect(formatClock(3600)).toBe("60:00");
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(59 * 60 + 5)).toBe("59:05");
    expect(formatDurationVi(42 * 60 + 5)).toBe("42 phút 5 giây");
    expect(formatDurationVi(45)).toBe("45 giây");
    expect(formatDurationVi(120)).toBe("2 phút");
  });
});
