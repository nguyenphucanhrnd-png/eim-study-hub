import { useState } from "react";
import { DiagramViewer } from "../engine/DiagramViewer";
import spec, { FIG113_MAPPING } from "../specs/c5-lc-fig113";
import type { DiagramViewProps } from "../registry";

/** "So sánh với sơ đồ 9 bước": numbering of the 9-step flow (C5 p.20) ↔ Figure 11.3 (C5 p.21). */
function Mapping() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-navy-800 hover:bg-slate-50 dark:text-navy-200 dark:hover:bg-slate-800/50"
      >
        {open ? "▾" : "▸"} So sánh với sơ đồ 9 bước
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-slate-200 p-3 dark:border-slate-800">
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs text-slate-600 dark:text-slate-400">
              Bảng đối chiếu tổng hợp từ ý nghĩa các mũi tên của hai sơ đồ (KB §5.5).
            </caption>
            <thead>
              <tr className="text-left text-xs text-slate-600 dark:text-slate-400">
                <th scope="col" className="py-1 pr-3">
                  Sơ đồ 9 bước
                </th>
                <th scope="col" className="py-1 pr-3">
                  Figure 11.3
                </th>
                <th scope="col" className="py-1">
                  Nội dung
                </th>
              </tr>
            </thead>
            <tbody>
              {FIG113_MAPPING.map((m) => (
                <tr key={m.fig} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1 pr-3 font-semibold tabular-nums">{m.nine}</td>
                  <td className="py-1 pr-3 font-semibold tabular-nums">{m.fig}</td>
                  <td className="py-1">{m.noteVi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Fig113View({ focusStepId }: DiagramViewProps) {
  return <DiagramViewer spec={spec} focusStepId={focusStepId} below={<Mapping />} />;
}
