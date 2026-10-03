/**
 * Pure merge logic for cloud sync. The synced document holds the persisted parts of the progress, exam and case
 * stores (theme/settings stay per device).
 *
 * - "Log-like" data is always merged: question stats (newest answer wins per question), the wrong-answer bank
 *   (follows the side whose answer is newer), exam attempts and case score history (union by id).
 * - "Set-like" data (flags, learned sections, flashcard marks, exam sessions, case drafts/ticks) cannot be merged
 *   without tombstones, so a mode decides it: `union` (first sync of a device), `local` (this device has unsynced
 *   changes → last writer wins) or `remote` (another device wrote since our last sync).
 */
import type { QuestionStat, WrongEntry } from "@/lib/progress";
import type { CardStatus } from "@/store/progressStore";
import type { ExamAttempt, ExamSession } from "@/store/examStore";
import type { CaseResult } from "@/store/caseStore";
import type { RubricChecks } from "@/lib/caseScore";

export interface ProgressData {
  stats: Record<string, QuestionStat>;
  wrongBank: Record<string, WrongEntry>;
  flagged: Record<string, number>;
  learned: Record<string, true>;
  cards: Record<string, CardStatus>;
  diagramViewed: Record<string, string[]>;
  diagramQuiz: Record<string, Record<string, number>>;
}
export interface ExamsData {
  sessions: Record<string, ExamSession>;
  attempts: ExamAttempt[];
}
export interface CasesData {
  drafts: Record<string, Record<string, string>>;
  revealed: Record<string, true>;
  checks: Record<string, RubricChecks>;
  history: CaseResult[];
}
export interface SyncDoc {
  progress: ProgressData;
  exams: ExamsData;
  cases: CasesData;
}

export type MergeMode = "union" | "local" | "remote";

export const MAX_ATTEMPTS = 100;
export const MAX_CASE_HISTORY = 200;

export const emptyDoc = (): SyncDoc => ({
  progress: { stats: {}, wrongBank: {}, flagged: {}, learned: {}, cards: {}, diagramViewed: {}, diagramQuiz: {} },
  exams: { sessions: {}, attempts: [] },
  cases: { drafts: {}, revealed: {}, checks: {}, history: [] },
});

/** Fill missing fields so documents written by older app versions (or partial rows) are safe to merge. */
export function normalizeDoc(raw: Partial<SyncDoc> | null | undefined): SyncDoc {
  const e = emptyDoc();
  return {
    progress: { ...e.progress, ...(raw?.progress ?? {}) },
    exams: { ...e.exams, ...(raw?.exams ?? {}) },
    cases: { ...e.cases, ...(raw?.cases ?? {}) },
  };
}

const isNewer = (a: QuestionStat | undefined, b: QuestionStat | undefined): boolean =>
  !!a && (!b || a.lastAnsweredAt > b.lastAnsweredAt || (a.lastAnsweredAt === b.lastAnsweredAt && a.attempts >= b.attempts));

function mergeStats(local: ProgressData, remote: ProgressData): Pick<ProgressData, "stats" | "wrongBank"> {
  const stats: Record<string, QuestionStat> = {};
  const wrongBank: Record<string, WrongEntry> = {};
  const ids = new Set([...Object.keys(local.stats), ...Object.keys(remote.stats), ...Object.keys(local.wrongBank), ...Object.keys(remote.wrongBank)]);
  for (const id of ids) {
    const l = local.stats[id];
    const r = remote.stats[id];
    const useLocal = isNewer(l, r) || (!l && !r && local.wrongBank[id] !== undefined);
    const stat = useLocal ? l : r;
    if (stat) stats[id] = stat;
    const entry = useLocal ? local.wrongBank[id] : remote.wrongBank[id];
    if (entry) wrongBank[id] = entry;
  }
  return { stats, wrongBank };
}

/** Union of records; on key conflicts the `preferred` side wins. */
const unionRecord = <T,>(preferred: Record<string, T>, other: Record<string, T>): Record<string, T> => ({ ...other, ...preferred });

