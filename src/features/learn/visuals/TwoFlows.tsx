/** C1 visual summary — KB §1.2 (physical flow, 9 steps), §1.3 (financial flow A–E), §1.5 (coordination chain). */
const PHYSICAL = [
  "Seller's factory",
  "Packing & loading",
  "Export customs clearance",
  "Port/airport of loading",
  "International transport",
  "Port/airport of discharge",
  "Import customs clearance",
  "Inland transport to buyer",
  "Buyer's premises",
];
const FINANCIAL = [
  ["A", "Buyer", "trả tiền theo hợp đồng"],
  ["B", "Buyer's bank", "xử lý & chuyển tiền"],
  ["C", "Payment methods", "L/C, T/T, D/P, D/A…"],
  ["D", "Seller's bank", "nhận ngoại tệ, ghi có"],
  ["E", "Seller", "nhận ngoại tệ (inflow)"],
] as const;
const RIGHT = ["Right goods", "Right place", "Right time", "Right documents", "Right payment", "Acceptable risk"];

export default function TwoFlows() {
  return (
    <figure className="space-y-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <p className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">① Dòng hàng đi ra (outflow of goods – physical flow) →</p>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {PHYSICAL.map((s, i) => (
            <li key={s} className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs dark:border-blue-900 dark:bg-blue-950/40">
              <span className="font-bold text-blue-800 dark:text-blue-300">{i + 1}</span>
              <span className="block leading-snug">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
          ② Dòng ngoại tệ đi vào (inflow of foreign exchange – financial flow) ←
        </p>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {FINANCIAL.map(([k, who, what]) => (
            <li key={k} className="rounded-lg border border-green-200 bg-green-50 p-2 text-xs dark:border-green-900 dark:bg-green-950/40">
              <span className="font-bold text-green-800 dark:text-green-300">{k}. </span>
              <span className="font-semibold">{who}</span>
              <span className="block text-slate-600 dark:text-slate-400">{what}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {RIGHT.map((r, i) => (
          <span key={r} className="flex items-center gap-1.5">
            <span className="rounded-full bg-navy-100 px-2.5 py-1 font-medium text-navy-900 dark:bg-navy-800 dark:text-navy-100">{r}</span>
            {i < RIGHT.length - 1 && <span aria-hidden="true">→</span>}
          </span>
        ))}
      </div>
      <figcaption className="text-xs text-slate-500 dark:text-slate-400">
        Quản trị xuất khẩu điều phối hai dòng chảy để hàng đến tay người mua thành công và tiền được thanh toán đủ, đúng hạn.
      </figcaption>
    </figure>
  );
}
