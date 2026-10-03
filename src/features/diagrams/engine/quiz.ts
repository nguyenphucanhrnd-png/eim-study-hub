import { shuffle } from "@/lib/rng";
import { isSubStep, sortedSteps, type DiagramSpec, type DiagramStep } from "./types";

export type QuizKind = "order" | "actor" | "gap";

/** Main steps in slide order (sub-steps such as "5b" are left out of quizzes). */
export function quizSteps(spec: Pick<DiagramSpec, "steps" | "lanes">): DiagramStep[] {
  return sortedSteps(spec.steps, spec.lanes).filter((s) => !isSubStep(s));
}

/** Shuffle until the order differs from the correct one (when that is possible). */
export function shuffledForOrderQuiz(steps: DiagramStep[], rng: () => number): DiagramStep[] {
  if (steps.length < 2) return steps;
  for (let i = 0; i < 20; i++) {
    const out = shuffle(steps, rng);
    if (out.some((s, k) => s.id !== steps[k]!.id)) return out;
  }
  return [...steps].reverse();
}

export interface OrderResult {
  /** Per submitted position: is it the right step? */
  correctAt: boolean[];
  /** Correct 1-based position of each submitted step. */
  correctPosition: number[];
  pct: number;
}

export function scoreOrder(submittedIds: string[], correctIds: string[]): OrderResult {
  const correctAt = submittedIds.map((id, i) => correctIds[i] === id);
  const correctPosition = submittedIds.map((id) => correctIds.indexOf(id) + 1);
  const pct = correctIds.length ? Math.round((correctAt.filter(Boolean).length / correctIds.length) * 100) : 0;
  return { correctAt, correctPosition, pct };
}

/** Actor quiz: the node that performs the step is the first listed actor. */
export const performerOf = (step: DiagramStep): string => step.actors[0]!;

export interface GapOption {
  key: string;
  titleVi: string;
  title: string;
}

export interface GapQuestion {
  blankIndex: number;
  options: GapOption[];
  answerKey: string;
}

export interface PoolStep {
  diagramId: string;
  titleVi: string;
  title: string;
}

/**
 * "Bước còn thiếu": blank one step; the 3 distractors come from OTHER diagrams' steps
 * (distinct titles, never one of this diagram's own steps).
 */
export function buildGapQuestion(steps: DiagramStep[], diagramId: string, pool: PoolStep[], rng: () => number): GapQuestion | null {
  if (steps.length === 0) return null;
  const blankIndex = Math.floor(rng() * steps.length);
  const answer = steps[blankIndex]!;
  const own = new Set(steps.map((s) => s.titleVi.trim().toLowerCase()));
  const seen = new Set<string>();
  const candidates = shuffle(
    pool.filter((p) => p.diagramId !== diagramId && !own.has(p.titleVi.trim().toLowerCase())),
    rng,
  ).filter((p) => {
    const k = p.titleVi.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (candidates.length < 3) return null;
  const distractors = candidates.slice(0, 3).map((p, i) => ({ key: `d${i}`, titleVi: p.titleVi, title: p.title }));
  const options = shuffle([{ key: "answer", titleVi: answer.titleVi, title: answer.title }, ...distractors], rng);
  return { blankIndex, options, answerKey: "answer" };
}
