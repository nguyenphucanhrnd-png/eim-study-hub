import type { DiagramEdge, DiagramNode, DiagramStep, DiagramVariant } from "../engine/types";

/**
 * D5.1 / D5.2 — T/T remittance (KB §5.3, amendment A1). Both slides (C5 p.7 advance, p.10 deferred) use the
 * same four ellipses: Exporter's bank top-left, Importer's bank top-right, Exporter bottom-left, Importer
 * bottom-right. Step ids name the arrow's meaning, so switching Advance ⇄ Deferred flashes the renumbered steps.
 */
const SRC_ADV = "KB §5.3 · Slide C5 p.7";
const SRC_DEF = "KB §5.3 · Slide C5 p.10";

export const TT_NODES: DiagramNode[] = [
  {
    id: "exporterBank",
    label: "EXPORTER'S BANK",
    labelVi: "Ngân hàng bên xuất khẩu",
    role: "sellerBank",
    x: 250,
    y: 140,
    w: 310,
    h: 130,
    shape: "ellipse",
    descVi: "Ngân hàng của người bán: nhận tiền chuyển đến từ ngân hàng bên nhập khẩu và ghi có (trả tiền) cho nhà xuất khẩu.",
    links: [{ label: "C5 · Chuyển tiền T/T", to: "/learn/c5#remittance" }],
  },
  {
    id: "importerBank",
    label: "IMPORTER'S BANK",
    labelVi: "Ngân hàng bên nhập khẩu",
    role: "buyerBank",
    x: 750,
    y: 140,
    w: 310,
    h: 130,
    shape: "ellipse",
    descVi: "Ngân hàng của người mua: nhận chỉ thị chuyển tiền của người mua, ghi nợ người mua và chuyển tiền sang ngân hàng bên xuất khẩu.",
    links: [{ label: "C5 · Chuyển tiền T/T", to: "/learn/c5#remittance" }],
  },
  {
    id: "exporter",
    label: "EXPORTER/\nSELLER",
    labelVi: "Nhà xuất khẩu",
    role: "seller",
    x: 250,
    y: 480,
    w: 310,
    h: 130,
    shape: "ellipse",
    descVi: "Người bán: giao hàng cho người mua và nhận tiền qua ngân hàng của mình. Trả trước → giao hàng sau cùng; trả sau → giao hàng đầu tiên.",
    links: [{ label: "C8 · Quy trình xuất khẩu", to: "/learn/c8#export-procedure" }],
  },
  {
    id: "importer",
    label: "IMPORTER/\nBUYER",
    labelVi: "Nhà nhập khẩu",
    role: "buyer",
    x: 750,
    y: 480,
    w: 310,
    h: 130,
    shape: "ellipse",
    descVi: "Người mua: chỉ thị ngân hàng của mình chuyển tiền cho người bán và nhận hàng.",
    links: [{ label: "C8 · Quy trình nhập khẩu", to: "/learn/c8#import-procedure" }],
  },
];

/** Advance (p.7): (3) down on the left, (1) up on the right of the importer column. */
export const TT_EDGES_ADVANCE: DiagramEdge[] = [
  { id: "instruct", from: "importer", to: "importerBank", kind: "info", curve: 34 },
  { id: "transfer", from: "importerBank", to: "exporterBank", kind: "money" },
  { id: "debit", from: "importerBank", to: "importer", kind: "info", curve: 34 },
  { id: "credit", from: "exporterBank", to: "exporter", kind: "money" },
  { id: "goods", from: "exporter", to: "importer", kind: "goods", label: "goods" },
];

/** Deferred (p.10): (2) up on the left, (3) down on the right of the importer column. */
export const TT_EDGES_DEFERRED: DiagramEdge[] = [
  { id: "goods", from: "exporter", to: "importer", kind: "goods", label: "goods" },
  { id: "instruct", from: "importer", to: "importerBank", kind: "info", curve: -34 },
  { id: "debit", from: "importerBank", to: "importer", kind: "info", curve: -34 },
  { id: "transfer", from: "importerBank", to: "exporterBank", kind: "money" },
  { id: "credit", from: "exporterBank", to: "exporter", kind: "money" },
];

const WHEN_ADVANCE = [
  "Nhà nhập khẩu là khách hàng mới và/hoặc có lịch sử hoạt động chưa vững",
  "Khả năng tín dụng của nhà nhập khẩu đáng ngờ, không đạt hoặc không kiểm chứng được",
  "Rủi ro chính trị và thương mại ở nước nhà nhập khẩu rất cao",
  "Sản phẩm của nhà xuất khẩu độc đáo, không có ở nơi khác, hoặc đang có nhu cầu rất lớn",
];

