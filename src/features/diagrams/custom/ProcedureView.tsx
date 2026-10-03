import { useId, useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { DiagramViewer } from "../engine/DiagramViewer";
import { BADGE_TONE, type StepBadge } from "../engine/StepPanel";
import type { ActorRole, DiagramSpec } from "../engine/types";
import exportSpec from "../specs/c8-export-procedure";
import importSpec from "../specs/c8-import-procedure";
import {
  MIRROR_PAIRS,
  PAYMENTS,
  RULES,
  STATE_VI,
  exportStates,
  importStates,
  type Payment,
  type Rule,
  type StepState,
  type StepStatus,
} from "./procedureStates";

const ROLE: Record<StepState, ActorRole> = { seller: "seller", buyer: "buyer", optional: "other", na: "other" };
const TONE: Record<StepState, StepBadge["tone"]> = { seller: "seller", buyer: "buyer", optional: "warn", na: "muted" };

/** Recolour the step boxes and print the state under each box for the chosen scenario. */
function withStates(spec: DiagramSpec, states: Record<string, StepStatus>): DiagramSpec {
  return {
    ...spec,
    nodes: spec.nodes.map((n) => {
      const st = states[n.id];
      return st ? { ...n, role: ROLE[st.state], labelVi: STATE_VI[st.state] } : n;
    }),
  };
}

const badgesOf = (states: Record<string, StepStatus>): Record<string, StepBadge> =>
  Object.fromEntries(Object.entries(states).map(([id, st]) => [id, { label: STATE_VI[st.state], tone: TONE[st.state], detail: st.noteVi }]));

function StateChip({ st }: { st: StepStatus }) {
  return <span className={cx("inline-block rounded px-1.5 text-[0.7rem] font-semibold", BADGE_TONE[TONE[st.state]])}>{STATE_VI[st.state]}</span>;
}

function Cell({ spec, id, states }: { spec: DiagramSpec; id?: string; states: Record<string, StepStatus> }) {
  const step = id ? spec.steps.find((s) => s.id === id) : undefined;
  const st = id ? states[id] : undefined;
  if (!step || !st) return <div className="hidden rounded-lg border border-dashed border-slate-200 md:block dark:border-slate-800" aria-hidden />;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="font-medium">
        <span className="tabular-nums text-navy-700 dark:text-navy-200">{step.order}.</span> {step.titleVi}
      </p>
      <p className="mt-1">
        <StateChip st={st} />
      </p>
    </div>
  );
}

/** "Xem song song": export and import procedures side by side, matching steps on one row. */
export function MirrorView({ rule, payment }: { rule: Rule; payment: Payment }) {
  const ex = exportStates(rule, payment);
  const im = importStates(rule, payment);
  const pairOfExport = new Map(MIRROR_PAIRS.map((p) => [p.exportId, p]));
  const rows: { e?: string; i?: string; label?: string }[] = [];
  for (const s of exportSpec.steps) {
    const p = pairOfExport.get(s.id);
    rows.push(p ? { e: s.id, i: p.importId, label: p.labelVi } : { e: s.id });
    // Import steps without a counterpart go right after their predecessor's row.
    if (p?.importId === "i6") rows.push({ i: "i7" });
  }
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)] gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:grid dark:text-slate-400">
        <span>Quy trình xuất khẩu (10 bước)</span>
        <span className="text-center">Liên kết</span>
        <span>Quy trình nhập khẩu (9 bước)</span>
      </div>
      <ul className="space-y-2">
        {rows.map((r, idx) => (
          <li key={idx} className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)]">
            <div className="md:order-1">
              <Cell spec={exportSpec} id={r.e} states={ex} />
            </div>
            <div className="col-span-2 flex items-center gap-2 md:order-2 md:col-span-1" aria-hidden={!r.label}>
              {r.label ? (
                <>
                  <span className="h-0.5 flex-1 bg-navy-300 dark:bg-navy-700" />
                  <span className="text-center text-xs font-semibold text-navy-800 dark:text-navy-200">↔ {r.label}</span>
                  <span className="h-0.5 flex-1 bg-navy-300 dark:bg-navy-700" />
                </>
              ) : (
                <span className="hidden md:block" />
              )}
            </div>
            <div className="md:order-3">
              <Cell spec={importSpec} id={r.i} states={im} />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Hai quy trình là hai mặt của cùng một hợp đồng: mỗi hàng nối bước tương ứng của người bán và người mua.
      </p>
    </div>
  );
}

/** D8.1 / D8.2 with scenario selectors (Incoterms rule × payment method) and the mirror view. */
export function ProcedureView({ which, focusStepId }: { which: "export" | "import"; focusStepId?: string | null }) {
  const [rule, setRule] = useState<Rule>("FOB");
  const [payment, setPayment] = useState<Payment>("lc");
  const [mirror, setMirror] = useState(false);
  const ruleId = useId();
  const base = which === "export" ? exportSpec : importSpec;
  const states = useMemo(() => (which === "export" ? exportStates(rule, payment) : importStates(rule, payment)), [which, rule, payment]);
  const spec = useMemo(() => withStates(base, states), [base, states]);

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <label htmlFor={ruleId} className="flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
        Điều kiện Incoterms® 2020
        <select
          id={ruleId}
          value={rule}
          onChange={(e) => setRule(e.target.value as Rule)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-900"
        >
          {RULES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span>Phương thức thanh toán</span>
        <Segmented label="Phương thức thanh toán" value={payment} onChange={setPayment} options={PAYMENTS.map((p) => ({ value: p.id, label: p.label }))} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="h-4 w-4 accent-navy-700" />
        Xem song song (XK ⇄ NK)
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      {toolbar}
      {mirror ? (
        <MirrorView rule={rule} payment={payment} />
      ) : (
        <DiagramViewer spec={spec} focusStepId={focusStepId} stepBadges={badgesOf(states)} />
      )}
    </div>
  );
}
