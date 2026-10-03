import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { DiagramViewer } from "../engine/DiagramViewer";
import { ClassifyQuiz } from "../engine/modes/ClassifyQuiz";
import { docLink } from "../engine/StepPanel";
import type { DiagramViewProps } from "../registry";
import exportProcess, { COUNTRY_ITEMS, EXPORT_DOCS, IMPORT_DOCS } from "../specs/c1-export-process";
import twoFlows, { COURSE_CHIPS, MANAGED_THROUGH, RIGHT_CHAIN } from "../specs/c1-two-flows";
import hub, { HUB_KIND, PLAYERS } from "../specs/c1-stakeholder-hub";
import pricing, { PRICING_SCENARIOS } from "../specs/c3-pricing-objectives";
import scope, { SCOPE_ITEMS } from "../specs/c3-incoterms-purpose-scope";

const chip = "rounded-full border px-2.5 py-1 text-xs font-medium";

function DocTray({ title, docs }: { title: string; docs: string[] }) {
  return (
    <div className="rounded-xl border border-violet-200 p-3 dark:border-violet-900">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {docs.map((d) => (
          <Link key={d} to={docLink(d)} className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-900 hover:underline dark:bg-violet-950/60 dark:text-violet-200">
            📄 {d}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** D1.1 with the "Hiện chứng từ" tray and the "nước người bán hay người mua?" sort. */
export function ExportProcessView({ focusStepId }: DiagramViewProps) {
  const [docs, setDocs] = useState(false);
  return (
    <DiagramViewer
      spec={exportProcess}
      focusStepId={focusStepId}
      toolbar={
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={docs} onChange={(e) => setDocs(e.target.checked)} className="h-4 w-4 accent-navy-700" />
          Hiện chứng từ
        </label>
      }
      below={
        docs ? (
          <div className="grid gap-3 md:grid-cols-2">
            <DocTray title="Chứng từ xuất khẩu chủ yếu (người bán)" docs={EXPORT_DOCS} />
            <DocTray title="Chứng từ nhập khẩu chủ yếu (người mua)" docs={IMPORT_DOCS} />
          </div>
        ) : null
      }
      extraModes={[
        {
          id: "classify",
          label: "Nước nào?",
          render: (onScore) => (
            <ClassifyQuiz
              items={COUNTRY_ITEMS}
              buckets={[
                { id: "seller", label: "Nước người bán" },
                { id: "intl", label: "Vận tải quốc tế" },
                { id: "buyer", label: "Nước người mua" },
              ]}
              instructions="Mỗi bước của dòng hàng diễn ra ở đâu?"
              onScore={onScore}
            />
          ),
        },
      ]}
    />
  );
}

/** D1.2 with "Môn học nằm ở đâu trên 2 dòng chảy?" chips. */
export function TwoFlowsView({ focusStepId }: DiagramViewProps) {
  const [chipId, setChipId] = useState<string | null>(null);
  const active = COURSE_CHIPS.find((c) => c.id === chipId);
  const highlight = useMemo(() => {
    if (!active) return null;
    const lanes = new Set(active.lanes);
    const nodes = new Set(twoFlows.steps.filter((s) => lanes.has(s.lane as "goods" | "money")).flatMap((s) => s.actors));
    const edges = new Set(twoFlows.edges.filter((e) => nodes.has(e.from) && nodes.has(e.to)).map((e) => e.id));
    return { nodes, edges };
  }, [active]);
  return (
    <DiagramViewer
      spec={twoFlows}
      focusStepId={focusStepId}
      highlight={highlight}
      toolbar={
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Môn học nằm ở đâu trên 2 dòng chảy?</p>
          <div role="group" aria-label="Môn học" className="flex flex-wrap gap-1.5">
            {COURSE_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === chipId}
                onClick={() => setChipId((x) => (x === c.id ? null : c.id))}
                className={cx(chip, c.id === chipId ? "border-navy-700 bg-navy-800 text-white dark:bg-navy-300 dark:text-navy-950" : "border-slate-300 dark:border-slate-600")}
              >
                {c.label}
              </button>
            ))}
          </div>
          {active && (
            <p className="text-sm" aria-live="polite">
              <strong>{active.label}</strong> → {active.roleVi}.{" "}
              <Link to={active.to} className="text-navy-700 underline dark:text-navy-200">
                Xem chương
              </Link>
            </p>
          )}
        </div>
      }
      below={
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
            <p className="mb-1 font-semibold">Managed through</p>
            <ul className="list-disc pl-5">
              {MANAGED_THROUGH.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
            <p className="mb-1 font-semibold">Phối hợp hiệu quả hai dòng chảy</p>
            <p className="flex flex-wrap items-center gap-1">
              {RIGHT_CHAIN.map((r, i) => (
                <span key={r} className="inline-flex items-center gap-1">
                  {i > 0 && <span aria-hidden>→</span>}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold dark:bg-slate-800">{r}</span>
                </span>
              ))}
            </p>
          </div>
        </div>
      }
    />
  );
}

/** D1.4 with the internal / external filter, the classify quiz and the 12 players (KB §1.9). */
export function HubView() {
  const [filter, setFilter] = useState<"all" | "internal" | "external">("all");
  const highlight = useMemo(() => {
    if (filter === "all") return null;
    const nodes = new Set(Object.entries(HUB_KIND).filter(([id, k]) => k === filter || id === "hub").map(([id]) => id));
    const edges = new Set(hub.edges.filter((e) => nodes.has(e.from) && nodes.has(e.to)).map((e) => e.id));
    return { nodes, edges };
  }, [filter]);
  const items = hub.nodes
    .filter((n) => n.id !== "hub")
    .map((n) => ({ id: n.id, textVi: n.label.replace(/\n/g, " "), bucket: HUB_KIND[n.id] ?? "external" }));
  return (
    <DiagramViewer
      spec={hub}
      highlight={highlight}
      toolbar={
        <Segmented
          label="Lọc"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "internal", label: "Phòng ban nội bộ" },
            { value: "external", label: "Nhà cung cấp bên ngoài" },
          ]}
        />
      }
      below={
        <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
          <p className="mb-1 font-semibold">12 bên tham gia giao dịch thương mại quốc tế (KB §1.9)</p>
          <ol className="grid list-decimal gap-x-6 pl-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLAYERS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
            Phòng Thương mại (Chamber of Commerce) là một trong 12 bên tham gia nhưng không có ô riêng trên Figure 1-6.
          </p>
        </div>
      }
      extraModes={[
        {
          id: "classify",
          label: "Nội bộ hay bên ngoài?",
          render: (onScore) => (
            <ClassifyQuiz
              items={items}
              buckets={[
                { id: "internal", label: "Phòng ban nội bộ" },
                { id: "external", label: "Bên ngoài" },
              ]}
              instructions="Theo Figure 1-6, mỗi ô là phòng ban nội bộ của doanh nghiệp hay nhà cung cấp/đối tác bên ngoài?"
              onScore={onScore}
            />
          ),
        },
      ]}
    />
  );
}

export function PricingView({ focusStepId }: DiagramViewProps) {
  return (
    <DiagramViewer
      spec={pricing}
      focusStepId={focusStepId}
      extraModes={[
        {
          id: "classify",
          label: "Phân loại tình huống",
          render: (onScore) => (
            <ClassifyQuiz
              items={PRICING_SCENARIOS}
              buckets={[
                { id: "low", label: "Giá tối thiểu – penetration / cost-based" },
                { id: "high", label: "Giá tối đa – skimming / demand-based" },
              ]}
              instructions="Mỗi tình huống thuộc nhánh nào của sơ đồ?"
              onScore={onScore}
            />
          ),
        },
      ]}
    />
  );
}

export function ScopeView() {
  return (
    <DiagramViewer
      spec={scope}
      extraModes={[
        {
          id: "classify",
          label: "Quy định hay không?",
          render: (onScore) => (
            <ClassifyQuiz
              items={SCOPE_ITEMS}
              buckets={[
                { id: "covers", label: "Incoterms quy định" },
                { id: "not", label: "Incoterms KHÔNG quy định" },
              ]}
              instructions="Nội dung nào Incoterms quy định, nội dung nào không?"
              onScore={onScore}
            />
          ),
        },
      ]}
    />
  );
}
