import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Exam } from "@/schemas/exam";
import type { MCQ, OptionId } from "@/schemas/mcq";
import { optionOrderOf, scoreAttempt } from "@/lib/exam";
import { useProgress } from "./progressStore";

/** An exam in progress. Persisted, so a reload resumes with the same answers and wall-clock timer. */
export interface ExamSession {
  exam: Exam;
  startedAt: number;
  durationSec: number;
  answers: Record<string, OptionId>;
  current: number;
}

/** A submitted attempt, kept for history and for reviewing answers later. */
export interface ExamAttempt {
  id: string;
  examId: string;
  title: string;
  startedAt: number;
  finishedAt: number;
  elapsedSec: number;
  timedOut: boolean;
  correct: number;
  total: number;
  score10: number;
  questionIds: string[];
  optionOrder: Record<string, OptionId[]>;
  answers: Record<string, OptionId>;
}

/** Oldest attempts beyond this are dropped to keep localStorage small. */
const MAX_ATTEMPTS = 100;

interface ExamState {
  sessions: Record<string, ExamSession>;
  attempts: ExamAttempt[];
  startExam: (exam: Exam, durationMin: number) => void;
  answer: (examId: string, questionId: string, option: OptionId) => void;
  setCurrent: (examId: string, index: number) => void;
  /** Score the session, store the attempt, feed answers into progress stats; returns the attempt id. */
  submitExam: (examId: string, questions: MCQ[], timedOut?: boolean) => string | null;
  abandonExam: (examId: string) => void;
  clearHistory: () => void;
}

export const useExams = create<ExamState>()(
  persist(
    (set, get) => ({
      sessions: {},
      attempts: [],
      startExam: (exam, durationMin) =>
        set((s) => ({
          sessions: {
            ...s.sessions,
            [exam.id]: { exam, startedAt: Date.now(), durationSec: durationMin * 60, answers: {}, current: 0 },
          },
        })),
      answer: (examId, questionId, option) =>
        set((s) => {
          const sess = s.sessions[examId];
          if (!sess) return s;
          return { sessions: { ...s.sessions, [examId]: { ...sess, answers: { ...sess.answers, [questionId]: option } } } };
        }),
      setCurrent: (examId, index) =>
        set((s) => {
          const sess = s.sessions[examId];
          if (!sess) return s;
          return { sessions: { ...s.sessions, [examId]: { ...sess, current: index } } };
        }),
      submitExam: (examId, questions, timedOut = false) => {
        const sess = get().sessions[examId];
        if (!sess) return null;
        const now = Date.now();
        const score = scoreAttempt(questions, sess.answers);
        const attempt: ExamAttempt = {
          id: `${examId}-${now}`,
          examId,
          title: sess.exam.title,
          startedAt: sess.startedAt,
          finishedAt: now,
          elapsedSec: Math.min(sess.durationSec, Math.round((now - sess.startedAt) / 1000)),
          timedOut,
          correct: score.correct,
          total: score.total,
          score10: score.score10,
          questionIds: sess.exam.questionIds,
          optionOrder: Object.fromEntries(sess.exam.questionIds.map((id) => [id, optionOrderOf(sess.exam, id)])),
          answers: sess.answers,
        };
        const record = useProgress.getState().recordAnswer;
        for (const q of questions) {
          const a = sess.answers[q.id];
          if (a !== undefined) record(q.id, a === q.correct);
        }
        set((s) => {
          const { [examId]: _done, ...rest } = s.sessions;
          return { sessions: rest, attempts: [attempt, ...s.attempts].slice(0, MAX_ATTEMPTS) };
        });
        return attempt.id;
      },
      abandonExam: (examId) =>
        set((s) => {
          const { [examId]: _gone, ...rest } = s.sessions;
          return { sessions: rest };
        }),
      clearHistory: () => set({ attempts: [] }),
    }),
    { name: "eim-exams", version: 1 },
  ),
);

/** Best score and attempt count per exam id. */
export function examStats(attempts: ExamAttempt[]): Map<string, { best: number; count: number; last: ExamAttempt }> {
  const out = new Map<string, { best: number; count: number; last: ExamAttempt }>();
  for (const a of attempts) {
    const cur = out.get(a.examId);
    if (!cur) out.set(a.examId, { best: a.score10, count: 1, last: a });
    else out.set(a.examId, { best: Math.max(cur.best, a.score10), count: cur.count + 1, last: cur.last });
  }
  return out;
}
