import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RubricChecks } from "@/lib/caseScore";

export interface CaseResult {
  caseId: string;
  score: number;
  at: number;
}

interface CaseState {
  /** Answer drafts: caseId → taskId → text (autosaved while typing). */
  drafts: Record<string, Record<string, string>>;
  /** Cases whose model answers are revealed. */
  revealed: Record<string, true>;
  checks: Record<string, RubricChecks>;
  history: CaseResult[];
  setDraft: (caseId: string, taskId: string, text: string) => void;
  reveal: (caseId: string) => void;
  toggleCheck: (caseId: string, taskId: string, index: number) => void;
  saveScore: (caseId: string, score: number) => void;
  /** Start the case again: clears drafts, ticks and the revealed state (history is kept). */
  resetCase: (caseId: string) => void;
}

const without = <T,>(rec: Record<string, T>, key: string): Record<string, T> => {
  const { [key]: _gone, ...rest } = rec;
  return rest;
};

export const useCases = create<CaseState>()(
  persist(
    (set) => ({
      drafts: {},
      revealed: {},
      checks: {},
      history: [],
      setDraft: (caseId, taskId, text) =>
        set((s) => ({ drafts: { ...s.drafts, [caseId]: { ...s.drafts[caseId], [taskId]: text } } })),
      reveal: (caseId) => set((s) => ({ revealed: { ...s.revealed, [caseId]: true } })),
      toggleCheck: (caseId, taskId, index) =>
        set((s) => {
          const cur = s.checks[caseId]?.[taskId] ?? [];
          const next = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index];
          return { checks: { ...s.checks, [caseId]: { ...s.checks[caseId], [taskId]: next } } };
        }),
      saveScore: (caseId, score) => set((s) => ({ history: [{ caseId, score, at: Date.now() }, ...s.history].slice(0, 200) })),
      resetCase: (caseId) =>
        set((s) => ({ drafts: without(s.drafts, caseId), revealed: without(s.revealed, caseId), checks: without(s.checks, caseId) })),
    }),
    { name: "eim-cases", version: 1 },
  ),
);

/** Best saved score per case. */
export function bestCaseScores(history: CaseResult[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of history) m.set(h.caseId, Math.max(m.get(h.caseId) ?? 0, h.score));
  return m;
}
