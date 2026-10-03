import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, cx } from "@/components/ui";
import { Segmented } from "@/components/ui/form";
import { RiskLadder } from "@/features/tools/payment-flow/RiskLadder";
import { KIND_STYLE, KindIcon, provenanceLabel } from "../engine/style";
import { EXPLORED_MARK, STATUS_CHIP, STATUS_VI, allViewed, useDiagramProgress } from "../engine/useDiagramProgress";
import type { FlowKind } from "../engine/types";
import {
  EVENT_VI,
  METHODS,
  SELECTION_OPTIONS,
  SELECTION_SCENARIOS,
  exposedParty,
  type EventKind,
  type MethodTimeline,
} from "./methodCompare";

const ID = "c5-method-compare";
const KIND: Record<EventKind, FlowKind> = { goods: "goods", documents: "document", money: "money" };
const SLOTS = [1, 2, 3];

function EventChip({ kind, text }: { kind: EventKind; text: string }) {
  const k = KIND_STYLE[KIND[kind]];
  return (
    <span className="flex items-start gap-1.5 rounded-lg border bg-white px-2 py-1 text-xs leading-snug dark:bg-slate-900" style={{ borderColor: k.stroke }}>
      <svg width="18" height="18" viewBox="-10 -10 20 20" className="mt-px shrink-0" style={{ color: k.stroke }} aria-hidden>
        <KindIcon kind={KIND[kind]} size={17} />
      </svg>
      <span>
        <span className="font-semibold">{EVENT_VI[kind]}</span>
        <span className="hidden sm:inline"> – {text}</span>
      </span>
    </span>
  );
}

function Row({ m, open, onToggle }: { m: MethodTimeline; open: boolean; onToggle: () => void }) {
  const who = exposedParty(m);
  const maxSlot = Math.max(...m.events.map((e) => e.slot));
  return (
    <li className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full gap-2 p-3 text-left hover:bg-slate-50 md:grid-cols-[11rem_minmax(0,1fr)] dark:hover:bg-slate-800/50"
      >
        <span>
          <span className="block font-semibold text-navy-900 dark:text-white">{m.labelVi}</span>
          <span className="block text-xs italic text-slate-600 dark:text-slate-400" lang="en">
            {m.label}
          </span>
          <span
            className={cx(
              "mt-1 inline-block rounded px-1.5 text-[0.7rem] font-semibold",
              who === "buyer" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
            )}
          >
            Rủi ro nghiêng về: {who === "buyer" ? "người mua" : "người bán"}
          </span>
        </span>
        <span className="relative grid grid-cols-3 gap-2">
          {/* The "gap" between the first and the last event: who is exposed. */}
          <span
            aria-hidden
            className={cx("absolute top-1/2 h-1 -translate-y-1/2 rounded-full", who === "buyer" ? "bg-amber-300 dark:bg-amber-700" : "bg-blue-300 dark:bg-blue-700")}
            style={{ left: "8%", width: `${((maxSlot - 1) / 3) * 100 + 18}%`, opacity: 0.6 }}
          />
          {SLOTS.map((slot) => (
            <span key={slot} className="relative flex min-h-10 flex-col gap-1">
              {m.events
                .filter((e) => e.slot === slot)
                .map((e) => (
                  <EventChip key={e.kind} kind={e.kind} text={e.textVi} />
                ))}
            </span>
          ))}
        </span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-200 p-3 text-sm dark:border-slate-800">
          {m.beforeVi && <p>⏮ Trước đó: {m.beforeVi}.</p>}
          <ol className="list-decimal space-y-0.5 pl-5">
            {[...m.events]
              .sort((a, b) => a.slot - b.slot)
              .map((e) => (
                <li key={e.kind}>
                  <span className="font-semibold">{EVENT_VI[e.kind]}:</span> {e.textVi}
                </li>
              ))}
          </ol>
          {m.missingVi && <p className="text-xs text-slate-600 dark:text-slate-400">{m.missingVi}</p>}
          <p className="rounded-lg bg-amber-50 p-2 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            <span className="font-semibold">Ai chịu rủi ro trong khoảng chờ? </span>
            {m.gapVi}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to={m.learn} className="text-navy-700 underline dark:text-navy-200">
              Lý thuyết
            </Link>
            <Link to={`/practice?topic=${m.topic}`} className="text-navy-700 underline dark:text-navy-200">
              Luyện câu hỏi
            </Link>
            <span className="text-xs text-slate-600 dark:text-slate-400">📘 Nguồn: {m.source}</span>
          </p>
        </div>
      )}
    </li>
  );
}

