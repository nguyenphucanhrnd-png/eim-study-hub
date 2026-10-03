import { useMemo, useState } from "react";
import { Button, cx } from "@/components/ui";
import { E04_NOTE, PERILS, covers } from "@/features/tools/icc/data";
import { PARTY_VI, RULE_BY_CODE, RULES, type IncotermRule, type Party } from "./data";
import { INCIDENTS, LEGS, STRIP_POINTS, buildChallenge, incidentAt, transferX, type IncidentPreset } from "./incident";

const X0 = 128;
const STEP = 90.5;
const sx = (x: number) => X0 + x * STEP;
const COLOR: Record<Party, string> = { S: "var(--dg-seller)", B: "var(--dg-buyer)" };
const PARTY_SHORT: Record<Party, string> = { S: "Người bán", B: "Người mua" };

function FlowArrow({ y, label, cut, rule }: { y: number; label: string; cut: number; rule: IncotermRule }) {
  const x1 = sx(-0.35);
  const x2 = sx(9.35);
  const mid = sx(cut);
  return (
    <g aria-hidden>
      <text x={x1 - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="13" fontWeight={700} style={{ fill: "var(--dg-seller)" }}>
        {label}
      </text>
      <line x1={x1} y1={y} x2={mid} y2={y} style={{ stroke: COLOR.S }} strokeWidth={4} />
      <line x1={mid} y1={y} x2={x2} y2={y} style={{ stroke: COLOR.B }} strokeWidth={4} />
      <path d={`M${mid - 9} ${y - 7} L${mid + 1} ${y} L${mid - 9} ${y + 7} Z`} style={{ fill: COLOR.S }} />
      <path d={`M${x2} ${y - 7} L${x2 + 10} ${y} L${x2} ${y + 7} Z`} style={{ fill: COLOR.B }} />
      <title>{`${label} ${rule.code}`}</title>
    </g>
  );
}

/** The slide strip (KB §3.7) with the ICC COSTS / RISKS / INSURANCE arrows of the selected rule. */
export function CarriageStrip({ rule, incident }: { rule: IncotermRule; incident?: IncidentPreset | null }) {
  const riskX = transferX(rule.risks);
  const costX = transferX(rule.costs);
  const twoPoints = Math.abs(costX - riskX) > 0.01;
  const insured = rule.insuredStages.length > 0;
  const summary = `${rule.code}: rủi ro chuyển sang người mua tại “${rule.deliveryVi}”. ${
    twoPoints ? "Chi phí chuyển ở điểm khác (người bán trả cước vận tải chính đến nơi đến)." : "Chi phí chuyển cùng điểm với rủi ro."
  } Thủ tục XK: ${PARTY_VI[rule.exportLicence]}; thủ tục NK: ${PARTY_VI[rule.importLicence]}.${
    insured ? ` Người bán bắt buộc mua bảo hiểm ${rule.insurance}.` : ""
  }`;
  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
        <svg viewBox="0 0 1000 300" className="h-auto w-full min-w-[46rem]" role="img" aria-label={summary}>
          {/* Legs */}
          {LEGS.map((l, i) => {
            const a = sx(l.from - 0.45);
            const b = sx(l.to + 0.45);
            const c = ["var(--dg-seller)", "var(--dg-carrier)", "var(--dg-buyer)"][i]!;
            return (
              <g key={l.id} aria-hidden>
                <line x1={a + 4} y1={30} x2={b - 4} y2={30} style={{ stroke: c }} strokeWidth={3} />
                <text x={(a + b) / 2} y={18} textAnchor="middle" fontSize="12.5" fontWeight={700} style={{ fill: "var(--dg-text)" }}>
                  {l.vi.split(" (")[0]}
                </text>
              </g>
            );
          })}
          {/* Points */}
          {STRIP_POINTS.map((p, i) => (
            <g key={p.id} aria-hidden>
              <circle cx={sx(i)} cy={72} r={17} style={{ fill: "var(--dg-surface)", stroke: "var(--dg-muted)" }} strokeWidth={2} />
              <text x={sx(i)} y={73} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight={700} style={{ fill: "var(--dg-text)" }}>
                {i + 1}
              </text>
              <text x={sx(i)} y={106} textAnchor="middle" fontSize="11.5" fontWeight={600} style={{ fill: "var(--dg-text)" }}>
                {p.vi}
              </text>
              <text x={sx(i)} y={121} textAnchor="middle" fontSize="10.5" style={{ fill: "var(--dg-muted)" }}>
                {p.en.replace(" customs clearance", "")}
              </text>
            </g>
          ))}
          {/* Formalities badges under points 4 and 8 */}
          {(
            [
              [3, "Export formalities", rule.exportLicence],
              [7, "Import formalities", rule.importLicence],
            ] as const
          ).map(([i, label, party]) => (
            <g key={label} aria-hidden>
              <rect x={sx(i) - 62} y={134} width={124} height={24} rx={6} style={{ fill: COLOR[party], opacity: 0.16, stroke: COLOR[party] }} strokeWidth={1.5} />
              <text x={sx(i)} y={147} textAnchor="middle" dominantBaseline="middle" fontSize="11.5" fontWeight={700} style={{ fill: "var(--dg-text)" }}>
                {label}: {party === "S" ? "Bán" : "Mua"}
              </text>
            </g>
          ))}
          <FlowArrow y={190} label="COSTS" cut={costX} rule={rule} />
          <FlowArrow y={218} label="RISKS" cut={riskX} rule={rule} />
          {insured && (
            <g aria-hidden>
              <text x={sx(-0.35) - 6} y={246} textAnchor="end" dominantBaseline="middle" fontSize="13" fontWeight={700} style={{ fill: "var(--dg-insurer)" }}>
                INSURANCE
              </text>
              <line x1={sx(riskX)} y1={246} x2={sx(costX)} y2={246} style={{ stroke: "var(--dg-insurer)" }} strokeWidth={4} strokeDasharray="10 5" />
              <text x={(sx(riskX) + sx(costX)) / 2} y={264} textAnchor="middle" fontSize="12" fontWeight={600} style={{ fill: "var(--dg-insurer)" }}>
                Người bán mua {rule.insurance} cho rủi ro người mua đang chịu
              </text>
            </g>
          )}
          {/* Transfer markers */}
          <g aria-hidden>
            <line x1={sx(riskX)} y1={44} x2={sx(riskX)} y2={226} style={{ stroke: "var(--color-wrong)" }} strokeWidth={2} strokeDasharray="4 4" />
            <text x={sx(riskX)} y={288} textAnchor="middle" fontSize="12.5" fontWeight={700} style={{ fill: "var(--color-wrong)" }}>
              ⚑ chuyển rủi ro
            </text>
            {twoPoints && (
              <>
                <line x1={sx(costX)} y1={44} x2={sx(costX)} y2={198} style={{ stroke: "var(--dg-money)" }} strokeWidth={2} strokeDasharray="4 4" />
                <text x={sx(costX)} y={288} textAnchor="middle" fontSize="12.5" fontWeight={700} style={{ fill: "var(--dg-money)" }}>
                  $ chuyển chi phí
                </text>
              </>
            )}
          </g>
          {incident && (
            <g aria-hidden>
              <path d={`M${sx(incident.x)} 52 l-12 -20 h24 Z`} style={{ fill: "var(--color-wrong)" }} />
              <text x={sx(incident.x)} y={40} textAnchor="middle" fontSize="13" fontWeight={800} fill="#fff">
                !
              </text>
            </g>
          )}
        </svg>
      </div>
      <figcaption className="text-xs text-slate-600 dark:text-slate-400">
        {twoPoints && rule.group === "C" && (
          <span className="mr-1 font-semibold text-wrong dark:text-red-400">Hai điểm tới hạn: “{rule.code} + cảng/nơi đến” ≠ rủi ro chuyển ở nơi đến.</span>
        )}
        Vị trí mũi tên mô phỏng sơ đồ COSTS/RISKS của ICC trên slide C3; thủ tục XK/NK tô theo bên có nghĩa vụ (KB §3.8, ERRATA E-14).
      </figcaption>
    </figure>
  );
}