/** Diagram progress only grows: union of viewed ids, best score per quiz. */
function mergeDiagrams(local: ProgressData, remote: ProgressData): Pick<ProgressData, "diagramViewed" | "diagramQuiz"> {
  const diagramViewed: Record<string, string[]> = { ...remote.diagramViewed };
  for (const [id, ids] of Object.entries(local.diagramViewed)) diagramViewed[id] = [...new Set([...(diagramViewed[id] ?? []), ...ids])];
  const diagramQuiz: Record<string, Record<string, number>> = { ...remote.diagramQuiz };
  for (const [id, scores] of Object.entries(local.diagramQuiz)) {
    const merged = { ...(diagramQuiz[id] ?? {}) };
    for (const [quiz, pct] of Object.entries(scores)) merged[quiz] = Math.max(merged[quiz] ?? 0, pct);
    diagramQuiz[id] = merged;
  }
  return { diagramViewed, diagramQuiz };
}

const pick = <T,>(mode: MergeMode, local: T, remote: T, union: () => T): T => (mode === "local" ? local : mode === "remote" ? remote : union());

export function mergeDocs(localRaw: SyncDoc, remoteRaw: SyncDoc, mode: MergeMode): SyncDoc {
  const local = normalizeDoc(localRaw);
  const remote = normalizeDoc(remoteRaw);

  const attempts = [...new Map([...remote.exams.attempts, ...local.exams.attempts].map((a) => [a.id, a])).values()]
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, MAX_ATTEMPTS);
  // A session that already produced an attempt was submitted on some device — never resurrect it.
  const finished = new Set(attempts.map((a) => `${a.examId}@${a.startedAt}`));
  const sessionsRaw = pick(mode, local.exams.sessions, remote.exams.sessions, () => {
    const out: Record<string, ExamSession> = { ...remote.exams.sessions };
    for (const [id, s] of Object.entries(local.exams.sessions)) if (!out[id] || s.startedAt >= out[id]!.startedAt) out[id] = s;
    return out;
  });
  const sessions = Object.fromEntries(Object.entries(sessionsRaw).filter(([id, s]) => !finished.has(`${id}@${s.startedAt}`)));

  const history = [...new Map([...remote.cases.history, ...local.cases.history].map((h) => [`${h.caseId}@${h.at}`, h])).values()]
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_CASE_HISTORY);

  return {
    progress: {
      ...mergeStats(local.progress, remote.progress),
      ...mergeDiagrams(local.progress, remote.progress),
      flagged: pick(mode, local.progress.flagged, remote.progress.flagged, () => unionRecord(local.progress.flagged, remote.progress.flagged)),
      learned: pick(mode, local.progress.learned, remote.progress.learned, () => unionRecord(local.progress.learned, remote.progress.learned)),
      cards: pick(mode, local.progress.cards, remote.progress.cards, () => unionRecord(local.progress.cards, remote.progress.cards)),
    },
    exams: { sessions, attempts },
    cases: {
      drafts: pick(mode, local.cases.drafts, remote.cases.drafts, () => unionRecord(local.cases.drafts, remote.cases.drafts)),
      revealed: pick(mode, local.cases.revealed, remote.cases.revealed, () => unionRecord(local.cases.revealed, remote.cases.revealed)),
      checks: pick(mode, local.cases.checks, remote.cases.checks, () => unionRecord(local.cases.checks, remote.cases.checks)),
      history,
    },
  };
}

/** True when the document has no user data at all (a fresh device). */
export function isEmptyDoc(d: SyncDoc): boolean {
  const n = normalizeDoc(d);
  return (
    Object.keys(n.progress.stats).length +
      Object.keys(n.progress.flagged).length +
      Object.keys(n.progress.learned).length +
      Object.keys(n.progress.cards).length +
      Object.keys(n.progress.diagramViewed).length +
      Object.keys(n.exams.sessions).length +
      n.exams.attempts.length +
      Object.keys(n.cases.drafts).length +
      n.cases.history.length ===
    0
  );
}
