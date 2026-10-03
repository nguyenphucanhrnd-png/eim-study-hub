import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { ROLE_STYLE } from "./style";
import { sortedSteps, stepLabel, type DiagramStep, type ResolvedSpec } from "./types";

export type Selection = { type: "step"; id: string } | { type: "node"; id: string } | null;

export interface StepBadge {
  label: string;
  tone: "seller" | "buyer" | "muted" | "warn";
  /** Longer explanation shown under the badge in the step panel. */
  detail?: string;
}

/** Document name (KB §7 wording) → theory anchor. */
export function docLink(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("pro forma")) return "/learn/c7#proforma";
  if (n.includes("commercial invoice") || n === "invoice") return "/learn/c7#commercial-invoice";
  if (n.includes("packing list")) return "/learn/c7#packing-list";
  if (n.includes("insurance")) return "/learn/c7#insurance-docs";
  if (n.includes("origin") || n.includes("c/o")) return "/learn/c7#certificate-of-origin";
  if (n.includes("quantity") || n.includes("quality") || n.includes("weight")) return "/learn/c7#quantity-quality-cert";
  if (n.includes("inspection") || n.includes("phytosanitary")) return "/learn/c7#phyto-inspection";
  if (n.includes("bill of lading") || n.includes("b/l") || n.includes("air waybill") || n.includes("awb")) return "/learn/c7#bl-functions";
  if (n.includes("declaration")) return "/learn/c1#key-documents";
  if (n.includes("draft") || n.includes("bill of exchange")) return "/learn/c5#documentary-collection";
  if (n.includes("l/c") || n.includes("letter of credit")) return "/learn/c5#lc-concept";
  return "/learn/c7#document-lists";
}

export const BADGE_TONE: Record<StepBadge["tone"], string> = {
  seller: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  buyer: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  muted: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  warn: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{title}</p>
      <div className="text-[0.94rem] text-slate-800 dark:text-slate-200">{children}</div>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i}>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 accent-navy-700" checked={!!done[i]} onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))} />
            <span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">{i + 1}.</span> {it}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function StepDetail({
  spec,
  step,
  badge,
  onSelectNode,
}: {
  spec: ResolvedSpec;
  step: DiagramStep;
  badge?: StepBadge;
  onSelectNode: (id: string) => void;
}) {
  const nodes = new Map(spec.nodes.map((n) => [n.id, n]));
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 px-2 text-sm font-bold text-white dark:bg-navy-300 dark:text-navy-950">
          {stepLabel(step)}
        </span>
        <div className="min-w-0 pr-6">
          <h3 className="font-semibold leading-snug text-navy-900 dark:text-white">{step.titleVi}</h3>
          <p className="text-sm italic text-slate-600 dark:text-slate-400" lang="en">
            {step.title}
          </p>
        </div>
      </div>
      {badge && (
        <div>
          <span className={cx("inline-block rounded-md px-2 py-0.5 text-xs font-semibold", BADGE_TONE[badge.tone])}>{badge.label}</span>
          {badge.detail && <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{badge.detail}</p>}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {step.actors.map((id) => {
          const n = nodes.get(id);
          if (!n) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectNode(id)}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              style={{ borderColor: ROLE_STYLE[n.role].stroke }}
            >
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: ROLE_STYLE[n.role].stroke }} />
              {n.label.replace(/\n/g, " ")}
            </button>
          );
        })}
      </div>
      <Section title="Điều gì xảy ra">{step.what}</Section>
      <Section title="Vì sao quan trọng">{step.why}</Section>
      {step.documents && step.documents.length > 0 && (
        <Section title="Chứng từ">
          <div className="mt-1 flex flex-wrap gap-1.5">
            {step.documents.map((d) => (
              <Link key={d} to={docLink(d)} className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-900 hover:underline dark:bg-violet-950/60 dark:text-violet-200">
                {d}
              </Link>
            ))}
          </div>
        </Section>
      )}
      {step.details?.map((d) => (
        <details key={d.title} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
          <summary className="cursor-pointer text-sm font-semibold text-navy-800 dark:text-navy-200">
            {d.title} ({d.items.length})
          </summary>
          <div className="mt-2">
            {d.checklist ? (
              <Checklist items={d.items} />
            ) : (
              <ol className="list-decimal space-y-0.5 pl-5 text-sm">
                {d.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ol>
            )}
          </div>
        </details>
      ))}
      {step.trap && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-semibold">⚠ Bẫy thường gặp: </span>
          {step.trap}
        </p>
      )}
      {step.ext && (
        <details className="rounded-lg border border-violet-200 p-2 text-sm dark:border-violet-900">
          <summary className="cursor-pointer font-semibold text-violet-800 dark:text-violet-300">➕ Lưu ý mở rộng [EXT]</summary>
          <p className="mt-1">{step.ext}</p>
        </details>
      )}
      {step.links && step.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {step.links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-navy-700 underline dark:text-navy-200">
              {l.label}
            </Link>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-600 dark:text-slate-400">📘 Nguồn: {step.source}</p>
      {step.practiceTopic && (
        <Link
          to={`/practice?topic=${step.practiceTopic}`}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-700 dark:bg-navy-300 dark:text-navy-950"
        >
          <Icon name="practice" className="h-4 w-4" /> Luyện câu hỏi về bước này
        </Link>
      )}
    </div>
  );
}

