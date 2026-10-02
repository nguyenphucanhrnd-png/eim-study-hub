import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyStat, applyWrongBank, type QuestionStat, type WrongEntry } from "@/lib/progress";

export type CardStatus = "known" | "unknown";

interface ProgressState {
  stats: Record<string, QuestionStat>;
  wrongBank: Record<string, WrongEntry>;
  /** Flagged question ids → time flagged. */
  flagged: Record<string, number>;
  /** Learned theory sections, keyed "C3#incoterms-scope". */
  learned: Record<string, true>;
  /** Flashcard self-assessment: card id → known / not yet known. */
  cards: Record<string, CardStatus>;
  recordAnswer: (id: string, correct: boolean) => void;
  toggleFlag: (id: string) => void;
  toggleLearned: (key: string) => void;
  setCardStatus: (id: string, status: CardStatus) => void;
  resetProgress: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      stats: {},
      wrongBank: {},
      flagged: {},
      learned: {},
      cards: {},
      recordAnswer: (id, correct) =>
        set((s) => {
          const now = Date.now();
          return {
            stats: { ...s.stats, [id]: applyStat(s.stats[id], correct, now) },
            wrongBank: applyWrongBank(s.wrongBank, id, correct, now),
          };
        }),
      toggleFlag: (id) =>
        set((s) => {
          if (s.flagged[id] === undefined) return { flagged: { ...s.flagged, [id]: Date.now() } };
          const { [id]: _removed, ...rest } = s.flagged;
          return { flagged: rest };
        }),
      toggleLearned: (key) =>
        set((s) => {
          if (!s.learned[key]) return { learned: { ...s.learned, [key]: true } };
          const { [key]: _removed, ...rest } = s.learned;
          return { learned: rest };
        }),
      setCardStatus: (id, status) => set((s) => ({ cards: { ...s.cards, [id]: status } })),
      resetProgress: () => set({ stats: {}, wrongBank: {}, flagged: {}, learned: {}, cards: {} }),
    }),
    { name: "eim-progress", version: 1 },
  ),
);
