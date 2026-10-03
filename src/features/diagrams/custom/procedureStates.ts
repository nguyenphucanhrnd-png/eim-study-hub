/**
 * D8.1 / D8.2 — who performs each procedure step for a given Incoterms rule × payment method
 * (KB §8.2, §8.3, §3.8). Pure and unit-tested.
 */
export const RULES = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"] as const;
export type Rule = (typeof RULES)[number];

export const PAYMENTS = [
  { id: "tt-advance", label: "T/T trả trước" },
  { id: "tt-deferred", label: "T/T trả sau" },
  { id: "dp", label: "D/P" },
  { id: "da", label: "D/A" },
  { id: "lc", label: "L/C" },
] as const;
export type Payment = (typeof PAYMENTS)[number]["id"];

export type StepState = "seller" | "buyer" | "optional" | "na";

export const STATE_VI: Record<StepState, string> = {
  seller: "Người bán thực hiện",
  buyer: "Người mua thực hiện",
  optional: "Không bắt buộc",
  na: "Không áp dụng",
};

export interface StepStatus {
  state: StepState;
  noteVi: string;
}

export type RuleGroup = "E" | "F" | "C" | "D";
export function ruleGroup(rule: Rule): RuleGroup {
  if (rule === "EXW") return "E";
  if (rule === "FCA" || rule === "FAS" || rule === "FOB") return "F";
  if (rule === "CFR" || rule === "CIF" || rule === "CPT" || rule === "CIP") return "C";
  return "D";
}

/** Delivery = risk transfer point (KB §3.8), short VI wording. */
export const DELIVERY_VI: Record<Rule, string> = {
  EXW: "Đặt hàng dưới quyền định đoạt của người mua tại nơi chỉ định, chưa bốc lên phương tiện",
  FCA: "Giao cho người chuyên chở: tại cơ sở người bán → khi đã bốc lên phương tiện; nơi khác → trên phương tiện của người bán, sẵn sàng để dỡ",
  FAS: "Đặt dọc mạn tàu do người mua chỉ định tại cảng giao hàng",
  FOB: "Hàng ở trên tàu do người mua chỉ định tại cảng giao hàng",
  CFR: "Hàng ở trên tàu tại cảng giao hàng (người bán vẫn trả cước đến cảng đích)",
  CIF: "Hàng ở trên tàu tại cảng giao hàng (người bán trả cước + bảo hiểm đến cảng đích)",
  CPT: "Giao cho người chuyên chở đầu tiên (người bán vẫn trả cước đến nơi đến)",
  CIP: "Giao cho người chuyên chở đầu tiên (người bán trả cước + bảo hiểm đến nơi đến)",
  DAP: "Trên phương tiện vận tải đến, sẵn sàng để dỡ, tại nơi đến chỉ định",
  DPU: "Đã dỡ khỏi phương tiện vận tải đến, tại nơi đến chỉ định",
  DDP: "Đã thông quan nhập khẩu, trên phương tiện đến, sẵn sàng để dỡ, tại nơi đến chỉ định",
};

const isLc = (p: Payment) => p === "lc";
const isTt = (p: Payment) => p === "tt-advance" || p === "tt-deferred";

const PRESENT_VI: Record<Payment, string> = {
  "tt-advance": "Theo hợp đồng (T/T) – người mua đã trả tiền trước",
  "tt-deferred": "Theo hợp đồng (T/T) – người mua trả tiền sau",
  dp: "Qua ngân hàng (nhờ thu D/P): người mua trả tiền tại ngân hàng thu hộ để nhận chứng từ",
  da: "Qua ngân hàng (nhờ thu D/A): người mua ký chấp nhận hối phiếu có kỳ hạn để nhận chứng từ",
  lc: "Qua ngân hàng (L/C): chứng từ phù hợp L/C, xuất trình ≤ 21 ngày sau giao hàng và trong hiệu lực L/C",
};

const PAY_VI: Record<Payment, string> = {
  "tt-advance": "T/T trả trước: người mua chuyển tiền TRƯỚC khi người bán giao hàng (thực tế diễn ra trước bước 3)",
  "tt-deferred": "T/T trả sau: người mua chuyển tiền sau khi đã nhận hàng",
  dp: "D/P: người mua trả tiền tại ngân hàng thu hộ, rồi mới nhận chứng từ",
  da: "D/A: người mua ký chấp nhận hối phiếu để nhận chứng từ, trả tiền khi hối phiếu đến hạn",
  lc: "L/C: ngân hàng phát hành trả tiền khi chứng từ phù hợp; người mua trả tiền hoặc bị ghi nợ khi nhận chứng từ",
};

