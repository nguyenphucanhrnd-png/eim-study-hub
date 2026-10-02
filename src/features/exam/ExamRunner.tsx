import { useCallback, useEffect, useRef, useState } from "react";
import { Button, cx } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { QuestionCard } from "@/features/practice/QuestionCard";
import { formatClock, optionOrderOf, remainingSeconds } from "@/lib/exam";
import type { MCQ, OptionId } from "@/schemas/mcq";
import { useExams, type ExamSession } from "@/store/examStore";
import { useProgress } from "@/store/progressStore";

/** Screen-reader announcements when the remaining time crosses these marks (seconds). */
const TIME_MARKS = [600, 300, 60];

function Navigator({
  questions,
  answers,
  flagged,
  current,
  onGo,
}: {
  questions: MCQ[];
  answers: Record<string, OptionId>;
  flagged: Record<string, number>;
  current: number;
  onGo: (i: number) => void;
}) {
  return (
    <nav aria-label="Danh sách câu hỏi">
      <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-6">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined;
          const isFlagged = flagged[q.id] !== undefined;
          const status = [answered ? "đã trả lời" : "chưa trả lời", isFlagged && "đã đánh dấu"].filter(Boolean).join(", ");
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onGo(i)}
                aria-label={`Câu ${i + 1}: ${status}`}
                aria-current={i === current ? "step" : undefined}
                className={cx(
                  "relative flex h-9 w-full items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors duration-150",
                  answered
                    ? "border-navy-700 bg-navy-700 text-white dark:border-navy-300 dark:bg-navy-300 dark:text-navy-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-navy-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                  i === current && "ring-2 ring-navy-500 ring-offset-2 dark:ring-navy-200 dark:ring-offset-slate-950",
                )}
              >
                {i + 1}
                {isFlagged && <span aria-hidden className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-flag dark:border-slate-950" />}
              </button>
            </li>
          );
        })}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-sm bg-navy-700 dark:bg-navy-300" /> Đã trả lời
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-sm border border-slate-400" /> Chưa trả lời
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-full bg-flag" /> Đánh dấu
        </li>
      </ul>
    </nav>
  );
}

export function ExamRunner({
  session,
  questions,
  onSubmitted,
}: {
  session: ExamSession;
  questions: MCQ[];
  onSubmitted: (attemptId: string) => void;
}) {
  const examId = session.exam.id;
  const answer = useExams((s) => s.answer);
  const setCurrent = useExams((s) => s.setCurrent);
  const submitExam = useExams((s) => s.submitExam);
  const abandonExam = useExams((s) => s.abandonExam);
  const flagged = useProgress((s) => s.flagged);

  const [now, setNow] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"submit" | "abandon" | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const submitted = useRef(false);
  const lastMark = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remaining = remainingSeconds(session.startedAt, session.durationSec, now);
  const total = questions.length;
  const i = Math.min(Math.max(0, session.current), Math.max(0, total - 1));
  const q = questions[i];
  const answeredCount = questions.filter((x) => session.answers[x.id] !== undefined).length;
  const unanswered = total - answeredCount;

  const submit = useCallback(
    (timedOut: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      const id = submitExam(examId, questions, timedOut);
      if (id) onSubmitted(id);
    },
    [submitExam, examId, questions, onSubmitted],
  );

  useEffect(() => {
    if (remaining === 0) submit(true);
    const mark = TIME_MARKS.find((m) => remaining <= m && remaining > m - 5);
    if (mark !== undefined && lastMark.current !== mark) {
      lastMark.current = mark;
      setAnnouncement(`Còn ${Math.round(mark / 60)} phút.`);
    }
  }, [remaining, submit]);

  const go = useCallback(
    (n: number) => {
      setCurrent(examId, Math.min(Math.max(0, n), total - 1));
      setNavOpen(false);
    },
    [setCurrent, examId, total],
  );

  // Enter → next question (ignored while a dialog is open or focus is on an interactive element).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || dialog || navOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(tag)) return;
      e.preventDefault();
      go(i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, navOpen, go, i]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const onSelect = useCallback((opt: OptionId) => q && answer(examId, q.id, opt), [answer, examId, q]);

  const requestSubmit = () => (unanswered > 0 ? setDialog("submit") : submit(false));
  const low = remaining <= 300;

  const navigator = <Navigator questions={questions} answers={session.answers} flagged={flagged} current={i} onGo={go} />;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
      <div className="min-w-0">
        <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border dark:border-slate-800 dark:bg-slate-900/95">
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-navy-900 dark:text-white">{session.exam.title}</h1>
          <p
            role="timer"
            aria-label="Thời gian còn lại"
            className={cx(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold tabular-nums",
              low ? "bg-red-50 text-wrong dark:bg-red-950/50 dark:text-red-300" : "text-slate-800 dark:text-slate-100",
            )}
          >
            <Icon name="clock" className="h-4 w-4" />
            {formatClock(remaining)}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Đã làm <strong className="tabular-nums">{answeredCount}</strong>/{total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="lg:hidden" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
              <Icon name="grid" className="h-4 w-4" /> Danh sách câu
            </Button>
            <Button onClick={requestSubmit}>Nộp bài</Button>
          </div>
          <span className="sr-only" aria-live="polite">
            {announcement}
          </span>
        </div>

        {q && (
          <QuestionCard
            key={q.id}
            question={q}
            order={optionOrderOf(session.exam, q.id)}
            selected={session.answers[q.id] ?? null}
            onSelect={onSelect}
            reveal={false}
            keyboard={!dialog && !navOpen}
            index={i}
            total={total}
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" disabled={i === 0} onClick={() => go(i - 1)}>
            ← Câu trước
          </Button>
          {i < total - 1 ? (
            <Button onClick={() => go(i + 1)}>Câu tiếp →</Button>
          ) : (
            <Button onClick={requestSubmit}>Nộp bài</Button>
          )}
          <Button variant="ghost" className="ml-auto" onClick={() => setDialog("abandon")}>
            Hủy bài này
          </Button>
        </div>
      </div>

      <aside className="hidden lg:block" aria-label="Điều hướng câu hỏi">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">{navigator}</div>
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Danh sách câu hỏi">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-navy-900 dark:text-white">Danh sách câu</p>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Đóng"
                onClick={() => setNavOpen(false)}
                autoFocus
              >
                <Icon name="close" />
              </button>
            </div>
            {navigator}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={dialog === "submit"}
        title="Nộp bài?"
        confirmLabel="Nộp bài"
        cancelLabel="Làm tiếp"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          submit(false);
        }}
      >
        Bạn còn <strong>{unanswered}</strong> câu chưa trả lời. Câu bỏ trống sẽ tính là sai.
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "abandon"}
        title="Hủy bài đang làm?"
        confirmLabel="Hủy bài"
        cancelLabel="Làm tiếp"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          abandonExam(examId);
        }}
      >
        Toàn bộ câu trả lời của lượt này sẽ bị xóa và không được lưu vào lịch sử.
      </ConfirmDialog>
    </div>
  );
}
