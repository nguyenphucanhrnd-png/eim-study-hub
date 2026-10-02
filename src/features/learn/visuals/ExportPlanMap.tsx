/** C2 visual summary — KB §2.1 (9 components) with the key content of each (§2.2–§2.10). */
const COMPONENTS = [
  ["Export objectives", "Mục tiêu + KPI: revenue, growth %, gross margin %, expected profit %, break-even, loss %"],
  ["Target market & customer", "Cơ hội thị trường; mức hấp dẫn & khả năng tiếp cận (rào cản, TBT); hồ sơ khách hàng"],
  ["Market entry / Distribution", "Direct export · Indirect export · Cross-border e-commerce → ảnh hưởng bao bì, logistics"],
  ["Product for foreign market", "Product–market–customer fit; tiêu chuẩn, bao bì, nhãn; bảo hộ sở hữu trí tuệ"],
  ["Pricing & Payment", "Giá XK, Incoterms, đồng tiền báo giá; phương thức, thời điểm, đồng tiền, rủi ro thanh toán"],
  ["Logistics & Delivery", "Giao hàng & vận tải, kho, bảo hiểm hàng hóa, trung gian logistics, chứng từ"],
  ["Resources & Responsibilities", "Ai thực hiện kế hoạch → quản trị XK là quản trị liên chức năng"],
  ["Financial analysis", "Revenue = Q × P; GP = Revenue − COGS; margin; yếu tố tỷ giá"],
  ["Risk management", "Vận tải · tín dụng/thanh toán · tỷ giá · thị trường · pháp lý & tuân thủ · chính trị/quốc gia"],
] as const;

export default function ExportPlanMap() {
  return (
    <figure className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <p className="mb-3 text-center text-sm">
        <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-900 dark:bg-violet-900/50 dark:text-violet-100">
          Export Plan = sản phẩm cụ thể → thị trường mục tiêu cụ thể
        </span>
      </p>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {COMPONENTS.map(([name, gist], i) => (
          <li key={name} className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900 dark:bg-violet-950/30">
            <p className="font-semibold text-violet-900 dark:text-violet-200">
              {i + 1}. {name}
            </p>
            <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{gist}</p>
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-xs text-slate-500 dark:text-slate-400">9 thành phần của kế hoạch xuất khẩu (KB §2.1).</figcaption>
    </figure>
  );
}
