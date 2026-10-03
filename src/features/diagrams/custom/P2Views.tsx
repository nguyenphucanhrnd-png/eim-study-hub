import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { DiagramViewer } from "../engine/DiagramViewer";
import { ClassifyQuiz } from "../engine/modes/ClassifyQuiz";
import { provenanceLabel } from "../engine/style";
import { EXPLORED_MARK, STATUS_CHIP, STATUS_VI, allViewed, useDiagramProgress } from "../engine/useDiagramProgress";
import type { DiagramViewProps } from "../registry";
import exportPlan, { ELEVEN_QUESTIONS } from "../specs/c2-export-plan";
import contract, { DRAFT_CLAUSES } from "../specs/c6-contract-anatomy";
import lifecycle from "../specs/c7-document-lifecycle";
import blTypes, { BL_ITEMS } from "../specs/c7-bl-types";
import invoices, { INVOICE_ITEMS } from "../specs/c7-proforma-vs-commercial";

/** D2.1 with the "11 câu hỏi chuẩn bị xuất khẩu" overlay. */
export function ExportPlanView() {
  const [q, setQ] = useState<number | null>(null);
  const highlight = useMemo(() => {
    const item = q === null ? undefined : ELEVEN_QUESTIONS[q];
    if (!item) return null;
    const nodes = new Set(["plan", ...item.components]);
    return { nodes, edges: new Set(item.components.map((c) => `e-${c}`)) };
  }, [q]);
  return (
    <DiagramViewer
      spec={exportPlan}
      highlight={highlight}
      below={
        <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
          <p className="mb-1 font-semibold">11 câu hỏi chuẩn bị xuất khẩu (KB §2.11) – bấm để xem thành phần kế hoạch liên quan</p>
          <ol className="space-y-1">
            {ELEVEN_QUESTIONS.map((item, i) => (
              <li key={item.q}>
                <button
                  type="button"
                  aria-pressed={q === i}
                  onClick={() => setQ((x) => (x === i ? null : i))}
                  className={cx("w-full rounded-md px-2 py-1 text-left", q === i ? "bg-navy-50 font-medium dark:bg-navy-900/60" : "hover:bg-slate-100 dark:hover:bg-slate-800")}
                >
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">{i + 1}.</span> {item.q}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Gợi ý đối chiếu câu hỏi ↔ thành phần (tổng hợp, không phải từ slide).</p>
        </div>
      }
    />
  );
}

/** D3.4 — the 7 changes Incoterms® 2010 → 2020 as flip cards (KB §3.6). */
const CHANGES = [
  { area: "Tên điều kiện", y2010: "DAT – Delivered at Terminal", y2020: "DPU – Delivered at Place Unloaded", impact: "Đổi tên duy nhất trong 11 điều kiện; nơi đến không bắt buộc là terminal; người bán giao sau khi dỡ hàng tại nơi chỉ định." },
  { area: "FCA & on-board B/L", y2010: "Không đề cập việc lấy B/L đã xếp hàng", y2020: "Các bên có thể thỏa thuận người mua chỉ thị người chuyên chở cấp on-board B/L cho người bán", impact: "Giúp người bán có on-board B/L (ví dụ để đáp ứng L/C)." },
  { area: "Bảo hiểm", y2010: "CIF/CIP ít phân biệt", y2020: "CIF: tối thiểu ICC (C); CIP: ICC (A)", impact: "CIF = mức bảo hiểm mặc định thấp; CIP = cao hơn." },
  { area: "Phương tiện vận tải riêng", y2010: "Không đề cập rõ", y2020: "Được công nhận trong FCA, DAP, DPU, DDP", impact: "Các bên có thể dùng phương tiện của chính mình." },
  { area: "Yêu cầu an ninh", y2010: "Ít nổi bật", y2020: "Đưa rõ hơn vào nghĩa vụ vận tải và hải quan", impact: "Phản ánh an ninh chuỗi cung ứng." },
  { area: "Trình bày chi phí", y2010: "Rải rác nhiều điều khoản", y2020: "Tập trung tại A9/B9", impact: "Dễ thấy ai trả chi phí gì." },
  { area: "Hướng dẫn", y2010: "Guidance Notes", y2020: "Explanatory Notes for Users + hình minh họa", impact: "Dễ hiểu và áp dụng hơn." },
];

export const YEAR_ITEMS = [
  { id: "y1", textVi: "DAT – Delivered at Terminal", bucket: "2010" },
  { id: "y2", textVi: "DPU – Delivered at Place Unloaded", bucket: "2020" },
  { id: "y3", textVi: "CIF tối thiểu ICC (C), CIP ICC (A)", bucket: "2020" },
  { id: "y4", textVi: "Chi phí tập trung tại A9/B9", bucket: "2020" },
  { id: "y5", textVi: "Guidance Notes", bucket: "2010" },
  { id: "y6", textVi: "Explanatory Notes for Users", bucket: "2020" },
  { id: "y7", textVi: "FCA: người mua có thể chỉ thị người chuyên chở cấp on-board B/L cho người bán", bucket: "2020" },
];

export function Incoterms2010vs2020View() {
  const id = "c3-2010-vs-2020";
  const progress = useDiagramProgress(id);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [mode, setMode] = useState<"cards" | "quiz">("cards");
  const { viewed, markViewed } = progress;
  const flip = (i: number) => {
    setFlipped((f) => ({ ...f, [i]: !f[i] }));
    const key = `n:${i}`;
    if (viewed.includes(key)) return;
    const required = CHANGES.map((_, j) => `n:${j}`);
    markViewed(allViewed([...viewed, key], required) ? [key, EXPLORED_MARK] : [key]);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{provenanceLabel("derived")}</span>
        <span className={cx("rounded-md px-2 py-0.5 font-semibold", STATUS_CHIP[progress.status])}>{STATUS_VI[progress.status]}</span>
      </div>
      <Segmented
        label="Chế độ"
        value={mode}
        onChange={setMode}
        options={[
          { value: "cards", label: "7 thay đổi" },
          { value: "quiz", label: "2010 hay 2020?" },
        ]}
      />
      {mode === "cards" ? (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHANGES.map((c, i) => (
            <li key={c.area}>
              <button
                type="button"
                aria-pressed={!!flipped[i]}
                onClick={() => flip(i)}
                className={cx(
                  "flex h-full min-h-36 w-full flex-col gap-1 rounded-xl border p-3 text-left text-sm transition-colors",
                  flipped[i] ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {i + 1}. {c.area} · {flipped[i] ? "Incoterms® 2020" : "Incoterms 2010"}
                </span>
                <span className="font-semibold">{flipped[i] ? c.y2020 : c.y2010}</span>
                {flipped[i] && <span className="text-slate-700 dark:text-slate-300">→ {c.impact}</span>}
                <span className="mt-auto text-xs text-navy-700 dark:text-navy-200">{flipped[i] ? "⟲ Xem 2010" : "⟳ Lật sang 2020"}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <ClassifyQuiz
          items={YEAR_ITEMS}
          buckets={[
            { id: "2010", label: "Incoterms 2010" },
            { id: "2020", label: "Incoterms® 2020" },
          ]}
          instructions="Mỗi đặc điểm thuộc phiên bản nào?"
          onScore={(pct) => progress.recordQuiz("classify", pct)}
        />
      )}
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Nguồn: KB §3.6 ·{" "}
        <Link to="/learn/c3#incoterms-2010-vs-2020" className="underline">
          Lý thuyết C3
        </Link>
      </p>
    </div>
  );
}

export function ContractView() {
  return (
    <DiagramViewer
      spec={contract}
      extraModes={[
        {
          id: "classify",
          label: "Bắt lỗi hợp đồng",
          render: (onScore) => (
            <ClassifyQuiz
              items={DRAFT_CLAUSES}
              buckets={[
                { id: "ok", label: "Viết đúng" },
                { id: "error", label: "Có lỗi" },
              ]}
              instructions="Bản nháp hợp đồng: điều khoản nào viết đúng, điều khoản nào có lỗi? (dựa trên các khuyến nghị “nên / không nên” trong slide C6)"
              onScore={onScore}
            />
          ),
        },
      ]}
    />
  );
}

const ISSUER_BUCKETS = [
  { id: "i-seller", label: "Người bán" },
  { id: "i-carrier", label: "Người chuyên chở" },
  { id: "i-insurer", label: "Công ty bảo hiểm" },
  { id: "i-chamber", label: "VCCI / Phòng TM" },
  { id: "i-gov", label: "Cơ quan nhà nước" },
];

export function DocumentLifecycleView({ focusStepId }: DiagramViewProps) {
  const items = lifecycle.steps.map((s) => ({ id: s.id, textVi: s.titleVi, bucket: s.actors[0]! }));
  return (
    <DiagramViewer
      spec={lifecycle}
      focusStepId={focusStepId}
      extraModes={[
        {
          id: "classify",
          label: "Ai phát hành?",
          render: (onScore) => <ClassifyQuiz items={items} buckets={ISSUER_BUCKETS} instructions="Chứng từ nào do ai phát hành?" onScore={onScore} />,
        },
      ]}
    />
  );
}

export function BlTypesView() {
  const buckets = blTypes.nodes.filter((n) => !n.id.startsWith("q-") && n.id !== "bl").map((n) => ({ id: n.id, label: n.label.replace(/\n/g, " ") }));
  return (
    <DiagramViewer
      spec={blTypes}
      extraModes={[
        {
          id: "classify",
          label: "Đây là loại B/L nào?",
          render: (onScore) => <ClassifyQuiz items={BL_ITEMS} buckets={buckets} instructions="Chọn loại vận đơn đúng cho từng mô tả." onScore={onScore} />,
        },
      ]}
    />
  );
}

export function InvoicesView({ focusStepId }: DiagramViewProps) {
  return (
    <DiagramViewer
      spec={invoices}
      focusStepId={focusStepId}
      extraModes={[
        {
          id: "classify",
          label: "Chiếu lệ hay thương mại?",
          render: (onScore) => (
            <ClassifyQuiz
              items={INVOICE_ITEMS}
              buckets={[
                { id: "proforma", label: "Pro forma invoice" },
                { id: "commercial", label: "Commercial invoice" },
              ]}
              instructions="Đặc điểm nào thuộc hóa đơn chiếu lệ, đặc điểm nào thuộc hóa đơn thương mại?"
              onScore={onScore}
            />
          ),
        },
      ]}
    />
  );
}

