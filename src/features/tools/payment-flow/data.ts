/**
 * Payment flows — KB §5.3 (T/T advance & deferred), §5.4 (Figure 11.2, D/P & D/A), §5.5 (L/C 9 steps).
 * Node positions: banks on top, parties at the bottom; exporter side left, importer side right (as on the slides).
 */
export type NodeId = "exporter" | "importer" | "exporterBank" | "importerBank";
export type FlowKind = "goods" | "money" | "documents" | "instruction";

export interface FlowStep {
  from: NodeId;
  to: NodeId;
  kind: FlowKind;
  textVi: string;
}

export interface PaymentFlow {
  id: "tt-advance" | "tt-deferred" | "dp" | "da" | "lc";
  label: string;
  nodeLabels: Record<NodeId, string>;
  steps: FlowStep[];
  source: string;
  summaryVi: string;
  noteVi?: string;
}

const TT_NODES: Record<NodeId, string> = {
  exporter: "Exporter / Seller",
  importer: "Importer / Buyer",
  exporterBank: "Exporter's bank",
  importerBank: "Importer's bank",
};

const DC_NODES: Record<NodeId, string> = {
  exporter: "Seller",
  importer: "Buyer",
  exporterBank: "Remitting bank (seller's bank)",
  importerBank: "Collecting bank (buyer's bank)",
};

const dcSteps = (step5: string, step6: string, step7: string): FlowStep[] => [
  { from: "exporter", to: "importer", kind: "goods", textVi: "Hai bên thỏa thuận điều kiện bán hàng và thanh toán; người bán giao hàng và lập bộ chứng từ." },
  { from: "exporter", to: "exporterBank", kind: "documents", textVi: "Người bán xuất trình chứng từ cho ngân hàng chuyển (remitting bank)." },
  { from: "exporterBank", to: "importerBank", kind: "documents", textVi: "Ngân hàng chuyển gửi chứng từ đến ngân hàng thu hộ (collecting bank)." },
  { from: "importerBank", to: "importer", kind: "documents", textVi: "Ngân hàng thu hộ xuất trình chứng từ cho người mua." },
  { from: "importer", to: "importerBank", kind: "money", textVi: step5 },
  { from: "importerBank", to: "exporterBank", kind: "money", textVi: step6 },
  { from: "exporterBank", to: "exporter", kind: "money", textVi: step7 },
];