const BUYER_RISKS = [
  "Mất quyền sử dụng khoản tiền cho đến khi hàng đến",
  "Người bán có thể không giao hàng đúng đơn đặt hàng (số lượng, sản phẩm, chất lượng, phương thức vận chuyển)",
  "Người bán có thể không giao hàng khi được yêu cầu",
];

export const TT_STEPS_ADVANCE: DiagramStep[] = [
  {
    id: "instruct",
    order: 1,
    title: "Buyer instructs its bank to remit",
    titleVi: "Người mua chỉ thị ngân hàng của mình chuyển tiền",
    edgeIds: ["instruct"],
    actors: ["importer", "importerBank"],
    what: "Người mua yêu cầu ngân hàng bên nhập khẩu chuyển tiền cho người bán. Trong T/T trả trước, việc này xảy ra TRƯỚC khi có hàng.",
    why: "Tiền rời khỏi người mua đầu tiên – người mua chấp nhận rủi ro để người bán yên tâm giao hàng.",
    trap: "T/T trả trước bắt đầu từ NGƯỜI MUA (chỉ thị chuyển tiền), không phải từ việc giao hàng.",
    details: [{ title: "Khi nào dùng cash-in-advance", items: WHEN_ADVANCE }],
    source: SRC_ADV,
    practiceTopic: "tt-advance",
  },
  {
    id: "transfer",
    order: 2,
    title: "Importer's bank transfers the money to the exporter's bank",
    titleVi: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu",
    edgeIds: ["transfer"],
    actors: ["importerBank", "exporterBank"],
    what: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu (chuyển tiền bằng điện – telegraphic transfer).",
    why: "Tiền đi giữa hai ngân hàng; người bán chưa giao hàng nhưng tiền đã trên đường đến.",
    source: SRC_ADV,
    practiceTopic: "tt-advance",
  },
  {
    id: "debit",
    order: 3,
    title: "Importer's bank sends the debit advice to the buyer",
    titleVi: "Ngân hàng bên nhập khẩu báo nợ / xác nhận cho người mua",
    edgeIds: ["debit"],
    actors: ["importerBank", "importer"],
    what: "Ngân hàng bên nhập khẩu xác nhận với người mua rằng tài khoản đã bị ghi nợ số tiền chuyển đi.",
    why: "Người mua đã trả tiền nhưng chưa có hàng → từ đây người mua mất quyền sử dụng khoản tiền cho đến khi hàng đến.",
    source: SRC_ADV,
    practiceTopic: "tt-advance",
  },
  {
    id: "credit",
    order: 4,
    title: "Exporter's bank credits the exporter",
    titleVi: "Ngân hàng bên xuất khẩu ghi có cho nhà xuất khẩu",
    edgeIds: ["credit"],
    actors: ["exporterBank", "exporter"],
    what: "Ngân hàng bên xuất khẩu ghi có (trả tiền) vào tài khoản của nhà xuất khẩu.",
    why: "Người bán đã nhận đủ tiền trước khi giao hàng → người bán gần như không còn rủi ro thanh toán.",
    source: SRC_ADV,
    practiceTopic: "tt-advance",
  },
  {
    id: "goods",
    order: 5,
    title: "Exporter ships the goods (last)",
    titleVi: "Nhà xuất khẩu giao hàng – bước cuối cùng",
    edgeIds: ["goods"],
    actors: ["exporter", "importer"],
    what: "Sau khi đã nhận tiền, nhà xuất khẩu giao hàng cho người mua.",
    why: "Tiền đi trước, hàng đi sau → rủi ro thuộc về người MUA (người bán có thể giao sai hoặc giao chậm).",
    trap: "T/T trả trước bất lợi cho NGƯỜI MUA; T/T trả sau mới bất lợi cho người bán.",
    details: [{ title: "Rủi ro cho người mua", items: BUYER_RISKS }],
    source: SRC_ADV,
    practiceTopic: "tt-advance",
  },
];

