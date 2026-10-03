import { cx } from "@/components/ui";
import { BADGE_TONE, type StepBadge } from "./StepPanel";
import { sortedSteps, stepLabel, type ResolvedSpec } from "./types";

/** Vertical timeline under the canvas on small screens (< 768px). */
export function MobileStepList({
  spec,
  activeIds,
  visited,
  stepBadges,
  onSelect,
}: {
  spec: ResolvedSpec;
  activeIds: ReadonlySet<string>;
  visited: ReadonlySet<string>;
  stepBadges?: Record<string, StepBadge>;
  onSelect: (id: string) => void;
}) {
  return (
    <ol className="relative ml-3 border-l-2 border-slate-200 dark:border-slate-700 md:hidden" aria-label="Các bước">
      {sortedSteps(spec.steps, spec.lanes).map((s) => {
        const active = activeIds.has(s.id);
        return (
          <li key={s.id} className="mb-1 ml-4">
            <span
              aria-hidden
              className={cx(
                "absolute -left-[0.6rem] mt-1.5 flex h-[1.1rem] w-[1.1rem] items-center justify-center rounded-full text-[0.6rem] font-bold",
                active ? "bg-navy-800 text-white dark:bg-navy-300 dark:text-navy-950" : visited.has(s.id) ? "bg-correct text-white" : "bg-slate-300 dark:bg-slate-600",
              )}
            >
              {visited.has(s.id) && !active ? "✓" : ""}
            </span>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={active ? "step" : undefined}
              className={cx("w-full rounded-md px-2 py-1 text-left text-sm", active ? "bg-navy-50 font-semibold dark:bg-navy-900/60" : "hover:bg-slate-100 dark:hover:bg-slate-800")}
            >
              <span className="tabular-nums text-navy-700 dark:text-navy-200">{stepLabel(s)}.</span> {s.titleVi}
              {stepBadges?.[s.id] && (
                <span className={cx("ml-1.5 rounded px-1.5 text-[0.7rem] font-semibold", BADGE_TONE[stepBadges[s.id]!.tone])}>{stepBadges[s.id]!.label}</span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
