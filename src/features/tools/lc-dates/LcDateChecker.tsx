import { useState, type ChangeEvent } from "react";
import { cx } from "@/components/ui";
import { Field } from "@/components/ui/form";
import { Callout } from "@/components/ui/Callout";
import { checkLcDates, formatDate, presentationDeadline, DEFAULT_PRESENTATION_DAYS, type LcDatesInput, type RuleStatus } from "./logic";

const PRESETS: { label: string; value: LcDatesInput }[] = [
  {
    label: "Hợp lệ",
    value: { issue: "2026-07-01", latestShipment: "2026-08-30", shipment: "2026-08-20", presentation: "2026-09-05", expiry: "2026-09-30" },
  },
  {
    label: "Xuất trình muộn",
    value: { issue: "2026-07-01", latestShipment: "2026-08-30", shipment: "2026-08-20", presentation: "2026-09-14", expiry: "2026-09-30" },
  },
  {
    label: "Giao hàng trễ",
    value: { issue: "2026-07-01", latestShipment: "2026-08-30", shipment: "2026-09-02", presentation: "2026-09-10", expiry: "2026-09-30" },
  },
  {
    label: "L/C hết hạn",
    value: { issue: "2026-07-01", latestShipment: "2026-08-30", shipment: "2026-08-28", presentation: "2026-09-08", expiry: "2026-09-05" },
  },
];

const STATUS: Record<RuleStatus, { icon: string; cls: string; sr: string }> = {
  pass: { icon: "✔", cls: "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200", sr: "Đạt" },
  fail: { icon: "✘", cls: "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200", sr: "Không đạt" },
  missing: { icon: "…", cls: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300", sr: "Thiếu dữ liệu" },
};

export default function LcDateChecker() {
  const [input, setInput] = useState<LcDatesInput>(PRESETS[0]!.value);
  const set = (k: keyof LcDatesInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setInput((s) => ({ ...s, [k]: k === "presentationDays" ? (e.target.value ? Number(e.target.value) : null) : e.target.value }));
  const results = checkLcDates(input);
  const deadline = presentationDeadline(input);
  const fails = results.filter((r) => r.status === "fail").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Ví dụ nhanh:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setInput({ ...p.value, presentationDays: input.presentationDays })}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:border-navy-400 dark:border-slate-700"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
        <Field label="Ngày phát hành L/C (issue date)" type="date" value={input.issue} onChange={set("issue")} />
        <Field label="Ngày giao hàng chậm nhất (latest shipment)" type="date" value={input.latestShipment} onChange={set("latestShipment")} />
        <Field label="Ngày giao hàng thực tế (shipment date)" type="date" value={input.shipment} onChange={set("shipment")} />
        <Field label="Ngày xuất trình chứng từ (presentation)" type="date" value={input.presentation} onChange={set("presentation")} />
        <Field label="Ngày hết hạn L/C (expiry date)" type="date" value={input.expiry} onChange={set("expiry")} />
        <Field
          label="Thời hạn xuất trình ghi trong L/C (ngày)"
          type="number"
          min={1}
          max={60}
          placeholder={String(DEFAULT_PRESENTATION_DAYS)}
          value={input.presentationDays ?? ""}
          onChange={set("presentationDays")}
          hint="Để trống = mặc định 21 ngày sau ngày giao hàng."
        />
      </form>

      <div aria-live="polite">
        <p className={cx("mb-3 font-semibold", fails ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300")}>
          {fails ? `${fails} quy tắc bị vi phạm` : "Không có vi phạm về ngày"}
          {deadline && <span className="font-normal text-slate-600 dark:text-slate-400"> · Hạn xuất trình hiệu lực: {formatDate(deadline)}</span>}
        </p>
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id} className={cx("flex gap-3 rounded-lg border px-4 py-3", STATUS[r.status].cls)}>
              <span aria-hidden="true" className="text-lg font-bold leading-6">
                {STATUS[r.status].icon}
              </span>
              <div>
                <p className="font-medium">
                  <span className="sr-only">{STATUS[r.status].sr}: </span>
                  {r.labelVi}
                </p>
                <p className="text-sm opacity-90">{r.detailVi}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Callout kind="note" title="Nhớ thêm (KB §5.5)">
        <ul>
          <li>Thời hạn hiệu lực (validity period) tính từ ngày phát hành đến ngày hết hạn.</li>
          <li>
            Nếu hai bên đồng ý <strong>gia hạn ngày giao hàng</strong> thì ngày hết hạn cũng được gia hạn; ngược lại,{" "}
            <strong>gia hạn ngày hết hạn KHÔNG kéo theo gia hạn ngày giao hàng</strong>.
          </li>
          <li>Hợp đồng/L/C có thể quy định thời hạn xuất trình ngắn hơn 21 ngày (ví dụ 20 ngày) — 21 ngày là giới hạn chung (ERRATA E-12).</li>
        </ul>
      </Callout>
      <Callout kind="ext">
        <p>
          [EXT] UCP 600 Art. 14(c): xuất trình không muộn hơn 21 ngày dương lịch sau ngày giao hàng và trong mọi trường hợp không muộn hơn
          ngày hết hạn. Art. 29(c): ngày hết hạn được gia hạn do ngân hàng đóng cửa không làm gia hạn ngày giao hàng chậm nhất.
        </p>
      </Callout>
    </div>
  );
}