/** "Sự cố trên đường": pick an incident → who bears the risk, who paid, insurance; optional peril → ICC A/B/C. */
export function IncidentSimulator({ rule, incidentId, onIncident }: { rule: IncotermRule; incidentId: string | null; onIncident: (id: string | null) => void }) {
  const [perilId, setPerilId] = useState("");
  const incident = INCIDENTS.find((i) => i.id === incidentId) ?? null;
  const res = incident ? incidentAt(rule, incident.stage) : null;
  const peril = PERILS.find((p) => p.id === perilId);
  return (
    <section aria-label="Sự cố trên đường" className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <h4 className="font-semibold text-navy-900 dark:text-white">⚠ Sự cố trên đường – ai chịu tổn thất?</h4>
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {[...INCIDENTS]
          .sort((a, b) => a.x - b.x)
          .map((i) => (
            <button
              key={i.id}
              type="button"
              aria-pressed={i.id === incidentId}
              onClick={() => onIncident(i.id === incidentId ? null : i.id)}
              className={cx(
                "rounded-lg border px-2.5 py-1.5 text-left text-sm",
                i.id === incidentId
                  ? "border-wrong bg-red-50 font-medium dark:bg-red-950/40"
                  : "border-slate-200 hover:border-navy-400 dark:border-slate-700",
              )}
            >
              {i.textVi}
            </button>
          ))}
      </div>
      {res && incident && (
        <div className="space-y-2 text-sm" aria-live="polite">
          <dl className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["Chịu rủi ro", res.risk],
                ["Chi phí chặng này", res.cost],
                ["Thuê & trả cước vận tải chính", res.mainCarriage],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-lg p-2" style={{ background: `color-mix(in srgb, ${COLOR[v]} 14%, transparent)` }}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{k}</dt>
                <dd className="font-semibold">{PARTY_SHORT[v]}</dd>
              </div>
            ))}
          </dl>
          <p>{res.explanationVi}</p>
          <label className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Nguyên nhân tổn thất (Bảng 6.2):</span>
            <select
              value={perilId}
              onChange={(e) => setPerilId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">— chọn để xem ICC (A)/(B)/(C) —</option>
              {PERILS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.vi} ({p.en})
                </option>
              ))}
            </select>
          </label>
          {peril && (
            <div>
              <p className="flex flex-wrap gap-2">
                {(["ICC-A", "ICC-B", "ICC-C"] as const).map((pol) => (
                  <span
                    key={pol}
                    className={cx(
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      covers(peril, pol) ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    )}
                  >
                    {pol.replace("ICC-", "ICC (")}) {covers(peril, pol) ? "✓ bảo hiểm" : "✗ không"}
                    {peril.errata?.includes(pol) ? " *" : ""}
                  </span>
                ))}
              </p>
              {res.insurance.kind === "compulsory" && (
                <p className="mt-1 text-xs">
                  Bảo hiểm bắt buộc của {rule.code} là {res.insurance.policy}:{" "}
                  {covers(peril, res.insurance.policy === "ICC (A)" ? "ICC-A" : "ICC-C") ? "rủi ro này được bảo hiểm." : "rủi ro này KHÔNG được bảo hiểm."}
                </p>
              )}
              {peril.errata && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">* {E04_NOTE}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** Quick quiz: 5 (rule, incident) pairs — who bears the risk? */
export function IncidentChallenge({ onScore }: { onScore: (pct: number) => void }) {
  const [seed, setSeed] = useState(() => Date.now() % 100000);
  const items = useMemo(() => buildChallenge(RULES, 5, seed), [seed]);
  const [answers, setAnswers] = useState<Record<number, Party>>({});
  const done = Object.keys(answers).length === items.length;
  const correct = items.filter((it, i) => answers[i] === incidentAt(RULE_BY_CODE[it.rule], it.incident.stage).risk).length;
  return (
    <section aria-label="Thử thách: ai chịu rủi ro?" className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <h4 className="font-semibold text-navy-900 dark:text-white">Thử thách: ai chịu rủi ro?</h4>
      <ol className="space-y-2">
        {items.map((it, i) => {
          const truth = incidentAt(RULE_BY_CODE[it.rule], it.incident.stage).risk;
          const a = answers[i];
          return (
            <li key={`${it.rule}-${it.incident.id}`} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
              <p>
                <span className="font-semibold">{it.rule}</span> · {it.incident.textVi}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {(["S", "B"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={!!a}
                    onClick={() => {
                      const next = { ...answers, [i]: p };
                      setAnswers(next);
                      if (Object.keys(next).length === items.length) {
                        const ok = items.filter((x, j) => next[j] === incidentAt(RULE_BY_CODE[x.rule], x.incident.stage).risk).length;
                        onScore(Math.round((ok / items.length) * 100));
                      }
                    }}
                    className={cx(
                      "rounded-md border px-2.5 py-1 text-xs font-semibold",
                      a === p ? (p === truth ? "border-correct bg-green-50 dark:bg-green-950/40" : "border-wrong bg-red-50 dark:bg-red-950/40") : "border-slate-300 dark:border-slate-600",
                    )}
                  >
                    {PARTY_SHORT[p]}
                  </button>
                ))}
                {a && <span className={a === truth ? "text-correct dark:text-green-400" : "text-wrong dark:text-red-400"}>{a === truth ? "✓ Đúng" : `✗ ${PARTY_SHORT[truth]} chịu rủi ro`}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {done && (
        <div className="flex items-center gap-3" aria-live="polite">
          <p className="font-semibold">
            Kết quả: {correct}/{items.length}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers({});
              setSeed((s) => s + 1);
            }}
          >
            Bộ câu khác
          </Button>
        </div>
      )}
    </section>
  );
}
