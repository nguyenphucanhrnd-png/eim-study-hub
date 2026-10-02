import { useCallback, useEffect, useState } from "react";
import { Button, ButtonLink, Card, cx } from "@/components/ui";
import { CHAPTER_BY_ID } from "@/config/chapters";
import type { MCQ, OptionId } from "@/schemas/mcq";
import { useProgress } from "@/store/progressStore";
import { QuestionCard } from "./QuestionCard";

/**
 * Instant-feedback practice over a fixed list of questions. Every answer is recorded in the progress
 * store (stats + wrong-answer bank). Enter moves to the next question once the current one is answered.
 */
export function PracticeSession({
  questions,
  onExit,
  onRestart,
  exitLabel = "Đổi bộ lọc",
}: {
  questions: MCQ[];
  onExit: () => void;
  onRestart: () => void;
  exitLabel?: string;
}) {
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionId>>({});
  const [finished, setFinished] = useState(false);

  const q = questions[i];
  const total = questions.length;
  const answered = q ? answers[q.id] !== undefined : false;

  const onSelect = useCallback(
    (id: OptionId) => {
      if (!q || answers[q.id] !== undefined) return;
      setAnswers((a) => ({ ...a, [q.id]: id }));
      recordAnswer(q.id, id === q.correct);
    },
    [q, answers, recordAnswer],
  );

  const next = useCallback(() => {
    if (!answered) return;
    if (i < total - 1) setI(i + 1);
    else setFinished(true);
  }, [answered, i, total]);

  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (/^(BUTTON|A|INPUT|TEXTAREA|SELECT|SUMMARY)$/.test(tag)) return;
      e.preventDefault();
      next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, finished]);

  const correctCount = questions.filter((x) => answers[x.id] === x.correct).length;
  const answeredCount = Object.keys(answers).length;

  if (finished) {
    const wrong = questions.filter((x) => answers[x.id] !== undefined && answers[x.id] !== x.correct);
    return (
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-navy-900 dark:text-white">Hoàn thành!</h2>
        <p className="text-lg" aria-live="polite">
          Đúng <strong className="tabular-nums">{correctCount}</strong>/{total} câu ({Math.round((correctCount / total) * 100)}%).
        </p>
        {wrong.length > 0 && (
          <div>
            <p className="mb-1 font-medium">Câu sai (đã vào ngân hàng câu sai):</p>
            <ul className="space-y-1 text-sm">
              {wrong.map((x) => (
                <li key={x.id} className="flex gap-2">
                  <span className="h-fit shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: CHAPTER_BY_ID[x.chapter].color }}>
                    {x.chapter}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{x.stem}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRestart}>Luyện bộ mới</Button>
          <Button variant="secondary" onClick={onExit}>
            {exitLabel}
          </Button>
          {wrong.length > 0 && (
            <ButtonLink to="/review" variant="ghost">
              Ôn câu sai
            </ButtonLink>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>
          Đã làm <strong className="tabular-nums">{answeredCount}</strong>/{total} · Đúng{" "}
          <strong className="tabular-nums text-correct dark:text-green-400">{correctCount}</strong>
        </span>
        <div className="flex flex-1 gap-0.5" aria-hidden>
          {questions.map((x, k) => (
            <span
              key={x.id}
              className={cx(
                "h-1.5 flex-1 rounded-full",
                answers[x.id] === undefined
                  ? k === i
                    ? "bg-navy-400"
                    : "bg-slate-200 dark:bg-slate-800"
                  : answers[x.id] === x.correct
                    ? "bg-correct"
                    : "bg-wrong",
              )}
            />
          ))}
        </div>
        <Button variant="ghost" onClick={onExit}>
          {exitLabel}
        </Button>
      </div>

      {q && <QuestionCard key={q.id} question={q} selected={answers[q.id] ?? null} onSelect={onSelect} reveal={answered} keyboard index={i} total={total} />}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← Câu trước
        </Button>
        <Button disabled={!answered} onClick={next}>
          {i < total - 1 ? "Câu tiếp →" : "Xem kết quả"}
        </Button>
        {answered && <span className="text-xs text-slate-500 dark:text-slate-400">hoặc nhấn Enter</span>}
      </div>
    </div>
  );
}
