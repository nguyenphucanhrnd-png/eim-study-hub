import { useEffect, useState } from "react";
import { Button, cx } from "@/components/ui";
import { Callout } from "@/components/ui/Callout";
import { Segmented } from "@/components/ui/form";
import { FLOWS, KIND_META, RISK_LADDER, type FlowStep, type NodeId, type PaymentFlow } from "./data";

const W = 640;
const H = 360;
const NODE_W = 210;
const NODE_H = 60;
const POS: Record<NodeId, { x: number; y: number }> = {
  exporterBank: { x: 140, y: 60 },
  importerBank: { x: 500, y: 60 },
  exporter: { x: 140, y: 300 },
  importer: { x: 500, y: 300 },
};

/** Point where the segment from (x, y) towards (tx, ty) leaves a node-sized box centred on (x, y). */
function edgePoint(x: number, y: number, tx: number, ty: number) {
  const dx = tx - x;
  const dy = ty - y;
  const scale = Math.min(Math.abs((NODE_W / 2 + 6) / (dx || 1e-9)), Math.abs((NODE_H / 2 + 6) / (dy || 1e-9)));
  return { x: x + dx * scale, y: y + dy * scale };
}

/** Geometry for every step; arrows that share a node pair are offset in parallel. */
function layout(steps: FlowStep[]) {
  const key = (s: FlowStep) => [s.from, s.to].sort().join("|");
  const groups = new Map<string, number[]>();
  steps.forEach((s, i) => groups.set(key(s), [...(groups.get(key(s)) ?? []), i]));
  return steps.map((s, i) => {
    const members = groups.get(key(s))!;
    const offset = (members.indexOf(i) - (members.length - 1) / 2) * 26;
    const a = POS[s.from];
    const b = POS[s.to];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    // Perpendicular unit vector, oriented consistently for the unordered pair.
    const [p, q] = [s.from, s.to].sort() as [NodeId, NodeId];
    const nx = -(POS[q].y - POS[p].y) / len;
    const ny = (POS[q].x - POS[p].x) / len;
    // Shift both centres sideways, then clip the shifted segment at the node boxes.
    const ax = a.x + nx * offset;
    const ay = a.y + ny * offset;
    const bx = b.x + nx * offset;
    const by = b.y + ny * offset;
    const start = edgePoint(ax, ay, bx, by);
    const end = edgePoint(bx, by, ax, ay);
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, mx: (start.x + end.x) / 2, my: (start.y + end.y) / 2 };
  });
}

