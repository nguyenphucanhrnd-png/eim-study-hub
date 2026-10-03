import { useEffect, useState } from "react";
import { Segmented } from "@/components/ui/form";
import { cx } from "@/components/ui";
import { EXPLORED_MARK, allViewed, useDiagramProgress } from "@/features/diagrams/engine/useDiagramProgress";
import { FCA_AT_PREMISES, PARTY_VI, RULES, RULE_BY_CODE, STAGES, type IncotermRule, type Party, type RuleCode } from "./data";
import { CarriageStrip, IncidentChallenge, IncidentSimulator } from "./CarriageStrip";
import { INCIDENTS } from "./incident";

/** Progress id of D3.3 (the Explorer is the diagram). */
const DIAGRAM_ID = "c3-carriage-incoterms";

const D_RULES: { code: RuleCode; vi: string }[] = [
  { code: "DAP", vi: "sẵn sàng để dỡ" },
  { code: "DPU", vi: "đã dỡ hàng" },
  { code: "DDP", vi: "đã thông quan NK, sẵn sàng để dỡ" },
];

const CELL: Record<Party, string> = {
  S: "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100",
  B: "bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100",
};
const SHORT: Record<Party, string> = { S: "Bán", B: "Mua" };

const ANY = RULES.filter((r) => r.mode === "any");
const SEA = RULES.filter((r) => r.mode === "sea");

/** Apply the FCA "seller's premises" variant when selected. */
function resolve(rule: IncotermRule, fcaPremises: boolean): IncotermRule {
  return rule.code === "FCA" && fcaPremises ? { ...rule, ...FCA_AT_PREMISES } : rule;
}

