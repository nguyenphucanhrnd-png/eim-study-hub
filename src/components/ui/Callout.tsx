import type { ReactNode } from "react";
import { cx } from "./index";

export type CalloutKind = "ext" | "trap" | "errata" | "note" | "takeaways";

const STYLES: Record<CalloutKind, { title: string; icon: string; box: string; head: string }> = {
  ext: {
    title: "Mở rộng",
    icon: "➕",
    box: "border-violet-300 bg-violet-50 dark:border-violet-700/60 dark:bg-violet-950/40",
    head: "text-violet-800 dark:text-violet-300",
  },
  trap: {
    title: "Bẫy thường gặp",
    icon: "⚠",
    box: "border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30",
    head: "text-amber-900 dark:text-amber-300",
  },
  errata: {
    title: "Ghi chú về slide",
    icon: "✎",
    box: "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800/60",
    head: "text-slate-700 dark:text-slate-300",
  },
  note: {
    title: "Lưu ý",
    icon: "ℹ",
    box: "border-sky-300 bg-sky-50 dark:border-sky-700/60 dark:bg-sky-950/30",
    head: "text-sky-900 dark:text-sky-300",
  },
  takeaways: {
    title: "Ý chính cần nhớ",
    icon: "★",
    box: "border-navy-300 bg-navy-50 dark:border-navy-600 dark:bg-navy-900/40",
    head: "text-navy-800 dark:text-navy-200",
  },
};

export function Callout({ kind, title, children, className }: { kind: CalloutKind; title?: string; children: ReactNode; className?: string }) {
  const s = STYLES[kind];
  return (
    <aside className={cx("my-5 rounded-xl border px-5 py-4", s.box, className)} aria-label={title ?? s.title}>
      <p className={cx("mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide", s.head)}>
        <span aria-hidden="true">{s.icon}</span>
        {title ?? s.title}
      </p>
      <div className="text-[0.95rem] [&>*:last-child]:mb-0 [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </aside>
  );
}