function SelectionQuiz({ onScore }: { onScore: (pct: number) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const correct = SELECTION_SCENARIOS.filter((s) => answers[s.id] === s.answer).length;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700 dark:text-slate-300">Chọn phương thức phù hợp cho từng tình huống – đáp án dựa trên tiêu chí “khi nào dùng” trong slide.</p>
      <ol className="space-y-4">
        {SELECTION_SCENARIOS.map((s, i) => {
          const ok = answers[s.id] === s.answer;
          return (
            <li key={s.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <fieldset>
                <legend className="mb-2 font-medium">
                  {i + 1}. {s.textVi}
                </legend>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {SELECTION_OPTIONS.map((o) => (
                    <label
                      key={o.id}
                      className={cx(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-sm",
                        checked && o.id === s.answer
                          ? "border-correct bg-green-50 dark:bg-green-950/40"
                          : checked && answers[s.id] === o.id
                            ? "border-wrong bg-red-50 dark:bg-red-950/40"
                            : "border-slate-200 dark:border-slate-700",
                      )}
                    >
                      <input
                        type="radio"
                        name={s.id}
                        value={o.id}
                        disabled={checked}
                        checked={answers[s.id] === o.id}
                        onChange={() => setAnswers((a) => ({ ...a, [s.id]: o.id }))}
                        className="accent-navy-700"
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {checked && (
                <p className={cx("mt-2 text-sm", ok ? "text-correct dark:text-green-400" : "text-wrong dark:text-red-400")}>
                  {ok ? "✓ Đúng. " : "✗ Chưa đúng. "}
                  <span className="text-slate-800 dark:text-slate-200">{s.whyVi}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        {!checked ? (
          <Button
            disabled={Object.keys(answers).length < SELECTION_SCENARIOS.length}
            onClick={() => {
              setChecked(true);
              onScore(Math.round((correct / SELECTION_SCENARIOS.length) * 100));
            }}
          >
            Kiểm tra
          </Button>
        ) : (
          <>
            <p className="font-semibold">
              Kết quả: {correct}/{SELECTION_SCENARIOS.length}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setAnswers({});
                setChecked(false);
              }}
            >
              Làm lại
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** D5.7 — compare the six payment methods by the order of goods · documents · money. */
export default function MethodCompareView() {
  const progress = useDiagramProgress(ID);
  const [mode, setMode] = useState<"timeline" | "quiz">("timeline");
  const [open, setOpen] = useState<string | null>(null);
  const { viewed, markViewed } = progress;

  useEffect(() => {
    if (!open) return;
    const required = METHODS.map((m) => `n:${m.id}`);
    const next = [...viewed, `n:${open}`];
    markViewed(allViewed(next, required) ? [`n:${open}`, EXPLORED_MARK] : [`n:${open}`]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- record once per opened row
  }, [open]);

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
          { value: "timeline", label: "Dòng thời gian" },
          { value: "quiz", label: "Chọn phương thức" },
        ]}
      />
      {mode === "timeline" ? (
        <>
          <div className="hidden grid-cols-[11rem_minmax(0,1fr)] gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600 md:grid dark:text-slate-400">
            <span>Phương thức</span>
            <span className="grid grid-cols-3 gap-2">
              <span>Trước</span>
              <span>Sau đó</span>
              <span>Sau cùng</span>
            </span>
          </div>
          <ul className="space-y-2">
            {METHODS.map((m) => (
              <Row key={m.id} m={m} open={open === m.id} onToggle={() => setOpen((o) => (o === m.id ? null : m.id))} />
            ))}
          </ul>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Bấm vào một phương thức để xem thứ tự chi tiết và ai chịu rủi ro trong khoảng chờ. Các sự kiện cùng cột xảy ra gần như cùng lúc.
          </p>
          <RiskLadder />
        </>
      ) : (
        <SelectionQuiz onScore={(pct) => progress.recordQuiz("scenario", pct)} />
      )}
    </div>
  );
}