function NodeDetail({ spec, nodeId, onSelectStep }: { spec: ResolvedSpec; nodeId: string; onSelectStep: (id: string) => void }) {
  const node = spec.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const edgeIds = new Set(spec.edges.filter((e) => e.from === nodeId || e.to === nodeId).map((e) => e.id));
  const steps = sortedSteps(spec.steps, spec.lanes).filter((s) => s.actors.includes(nodeId) || s.edgeIds.some((id) => edgeIds.has(id)));
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 pr-6">
        <span aria-hidden className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: ROLE_STYLE[node.role].stroke }} />
        <div>
          <h3 className="font-semibold text-navy-900 dark:text-white">{node.label.replace(/\n/g, " ")}</h3>
          {node.labelVi && <p className="text-sm text-slate-600 dark:text-slate-400">{node.labelVi.replace(/\n/g, " ")}</p>}
        </div>
      </div>
      {node.aka && node.aka.length > 0 && <Section title="Còn gọi là">{node.aka.join(" · ")}</Section>}
      {node.descVi && <Section title="Vai trò trong sơ đồ">{node.descVi}</Section>}
      {steps.length > 0 && (
        <Section title="Tham gia các bước">
          <ul className="mt-1 space-y-1">
            {steps.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onSelectStep(s.id)} className="text-left text-sm hover:underline">
                  <span className="font-semibold tabular-nums">{stepLabel(s)}.</span> {s.titleVi}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {node.links && node.links.length > 0 && (
        <Section title="Liên kết">
          <ul className="mt-1 space-y-1">
            {node.links.map((l) => (
              <li key={l.to + l.label}>
                <Link to={l.to} className="text-sm text-navy-700 underline dark:text-navy-200">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** Right-hand panel (desktop) / bottom sheet (mobile) with the selected step or actor. */
export function StepPanel({
  spec,
  selection,
  stepBadges,
  onSelectStep,
  onSelectNode,
  onClose,
}: {
  spec: ResolvedSpec;
  selection: Selection;
  stepBadges?: Record<string, StepBadge>;
  onSelectStep: (id: string) => void;
  onSelectNode: (id: string) => void;
  onClose: () => void;
}) {
  const step = selection?.type === "step" ? spec.steps.find((s) => s.id === selection.id) : undefined;
  return (
    <div className="relative">
      {selection && (
        <button type="button" onClick={onClose} className="absolute right-0 top-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Đóng (Esc)">
          <Icon name="close" className="h-4 w-4" />
        </button>
      )}
      {step ? (
        <StepDetail spec={spec} step={step} badge={stepBadges?.[step.id]} onSelectNode={onSelectNode} />
      ) : selection?.type === "node" ? (
        <NodeDetail spec={spec} nodeId={selection.id} onSelectStep={onSelectStep} />
      ) : (
        <div>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Bấm vào một bước, một mũi tên hay một đối tượng trên sơ đồ — hoặc bấm ▶ để chạy toàn bộ quy trình.
          </p>
          <ol className="space-y-1">
            {sortedSteps(spec.steps, spec.lanes).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onSelectStep(s.id)} className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="w-7 shrink-0 font-semibold tabular-nums text-navy-700 dark:text-navy-200">{stepLabel(s)}</span>
                  <span className="min-w-0 flex-1">{s.titleVi}</span>
                  {stepBadges?.[s.id] && (
                    <span className={cx("shrink-0 rounded px-1.5 text-[0.7rem] font-semibold", BADGE_TONE[stepBadges[s.id]!.tone])}>{stepBadges[s.id]!.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
