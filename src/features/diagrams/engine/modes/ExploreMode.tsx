import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { DiagramCanvas, type DiagramCanvasProps } from "../DiagramCanvas";
import type { TokenRun } from "../FlowToken";
import { MobileStepList } from "../MobileStepList";
import { PlayerControls } from "../PlayerControls";
import { StepPanel, type Selection, type StepBadge } from "../StepPanel";
import { playFrames, stepLabel, type ResolvedSpec } from "../types";
import { STEP_MS, usePlayer } from "./PlayMode";

export interface ExploreModeProps {
  spec: ResolvedSpec;
  focusStepId?: string | null;
  stepBadges?: Record<string, StepBadge>;
  highlight?: DiagramCanvasProps["highlight"];
  hiddenNodeIds?: ReadonlySet<string>;
  flashStepIds?: ReadonlySet<string>;
  visited: ReadonlySet<string>;
  onViewed: (ids: string[]) => void;
  /** Rendered between the controls and the canvas (e.g. scenario selectors). */
  toolbar?: ReactNode;
}

export function ExploreMode({ spec, focusStepId, stepBadges, highlight, hiddenNodeIds, flashStepIds, visited, onViewed, toolbar }: ExploreModeProps) {
  const frames = useMemo(() => playFrames(spec), [spec]);
  const player = usePlayer(frames.length);
  const [selection, setSelection] = useState<Selection>(null);
  const [tokens, setTokens] = useState<TokenRun[]>([]);
  const runKey = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasSteps = spec.steps.length > 0;

  const frame = player.index >= 0 ? (frames[player.index] ?? []) : [];
  const activeIds = useMemo(() => new Set(frame.map((s) => s.id)), [frame]);

  // Entering a frame: select its first step, record it as viewed and run a token along each edge.
  useEffect(() => {
    if (frame.length === 0) return;
    setSelection({ type: "step", id: frame[0]!.id });
    onViewed(frame.map((s) => s.id));
    runKey.current += 1;
    const dur = Math.min(1.6, (STEP_MS / 1000) * 0.55) / Number(player.speed);
    setTokens(frame.flatMap((s) => (s.edgeIds[0] ? [{ edgeId: s.edgeIds[0], key: runKey.current, durationSec: dur }] : [])));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the frame changes
  }, [player.index, frames]);

  // Deep link (?step=…): jump to that step once.
  useEffect(() => {
    if (!focusStepId) return;
    const i = frames.findIndex((f) => f.some((s) => s.id === focusStepId));
    if (i >= 0) {
      player.goTo(i);
      rootRef.current?.scrollIntoView({ block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusStepId]);

  const selectStep = (id: string) => {
    const i = frames.findIndex((f) => f.some((s) => s.id === id));
    player.setPlaying(false);
    if (i >= 0 && i !== player.index) player.goTo(i);
    else setSelection({ type: "step", id });
    onViewed([id]);
  };
  const selectNode = (id: string) => {
    setSelection({ type: "node", id });
    onViewed([id]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (e.key === "ArrowRight" && hasSteps) {
      e.preventDefault();
      player.setPlaying(false);
      player.next();
    } else if (e.key === "ArrowLeft" && hasSteps) {
      e.preventDefault();
      player.setPlaying(false);
      player.prev();
    } else if (e.key === " " && hasSteps && !/^(BUTTON|A|SUMMARY)$/.test(tag) && (e.target as HTMLElement).getAttribute("role") !== "button") {
      e.preventDefault();
      player.toggle();
    } else if (e.key === "Escape") {
      setSelection(null);
    }
  };

  const current = frame[0];
  const announcement = current ? `Bước ${stepLabel(current)}: ${current.titleVi}` : "";

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className="space-y-3">
      {hasSteps && (
        <PlayerControls
          index={player.index}
          total={frames.length}
          playing={player.playing}
          speed={player.speed}
          onPrev={() => {
            player.setPlaying(false);
            player.prev();
          }}
          onNext={() => {
            player.setPlaying(false);
            player.next();
          }}
          onToggle={player.toggle}
          onReset={() => {
            player.reset();
            setSelection(null);
            setTokens([]);
          }}
          onSpeed={player.setSpeed}
        />
      )}
      {toolbar}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="min-w-0">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-[36rem]">
              <DiagramCanvas
                spec={spec}
                activeSteps={frame}
                visited={visited}
                selectedNodeId={selection?.type === "node" ? selection.id : null}
                highlight={highlight}
                flashStepIds={flashStepIds}
                hiddenNodeIds={hiddenNodeIds}
                tokens={tokens}
                onNodeClick={selectNode}
                onStepClick={selectStep}
                ariaLabel={`Sơ đồ: ${spec.titleVi}`}
              />
            </div>
          </div>
          <p className="mt-1 text-center text-xs text-slate-500 sm:hidden dark:text-slate-400">← Vuốt ngang để xem toàn bộ sơ đồ →</p>
          {hasSteps && (
            <div className="mt-3">
              <MobileStepList spec={spec} activeIds={activeIds} visited={visited} stepBadges={stepBadges} onSelect={selectStep} />
            </div>
          )}
        </div>
        {/* Desktop: side panel. Mobile: bottom sheet when something is selected, otherwise hidden. */}
        <aside
          aria-label="Chi tiết"
          className={cx(
            "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:max-h-[60vh] max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:shadow-2xl",
            !selection && "max-lg:hidden",
            "lg:max-h-[34rem] lg:overflow-y-auto",
          )}
        >
          <StepPanel
            spec={spec}
            selection={selection}
            stepBadges={stepBadges}
            onSelectStep={selectStep}
            onSelectNode={selectNode}
            onClose={() => setSelection(null)}
          />
        </aside>
      </div>
    </div>
  );
}
