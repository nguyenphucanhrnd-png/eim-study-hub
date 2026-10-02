/** C5 visual summary — key mechanism of each payment method (KB §5.1–§5.5). */
const ROWS = [
  ["Consignment", "Nhận hàng trước", "Sau khi người mua đã bán được hàng cho bên thứ ba", "Quyền sở hữu chỉ chuyển khi người mua trả tiền"],
  ["Open account", "Nhận hàng + chứng từ gửi riêng", "Trong thời hạn tín dụng 30–120 ngày", "Người bán giao hàng theo hình thức bán chịu"],
  ["T/T trả trước", "Sau khi đã trả tiền", "Trước khi giao hàng", "Tiền trước – hàng sau → rủi ro nghiêng về người mua"],
  ["T/T trả sau", "Nhận hàng trước", "Sau khi giao hàng", "Hàng trước – tiền sau → rủi ro nghiêng về người XK"],
  ["D/P", "Chứng từ sau khi TRẢ TIỀN tại ngân hàng", "Khi người mua trả tiền (sight draft)", "Không có ngân hàng bảo đảm thanh toán"],
  ["D/A", "Chứng từ sau khi KÝ CHẤP NHẬN hối phiếu", "Khi hối phiếu có kỳ hạn đến hạn (time draft)", "Không có ngân hàng bảo đảm thanh toán"],
  ["L/C", "Chứng từ qua ngân hàng phát hành", "Khi xuất trình chứng từ phù hợp", "Cam kết trả tiền của ngân hàng; chứng từ là then chốt"],
] as const;

export default function PaymentCompare() {
  return (
    <figure className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <caption className="sr-only">So sánh cơ chế các phương thức thanh toán</caption>
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            {["Phương thức", "Người mua có hàng / chứng từ", "Người bán được trả tiền", "Ghi nhớ"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([m, ...cells]) => (
            <tr key={m} className="border-t border-slate-200 dark:border-slate-800">
              <th scope="row" className="px-3 py-2 text-left font-bold text-rose-800 dark:text-rose-300">
                {m}
              </th>
              {cells.map((c) => (
                <td key={c} className="px-3 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
