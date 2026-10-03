import { lazy, Suspense } from "react";
import { cx } from "@/components/ui";
import { provenanceLabel } from "../engine/style";
import { STATUS_CHIP, STATUS_VI, useDiagramProgress } from "../engine/useDiagramProgress";

const Explorer = lazy(() => import("@/features/tools/incoterms/IncotermsExplorer"));

/** D3.3 — the upgraded Incoterms Explorer is the diagram. */
export default function CarriageView() {
  const { status } = useDiagramProgress("c3-carriage-incoterms");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {provenanceLabel("slide", "C3 p.11")} + sơ đồ ICC 11 điều kiện (tr.13–34)
        </span>
        <span className={cx("rounded-md px-2 py-0.5 font-semibold", STATUS_CHIP[status])}>{STATUS_VI[status]}</span>
      </div>
      <h2 className="sr-only">Incoterms® 2020 Explorer</h2>
      <Suspense fallback={<p role="status">Đang tải…</p>}>
        <Explorer />
      </Suspense>
    </div>
  );
}
