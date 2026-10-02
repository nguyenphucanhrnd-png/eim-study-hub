/** Pure mock-exam logic: scoring and the blueprint-based random exam (kept out of React for testing). */
import { BLUEPRINT, DIFFICULTIES, EXAM_DIFFICULTY_MIX, EXAM_DURATION_MIN, groupOf, topicCapPerExam, type Difficulty } from "@/config/blueprint";
import { CHAPTER_BY_ID, CHAPTERS, type ChapterId } from "@/config/chapters";
import { OPTION_IDS } from "@/schemas/constants";
import type { MCQ, OptionId } from "@/schemas/mcq";
import type { Exam } from "@/schemas/exam";
import { balanceOptionOrder } from "@/lib/bank/buildExams";
import { createRng, shuffle } from "@/lib/rng";

export const RANDOM_EXAM_ID = "random";

export interface Tally {
  correct: number;
  total: number;
}

export interface ExamScore {
  correct: number;
  answered: number;
  total: number;
  /** Score on a 10-point scale, one decimal. */
  score10: number;
  pct: number;
  byChapter: (Tally & { chapter: ChapterId })[];
  byDifficulty: (Tally & { difficulty: Difficulty })[];
  wrongIds: string[];
  unansweredIds: string[];
}

/** Score an attempt; unanswered questions count as wrong. Questions are given in exam order. */
export function scoreAttempt(questions: MCQ[], answers: Record<string, OptionId>): ExamScore {
  const chapter = new Map<ChapterId, Tally>();
  const difficulty = new Map<Difficulty, Tally>();
  const wrongIds: string[] = [];
  const unansweredIds: string[] = [];
  let correct = 0;

  for (const q of questions) {
    const a = answers[q.id];
    const ok = a === q.correct;
    if (ok) correct++;
    else if (a === undefined) unansweredIds.push(q.id);
    else wrongIds.push(q.id);
    for (const [map, key] of [
      [chapter, q.chapter],
      [difficulty, q.difficulty],
    ] as [Map<unknown, Tally>, unknown][]) {
      const t = map.get(key) ?? { correct: 0, total: 0 };
      map.set(key, { correct: t.correct + (ok ? 1 : 0), total: t.total + 1 });
    }
  }

  const total = questions.length;
  return {
    correct,
    answered: questions.filter((q) => answers[q.id] !== undefined).length,
    total,
    score10: total ? Math.round((correct / total) * 100) / 10 : 0,
    pct: total ? Math.round((correct / total) * 100) : 0,
    byChapter: CHAPTERS.filter((c) => chapter.has(c.id)).map((c) => ({ chapter: c.id, ...chapter.get(c.id)! })),
    byDifficulty: DIFFICULTIES.filter((d) => difficulty.has(d)).map((d) => ({ difficulty: d, ...difficulty.get(d)! })),
    wrongIds,
    unansweredIds,
  };
}

/** Largest-remainder apportionment of `total` over weights, returning integers that sum to `total`. */
function apportion(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    out[i]!++;
    left--;
  }
  return out;
}

/**
 * Per-group difficulty quotas for one exam: hard and easy are apportioned across groups by group size,
 * medium takes the rest — so the exam is exactly 20/20/10 and each group stays close to 40/40/20.
 */
export function randomExamQuotas(): Record<string, Record<Difficulty, number>> {
  const sizes = BLUEPRINT.map((g) => g.perExam);
  const hard = apportion(sizes, EXAM_DIFFICULTY_MIX[3]);
  const easy = apportion(sizes, EXAM_DIFFICULTY_MIX[1]);
  const quotas: Record<string, Record<Difficulty, number>> = {};
  BLUEPRINT.forEach((g, i) => {
    const h = hard[i]!;
    const e = easy[i]!;
    quotas[g.id] = { 1: e, 2: g.perExam - e - h, 3: h };
  });
  return quotas;
}

/** Draw a 50-question exam from the whole bank following the blueprint (group quotas, 20/20/10, topic caps). */
export function buildRandomExam(bank: MCQ[], seed: number, durationMin = EXAM_DURATION_MIN): Exam {
  const rng = createRng(seed);
  const quotas = randomExamQuotas();
  const picked: MCQ[] = [];

  for (const g of BLUEPRINT) {
    const pool = bank.filter((q) => groupOf(q.chapter, q.topic).id === g.id);
    const cap = topicCapPerExam(g);
    const topicCount = new Map<string, number>();
    for (const d of DIFFICULTIES) {
      const candidates = shuffle(
        pool.filter((q) => q.difficulty === d),
        rng,
      );
      let need = quotas[g.id]![d];
      // First pass honours the topic cap; a second pass fills any shortfall regardless.
      for (const pass of [0, 1])
        for (const q of candidates) {
          if (need <= 0) break;
          if (picked.includes(q)) continue;
          if (pass === 0 && (topicCount.get(q.topic) ?? 0) >= cap) continue;
          picked.push(q);
          topicCount.set(q.topic, (topicCount.get(q.topic) ?? 0) + 1);
          need--;
        }
    }
  }

  const ordered = shuffle(picked, rng).sort(
    (a, b) => CHAPTER_BY_ID[a.chapter].order - CHAPTER_BY_ID[b.chapter].order || a.difficulty - b.difficulty,
  );
  return {
    id: RANDOM_EXAM_ID,
    title: "Đề ngẫu nhiên",
    durationMin,
    questionIds: ordered.map((q) => q.id),
    optionOrder: balanceOptionOrder(ordered, rng),
  };
}

export const optionOrderOf = (exam: Pick<Exam, "optionOrder">, id: string): OptionId[] => exam.optionOrder?.[id] ?? [...OPTION_IDS];

/** Seconds left given a wall-clock start (so reloads keep the timer honest). */
export function remainingSeconds(startedAt: number, durationSec: number, now: number): number {
  return Math.max(0, Math.ceil(durationSec - (now - startedAt) / 1000));
}

/** "mm:ss" with total minutes (a 90-minute exam starts at "90:00"). */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Human-readable duration in Vietnamese, e.g. "42 phút 5 giây". */
export function formatDurationVi(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (!m) return `${sec} giây`;
  return sec ? `${m} phút ${sec} giây` : `${m} phút`;
}
