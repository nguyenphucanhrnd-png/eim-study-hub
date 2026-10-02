/** C7 visual summary — who issues each document and what it is for (KB §7.3–§7.9). */
const DOCS = [
  ["Commercial invoice", "Người bán → người mua", "Thông quan, chứng minh sở hữu, thanh toán; hải quan xác định trị giá tính thuế"],
  ["Pro forma invoice", "Người bán → người mua tiềm năng", "Báo giá, xin giấy phép NK/ngoại tệ, hàng mẫu; KHÔNG dùng để thanh toán"],
  ["Bill of lading", "Người chuyên chở → người gửi hàng", "Biên lai nhận hàng, bằng chứng HĐ vận tải, chứng từ sở hữu"],
  ["Insurance certificate / policy", "Công ty bảo hiểm / đại lý được ủy quyền", "Loại & số tiền bảo hiểm; ngày ≤ ngày giao hàng"],
  ["Certificate of quantity / quality", "Nhà SX/người bán hoặc tổ chức giám định độc lập", "Xác nhận số lượng/trọng lượng, chất lượng đúng HĐ"],
  ["Certificate of origin", "Theo FTA/cơ chế ưu đãi (vd VCCI trong ví dụ HĐ)", "Xác nhận xuất xứ → ưu đãi thuế quan"],
  ["Packing list", "Người gửi hàng (shipper)", "Liệt kê loại & số lượng hàng; người nhận kiểm tra khi hàng đến"],
  ["Phytosanitary certificate", "Cơ quan nhà nước", "Không có sâu bệnh hại theo quy định nước NK"],
  ["Inspection certificate", "Người bán hoặc công ty giám định độc lập", "Hàng đáp ứng quy cách nhất định"],
] as const;

const BL_PAIRS = [
  ["Clean", "Unclean (claused/dirty)", "Có ghi chú hàng/bao bì khiếm khuyết hay không"],
  ["Shipped on board", "Received for shipment", "Đã xếp lên tàu hay mới nhận để chở"],
  ["To order", "Straight / Bearer", "Chuyển nhượng bằng ký hậu vs người nhận đích danh / người cầm"],
] as const;

export default function DocumentMap() {
  return (
    <figure className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">Chứng từ – người phát hành – mục đích</caption>
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              {["Chứng từ", "Ai phát hành", "Dùng để"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOCS.map(([doc, who, what]) => (
              <tr key={doc} className="border-t border-slate-200 dark:border-slate-800">
                <th scope="row" className="px-3 py-2 text-left font-semibold text-sky-800 dark:text-sky-300">
                  {doc}
                </th>
                <td className="px-3 py-2">{who}</td>
                <td className="px-3 py-2">{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {BL_PAIRS.map(([a, b, why]) => (
          <div key={a} className="rounded-lg border border-sky-200 p-3 text-sm dark:border-sky-900">
            <p className="font-semibold">
              {a} B/L <span className="font-normal text-slate-500 dark:text-slate-400">vs</span> {b}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{why}</p>
          </div>
        ))}
      </div>
      <figcaption className="text-xs text-slate-500 dark:text-slate-400">7 loại vận đơn được ghép thành 3 cặp đối lập để dễ nhớ.</figcaption>
    </figure>
  );
}
