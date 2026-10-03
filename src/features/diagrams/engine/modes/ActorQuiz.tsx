import { useMemo, useState } from "react";
import { Button, cx } from "@/components/ui";
import { DiagramCanvas, type NodeMark } from "../DiagramCanvas";
import { performerOf, quizSteps } from "../quiz";
import { stepLabel, type ResolvedSpec } from "../types";

const NONE: ReadonlySet<string> = new Set();

/** "Ai làm bước này?": labels hidden; click the node that performs each step. */
export function ActorQuiz({ spec, onScore }: { spec: ResolvedSpec; onScore: (pct: number) => void }) {
  const steps = useMemo(() => quizSteps(spec), [spec]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const step = steps[i];
  if (!step) return <p>Sơ đồ này không có bước để đố.</p>;
  const answer = performerOf(step);
  const name = (id: string) => spec.nodes.find((n) => n.id === id)?.label.replace(/\n/g, " ") ?? id;

  const marks: Record<string, NodeMark> = {};
  if (picked) {
    marks[answer] = "correct";
    if (picked !== answer) marks[picked] = "wrong";
  }

  const pick = (id: string) => {
    if (picked || done) return;
    setPicked(id);
    if (id === answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= steps.length) {
      setDone(true);
      onScore(Math.round((score / steps.length) * 100));
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  return (
    <div className="space-y-3">
      {!done ? (
        <div className="rounded-xl border border-navy-200 bg-navy-50/60 p-3 dark:border-navy-800 dark:bg-navy-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Câu {i + 1}/{steps.length} · Ai thực hiện bước này?
          </p>
          <p className="mt-1 font-semibold text-navy-900 dark:text-white">
            Bước {stepLabel(step)}: {step.titleVi}
          </p>
          <p className="text-sm italic text-slate-600 dark:text-slate-400" lang="en">
            {step.title}
          </p>
          <div aria-live="polite" className="mt-2 flex flex-wrap items-center gap-3">
            {picked && (
              <p className={cx("text-sm font-semibold", picked === answer ? "text-correct dark:text-green-400" : "text-wrong dark:text-red-400")}>
                {picked === answer ? `Đúng — ${name(answer)}.` : `Chưa đúng — người thực hiện là ${name(answer)}.`}
              </p>
            )}
            {picked && <Button onClick={next}>{i + 1 >= steps.length ? "Xem kết quả" : "Câu tiếp →"}</Button>}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          <p className={cx("font-semibold", score === steps.length ? "text-correct dark:text-green-400" : "text-slate-800 dark:text-slate-200")}>
            Kết quả: {score}/{steps.length} ({Math.round((score / steps.length) * 100)}%)
            {score === steps.length && " — đã thành thạo!"}
          </p>
          <Button variant="secondary" onClick={restart}>
            Làm lại
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-[36rem]">
          <DiagramCanvas
            spec={spec}
            activeSteps={[]}
            visited={NONE}
            quizMode={!done}
            nodeMarks={marks}
            onNodeClick={pick}
            ariaLabel={`Đố: ai thực hiện bước ${stepLabel(step)}`}
          />
        </div>
      </div>
    </div>
  );
}
