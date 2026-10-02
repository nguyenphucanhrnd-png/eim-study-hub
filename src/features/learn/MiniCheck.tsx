import { useCallback, useEffect, useState } from "react";
import type { ChapterId } from "@/config/chapters";
import { afterPaint, loadChapterQuestions } from "@/data";
import { useAsync } from "@/lib/useAsync";
import { createRng, shuffle } from "@/lib/rng";
import { useProgress } from "@/store/progressStore";
import { Button, Card } from "@/components/ui";
import { QuestionCard } from "@/features/practice/QuestionCard";
import type { MCQ, OptionId } from "@/schemas/mcq";

const SIZE = 5;

/** End-of-chapter mini-check: 5 random questions from the chapter with instant feedback. */
export function MiniCheck({ chapter }: { chapter: ChapterId }) {
  const bank = useAsync(() => afterPaint().then(() => loadChapterQuestions(chapter)), [chapter]);
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const [round, setRound] = useState(0);
  const [set, setSet] = useState<MCQ[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionId>>({});

  useEffect(() => {
    if (bank.status !== "ready") return;
    setSet(shuffle(bank.data, createRng(Date.now() + round)).slice(0, SIZE));
    setI(0);
    setAnswers({});
  }, [bank, round]);

  const q = set[i];
  const onSelect = useCallback(
    (id: OptionId) => {
      if (!q || answers[q.id]) return;
      setAnswers((a) => ({ ...a, [q.id]: id }));
      recordAnswer(q.id, id === q.correct);
    },
    [q, answers, recordAnswer],
  );

  if (bank.status === "loading") return <p role="status">Đang tải câu hỏi…</p>;
  if (bank.status === "error" || set.length === 0)
    return (
      <Card className="border-dashed text-center text-slate-600 dark:text-slate-400">
        Chưa có câu hỏi cho chương này.
      </Card>
    );

  const done = Object.keys(answers).length === set.length;
  const score = set.filter((x) => answers[x.id] === x.correct).length;

  return (
    <div className="space-y-3">
      {q && (
        <QuestionCard question={q} selected={answers[q.id] ?? null} onSelect={onSelect} reveal={!!answers[q.id]} index={i} total={set.length} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← Câu trước
        </Button>
        <Button disabled={!q || !answers[q.id] || i === set.length - 1} onClick={() => setI(i + 1)}>
          Câu tiếp →
        </Button>
        {done && (
          <>
            <span className="font-semibold" aria-live="polite">
              Kết quả: {score}/{set.length}
            </span>
            <Button variant="ghost" onClick={() => setRound((r) => r + 1)}>
              Làm bộ khác
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