export const TT_STEPS_DEFERRED: DiagramStep[] = [
  {
    id: "goods",
    order: 1,
    title: "Seller ships the goods to the buyer",
    titleVi: "Người bán giao hàng cho người mua",
    edgeIds: ["goods"],
    actors: ["exporter", "importer"],
    what: "Người bán giao hàng cho người mua TRƯỚC, chưa nhận được tiền.",
    why: "Hàng đi trước, tiền đi sau → rủi ro thuộc về NHÀ XUẤT KHẨU (người mua có thể trả chậm hoặc không trả).",
    trap: "T/T trả sau bắt đầu bằng việc GIAO HÀNG; T/T trả trước kết thúc bằng việc giao hàng.",
    source: SRC_DEF,
    practiceTopic: "tt-deferred",
  },
  {
    id: "instruct",
    order: 2,
    title: "Buyer instructs its bank to remit",
    titleVi: "Người mua chỉ thị ngân hàng của mình chuyển tiền",
    edgeIds: ["instruct"],
    actors: ["importer", "importerBank"],
    what: "Sau khi đã có hàng, người mua yêu cầu ngân hàng bên nhập khẩu chuyển tiền cho người bán.",
    why: "Việc thanh toán phụ thuộc hoàn toàn vào thiện chí của người mua – không ngân hàng nào cam kết thay.",
    source: SRC_DEF,
    practiceTopic: "tt-deferred",
  },
  {
    id: "debit",
    order: 3,
    title: "Importer's bank confirms / debits the buyer",
    titleVi: "Ngân hàng bên nhập khẩu xác nhận / ghi nợ người mua",
    edgeIds: ["debit"],
    actors: ["importerBank", "importer"],
    what: "Ngân hàng bên nhập khẩu xác nhận lệnh và ghi nợ tài khoản của người mua.",
    why: "Đây là lúc tiền thật sự rời khỏi người mua – sau khi người mua đã nhận hàng.",
    source: SRC_DEF,
    practiceTopic: "tt-deferred",
  },
  {
    id: "transfer",
    order: 4,
    title: "Importer's bank remits to the exporter's bank",
    titleVi: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu",
    edgeIds: ["transfer"],
    actors: ["importerBank", "exporterBank"],
    what: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu.",
    why: "Tiền đi giữa hai ngân hàng; người bán vẫn đang chờ tiền dù đã giao hàng từ bước 1.",
    source: SRC_DEF,
    practiceTopic: "tt-deferred",
  },
  {
    id: "credit",
    order: 5,
    title: "Exporter's bank pays the exporter",
    titleVi: "Ngân hàng bên xuất khẩu trả tiền cho nhà xuất khẩu",
    edgeIds: ["credit"],
    actors: ["exporterBank", "exporter"],
    what: "Ngân hàng bên xuất khẩu trả tiền (ghi có) cho nhà xuất khẩu – bước cuối cùng.",
    why: "Người bán chỉ nhận tiền ở cuối quy trình → người bán chịu rủi ro suốt thời gian chờ.",
    trap: "T/T trả sau (và open account) bất lợi cho NGƯỜI BÁN.",
    source: SRC_DEF,
    practiceTopic: "tt-deferred",
  },
];

export const TT_TAKEAWAYS_ADVANCE = [
  "Tiền đi TRƯỚC, hàng đi SAU → rủi ro thuộc về người mua.",
  "Người mua: mất quyền sử dụng tiền đến khi hàng đến; người bán có thể giao sai hoặc giao chậm.",
  "Dùng khi người mua mới / tín dụng đáng ngờ / rủi ro quốc gia rất cao / sản phẩm độc đáo, nhu cầu lớn.",
];

export const TT_TAKEAWAYS_DEFERRED = [
  "Hàng đi TRƯỚC, tiền đi SAU → rủi ro thuộc về nhà xuất khẩu.",
  "Cùng 4 đối tượng và 5 mũi tên như trả trước – khác ở thứ tự: giao hàng là bước 5 (trả trước) hay bước 1 (trả sau).",
];

export const TT_NOTE =
  "Hướng và số thứ tự mũi tên theo slide. Nhãn “chỉ thị” và “báo nợ/xác nhận” là cách hiểu chuẩn của các mũi tên (slide chỉ ghi số).";

export const ADVANCE_VARIANT: DiagramVariant = {
  id: "advance",
  label: "Trả trước (Advance)",
  patch: { edges: TT_EDGES_ADVANCE, steps: TT_STEPS_ADVANCE, keyTakeaways: TT_TAKEAWAYS_ADVANCE, note: "Slide C5 p.7 – tiền trước, hàng sau." },
};

export const DEFERRED_VARIANT: DiagramVariant = {
  id: "deferred",
  label: "Trả sau (Deferred)",
  patch: { edges: TT_EDGES_DEFERRED, steps: TT_STEPS_DEFERRED, keyTakeaways: TT_TAKEAWAYS_DEFERRED, note: "Slide C5 p.10 – hàng trước, tiền sau." },
};
