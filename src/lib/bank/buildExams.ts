import type { MCQ, OptionId } from "@/schemas/mcq";
import { OPTION_IDS } from "@/schemas/constants";
import type { Exam } from "@/schemas/exam";
import {
  BLUEPRINT,
  DIFFICULTIES,
  EXAM_COUNT,
  EXAM_DIFFICULTY_MIX,
  EXAM_DURATION_MIN,
  bankTargets,
  groupOf,
  topicCapPerExam,
  type BlueprintGroup,
  type Difficulty,
} from "@/config/blueprint";
import { CHAPTER_BY_ID } from "@/config/chapters";
import { createRng, shuffle } from "@/lib/rng";

export interface BuildOptions {
  seed: number;
  examCount?: number;
  durationMin?: number;
}

export interface BuildResult {
  exams: Exam[];
  warnings: string[];
}

type Matrix = number[][]; // [exam][difficultyIndex]

const DI = (d: Difficulty) => d - 1;

/** Deal a group's difficulty labels round-robin so each exam gets an even mix. */
function dealGroup(counts: Record<Difficulty, number>, examCount: number, offset: number): Matrix {
  const labels: Difficulty[] = DIFFICULTIES.flatMap((d) => Array<Difficulty>(counts[d]).fill(d));
  const m: Matrix = Array.from({ length: examCount }, () => [0, 0, 0]);
  labels.forEach((d, k) => {
    m[(k + offset) % examCount]![DI(d)]!++;
  });
  return m;
}

/**
 * Swap difficulty slots between exams (within one group, so group quotas and group difficulty
 * totals stay fixed) until every exam has the global 20/20/10 mix. Greedy best-improvement search.
 */
function balanceDifficulty(mats: Matrix[], examCount: number): boolean {
  const target = DIFFICULTIES.map((d) => EXAM_DIFFICULTY_MIX[d]);
  const totals = () =>
    Array.from({ length: examCount }, (_, e) => [0, 1, 2].map((di) => mats.reduce((s, m) => s + m[e]![di]!, 0)));
  const cost = (T: number[][]) => T.reduce((s, row) => s + row.reduce((a, v, di) => a + Math.abs(v - target[di]!), 0), 0);

  for (let iter = 0; iter < 5000; iter++) {
    const T = totals();
    const c0 = cost(T);
    if (c0 === 0) return true;
    let best: { g: number; e1: number; e2: number; d1: number; d2: number; delta: number } | null = null;
    for (let e1 = 0; e1 < examCount; e1++)
      for (let e2 = 0; e2 < examCount; e2++) {
        if (e1 === e2) continue;
        for (let d1 = 0; d1 < 3; d1++)
          for (let d2 = 0; d2 < 3; d2++) {
            if (d1 === d2) continue;
            // Move: e1 gives d1 & takes d2; e2 gives d2 & takes d1.
            const delta =
              Math.abs(T[e1]![d1]! - 1 - target[d1]!) - Math.abs(T[e1]![d1]! - target[d1]!) +
              Math.abs(T[e1]![d2]! + 1 - target[d2]!) - Math.abs(T[e1]![d2]! - target[d2]!) +
              Math.abs(T[e2]![d2]! - 1 - target[d2]!) - Math.abs(T[e2]![d2]! - target[d2]!) +
              Math.abs(T[e2]![d1]! + 1 - target[d1]!) - Math.abs(T[e2]![d1]! - target[d1]!);
            if (delta >= 0 || (best && delta >= best.delta)) continue;
            const g = mats.findIndex((m) => m[e1]![d1]! > 0 && m[e2]![d2]! > 0);
            if (g >= 0) best = { g, e1, e2, d1, d2, delta };
          }
      }
    if (!best) return false;
    const m = mats[best.g]!;
    m[best.e1]![best.d1]!--;
    m[best.e1]![best.d2]!++;
    m[best.e2]![best.d2]!--;
    m[best.e2]![best.d1]!++;
  }
  return false;
}

/** Fill each (exam, difficulty) slot of a group with questions, respecting the per-exam topic cap. */
function assignGroup(
  group: BlueprintGroup,
  pool: MCQ[],
  mat: Matrix,
  examCount: number,
  rng: () => number,
): { perExam: MCQ[][]; violations: number } {
  const cap = topicCapPerExam(group);
  let best: { perExam: MCQ[][]; violations: number } | null = null;

  for (let attempt = 0; attempt < 30 && (!best || best.violations > 0); attempt++) {
    const remaining = new Map<Difficulty, MCQ[]>(DIFFICULTIES.map((d) => [d, shuffle(pool.filter((q) => q.difficulty === d), rng)]));
    const perExam: MCQ[][] = Array.from({ length: examCount }, () => []);
    const topicCount: Map<string, number>[] = Array.from({ length: examCount }, () => new Map());
    let violations = 0;

    // Slots are interleaved across exams (hard first, as those pools are smallest).
    const slots: { e: number; d: Difficulty }[] = [];
    for (const d of [3, 2, 1] as Difficulty[]) {
      const need = mat.map((row) => row[DI(d)]!);
      for (let round = 0; need.some((n) => n > 0); round++)
        for (const e of shuffle([...Array(examCount).keys()], rng))
          if (need[e]! > 0) {
            slots.push({ e, d });
            need[e]!--;
          }
    }

    for (const { e, d } of slots) {
      const list = remaining.get(d)!;
      // Prefer the topic with the most questions left (avoids stranding a big topic at the end).
      const left = new Map<string, number>();
      for (const q of list) left.set(q.topic, (left.get(q.topic) ?? 0) + 1);
      let pick = -1;
      let pickScore = -1;
      list.forEach((q, i) => {
        if ((topicCount[e]!.get(q.topic) ?? 0) >= cap) return;
        const score = left.get(q.topic) ?? 0;
        if (score > pickScore) {
          pick = i;
          pickScore = score;
        }
      });
      if (pick < 0) {
        pick = 0;
        violations++;
      }
      const [q] = list.splice(pick, 1);
      perExam[e]!.push(q!);
      topicCount[e]!.set(q!.topic, (topicCount[e]!.get(q!.topic) ?? 0) + 1);
    }
    if (!best || violations < best.violations) best = { perExam, violations };
  }
  return best!;
}

