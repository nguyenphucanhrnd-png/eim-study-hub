import { useState, type ChangeEvent } from "react";
import { cx } from "@/components/ui";
import { Field } from "@/components/ui/form";
import { computeFx, formatMoney, SLIDE_EXAMPLE } from "./logic";

interface FormState {
  currency: string;
  home: string;
  quantity: string;
  unitPrice: string;
  rateAtContract: string;
  rateAtPayment: string;
  costs: string;
}

const fromSlide = (rateAtPayment: number): FormState => ({
  currency: SLIDE_EXAMPLE.currency,
  home: "VND",
  quantity: String(SLIDE_EXAMPLE.quantity),
  unitPrice: String(SLIDE_EXAMPLE.unitPrice),
  rateAtContract: String(SLIDE_EXAMPLE.rateAtContract),
  rateAtPayment: String(rateAtPayment),
  costs: "0",
});

const num = (s: string) => {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
      <p className="text-xs text-slate-600 dark:text-slate-400">{label}</p>
      <p
        className={cx(
          "mt-0.5 text-lg font-semibold tabular-nums",
          tone === "good" && "text-green-700 dark:text-green-300",
          tone === "bad" && "text-red-700 dark:text-red-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default function FxCalculator() {
  const [f, setF] = useState<FormState>(fromSlide(SLIDE_EXAMPLE.scenarios[0].rateAtPayment));
  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const r = computeFx({
    quantity: num(f.quantity),
    unitPrice: num(f.unitPrice),
    rateAtContract: num(f.rateAtContract),
    rateAtPayment: num(f.rateAtPayment),
    costs: num(f.costs),
  });
  const home = f.home || "VND";
  const fx = f.currency || "FX";
  const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}%`);
  const sign = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Ví dụ slide (cà phê, EUR 50,000, 30,000 VND/EUR):</span>
        {SLIDE_EXAMPLE.scenarios.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setF(fromSlide(s.rateAtPayment))}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm hover:border-navy-400 dark:border-slate-700"
          >
            {s.label} ({s.rateAtPayment.toLocaleString("en-US")})
          </button>
        ))}
      </div>

      <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Ngoại tệ" value={f.currency} onChange={set("currency")} maxLength={5} />
        <Field label="Nội tệ" value={f.home} onChange={set("home")} maxLength={5} />
        <Field label="Số lượng" inputMode="decimal" value={f.quantity} onChange={set("quantity")} />
        <Field label={`Đơn giá (${fx}/đơn vị)`} inputMode="decimal" value={f.unitPrice} onChange={set("unitPrice")} />
        <Field label={`Tỷ giá lúc ký HĐ (${home}/${fx})`} inputMode="decimal" value={f.rateAtContract} onChange={set("rateAtContract")} />
        <Field label={`Tỷ giá lúc thanh toán (${home}/${fx})`} inputMode="decimal" value={f.rateAtPayment} onChange={set("rateAtPayment")} />
        <Field
          label={`Tổng chi phí – COGS (${home})`}
          inputMode="decimal"
          value={f.costs}
          onChange={set("costs")}
          hint="Chi phí sản phẩm + logistics + thuế/phí (KB §2.9). Slide không cho số liệu chi phí."
          className="sm:col-span-2"
        />
      </form>

      <div aria-live="polite" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`Doanh thu (${fx})`} value={formatMoney(r.revenueForeign, fx, 2)} />
        <Stat label="Doanh thu dự kiến (tỷ giá lúc ký)" value={formatMoney(r.revenueAtContract, home)} />
        <Stat label="Doanh thu thực tế (tỷ giá lúc thanh toán)" value={formatMoney(r.revenueAtPayment, home)} />
        <Stat
          label="Lãi / lỗ do tỷ giá"
          value={`${sign(r.fxGainLoss)}${formatMoney(Math.abs(r.fxGainLoss), home)}`}
          tone={r.fxGainLoss > 0 ? "good" : r.fxGainLoss < 0 ? "bad" : undefined}
        />
        <Stat label="Lợi nhuận gộp dự kiến" value={formatMoney(r.grossProfitExpected, home)} />
        <Stat label="Biên lợi nhuận gộp dự kiến" value={pct(r.marginExpected)} />
        <Stat label="Lợi nhuận gộp thực tế" value={formatMoney(r.grossProfitActual, home)} tone={r.grossProfitActual < 0 ? "bad" : undefined} />
        <Stat label="Biên lợi nhuận gộp thực tế" value={pct(r.marginActual)} />
      </div>

      <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
        <p className="mb-1 font-semibold">Công thức (KB §2.9)</p>
        <ul className="list-disc space-y-0.5 pl-5 text-slate-700 dark:text-slate-300">
          <li>Export Revenue = Export Quantity × Export Price</li>
          <li>Gross Profit = Revenue − COGS; Gross Profit Margin = Gross Profit / Revenue × 100%</li>
          <li>Lãi/lỗ tỷ giá = Doanh thu ngoại tệ × (tỷ giá lúc thanh toán − tỷ giá lúc ký)</li>
        </ul>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Người mua vẫn trả đúng số ngoại tệ đã thỏa thuận; chỉ giá trị quy ra nội tệ thay đổi. Ngoại tệ giảm giá → doanh thu nội tệ giảm →
          lợi nhuận giảm; ngoại tệ tăng giá → ngược lại.
        </p>
      </div>
    </div>
  );
}
