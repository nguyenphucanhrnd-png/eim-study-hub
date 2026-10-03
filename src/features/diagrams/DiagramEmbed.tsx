import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { STATUS_VI, useAllDiagramStatuses } from "./engine/useDiagramProgress";
import { provenanceLabel } from "./engine/style";
import { DIAGRAM_BY_ID } from "./catalog";
import { DiagramView } from "./DiagramView";

const TONE = {
  new: "text-slate-600 dark:text-slate-400",
  started: "text-navy-700 dark:text-navy-200",
  explored: "text-blue-700 dark:text-blue-300",
  mastered: "text-correct dark:text-green-400",
} as const;

/** `::embed[diagram:<id>]` in theory pages: a collapsible "Mở sơ đồ tương tác" block. */
export function DiagramEmbed({ id }: { id: string }) {
  const meta = DIAGRAM_BY_ID.get(id);
  const { hash } = useLocation();
  const [open, setOpen] = useState(() => hash === `#diagram-${id}`);
  const statusOf = useAllDiagramStatuses();
  useEffect(() => {
    if (hash === `#diagram-${id}`) setOpen(true);
  }, [hash, id]);
  if (!meta) return <p className="text-wrong dark:text-red-400">Thiếu sơ đồ: {id}</p>;
  const status = statusOf(id);
  return (
    <section
      id={`diagram-${id}`}
      className="my-6 scroll-mt-20 rounded-xl border border-navy-200 bg-white dark:border-navy-800 dark:bg-slate-900"
      aria-label={`Sơ đồ tương tác: ${meta.titleVi}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3 text-left hover:bg-navy-50/60 dark:hover:bg-navy-950/40"
      >
        <Icon name={open ? "close" : "grid"} className="h-5 w-5 shrink-0 text-navy-700 dark:text-navy-200" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-navy-900 dark:text-white">
            {open ? "Thu gọn sơ đồ" : "Mở sơ đồ tương tác"}: {meta.titleVi}
          </span>
          <span className="block text-xs text-slate-600 dark:text-slate-400">
            {meta.stepCount} bước · ~{meta.estMinutes} phút · {provenanceLabel(meta.provenance, meta.slideRef)} ·{" "}
            <span className={cx("font-semibold", TONE[status])}>{STATUS_VI[status]}</span>
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-200 p-3 sm:p-4 dark:border-slate-800">
          <DiagramView meta={meta} />
          <p className="mt-3 text-right text-sm">
            <Link to={`/diagrams/${id}`} className="text-navy-700 underline dark:text-navy-200">
              Mở toàn trang →
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}

export default DiagramEmbed;
