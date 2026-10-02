/** Pure progress logic (kept out of the store so it can be unit-tested). */

export interface QuestionStat {
  attempts: number;
  correct: number;
  lastCorrect: boolean;
  lastAnsweredAt: number;
}

export interface WrongEntry {
  addedAt: number;
  /** Consecutive correct answers since the question last went wrong. */
  streak: number;
}

/** A question leaves the wrong-answer bank after this many consecutive correct answers. */
export const WRONG_BANK_EXIT_STREAK = 2;

export function applyStat(prev: QuestionStat | undefined, correct: boolean, now: number): QuestionStat {
  return {
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    lastCorrect: correct,
    lastAnsweredAt: now,
  };
}

/**
 * Simple spaced repetition: a wrong answer (re)enters the bank with streak 0;
 * a correct answer on a banked question increments the streak and removes it at the exit streak.
 */
export function applyWrongBank(
  bank: Record<string, WrongEntry>,
  id: string,
  correct: boolean,
  now: number,
): Record<string, WrongEntry> {
  const entry = bank[id];
  if (!correct) return { ...bank, [id]: { addedAt: entry?.addedAt ?? now, streak: 0 } };
  if (!entry) return bank;
  const streak = entry.streak + 1;
  if (streak >= WRONG_BANK_EXIT_STREAK) {
    const { [id]: _removed, ...rest } = bank;
    return rest;
  }
  return { ...bank, [id]: { ...entry, streak } };
}
