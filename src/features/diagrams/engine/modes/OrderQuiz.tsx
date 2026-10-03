import { useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button, cx } from "@/components/ui";
import { createRng } from "@/lib/rng";
import { quizSteps, scoreOrder, shuffledForOrderQuiz, type OrderResult } from "../quiz";
import type { DiagramStep, ResolvedSpec } from "../types";

const SR_INSTRUCTIONS =
  "Để di chuyển một bước: đưa tiêu điểm vào tay nắm ⠿, nhấn Space để nhấc, dùng phím mũi tên lên/xuống để di chuyển, nhấn Space để thả, Esc để hủy. Hoặc dùng các nút ↑ ↓.";

function SortableCard({
  step,
  index,
  total,
  result,
  onMove,
}: {
  step: DiagramStep;
  index: number;
  total: number;
  result: OrderResult | null;
  onMove: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: step.id, disabled: !!result });
  const ok = result?.correctAt[index];
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={cx(
        "flex items-center gap-2 rounded-lg border bg-white px-2 py-2 dark:bg-slate-900",
        isDragging && "z-10 shadow-lg",
        result ? (ok ? "border-green-600 bg-green-50 dark:bg-green-950/30" : "border-red-600 bg-red-50 dark:bg-red-950/30") : "border-slate-200 dark:border-slate-700",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Kéo bước: ${step.titleVi}`}
        className="cursor-grab touch-none rounded px-1.5 py-1 text-lg leading-none text-slate-500 hover:bg-slate-100 disabled:cursor-default dark:hover:bg-slate-800"
        disabled={!!result}
      >
        ⠿
      </button>
      <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-500">{index + 1}.</span>
      <span className="min-w-0 flex-1 text-sm">
        {step.titleVi}
        <span className="block text-xs italic text-slate-500 dark:text-slate-400" lang="en">
          {step.title}
        </span>
      </span>
      {result && !ok && (
        <span className="shrink-0 rounded bg-red-600 px-1.5 text-xs font-bold text-white" aria-label={`Đúng phải là vị trí ${result.correctPosition[index]}`}>
          → {result.correctPosition[index]}
        </span>
      )}
      {!result && (
        <span className="flex shrink-0 flex-col">
          <button type="button" className="rounded px-1 text-xs hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label={`Đưa “${step.titleVi}” lên`}>
            ↑
          </button>
          <button type="button" className="rounded px-1 text-xs hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800" onClick={() => onMove(index, index + 1)} disabled={index === total - 1} aria-label={`Đưa “${step.titleVi}” xuống`}>
            ↓
          </button>
        </span>
      )}
    </li>
  );
}

/** "Sắp xếp các bước": drag the shuffled steps into slide order. */
export function OrderQuiz({ spec, onScore, seed }: { spec: ResolvedSpec; onScore: (pct: number) => void; seed?: number }) {
  const correct = useMemo(() => quizSteps(spec), [spec]);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState(() => shuffledForOrderQuiz(correct, createRng(seed ?? Date.now())));
  const [result, setResult] = useState<OrderResult | null>(null);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const move = (from: number, to: number) => setItems((it) => (to < 0 || to >= it.length ? it : arrayMove(it, from, to)));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((s) => s.id === e.active.id);
    const to = items.findIndex((s) => s.id === e.over!.id);
    move(from, to);
  };
  const check = () => {
    const r = scoreOrder(
      items.map((s) => s.id),
      correct.map((s) => s.id),
    );
    setResult(r);
    onScore(r.pct);
  };
  const again = () => {
    setRound((r) => r + 1);
    setItems(shuffledForOrderQuiz(correct, createRng((seed ?? Date.now()) + round + 1)));
    setResult(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 dark:text-slate-300">Kéo các bước vào đúng thứ tự như trên slide, rồi bấm “Kiểm tra”.</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{ screenReaderInstructions: { draggable: SR_INSTRUCTIONS } }}
      >
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-1.5" aria-label="Các bước cần sắp xếp">
            {items.map((s, i) => (
              <SortableCard key={s.id} step={s} index={i} total={items.length} result={result} onMove={move} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <div className="flex flex-wrap items-center gap-3">
        {!result ? (
          <Button onClick={check}>Kiểm tra</Button>
        ) : (
          <>
            <p className={cx("font-semibold", result.pct === 100 ? "text-correct dark:text-green-400" : "text-wrong dark:text-red-400")} aria-live="polite">
              {result.pct === 100 ? "Chính xác 100% — đã thành thạo sơ đồ này!" : `Đúng ${result.correctAt.filter(Boolean).length}/${items.length} vị trí (${result.pct}%).`}
            </p>
            <Button variant="secondary" onClick={again}>
              Làm lại
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
