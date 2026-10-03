import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { CHAPTER_BY_ID } from "@/config/chapters";
import { PlayerControls } from "@/features/diagrams/engine/PlayerControls";
import { usePlayer } from "@/features/diagrams/engine/modes/PlayMode";
import { docLink } from "@/features/diagrams/engine/StepPanel";
import { KIND_STYLE, KindIcon } from "@/features/diagrams/engine/style";
import { IncidentSimulator } from "@/features/tools/incoterms/CarriageStrip";
import { PARTY_VI, RULES, RULE_BY_CODE, type RuleCode } from "@/features/tools/incoterms/data";
import { resolveRule } from "@/features/tools/incoterms/incident";
import { LANES, MODES, PAYMENTS, PHASES, buildJourney, ruleAllowed, type CardKind, type JourneyCard, type PaymentId, type TransportMode } from "./buildJourney";

const FLOW_KINDS = ["goods", "document", "money"] as const;
const OVERLAY_VI: Record<(typeof FLOW_KINDS)[number], string> = { goods: "Dòng hàng", document: "Dòng chứng từ", money: "Dòng tiền" };
const LANE_VI = Object.fromEntries(LANES.map((l) => [l.id, l.vi])) as Record<string, string>;

function CardIcon({ kind }: { kind: CardKind }) {
  if (kind === "action") return <span aria-hidden className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm bg-slate-400 dark:bg-slate-500" />;
  return (
    <svg width="16" height="16" viewBox="-10 -10 20 20" className="mt-px shrink-0" style={{ color: KIND_STYLE[kind].stroke }} aria-hidden>
      <KindIcon kind={kind} size={17} />
    </svg>
  );
}