export const FLOWS: PaymentFlow[] = [
  {
    id: "tt-advance",
    label: "T/T trả trước",
    nodeLabels: TT_NODES,
    source: "KB §5.3 – Remittance: payment in advance",
    summaryVi: "Tiền đi trước, hàng đi sau → rủi ro nghiêng về người mua.",
    noteVi: "Thứ tự minh họa logic “tiền trước – hàng sau”; số bước trên sơ đồ slide không dùng để ra câu hỏi (ERRATA E-09).",
    steps: [
      { from: "importer", to: "importerBank", kind: "instruction", textVi: "Người mua chỉ thị ngân hàng của mình chuyển tiền." },
      { from: "importerBank", to: "exporterBank", kind: "money", textVi: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu." },
      { from: "exporterBank", to: "exporter", kind: "money", textVi: "Ngân hàng bên xuất khẩu ghi có cho người xuất khẩu." },
      { from: "exporter", to: "importer", kind: "goods", textVi: "Người xuất khẩu giao hàng — bước CUỐI CÙNG." },
    ],
  },
  {
    id: "tt-deferred",
    label: "T/T trả sau",
    nodeLabels: TT_NODES,
    source: "KB §5.3 – Remittance: deferred payment",
    summaryVi: "Hàng đi trước, tiền đi sau → rủi ro nghiêng về người xuất khẩu.",
    noteVi: "Thứ tự minh họa logic “hàng trước – tiền sau” (ERRATA E-09).",
    steps: [
      { from: "exporter", to: "importer", kind: "goods", textVi: "Người bán giao hàng cho người mua." },
      { from: "importer", to: "importerBank", kind: "instruction", textVi: "Người mua chỉ thị ngân hàng của mình thanh toán." },
      { from: "importerBank", to: "importer", kind: "instruction", textVi: "Ngân hàng bên nhập khẩu xác nhận / ghi nợ tài khoản người mua." },
      { from: "importerBank", to: "exporterBank", kind: "money", textVi: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu." },
      { from: "exporterBank", to: "exporter", kind: "money", textVi: "Ngân hàng bên xuất khẩu trả tiền cho người xuất khẩu." },
    ],
  },
  {
    id: "dp",
    label: "Nhờ thu D/P",
    nodeLabels: DC_NODES,
    source: "KB §5.4 – Documentary Collection, Figure 11.2",
    summaryVi: "Người mua chỉ nhận chứng từ SAU KHI TRẢ TIỀN tại ngân hàng (hối phiếu trả ngay – sight draft).",
    steps: dcSteps(
      "Người mua TRẢ TIỀN khi được xuất trình chứng từ → nhận chứng từ để lấy hàng.",
      "Ngân hàng thu hộ chuyển tiền cho ngân hàng chuyển.",
      "Ngân hàng chuyển trả tiền cho người bán.",
    ),
  },
  {
    id: "da",
    label: "Nhờ thu D/A",
    nodeLabels: DC_NODES,
    source: "KB §5.4 – Documentary Collection, Figure 11.2",
    summaryVi: "Người mua nhận chứng từ sau khi KÝ CHẤP NHẬN hối phiếu có kỳ hạn (time/usance draft), hứa trả tiền sau.",
    steps: dcSteps(
      "Người mua KÝ CHẤP NHẬN hối phiếu có kỳ hạn → nhận chứng từ để lấy hàng (trả tiền sau).",
      "Ngân hàng thu hộ báo cho ngân hàng chuyển về việc chấp nhận (và chuyển tiền khi đến hạn).",
      "Ngân hàng chuyển báo cho người bán về việc chấp nhận (và trả tiền khi đến hạn).",
    ),
  },
  {
    id: "lc",
    label: "Thư tín dụng L/C",
    nodeLabels: {
      exporter: "Exporter / Beneficiary",
      importer: "Importer / Applicant",
      exporterBank: "Advising bank",
      importerBank: "Issuing bank",
    },
    source: "KB §5.5 – Basic procedure of documentary credit (9 steps)",
    summaryVi: "Ngân hàng phát hành cam kết trả tiền nếu chứng từ phù hợp — ngân hàng chỉ xét chứng từ, không liên quan đến hàng hóa.",
    steps: [
      { from: "importer", to: "importerBank", kind: "instruction", textVi: "Người mua làm đơn và mở L/C tại ngân hàng phát hành." },
      { from: "importerBank", to: "exporterBank", kind: "instruction", textVi: "Ngân hàng phát hành phát hành L/C, chuyển đến ngân hàng thông báo." },
      { from: "exporterBank", to: "exporter", kind: "instruction", textVi: "Ngân hàng thông báo báo L/C cho người bán." },
      { from: "exporter", to: "importer", kind: "goods", textVi: "Người bán giao hàng khi đã đáp ứng các điều kiện của L/C." },
      { from: "exporter", to: "exporterBank", kind: "documents", textVi: "Người bán xuất trình bộ chứng từ theo quy định của L/C cho ngân hàng thông báo." },
      { from: "exporterBank", to: "importerBank", kind: "documents", textVi: "Ngân hàng thông báo chuyển chứng từ đến ngân hàng phát hành để kiểm tra." },
      { from: "importerBank", to: "exporterBank", kind: "money", textVi: "Ngân hàng phát hành kiểm tra, chấp nhận và thanh toán cho ngân hàng bên bán." },
      { from: "importerBank", to: "importer", kind: "documents", textVi: "Ngân hàng phát hành giao chứng từ cho người mua; người mua trả tiền hoặc bị ghi nợ tài khoản." },
      { from: "exporterBank", to: "exporter", kind: "money", textVi: "Ngân hàng thông báo trả tiền cho người bán theo quy định của L/C." },
    ],
  },
];

/** color = diagram strokes; textClass = readable label colour in light and dark mode. */
export const KIND_META: Record<FlowKind, { vi: string; color: string; textClass: string }> = {
  goods: { vi: "Hàng hóa", color: "#1d4ed8", textClass: "text-blue-700 dark:text-blue-300" },
  money: { vi: "Tiền", color: "#15803d", textClass: "text-green-700 dark:text-green-400" },
  documents: { vi: "Chứng từ", color: "#7c3aed", textClass: "text-violet-700 dark:text-violet-300" },
  instruction: { vi: "Chỉ thị / thông báo", color: "#475569", textClass: "text-slate-600 dark:text-slate-300" },
};

/**
 * [EXT – teaching aid] Exporter's risk ladder, lowest → highest (KB §5.5, source: U.S. DoC/ITA Trade Finance Guide).
 * Reversed for the importer.
 */
export const RISK_LADDER = [
  "Cash-in-advance (T/T trả trước)",
  "L/C (có xác nhận an toàn hơn không xác nhận)",
  "D/P (nhờ thu trả tiền đổi chứng từ)",
  "D/A (nhờ thu chấp nhận đổi chứng từ)",
  "Open account (ghi sổ)",
  "Consignment (bán hàng ký gửi)",
] as const;
