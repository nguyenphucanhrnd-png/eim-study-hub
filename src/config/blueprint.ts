import { CHAPTER_BY_ID, type ChapterId } from "./chapters";

/** Number of fixed mock exams. Change to 10 or 15 and re-run `npm run build:exams`. */
export const EXAM_COUNT = 12;
export const EXAM_SIZE = 50;
export const EXAM_DURATION_MIN = 60;

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTIES: Difficulty[] = [1, 2, 3];

/** Difficulty mix per exam (PROMPT §6.1): 20 easy – 20 medium – 10 hard. */
export const EXAM_DIFFICULTY_MIX: Record<Difficulty, number> = { 1: 20, 2: 20, 3: 10 };

/**
 * Blueprint groups. C3 is split into pricing (approaches + objectives) and Incoterms,
 * because the blueprint gives them separate quotas.
 */
export interface BlueprintGroup {
  id: string;
  chapter: ChapterId;
  label: string;
  perExam: number;
  /** If set, only these topics belong to the group; otherwise all topics of the chapter not claimed by another group. */
  topics?: string[];
}

export const C3_PRICING_TOPICS = ["pricing-approaches", "pricing-objectives"];

export const BLUEPRINT: BlueprintGroup[] = [
  { id: "C1", chapter: "C1", label: "C1 Tổng quan", perExam: 3 },
  { id: "C2", chapter: "C2", label: "C2 Kế hoạch XK", perExam: 4 },
  { id: "C3P", chapter: "C3", label: "C3 Định giá", perExam: 3, topics: C3_PRICING_TOPICS },
  { id: "C3I", chapter: "C3", label: "C3 Incoterms", perExam: 12 },
  { id: "C4", chapter: "C4", label: "C4 Bảo hiểm", perExam: 6 },
  { id: "C5", chapter: "C5", label: "C5 Thanh toán", perExam: 10 },
  { id: "C6", chapter: "C6", label: "C6 Hợp đồng", perExam: 5 },
  { id: "C7", chapter: "C7", label: "C7 Chứng từ", perExam: 5 },
  { id: "C8", chapter: "C8", label: "C8 Quy trình", perExam: 2 },
];

/** Resolve the blueprint group a question belongs to. */
export function groupOf(chapter: ChapterId, topic: string): BlueprintGroup {
  const candidates = BLUEPRINT.filter((g) => g.chapter === chapter);
  const explicit = candidates.find((g) => g.topics?.includes(topic));
  if (explicit) return explicit;
  const fallback = candidates.find((g) => !g.topics);
  if (!fallback) throw new Error(`No blueprint group for ${chapter}/${topic}`);
  return fallback;
}

/**
 * Target bank size per group and difficulty (~40/40/20 per group), apportioned so the
 * whole bank sums exactly to examCount × EXAM_DIFFICULTY_MIX.
 */
export function bankTargets(examCount = EXAM_COUNT): Record<string, Record<Difficulty, number>> {
  const totals = BLUEPRINT.map((g) => g.perExam * examCount);
  const hardTotal = examCount * EXAM_DIFFICULTY_MIX[3];

  // Largest-remainder apportionment of hard questions (20% of each group).
  const raw = totals.map((n) => n * 0.2);
  const hard = raw.map(Math.floor);
  let left = hardTotal - hard.reduce((a, b) => a + b, 0);
  const byRemainder = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    hard[i] = (hard[i] ?? 0) + 1;
    left--;
  }

  // Split the rest evenly; odd remainders alternate between easy and medium so global totals match.
  const result: Record<string, Record<Difficulty, number>> = {};
  let giveEasy = true;
  BLUEPRINT.forEach((g, i) => {
    const h = hard[i] ?? 0;
    const rest = (totals[i] ?? 0) - h;
    let easy = Math.floor(rest / 2);
    if (rest % 2 === 1) {
      if (giveEasy) easy++;
      giveEasy = !giveEasy;
    }
    result[g.id] = { 1: easy, 2: rest - easy, 3: h };
  });
  return result;
}

/** Topics belonging to a blueprint group. */
export function groupTopics(group: BlueprintGroup): string[] {
  const all = CHAPTER_BY_ID[group.chapter].topics.map((tp) => tp.id);
  if (group.topics) return group.topics;
  const claimed = new Set(BLUEPRINT.filter((g) => g.chapter === group.chapter && g.topics).flatMap((g) => g.topics ?? []));
  return all.filter((id) => !claimed.has(id));
}

/**
 * Max questions of one topic in one exam within a group: ≤30% of the group's quota.
 * When the group has too few topics for that to be satisfiable (C3 pricing: 3 questions, 2 topics),
 * the cap relaxes to the minimum feasible value ceil(perExam / topicCount).
 */
export function topicCapPerExam(group: BlueprintGroup): number {
  const feasible = Math.ceil(group.perExam / groupTopics(group).length);
  return Math.max(1, Math.floor(group.perExam * 0.3), feasible);
}