/** /journey — the whole course as one transaction (DIAGRAMS_PROMPT §5). */
export default function JourneyPage() {
  const [rule, setRule] = useState<RuleCode>("CIF");
  const [payment, setPayment] = useState<PaymentId>("lc");
  const [mode, setMode] = useState<TransportMode>("sea");
  const [fcaPremises, setFcaPremises] = useState(false);
  const [overlays, setOverlays] = useState<Record<string, boolean>>({ goods: true, document: true, money: true });
  const [selected, setSelected] = useState<string | null>(null);
  const [incidentMode, setIncidentMode] = useState(false);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const ruleId = useId();

  const journey = useMemo(() => buildJourney(rule, payment, mode, { fcaAtPremises: fcaPremises }), [rule, payment, mode, fcaPremises]);
  const cards = journey.ok ? journey.cards : [];
  const player = usePlayer(cards.length);
  const current = player.index >= 0 ? cards[player.index] : undefined;
  const shown = current ?? cards.find((c) => c.id === selected);

  useEffect(() => {
    player.reset();
    setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart when the scenario changes
  }, [rule, payment, mode, fcaPremises]);

  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!current) return;
    gridRef.current?.querySelector(`[data-card="${current.id}"]`)?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [current]);

  const visible = (c: JourneyCard) => (c.kind === "goods" || c.kind === "document" || c.kind === "money" ? overlays[c.kind] : true);

  return (
    <>
      <PageHeader title="Hành trình xuất nhập khẩu" subtitle="Toàn bộ môn học trong một giao dịch: chọn điều kiện Incoterms, phương thức thanh toán và phương thức vận tải.">
        <Link to="/diagrams" className="text-sm text-navy-700 underline dark:text-navy-200">
          Tất cả sơ đồ
        </Link>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <label htmlFor={ruleId} className="flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Điều kiện Incoterms® 2020
            <select
              id={ruleId}
              value={rule}
              onChange={(e) => setRule(e.target.value as RuleCode)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-900"
            >
              {RULES.map((r) => (
                <option key={r.code} value={r.code} disabled={!ruleAllowed(r.code, mode)}>
                  {r.code} – {r.name}
                  {!ruleAllowed(r.code, mode) ? " (chỉ đường biển)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Thanh toán</span>
            <Segmented label="Phương thức thanh toán" value={payment} onChange={setPayment} options={PAYMENTS.map((p) => ({ value: p.id, label: p.label }))} />
          </div>
          <div className="flex flex-col gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Vận tải</span>
            <Segmented label="Phương thức vận tải" value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.id, label: m.label }))} />
          </div>
          {rule === "FCA" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={fcaPremises} onChange={(e) => setFcaPremises(e.target.checked)} className="h-4 w-4 accent-navy-700" />
              FCA giao tại cơ sở người bán
            </label>
          )}
        </div>

        {!journey.ok ? (
          <p role="alert" className="rounded-xl border border-wrong bg-red-50 p-3 text-sm dark:bg-red-950/40">
            {journey.reasonVi}
          </p>
        ) : (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["Vận tải chính", `${PARTY_VI[journey.mainCarriage]} thuê – ${journey.transportDoc}`],
                  ["Thông quan XK / NK", `${PARTY_VI[journey.exportClearance]} / ${PARTY_VI[journey.importClearance]}`],
                  ["⚑ Chuyển rủi ro (giai đoạn " + journey.risk.phase + ")", journey.risk.labelVi],
                  ["$ Chuyển chi phí (giai đoạn " + journey.cost.phase + ")", journey.cost.labelVi],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-slate-700 dark:text-slate-300">🛡 {journey.insurance.noteVi}</p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <PlayerControls
                index={player.index}
                total={cards.length}
                playing={player.playing}
                speed={player.speed}
                onPrev={player.prev}
                onNext={player.next}
                onToggle={player.toggle}
                onReset={player.reset}
                onSpeed={player.setSpeed}
              />
              <div role="group" aria-label="Lớp hiển thị" className="flex flex-wrap items-center gap-3 text-sm">
                {FLOW_KINDS.map((k) => (
                  <label key={k} className="flex items-center gap-1.5">
                    <input type="checkbox" checked={overlays[k]} onChange={(e) => setOverlays((o) => ({ ...o, [k]: e.target.checked }))} className="h-4 w-4 accent-navy-700" />
                    <CardIcon kind={k} /> {OVERLAY_VI[k]}
                  </label>
                ))}
                <label className="flex items-center gap-1.5 font-medium">
                  <input type="checkbox" checked={incidentMode} onChange={(e) => setIncidentMode(e.target.checked)} className="h-4 w-4 accent-navy-700" />⚠ Sự cố
                </label>
              </div>
            </div>

            <aside aria-label="Chi tiết bước" aria-live="polite" className="min-h-[7.5rem] rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              {shown ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Bước {shown.seq} · Giai đoạn {shown.phase}: {PHASES[shown.phase - 1]!.vi}
                  </p>
                  <h2 className="font-semibold text-navy-900 dark:text-white">{shown.titleVi}</h2>
                  <p>
                    {LANE_VI[shown.lane]}
                    {shown.to ? ` → ${LANE_VI[shown.to]}` : ""}
                    {shown.optional ? " · không bắt buộc" : ""}
                  </p>
                  <p>{shown.detailVi}</p>
                  {shown.documents && (
                    <div className="flex flex-wrap gap-1.5">
                      {shown.documents.map((d) => (
                        <Link key={d} to={docLink(d)} className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-900 hover:underline dark:bg-violet-950/60 dark:text-violet-200">
                          {d}
                        </Link>
                      ))}
                    </div>
                  )}
                  <p className="flex flex-wrap gap-3">
                    <Link to={shown.learn} className="text-navy-700 underline dark:text-navy-200">
                      Lý thuyết
                    </Link>
                    {shown.topic && (
                      <Link to={`/practice?topic=${shown.topic}`} className="text-navy-700 underline dark:text-navy-200">
                        Luyện câu hỏi
                      </Link>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">Bấm ▶ để chạy toàn bộ hành trình hoặc bấm vào một thẻ. Nét đứt = bước không bắt buộc.</p>
              )}
            </aside>

            <div>
              <div ref={gridRef} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="grid min-w-[88rem] grid-cols-[7.5rem_repeat(11,minmax(0,1fr))] text-xs" role="table" aria-label="Hành trình theo bên tham gia và giai đoạn">
                  <div role="row" className="contents">
                    <div role="columnheader" className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 p-2 font-semibold dark:border-slate-800 dark:bg-slate-900">
                      Bên \ Giai đoạn
                    </div>
                    {PHASES.map((p) => (
                      <div key={p.n} role="columnheader" className="border-b border-l border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
                        <p className="font-semibold">
                          {p.n}. {p.vi}
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-1">
                          {p.chapters.map((c) => (
                            <Link key={c} to={`/learn/${CHAPTER_BY_ID[c].slug}`} className="rounded bg-white px-1 font-semibold text-navy-700 hover:underline dark:bg-slate-800 dark:text-navy-200">
                              {c}
                            </Link>
                          ))}
                          {journey.risk.phase === p.n && <span className="rounded bg-red-100 px-1 font-bold text-red-800 dark:bg-red-950 dark:text-red-200">⚑ rủi ro</span>}
                          {journey.cost.phase === p.n && <span className="rounded bg-green-100 px-1 font-bold text-green-800 dark:bg-green-950 dark:text-green-200">$ chi phí</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                  {LANES.map((lane) => (
                    <div key={lane.id} role="row" className="contents">
                      <div role="rowheader" className="sticky left-0 z-10 border-b border-slate-200 bg-white p-2 font-semibold dark:border-slate-800 dark:bg-slate-950">
                        {lane.vi}
                        <span className="block font-normal italic text-slate-500 dark:text-slate-400" lang="en">
                          {lane.en}
                        </span>
                      </div>
                      {PHASES.map((p) => (
                        <div key={p.n} role="cell" className="space-y-1 border-b border-l border-slate-200 p-1 dark:border-slate-800">
                          {cards
                            .filter((c) => c.lane === lane.id && c.phase === p.n)
                            .map((c) => {
                              const isCurrent = shown?.id === c.id;
                              const dim = !visible(c) || (player.index >= 0 && !isCurrent);
                              return (
                                <button
                                  key={c.id}
                                  data-card={c.id}
                                  type="button"
                                  onClick={() => {
                                    player.setPlaying(false);
                                    player.goTo(cards.indexOf(c));
                                    setSelected(c.id);
                                  }}
                                  aria-current={isCurrent ? "step" : undefined}
                                  className={cx(
                                    "flex w-full items-start gap-1 rounded-md border p-1 text-left leading-snug transition-opacity",
                                    c.optional ? "border-dashed" : "",
                                    isCurrent ? "border-navy-700 bg-navy-50 ring-2 ring-navy-600 dark:bg-navy-900/60" : "border-slate-200 bg-white hover:border-navy-400 dark:border-slate-700 dark:bg-slate-900",
                                    dim && "opacity-30",
                                  )}
                                >
                                  <CardIcon kind={c.kind} />
                                  <span>
                                    <span className="tabular-nums text-slate-500 dark:text-slate-400">{c.seq}. </span>
                                    {c.titleVi}
                                    {c.to && <span className="block text-slate-500 dark:text-slate-400">→ {LANE_VI[c.to]}</span>}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {incidentMode && (
              <IncidentSimulator rule={resolveRule(RULE_BY_CODE[rule], fcaPremises)} incidentId={incidentId} onIncident={setIncidentId} />
            )}
          </>
        )}
      </div>
    </>
  );
}
