import { useMemo } from "react";
import { loadAllQuestionsAfterPaint } from "@/data";
import { useAsync, type AsyncState } from "@/lib/useAsync";
import type { MCQ } from "@/schemas/mcq";

export interface Bank {
  all: MCQ[];
  byId: Map<string, MCQ>;
}

/** The whole question bank (all chapter chunks) plus an id index. */
export function useBank(): AsyncState<Bank> {
  const state = useAsync(loadAllQuestionsAfterPaint, []);
  return useMemo<AsyncState<Bank>>(
    () => (state.status === "ready" ? { status: "ready", data: { all: state.data, byId: new Map(state.data.map((q) => [q.id, q])) } } : state),
    [state],
  );
}

/** Resolve ids against the bank, dropping unknown ids (e.g. after a question was renamed). */
export const resolveIds = (byId: Map<string, MCQ>, ids: string[]): MCQ[] =>
  ids.map((id) => byId.get(id)).filter((q): q is MCQ => q !== undefined);