function RulePicker({ value, onChange, label }: { value: RuleCode; onChange: (c: RuleCode) => void; label: string }) {
  const group = (title: string, rules: IncotermRule[]) => (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {rules.map((r) => (
          <button
            key={r.code}
            type="button"
            aria-pressed={r.code === value}
            onClick={() => onChange(r.code)}
            title={r.name}
            className={cx(
              "min-w-14 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors duration-150",
              r.code === value
                ? "border-navy-800 bg-navy-800 text-white dark:border-navy-300 dark:bg-navy-300 dark:text-navy-950"
                : "border-slate-300 bg-white text-slate-700 hover:border-navy-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
            )}
          >
            {r.code}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <fieldset className="flex flex-wrap gap-x-6 gap-y-3">
      <legend className="sr-only">{label}</legend>
      {group("Mọi phương thức vận tải (7)", ANY)}
      {group("Đường biển & thủy nội địa (4)", SEA)}
    </fieldset>
  );
}

/** Cost / risk / insurance bars along the 9-stage chain, rendered as an accessible table. */
export function ChainTable({ rule }: { rule: IncotermRule }) {
  const deliveryIdx = rule.risks.indexOf("B");
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-xs">
        <caption className="sr-only">
          {rule.code}: phân chia chi phí, rủi ro và bảo hiểm theo từng chặng
        </caption>
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900">
            <th scope="col" className="sticky left-0 z-10 w-24 bg-slate-50 p-2 text-left font-semibold dark:bg-slate-900">
              Chặng
            </th>
            {STAGES.map((s, i) => (
              <th key={s.id} scope="col" className="p-2 text-center align-bottom font-medium leading-snug" title={s.en}>
                <span className="block text-slate-400">{i + 1}</span>
                {s.vi}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["CHI PHÍ", rule.costs],
              ["RỦI RO", rule.risks],
            ] as const
          ).map(([label, row]) => (
            <tr key={label}>
              <th scope="row" className="sticky left-0 z-10 bg-white p-2 text-left font-semibold dark:bg-slate-950">
                {label}
              </th>
              {row.map((party, i) => (
                <td
                  key={i}
                  className={cx(
                    "border-l-2 border-white p-0 dark:border-slate-950",
                    label === "RỦI RO" && i === deliveryIdx && "!border-l-4 !border-l-red-600 dark:!border-l-red-400",
                  )}
                >
                  <div className={cx("m-0.5 rounded px-1 py-2 text-center font-semibold", CELL[party])}>
                    <span aria-hidden="true">{SHORT[party]}</span>
                    <span className="sr-only">{PARTY_VI[party]}</span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="sticky left-0 z-10 bg-white p-2 text-left font-semibold dark:bg-slate-950">
              BẢO HIỂM
            </th>
            {rule.risks.map((bearer, i) => {
              const required = rule.insuredStages.includes(i);
              return (
                <td key={i} className="border-l-2 border-white p-0 dark:border-slate-950">
                  {required ? (
                    <div className={cx("m-0.5 rounded px-1 py-2 text-center font-semibold", CELL.S)}>
                      Bán mua {rule.insurance}
                      <span className="sr-only"> (bắt buộc)</span>
                    </div>
                  ) : (
                    <div
                      className={cx(
                        "m-0.5 rounded border border-dashed px-1 py-2 text-center opacity-80",
                        bearer === "S"
                          ? "border-blue-400 text-blue-900 dark:text-blue-200"
                          : "border-amber-500 text-amber-950 dark:text-amber-200",
                      )}
                    >
                      <span aria-hidden="true">{SHORT[bearer]} tùy chọn</span>
                      <span className="sr-only">Không bắt buộc; {PARTY_VI[bearer]} chịu rủi ro, có thể tự mua</span>
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const ROWS: { label: string; get: (r: IncotermRule) => string }[] = [
  { label: "Tên đầy đủ", get: (r) => r.name },
  { label: "Nhóm", get: (r) => `Nhóm ${r.group}` },
  { label: "Phương thức vận tải", get: (r) => (r.mode === "any" ? "Mọi phương thức" : "Đường biển & thủy nội địa") },
  { label: "Địa điểm chỉ định", get: (r) => r.namedPlace },
  { label: "Giấy phép / thông quan XK", get: (r) => PARTY_VI[r.exportLicence] },
  { label: "Giấy phép / thông quan NK", get: (r) => PARTY_VI[r.importLicence] },
  { label: "Hợp đồng vận tải chính", get: (r) => PARTY_VI[r.mainCarriage] },
  { label: "Nghĩa vụ bảo hiểm", get: (r) => (r.insurance === "none" ? "Không" : `Người bán – tối thiểu ${r.insurance}`) },
  { label: "Giao hàng = chuyển rủi ro", get: (r) => r.deliveryVi },
];

export function ObligationTable({ rules }: { rules: IncotermRule[] }) {
  const differs = (row: (typeof ROWS)[number]) => rules.length > 1 && new Set(rules.map(row.get)).size > 1;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Bảng nghĩa vụ theo KB §3.8</caption>
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th scope="col" className="p-2.5 text-left font-semibold">
              Nghĩa vụ
            </th>
            {rules.map((r, i) => (
              <th key={`${r.code}-${i}`} scope="col" className="p-2.5 text-left font-semibold">
                {r.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr
              key={row.label}
              className={cx("border-t border-slate-200 dark:border-slate-800", differs(row) && "bg-amber-50/70 dark:bg-amber-900/15")}
            >
              <th scope="row" className="w-48 p-2.5 text-left align-top font-medium text-slate-600 dark:text-slate-400">
                {row.label}
                {differs(row) && <span className="sr-only"> (khác nhau)</span>}
              </th>
              {rules.map((r, i) => (
                <td key={`${r.code}-${i}`} className="p-2.5 align-top">
                  {row.get(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
      <li className="flex items-center gap-1.5">
        <span className={cx("inline-block h-3 w-5 rounded", CELL.S)} /> Người bán (seller)
      </li>
      <li className="flex items-center gap-1.5">
        <span className={cx("inline-block h-3 w-5 rounded", CELL.B)} /> Người mua (buyer)
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-5 rounded border border-dashed border-slate-400" /> Bảo hiểm không bắt buộc
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-1 rounded bg-red-600 dark:bg-red-400" /> Điểm chuyển rủi ro
      </li>
    </ul>
  );
}

function RuleView({
  rule,
  fcaPremises,
  setFcaPremises,
  incidentId,
  onPickRule,
}: {
  rule: IncotermRule;
  fcaPremises: boolean;
  setFcaPremises: (v: boolean) => void;
  incidentId?: string | null;
  onPickRule?: (c: RuleCode) => void;
}) {
  const resolved = resolve(rule, fcaPremises);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
          {rule.code} – {rule.name}{" "}
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({rule.namedPlace}) Incoterms® 2020</span>
        </h3>
        {rule.code === "FCA" && (
          <Segmented
            label="Nơi giao hàng FCA"
            value={fcaPremises ? "premises" : "other"}
            onChange={(v) => setFcaPremises(v === "premises")}
            options={[
              { value: "other", label: "Nơi khác" },
              { value: "premises", label: "Tại cơ sở người bán" },
            ]}
          />
        )}
      </div>
      {rule.group === "D" && onPickRule && (
        <div role="group" aria-label="So sánh nhóm D" className="flex flex-wrap gap-1.5 text-xs">
          {D_RULES.map((d) => (
            <button
              key={d.code}
              type="button"
              aria-pressed={d.code === rule.code}
              onClick={() => onPickRule(d.code)}
              className={cx(
                "rounded-full border px-2.5 py-1 font-medium",
                d.code === rule.code ? "border-navy-700 bg-navy-50 dark:bg-navy-900/60" : "border-slate-300 dark:border-slate-600",
              )}
            >
              {d.code} – {d.vi}
            </button>
          ))}
        </div>
      )}
      <CarriageStrip rule={resolved} incident={INCIDENTS.find((i) => i.id === incidentId) ?? null} />
      <details className="rounded-xl border border-slate-200 dark:border-slate-800">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Bảng chi phí – rủi ro – bảo hiểm theo 9 chặng</summary>
        <div className="p-2">
          <ChainTable rule={resolved} />
        </div>
      </details>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
        <li>
          <strong>Giao hàng / chuyển rủi ro:</strong> {rule.deliveryVi}.
        </li>
        {rule.notesVi.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

export default function IncotermsExplorer() {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [a, setA] = useState<RuleCode>("CIF");
  const [b, setB] = useState<RuleCode>("FOB");
  const [fcaPremises, setFcaPremises] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const progress = useDiagramProgress(DIAGRAM_ID);
  const { viewed, markViewed } = progress;

  useEffect(() => {
    const id = `n:${a}`;
    if (viewed.includes(id)) return;
    const required = RULES.map((r) => `n:${r.code}`);
    markViewed(allViewed([...viewed, id], required) ? [id, EXPLORED_MARK] : [id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record each rule once
  }, [a]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Chế độ xem"
          value={mode}
          onChange={setMode}
          options={[
            { value: "single", label: "Một điều kiện" },
            { value: "compare", label: "So sánh 2 rule" },
          ]}
        />
        <Legend />
      </div>

      {mode === "single" ? (
        <>
          <RulePicker label="Chọn điều kiện Incoterms" value={a} onChange={setA} />
          <RuleView rule={RULE_BY_CODE[a]} fcaPremises={fcaPremises} setFcaPremises={setFcaPremises} incidentId={incidentId} onPickRule={setA} />
          <IncidentSimulator rule={resolve(RULE_BY_CODE[a], fcaPremises)} incidentId={incidentId} onIncident={setIncidentId} />
          <ObligationTable rules={[resolve(RULE_BY_CODE[a], fcaPremises)]} />
          <IncidentChallenge onScore={(pct) => progress.recordQuiz("incident", pct)} />
        </>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">Điều kiện A</p>
              <RulePicker label="Điều kiện A" value={a} onChange={setA} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Điều kiện B</p>
              <RulePicker label="Điều kiện B" value={b} onChange={setB} />
            </div>
          </div>
          <RuleView rule={RULE_BY_CODE[a]} fcaPremises={fcaPremises} setFcaPremises={setFcaPremises} />
          <RuleView rule={RULE_BY_CODE[b]} fcaPremises={fcaPremises} setFcaPremises={setFcaPremises} />
          <div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Các dòng tô vàng là điểm khác nhau giữa hai điều kiện.</p>
            <ObligationTable rules={[resolve(RULE_BY_CODE[a], fcaPremises), resolve(RULE_BY_CODE[b], fcaPremises)]} />
          </div>
        </>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Nguồn: KB §3.8 (bảng nghĩa vụ) và sơ đồ COSTS/RISKS của ICC trên slide Chương 3. Nguyên tắc chung: người bán chịu chi phí đến khi
        giao hàng, người mua chịu từ khi giao hàng; rủi ro chuyển tại điểm giao hàng. Riêng nhóm C, người bán trả thêm cước vận tải chính đến
        nơi đến.
      </p>
    </div>
  );
}