function FlowDiagram({ flow, current }: { flow: PaymentFlow; current: number }) {
  const geo = layout(flow.steps);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Sơ đồ ${flow.label}, bước ${current + 1}`}>
      <defs>
        {Object.entries(KIND_META).map(([k, m]) => (
          <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill={m.color} />
          </marker>
        ))}
      </defs>
      {flow.steps.map((s, i) => {
        const g = geo[i]!;
        const state = i === current ? "now" : i < current ? "done" : "todo";
        const color = KIND_META[s.kind].color;
        return (
          <g key={i} opacity={state === "todo" ? 0.18 : state === "done" ? 0.55 : 1}>
            <line
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke={color}
              strokeWidth={state === "now" ? 3.5 : 2}
              markerEnd={`url(#arrow-${s.kind})`}
              strokeDasharray={state === "now" ? "8 6" : undefined}
              className={state === "now" ? "flow-dash" : undefined}
            />
            <circle cx={g.mx} cy={g.my} r={12} fill={state === "now" ? color : "var(--flow-bg)"} stroke={color} strokeWidth={2} />
            <text x={g.mx} y={g.my + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={state === "now" ? "#fff" : color}>
              {i + 1}
            </text>
          </g>
        );
      })}
      {(Object.keys(POS) as NodeId[]).map((n) => (
        <g key={n}>
          <rect
            x={POS[n].x - NODE_W / 2}
            y={POS[n].y - NODE_H / 2}
            width={NODE_W}
            height={NODE_H}
            rx={14}
            className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-600"
            strokeWidth={1.5}
          />
          <text x={POS[n].x} y={POS[n].y + 5} textAnchor="middle" fontSize="14" fontWeight="600" className="fill-slate-800 dark:fill-slate-100">
            {flow.nodeLabels[n]}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RiskLadder() {
  const n = RISK_LADDER.length;
  return (
    <Callout kind="ext" title="Mở rộng – So sánh rủi ro nhà XK vs nhà NK">
      <p>
        Thang rủi ro cho <strong>nhà xuất khẩu</strong> từ thấp đến cao; với nhà nhập khẩu thì ngược lại. (Nguồn: U.S. Department of
        Commerce/ITA, <em>Trade Finance Guide</em> – nội dung [EXT], không phải từ slide.)
      </p>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-600 dark:text-slate-400">
            <th scope="col" className="py-1 pr-2">
              Phương thức
            </th>
            <th scope="col" className="w-1/4 py-1 pr-2">
              Rủi ro nhà XK
            </th>
            <th scope="col" className="w-1/4 py-1">
              Rủi ro nhà NK
            </th>
          </tr>
        </thead>
        <tbody>
          {RISK_LADDER.map((m, i) => (
            <tr key={m}>
              <th scope="row" className="py-1 pr-2 text-left font-normal">
                {m}
              </th>
              <td className="py-1 pr-2">
                <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${((i + 1) / n) * 100}%` }} />
                <span className="sr-only">hạng {i + 1}/{n}</span>
              </td>
              <td className="py-1">
                <div className="h-2.5 rounded-full bg-amber-600" style={{ width: `${((n - i) / n) * 100}%` }} />
                <span className="sr-only">hạng {n - i}/{n}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Callout>
  );
}

export default function PaymentFlowStepper({ initial = "tt-advance" }: { initial?: PaymentFlow["id"] }) {
  const [flowId, setFlowId] = useState<PaymentFlow["id"]>(initial);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const flow = FLOWS.find((f) => f.id === flowId)!;
  const last = flow.steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setStep((s) => Math.min(s + 1, last)), 2200);
    return () => window.clearTimeout(t);
  }, [playing, step, last]);

  const current = flow.steps[step]!;

  return (
    <div className="space-y-4 [--flow-bg:#fff] dark:[--flow-bg:#0f172a]">
      <Segmented
        label="Phương thức thanh toán"
        value={flowId}
        onChange={(v) => {
          setFlowId(v);
          setStep(0);
          setPlaying(false);
        }}
        options={FLOWS.map((f) => ({ value: f.id, label: f.label }))}
      />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{flow.summaryVi}</p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-800">
          <FlowDiagram flow={flow} current={step} />
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800" aria-live="polite">
            <p className={cx("text-xs font-semibold uppercase tracking-wide", KIND_META[current.kind].textClass)}>
              Bước {step + 1}/{flow.steps.length} · {KIND_META[current.kind].vi}
            </p>
            <p className="mt-1">{current.textVi}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              ← Trước
            </Button>
            <Button onClick={() => setStep((s) => Math.min(last, s + 1))} disabled={step === last}>
              Tiếp →
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (step === last) setStep(0);
                setPlaying((p) => !p);
              }}
            >
              {playing ? "Tạm dừng" : "Tự chạy"}
            </Button>
          </div>
          <ol className="space-y-1 text-sm">
            {flow.steps.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cx(
                    "flex w-full gap-2 rounded-md px-2 py-1 text-left",
                    i === step ? "bg-navy-50 font-medium dark:bg-navy-900/50" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  <span className={cx("font-semibold", KIND_META[s.kind].textClass)}>
                    {i + 1}.
                  </span>
                  <span className={i > step ? "text-slate-500 dark:text-slate-400" : undefined}>{s.textVi}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        {Object.entries(KIND_META).map(([k, m]) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-6 rounded" style={{ backgroundColor: m.color }} /> {m.vi}
          </li>
        ))}
      </ul>
      {flow.noteVi && <p className="text-xs text-slate-500 dark:text-slate-400">{flow.noteVi}</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">Nguồn: {flow.source}.</p>
      <RiskLadder />
    </div>
  );
}
