import { useEffect, useMemo, useState } from "react";
import { Button, cx } from "@/components/ui";
import { createRng } from "@/lib/rng";
import { buildGapQuestion, quizSteps, type GapQuestion, type PoolStep } from "../quiz";
import { stepLabel, type ResolvedSpec } from "../types";

export const GAP_ROUNDS = 3;

/** "Bước còn thiếu": one step is blanked; choose it among 4 (distractors from other diagrams). */
export function GapQuiz({
  spec,
  loadPool,
  onScore,
  seed,
}: {
  spec: ResolvedSpec;
  loadPool: () => Promise<PoolStep[]>;
  onScore: (pct: number) => void;
  seed?: number;
}) {
  const steps = useMemo(() => quizSteps(spec), [spec]);
  const [pool, setPool] = useState<PoolStep[] | null>(null);
  const [round, setRound] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    loadPool().then((p) => live && setPool(p));
    return () => {
      live = false;
    };
  }, [loadPool]);

  const base = seed ?? 7;
  const question: GapQuestion | null = useMemo(
    () => (pool ? buildGapQuestion(steps, spec.id, pool, createRng(base * 101 + attempt * 31 + round)) : null),
    [pool, steps, spec.id, base, attempt, round],
  );

  if (!pool) return <p role="status">Đang chuẩn bị câu hỏi…</p>;
  if (!question) return <p>Chưa đủ dữ liệu để tạo câu hỏi cho sơ đồ này.</p>;

  const check = (key: string) => {
    if (picked) return;
    setPicked(key);
    if (key === question.answerKey) setScore((s) => s + 1);
  };
  const next = () => {
    if (round + 1 >= GAP_ROUNDS) {
      setDone(true);
      onScore(Math.round((score / GAP_ROUNDS) * 100));
    } else {
      setRound(round + 1);
      setPicked(null);
    }
  };
  const restart = () => {
    setAttempt((a) => a + 1);
    setRound(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done)
    return (
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <p className={cx("font-semibold", score === GAP_ROUNDS ? "text-correct dark:text-green-400" : "text-slate-800 dark:text-slate-200")}>
          Kết quả: {score}/{GAP_ROUNDS}
          {score === GAP_ROUNDS && " — đã thành thạo!"}
        </p>
        <Button variant="secondary" onClick={restart}>
          Làm lại
        </Button>
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Lượt {round + 1}/{GAP_ROUNDS} · Quy trình (một bước bị che)
        </p>
        <ol className="space-y-1 text-sm">
          {steps.map((s, i) => (
            <li key={s.id} className={cx("flex gap-2 rounded-md px-2 py-1", i === question.blankIndex && "bg-amber-50 font-semibold dark:bg-amber-950/40")}>
              <span className="w-6 shrink-0 tabular-nums text-slate-500">{stepLabel(s)}.</span>
              <span>{i === question.blankIndex ? (picked ? s.titleVi : "_______________ ?") : s.titleVi}</span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Bước bị che là bước nào?</p>
        <div role="radiogroup" aria-label="Các lựa chọn" className="space-y-2">
          {question.options.map((o) => {
            const isAnswer = o.key === question.answerKey;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={picked === o.key}
                onClick={() => check(o.key)}
                disabled={!!picked}
                className={cx(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm",
                  picked && isAnswer && "border-green-600 bg-green-50 dark:bg-green-950/30",
                  picked === o.key && !isAnswer && "border-red-600 bg-red-50 dark:bg-red-950/30",
                  !picked && "border-slate-200 hover:border-navy-400 dark:border-slate-700",
                )}
              >
                {o.titleVi}
                <span className="block text-xs italic text-slate-500 dark:text-slate-400" lang="en">
                  {o.title}
                </span>
              </button>
            );
          })}
        </div>
        <div aria-live="polite" className="mt-3 flex items-center gap-3">
          {picked && (
            <>
              <p className={cx("text-sm font-semibold", picked === question.answerKey ? "text-correct dark:text-green-400" : "text-wrong dark:text-red-400")}>
                {picked === question.answerKey ? "Chính xác!" : "Chưa đúng — các phương án khác là bước của sơ đồ khác."}
              </p>
              <Button onClick={next}>{round + 1 >= GAP_ROUNDS ? "Xem kết quả" : "Lượt tiếp →"}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