/** Choose a display order per question so that each letter is correct ~25% of the time in the exam. */
export function balanceOptionOrder(questions: MCQ[], rng: () => number): Record<string, OptionId[]> {
  const n = questions.length;
  const base = Math.floor(n / 4);
  const extra = n - base * 4;
  const letterTargets = shuffle([0, 1, 2, 3], rng).map((pos, i) => ({ pos, count: base + (i < extra ? 1 : 0) }));
  const remaining = [0, 0, 0, 0];
  for (const { pos, count } of letterTargets) remaining[pos] = count;

  const order: Record<string, OptionId[]> = {};
  const locked = questions.filter((q) => q.lockOrder);
  for (const q of locked) {
    const ids = q.options.map((o) => o.id);
    order[q.id] = ids;
    remaining[ids.indexOf(q.correct)]!--;
  }
  const desired: number[] = shuffle(
    remaining.flatMap((cnt, pos) => Array<number>(Math.max(0, cnt)).fill(pos)),
    rng,
  );
  const free = questions.filter((q) => !q.lockOrder);
  free.forEach((q, i) => {
    const pos = desired[i] ?? Math.floor(rng() * 4);
    const distractors = shuffle(
      q.options.map((o) => o.id).filter((id) => id !== q.correct),
      rng,
    );
    const ids: OptionId[] = [];
    for (let p = 0; p < 4; p++) ids.push(p === pos ? q.correct : distractors.shift()!);
    order[q.id] = ids;
  });
  return order;
}

export function buildExams(questions: MCQ[], opts: BuildOptions): BuildResult {
  const examCount = opts.examCount ?? EXAM_COUNT;
  const rng = createRng(opts.seed);
  const warnings: string[] = [];
  const targets = bankTargets(examCount);

  // Partition by blueprint group and check counts (validate:bank should have caught this).
  const pools = new Map<string, MCQ[]>(BLUEPRINT.map((g) => [g.id, []]));
  for (const q of questions) pools.get(groupOf(q.chapter, q.topic).id)!.push(q);
  for (const g of BLUEPRINT)
    for (const d of DIFFICULTIES) {
      const have = pools.get(g.id)!.filter((q) => q.difficulty === d).length;
      if (have !== targets[g.id]![d])
        throw new Error(`Group ${g.id} difficulty ${d}: ${have} questions, blueprint needs ${targets[g.id]![d]}`);
    }

  // Difficulty allocation per (group, exam), then rebalance to 20/20/10 per exam.
  let mats: Matrix[] = [];
  let balanced = false;
  for (let attempt = 0; attempt < 20 && !balanced; attempt++) {
    mats = BLUEPRINT.map(() => [] as Matrix);
    BLUEPRINT.forEach((g, gi) => {
      mats[gi] = dealGroup(targets[g.id]!, examCount, Math.floor(rng() * examCount));
    });
    balanced = balanceDifficulty(mats, examCount);
  }
  if (!balanced) warnings.push("Could not reach the exact 20/20/10 difficulty mix in every exam");

  const examQuestions: MCQ[][] = Array.from({ length: examCount }, () => []);
  BLUEPRINT.forEach((g, gi) => {
    const { perExam, violations } = assignGroup(g, pools.get(g.id)!, mats[gi]!, examCount, rng);
    if (violations > 0) warnings.push(`Group ${g.id}: ${violations} topic-cap violation(s) (cap ${topicCapPerExam(g)}/exam)`);
    perExam.forEach((qs, e) => examQuestions[e]!.push(...qs));
  });

  const exams: Exam[] = examQuestions.map((qs, e) => {
    // Order: by chapter, then difficulty (easy → hard), shuffled within a cell.
    const ordered = shuffle(qs, rng).sort(
      (a, b) => CHAPTER_BY_ID[a.chapter].order - CHAPTER_BY_ID[b.chapter].order || a.difficulty - b.difficulty,
    );
    const num = String(e + 1).padStart(2, "0");
    return {
      id: `EXAM-${num}`,
      title: `Đề thi thử số ${e + 1}`,
      durationMin: opts.durationMin ?? EXAM_DURATION_MIN,
      questionIds: ordered.map((q) => q.id),
      optionOrder: balanceOptionOrder(ordered, rng),
    };
  });
  return { exams, warnings };
}

/** Correct-letter distribution of an exam given its option order. */
export function letterDistribution(exam: Exam, byId: Map<string, MCQ>): Record<"A" | "B" | "C" | "D", number> {
  const dist = { A: 0, B: 0, C: 0, D: 0 };
  const letters = ["A", "B", "C", "D"] as const;
  for (const id of exam.questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const order = exam.optionOrder?.[id] ?? [...OPTION_IDS];
    dist[letters[order.indexOf(q.correct)]!]++;
  }
  return dist;
}
