/** C6 visual summary — 3-phase structure and the 14 main articles with what each must specify (KB §6.2–§6.16). */
const ARTICLES = [
  ["Commodity", "Mô tả đơn giản, chính xác: tên kỹ thuật & thương mại, nhà SX, xuất xứ"],
  ["Quality", "Mẫu · tiêu chuẩn · mô tả chi tiết · nhãn hiệu · tài liệu kỹ thuật"],
  ["Quantity", "Số lượng, đơn vị, dung sai (ai chọn), cách xác định"],
  ["Packing & Marking", "Vật liệu, kích cỡ/hình dạng, bên trong, thể tích & trọng lượng kiện"],
  ["Price", "Đồng tiền · Incoterms (rule + version + nơi) · đơn giá · tổng giá trị (số & chữ) · điều chỉnh giá"],
  ["Delivery", "Điều kiện, thời gian (ngày/khoảng), địa điểm, thông báo giao hàng, giao từng phần/chuyển tải"],
  ["Payment", "Đồng tiền, phương thức (ngân hàng, chứng từ, UCP 600, phí), thời hạn"],
  ["Documents", "Bộ chứng từ người bán phải cung cấp"],
  ["Insurance", "Ai mua (theo Incoterms), điều kiện ICC, số tiền (vd 110%), đồng tiền, nơi bồi thường"],
  ["Claim", "Căn cứ, thời hạn khiếu nại (kể cả khuyết tật ẩn), hồ sơ khiếu nại"],
  ["Penalty", "Giao chậm / thanh toán chậm: X%/ngày, mức trần Y%"],
  ["Arbitration", "Luật áp dụng (CISG…), trọng tài, nơi xét xử, chi phí"],
  ["Force Majeure", "Không lường trước, không tránh được, không khắc phục được; thông báo; chấm dứt/kéo dài"],
  ["Other terms", "Sửa đổi bằng văn bản, chuyển nhượng, toàn bộ thỏa thuận, ngôn ngữ, hiệu lực"],
] as const;

export default function ContractMap() {
  return (
    <figure className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="rounded-lg bg-lime-50 p-3 text-sm dark:bg-lime-950/30">
        <span className="font-semibold">Phase 1 – Contracting parties:</span> tên HĐ, số HĐ, ngày & nơi ký, các bên (“hereinafter called the
        Seller/Buyer”), thuật ngữ.
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map(([name, what], i) => (
          <li key={name} className="rounded-lg border border-lime-300 p-2.5 dark:border-lime-800">
            <p className="text-sm font-semibold text-lime-900 dark:text-lime-300">
              Art. {i + 1} – {name}
            </p>
            <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">{what}</p>
          </li>
        ))}
      </ol>
      <div className="rounded-lg bg-lime-50 p-3 text-sm dark:bg-lime-950/30">
        <span className="font-semibold">Phase 3 – Signatures:</span> For the Seller / For the Buyer.
      </div>
      <figcaption className="text-xs text-slate-500 dark:text-slate-400">Phase 2 = 14 điều khoản chính của hợp đồng mua bán quốc tế.</figcaption>
    </figure>
  );
}
