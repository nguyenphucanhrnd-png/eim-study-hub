import { useCallback } from "react";
import { useProgress } from "@/store/progressStore";

export type DiagramStatus = "new" | "started" | "explored" | "mastered";

export const STATUS_VI: Record<DiagramStatus, string> = {
  new: "Chưa xem",
  started: "Đang khám phá",
  explored: "Đã khám phá",
  mastered: "Đã thành thạo",
};

/** Chip colours per status (light + dark). */
export const STATUS_CHIP: Record<DiagramStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  started: "bg-navy-50 text-navy-800 dark:bg-navy-900/60 dark:text-navy-200",
  explored: "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  mastered: "bg-green-50 text-green-800 dark:bg-green-950/60 dark:text-green-200",
};

/** Marker stored once every required step (or node, for map diagrams) has been viewed. */
export const EXPLORED_MARK = "__explored";

/**
 * "Đã khám phá" = every step (or node for map diagrams) viewed — recorded by the viewer as EXPLORED_MARK,
 * so lists can show the status without loading the spec; "Đã thành thạo" = any quiz scored 100%.
 */
export function diagramStatus(viewed: readonly string[] | undefined, quiz: Record<string, number> | undefined): DiagramStatus {
  if (quiz && Object.values(quiz).some((p) => p >= 100)) return "mastered";
  if (viewed?.includes(EXPLORED_MARK)) return "explored";
  return viewed && viewed.length > 0 ? "started" : "new";
}

/** True when all required ids are in the viewed list. */
export const allViewed = (viewed: readonly string[], required: readonly string[]) => {
  const seen = new Set(viewed);
  return required.length > 0 && required.every((id) => seen.has(id));
};

/** Progress slice for one diagram (DIAGRAMS_PROMPT §3.2 useDiagramProgress). */
export function useDiagramProgress(diagramId: string) {
  const viewed = useProgress((s) => s.diagramViewed[diagramId]);
  const quiz = useProgress((s) => s.diagramQuiz[diagramId]);
  const mark = useProgress((s) => s.markDiagramViewed);
  const record = useProgress((s) => s.recordDiagramQuiz);
  const markViewed = useCallback((ids: string[]) => mark(diagramId, ids), [mark, diagramId]);
  const recordQuiz = useCallback((kind: string, pct: number) => record(diagramId, kind, pct), [record, diagramId]);
  return { viewed: viewed ?? [], quiz: quiz ?? {}, status: diagramStatus(viewed, quiz), markViewed, recordQuiz };
}

/** Status of every diagram (for the hub, chapter pages and the dashboard). */
export function useAllDiagramStatuses(): (id: string) => DiagramStatus {
  const viewed = useProgress((s) => s.diagramViewed);
  const quiz = useProgress((s) => s.diagramQuiz);
  return useCallback((id: string) => diagramStatus(viewed[id], quiz[id]), [viewed, quiz]);
}
