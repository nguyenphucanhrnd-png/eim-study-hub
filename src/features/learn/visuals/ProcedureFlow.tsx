/** C8 visual summary — export (10) and import (9) procedures, with the steps driven by Incoterms or the payment method (KB §8.1–§8.3). */
type Driver = "incoterms" | "payment" | null;
const EXPORT: [string, Driver][] = [
  ["Negotiate and sign the sales contract", null],
  ["Consider payment terms (check L/C if payment by L/C)", "payment"],
  ["Prepare goods for export", null],
  ["Inspect goods", null],
  ["Arrange transportation (C & D rules)", "incoterms"],
  ["Arrange cargo insurance (CIF & CIP)", "incoterms"],
  ["Complete export customs clearance", null],
  ["Deliver the goods", "incoterms"],
  ["Prepare and present shipping documents for payment", "payment"],
  ["Handle claims and resolve disputes", null],
];
const IMPORT: [string, Driver][] = [
  ["Negotiate & sign the sale contract", null],
  ["Consider payment terms (open L/C if payment by L/C)", "payment"],
  ["Arrange transportation (E & F rules)", "incoterms"],
  ["Arrange cargo insurance (if any: E, F, CPT, CFR)", "incoterms"],
  ["Complete import customs clearance", null],
  ["Take delivery of goods", null],
  ["Inspect goods", null],
  ["Claim & settle claims", null],
  ["Make payment", "payment"],
];

const CHIP: Record<Exclude<Driver, null>, { label: string; cls: string }> = {
  incoterms: { label: "Incoterms", cls: "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100" },
  payment: { label: "Thanh toán", cls: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100" },
};

function Column({ title, steps }: { title: string; steps: [string, Driver][] }) {
  return (
    <div>
      <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <ol className="space-y-1.5">
        {steps.map(([s, d], i) => (
          <li key={s} className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[0.7rem] font-bold text-white">
              {i + 1}
            </span>
            <span className="flex-1">{s}</span>
            {d && <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.7rem] font-semibold ${CHIP[d].cls}`}>{CHIP[d].label}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ProcedureFlow() {
  return (
    <figure className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="grid gap-5 md:grid-cols-2">
        <Column title="Quy trình xuất khẩu (10 bước)" steps={EXPORT} />
        <Column title="Quy trình nhập khẩu (9 bước)" steps={IMPORT} />
      </div>
      <figcaption className="mt-3 text-xs text-slate-600 dark:text-slate-400">
        Nhãn cho biết bước nào phụ thuộc vào <strong>điều kiện Incoterms®</strong> hay <strong>phương thức thanh toán</strong> — hai yếu tố
        quyết định bên nào làm bước nào (KB §8.1).
      </figcaption>
    </figure>
  );
}
