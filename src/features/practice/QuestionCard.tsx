import { useEffect } from "react";
import { Link } from "react-router-dom";
import { TOPIC_DIAGRAM, diagramHref } from "@/features/diagrams/topicMap";
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { OPTION_IDS } from "@/schemas/constants";
import type { MCQ, OptionId } from "@/schemas/mcq";
import { useProgress } from "@/store/progressStore";
import { CHAPTER_BY_ID, topicLabel } from "@/config/chapters";

const LETTERS = ["A", "B", "C", "D"] as const;

export interface QuestionCardProps {
  question: MCQ;
  /** Display order of option ids (from exams.json); defaults to a, b, c, d. */
  order?: OptionId[];
  selected: OptionId | null;
  onSelect: (id: OptionId) => void;
  /** Show correctness + explanation (instant-feedback mode). */
  reveal: boolean;
  /** Enable A–D / 1–4 and F keyboard shortcuts. */
  keyboard?: boolean;
  index?: number;
  total?: number;
}

/** Explanation layout per PROMPT §5.3, with letters mapped to the displayed order. */
export function Explanation({ question, order }: { question: MCQ; order: OptionId[] }) {
  const ex = question.explanation;
  const letterOf = (id: OptionId) => LETTERS[order.indexOf(id)]!;
  const correctText = question.options.find((o) => o.id === question.correct)?.text;
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[0.95rem] dark:border-slate-800 dark:bg-slate-900/60">
      <p className="font-semibold text-green-800 dark:text-green-300">
        ✔ Đáp án đúng: {letterOf(question.correct)} — {correctText}
      </p>
      <p>
        <span className="font-semibold">Tóm tắt: </span>
        {ex.summary}
      </p>
      <p>
        <span className="font-semibold">Vì sao đúng: </span>
        {ex.whyCorrect}
      </p>
      <div>
        <p className="font-semibold">Vì sao các phương án khác sai:</p>
        <ul className="mt-1 space-y-1">
          {order
            .filter((id) => id !== question.correct)
            .map((id) => (
              <li key={id}>
                <span className="font-semibold">{letterOf(id)}:</span> {ex.whyWrong[id]}
              </li>
            ))}
        </ul>
      </div>
      {ex.trap && (
        <p className="rounded-lg bg-amber-50 p-2 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-semibold">⚠ Bẫy thường gặp: </span>
          {ex.trap}
        </p>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-400">📘 Nguồn: {ex.source}</p>
      {TOPIC_DIAGRAM[question.topic] && (
        <Link
          to={diagramHref(TOPIC_DIAGRAM[question.topic]!)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-300 px-3 py-1 text-sm font-medium text-navy-800 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-900/50"
        >
          <Icon name="grid" className="h-4 w-4" /> Xem trên sơ đồ
        </Link>
      )}
      {ex.extNote && (
        <details className="rounded-lg border border-violet-200 p-2 text-sm dark:border-violet-900">
          <summary className="cursor-pointer font-semibold text-violet-800 dark:text-violet-300">➕ Lưu ý mở rộng</summary>
          <p className="mt-1">{ex.extNote}</p>
        </details>
      )}
    </div>
  );
}

export function QuestionCard({ question, order = [...OPTION_IDS], selected, onSelect, reveal, keyboard, index, total }: QuestionCardProps) {
  const flagged = useProgress((s) => s.flagged[question.id] !== undefined);
  const toggleFlag = useProgress((s) => s.toggleFlag);
  const chapter = CHAPTER_BY_ID[question.chapter];

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const k = e.key.toLowerCase();
      const pos = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
      if (pos >= 0 && !reveal) {
        const id = order[pos];
        if (id) onSelect(id);
      } else if (k === "f") toggleFlag(question.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, order, onSelect, reveal, toggleFlag, question.id]);

  const isCorrect = selected === question.correct;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" aria-label="Câu hỏi">
      <header className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {index !== undefined && total !== undefined && (
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Câu {index + 1}/{total}
          </span>
        )}
        <span className="rounded px-1.5 py-0.5 font-semibold text-white" style={{ backgroundColor: chapter.color }}>
          {chapter.id}
        </span>
        <span>{topicLabel(question.chapter, question.topic)}</span>
        <span aria-label={`Độ khó ${question.difficulty}`}>{"●".repeat(question.difficulty) + "○".repeat(3 - question.difficulty)}</span>
        <button
          type="button"
          onClick={() => toggleFlag(question.id)}
          aria-pressed={flagged}
          className={cx(
            "ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1",
            flagged ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" : "hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
          title="Đánh dấu (F)"
        >
          <Icon name="flag" className="h-4 w-4" /> {flagged ? "Đã đánh dấu" : "Đánh dấu"}
        </button>
      </header>
      <p className="mb-4 whitespace-pre-line font-medium text-slate-900 dark:text-white">{question.stem}</p>
      <div role="radiogroup" aria-label="Các phương án" className="space-y-2">
        {order.map((id, pos) => {
          const opt = question.options.find((o) => o.id === id)!;
          const chosen = selected === id;
          const showCorrect = reveal && id === question.correct;
          const showWrong = reveal && chosen && !isCorrect;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={reveal}
              onClick={() => onSelect(id)}
              className={cx(
                "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150",
                showCorrect && "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-950/40",
                showWrong && "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950/40",
                !showCorrect && !showWrong && chosen && "border-navy-600 bg-navy-50 dark:border-navy-300 dark:bg-navy-900/50",
                !showCorrect && !showWrong && !chosen && "border-slate-200 hover:border-navy-300 dark:border-slate-700 dark:hover:border-navy-500",
                reveal && "cursor-default",
              )}
            >
              <span
                className={cx(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  showCorrect ? "border-green-600 bg-green-600 text-white" : showWrong ? "border-red-600 bg-red-600 text-white" : "border-slate-400",
                )}
              >
                {LETTERS[pos]}
              </span>
              <span className="flex-1">{opt.text}</span>
              {showCorrect && <span className="sr-only">(đáp án đúng)</span>}
              {showWrong && <span className="sr-only">(bạn chọn – sai)</span>}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {reveal && selected && (
          <p className={cx("mt-4 font-semibold", isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}>
            {isCorrect ? "Chính xác!" : `Chưa đúng — bạn chọn ${LETTERS[order.indexOf(selected)]}.`}
          </p>
        )}
      </div>
      {reveal && <Explanation question={question} order={order} />}
    </article>
  );
}
