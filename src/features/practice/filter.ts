import type { ChapterId } from "@/config/chapters";
import type { Difficulty } from "@/config/blueprint";
import type { QuestionStat, WrongEntry } from "@/lib/progress";
import type { MCQ } from "@/schemas/mcq";

/** all = every question · new = never answered · wrong = currently in the wrong-answer bank. */
export type PracticeMode = "all" | "new" | "wrong";

export interface PracticeFilter {
  /** Empty = all chapters. */
  chapters: ChapterId[];
  /** Only applied when exactly one chapter is selected. */
  topic: string | null;
  /** Empty = all difficulties. */
  difficulties: Difficulty[];
  mode: PracticeMode;
}

export function filterQuestions(
  bank: MCQ[],
  f: PracticeFilter,
  stats: Record<string, QuestionStat>,
  wrongBank: Record<string, WrongEntry>,
): MCQ[] {
  const topic = f.chapters.length === 1 ? f.topic : null;
  return bank.filter(
    (q) =>
      (f.chapters.length === 0 || f.chapters.includes(q.chapter)) &&
      (!topic || q.topic === topic) &&
      (f.difficulties.length === 0 || f.difficulties.includes(q.difficulty)) &&
      (f.mode === "all" || (f.mode === "new" ? !stats[q.id] : wrongBank[q.id] !== undefined)),
  );
}