/** Export procedure (KB §8.2, 10 steps): step id "e1"…"e10". */
export function exportStates(rule: Rule, payment: Payment) {
  const g = ruleGroup(rule);
  return {
    e1: { state: "seller", noteVi: "Cả hai bên đàm phán; người bán ký hợp đồng với người mua" },
    e2: isLc(payment)
      ? { state: "seller", noteVi: "Kiểm tra L/C theo checklist 14 điểm" }
      : { state: "seller", noteVi: `Không có L/C để kiểm tra – theo điều kiện ${isTt(payment) ? "T/T" : "nhờ thu"} đã thỏa thuận` },
    e3: { state: "seller", noteVi: "Đóng gói, dán nhãn, ghi ký mã hiệu, chuẩn bị chứng từ xuất khẩu" },
    e4: { state: "optional", noteVi: "Chỉ khi hợp đồng, L/C hoặc quy định yêu cầu" },
    e5:
      g === "C" || g === "D"
        ? { state: "seller", noteVi: `${rule}: người bán thuê vận tải chính (nhóm C & D)` }
        : { state: "buyer", noteVi: `${rule}: người mua thuê vận tải chính (nhóm E & F)` },
    e6:
      rule === "CIF"
        ? { state: "seller", noteVi: "CIF: người bán bắt buộc mua bảo hiểm, tối thiểu ICC (C)" }
        : rule === "CIP"
          ? { state: "seller", noteVi: "CIP: người bán bắt buộc mua bảo hiểm ICC (A)" }
          : g === "D"
            ? { state: "optional", noteVi: `${rule}: không có nghĩa vụ bảo hiểm; người bán chịu rủi ro đến nơi đến nên có thể tự mua` }
            : { state: "optional", noteVi: `${rule}: người bán không có nghĩa vụ; người mua chịu rủi ro chặng chính có thể tự mua` },
    e7:
      rule === "EXW"
        ? { state: "buyer", noteVi: "EXW: người mua làm cả thủ tục hải quan xuất khẩu" }
        : { state: "seller", noteVi: "Người bán làm thủ tục hải quan xuất khẩu" },
    e8: { state: "seller", noteVi: `Giao hàng theo ${rule}: ${DELIVERY_VI[rule]}` },
    e9: { state: "seller", noteVi: PRESENT_VI[payment] },
    e10: { state: "optional", noteVi: "Nếu có (hàng hư hỏng, thiếu hụt, giao chậm…)" },
  } satisfies Record<string, StepStatus>;
}

/** Import procedure (KB §8.3, 9 steps): step id "i1"…"i9". */
export function importStates(rule: Rule, payment: Payment) {
  const g = ruleGroup(rule);
  const buyerMayInsure = g === "E" || g === "F" || rule === "CPT" || rule === "CFR";
  return {
    i1: { state: "buyer", noteVi: "Người mua ký hợp đồng với nhà cung cấp" },
    i2: isLc(payment)
      ? { state: "buyer", noteVi: "Mở L/C tại ngân hàng phát hành" }
      : { state: "buyer", noteVi: `Không cần mở L/C – theo điều kiện ${isTt(payment) ? "T/T" : "nhờ thu"} đã thỏa thuận` },
    i3:
      g === "E" || g === "F"
        ? { state: "buyer", noteVi: `${rule}: người mua thuê vận tải chính (nhóm E & F)` }
        : { state: "seller", noteVi: `${rule}: người bán thuê vận tải chính (nhóm C & D)` },
    i4: buyerMayInsure
      ? { state: "optional", noteVi: `${rule}: người bán không có nghĩa vụ bảo hiểm, người mua chịu rủi ro chặng chính → người mua có thể mua` }
      : rule === "CIF" || rule === "CIP"
        ? { state: "na", noteVi: `${rule}: người bán đã có nghĩa vụ mua bảo hiểm` }
        : { state: "na", noteVi: `${rule}: người bán chịu rủi ro đến nơi đến` },
    i5:
      rule === "DDP"
        ? { state: "seller", noteVi: "DDP: người bán làm cả thủ tục hải quan nhập khẩu" }
        : { state: "buyer", noteVi: "Người mua nộp tờ khai, chứng từ, thuế và phí nhập khẩu" },
    i6:
      rule === "DPU"
        ? { state: "buyer", noteVi: "DPU: người bán đã dỡ hàng (điều kiện duy nhất người bán phải dỡ); người mua nhận hàng và vận chuyển nội địa" }
        : { state: "buyer", noteVi: `Nhận hàng từ người chuyên chở/terminal và vận chuyển nội địa (${rule}: ${DELIVERY_VI[rule]})` },
    i7: { state: "buyer", noteVi: "Kiểm tra số lượng, chất lượng, tình trạng, sự phù hợp với hợp đồng" },
    i8: { state: "optional", noteVi: "Nếu có tổn thất/sai lệch: khiếu nại người bán, người chuyên chở hoặc công ty bảo hiểm" },
    i9: { state: "buyer", noteVi: PAY_VI[payment] },
  } satisfies Record<string, StepStatus>;
}

/** Mirror view: matching steps of the two procedures (export id ↔ import id). */
export const MIRROR_PAIRS: { exportId: string; importId: string; labelVi: string }[] = [
  { exportId: "e1", importId: "i1", labelVi: "Hợp đồng" },
  { exportId: "e2", importId: "i2", labelVi: "Kiểm tra L/C ↔ mở L/C" },
  { exportId: "e5", importId: "i3", labelVi: "Vận tải: C & D ↔ E & F" },
  { exportId: "e6", importId: "i4", labelVi: "Bảo hiểm: CIF & CIP ↔ E, F, CPT, CFR" },
  { exportId: "e7", importId: "i5", labelVi: "Thông quan XK ↔ NK" },
  { exportId: "e8", importId: "i6", labelVi: "Giao hàng ↔ nhận hàng" },
  { exportId: "e9", importId: "i9", labelVi: "Xuất trình chứng từ ↔ thanh toán" },
  { exportId: "e10", importId: "i8", labelVi: "Khiếu nại" },
];
