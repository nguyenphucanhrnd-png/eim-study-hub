import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { Legend } from "./Legend";
import { ActorQuiz } from "./modes/ActorQuiz";
import { ExploreMode, type ExploreModeProps } from "./modes/ExploreMode";
import { GapQuiz } from "./modes/GapQuiz";
import { OrderQuiz } from "./modes/OrderQuiz";
import type { PoolStep, QuizKind } from "./quiz";
import type { StepBadge } from "./StepPanel";
import { provenanceLabel } from "./style";
import { resolveVariant, type DiagramSpec } from "./types";
import { EXPLORED_MARK, STATUS_CHIP, STATUS_VI, allViewed, useDiagramProgress } from "./useDiagramProgress";

type Mode = "explore" | QuizKind;

const MODE_LABEL: Record<Mode, string> = {
  explore: "Khám phá",
  order: "Sắp xếp các bước",
  actor: "Ai làm bước này?",
  gap: "Bước còn thiếu",
};

/** Step pool of all other diagrams (lazy: loads every spec only when the gap quiz opens). */
const loadPool = (): Promise<PoolStep[]> => import("../catalog").then((m) => m.loadStepPool());

export interface DiagramViewerProps {
  spec: DiagramSpec;
  focusStepId?: string | null;
  initialVariant?: string | null;
  onVariantChange?: (id: string | null) => void;
  stepBadges?: Record<string, StepBadge>;
  highlight?: ExploreModeProps["highlight"];
  hiddenNodeIds?: ReadonlySet<string>;
  /** Extra controls shown above the canvas in Explore mode. */
  toolbar?: ReactNode;
  /** Extra content under the canvas in Explore mode (e.g. document chips, mapping tables). */
  below?: ReactNode;
  /** Additional quiz tabs provided by a wrapper (e.g. a classification quiz). */
  extraModes?: { id: string; label: string; render: (onScore: (pct: number) => void) => ReactNode }[];
}

/** The complete interactive diagram: provenance, variants, modes, legend, takeaways. */
export function DiagramViewer({ spec, focusStepId, initialVariant, onVariantChange, stepBadges, highlight, hiddenNodeIds, toolbar, below, extraModes }: DiagramViewerProps) {
  const [variantId, setVariantId] = useState<string | null>(initialVariant ?? spec.variants?.[0]?.id ?? null);
  const resolved = useMemo(() => resolveVariant(spec, variantId), [spec, variantId]);
  const [mode, setMode] = useState<string>("explore");
  const [flash, setFlash] = useState<ReadonlySet<string>>(new Set());
  const prevSteps = useRef(resolved.steps);
  const progress = useDiagramProgress(spec.id);

  // Flash the steps that changed after a variant switch, so the student sees what is different.
  useEffect(() => {
    const before = new Map(prevSteps.current.map((s) => [s.id, JSON.stringify(s)]));
    const changed = resolved.steps.filter((s) => before.get(s.id) !== JSON.stringify(s)).map((s) => s.id);
    prevSteps.current = resolved.steps;
    if (changed.length === 0) return;
    setFlash(new Set(changed));
    const t = window.setTimeout(() => setFlash(new Set()), 1800);
    return () => window.clearTimeout(t);
  }, [resolved.steps]);

  useEffect(() => {
    if (initialVariant != null && initialVariant !== variantId) setVariantId(initialVariant);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- external control
  }, [initialVariant]);

  const visited = useMemo(() => new Set(progress.viewed.map((id) => id.replace(/^[sn]:/, ""))), [progress.viewed]);
  const required = useMemo(
    () => (spec.steps.length > 0 ? spec.steps.map((s) => `s:${s.id}`) : spec.nodes.map((n) => `n:${n.id}`)),
    [spec],
  );
  const onViewed = useCallback(
    (ids: string[]) => {
      const nodeIds = new Set(resolved.nodes.map((n) => n.id));
      const stepIds = new Set(resolved.steps.map((s) => s.id));
      const prefixed = ids.map((id) => (stepIds.has(id) ? `s:${id}` : nodeIds.has(id) ? `n:${id}` : id));
      const next = [...progress.viewed, ...prefixed];
      if (!progress.viewed.includes(EXPLORED_MARK) && allViewed(next, required)) prefixed.push(EXPLORED_MARK);
      progress.markViewed(prefixed);
    },
    [progress, required, resolved],
  );

  const quizzes: { id: string; label: string }[] = [
    ...(spec.quiz?.order ? [{ id: "order", label: MODE_LABEL.order }] : []),
    ...(spec.quiz?.actor ? [{ id: "actor", label: MODE_LABEL.actor }] : []),
    ...(spec.quiz?.gap ? [{ id: "gap", label: MODE_LABEL.gap }] : []),
    ...(extraModes ?? []).map((m) => ({ id: m.id, label: m.label })),
  ];
  const modes = [{ value: "explore", label: MODE_LABEL.explore }, ...quizzes.map((q) => ({ value: q.id, label: q.label }))];
  const onScore = (kind: string) => (pct: number) => progress.recordQuiz(kind, pct);
  const extra = extraModes?.find((m) => m.id === mode);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cx(
            "rounded-md px-2 py-0.5 font-semibold",
            spec.provenance === "slide" ? "bg-navy-50 text-navy-800 dark:bg-navy-900/60 dark:text-navy-200" : "bg-violet-50 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
          )}
        >
          {provenanceLabel(spec.provenance, spec.slideRef)}
        </span>
        <span className={cx("rounded-md px-2 py-0.5 font-semibold", STATUS_CHIP[progress.status])}>{STATUS_VI[progress.status]}</span>
        {spec.note && <span className="text-slate-600 dark:text-slate-400">· {spec.note}</span>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {modes.length > 1 && <Segmented label="Chế độ" value={mode} options={modes} onChange={setMode} />}
        {spec.variants && spec.variants.length > 0 && (
          <Segmented
            label="Biến thể"
            value={variantId ?? ""}
            options={spec.variants.map((v) => ({ value: v.id, label: v.label }))}
            onChange={(v) => {
              setVariantId(v);
              onVariantChange?.(v);
            }}
          />
        )}
      </div>
      {resolved.variantNote && <p className="text-sm text-slate-700 dark:text-slate-300">{resolved.variantNote}</p>}

      <Legend spec={resolved} />

      {mode === "explore" && (
        <>
          <ExploreMode
            spec={resolved}
            focusStepId={focusStepId}
            stepBadges={stepBadges}
            highlight={highlight}
            hiddenNodeIds={hiddenNodeIds}
            flashStepIds={flash}
            visited={visited}
            onViewed={onViewed}
            toolbar={toolbar}
          />
          {below}
        </>
      )}
      {mode === "order" && <OrderQuiz key={resolved.variantId ?? "base"} spec={resolved} onScore={onScore("order")} />}
      {mode === "actor" && <ActorQuiz key={resolved.variantId ?? "base"} spec={resolved} onScore={onScore("actor")} />}
      {mode === "gap" && <GapQuiz key={resolved.variantId ?? "base"} spec={resolved} loadPool={loadPool} onScore={onScore("gap")} />}
      {extra && extra.render(onScore(extra.id))}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="mb-1 text-sm font-semibold text-navy-900 dark:text-white">Ghi nhớ</p>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-800 dark:text-slate-200">
          {resolved.keyTakeaways.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
