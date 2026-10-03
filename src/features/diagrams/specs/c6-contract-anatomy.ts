import type { DiagramEdge, DiagramNode, DiagramSpec } from "../engine/types";

/**
 * D6.1 — anatomy of an international sale contract (KB §6.2–6.17): 3 phases, 14 articles, and the
 * dependency lines between articles that must be consistent. Derived; a map diagram (click each part).
 */
const A = (
  id: string,
  n: number,
  label: string,
  x: number,
  y: number,
  anchor: string,
  descVi: string,
): DiagramNode => ({
  id,
  label: `${n}. ${label}`,
  role: "other",
  x,
  y,
  w: 156,
  h: 66,
  shape: "rect",
  descVi,
  links: [{ label: `C6 · Art. ${n}`, to: `/learn/c6#${anchor}` }],
});

const nodes: DiagramNode[] = [
  { id: "parties", label: "Phase 1 – Contracting parties", labelVi: "Tên & số HĐ, ngày & nơi ký, các bên (“hereinafter called the Seller/Buyer”), thuật ngữ", role: "seller", x: 500, y: 48, w: 960, h: 70, shape: "rect", descVi: "Tên hợp đồng; số hợp đồng; ngày & nơi ký; các bên ký kết (tên, địa chỉ, điện thoại, fax, người đại diện, “hereinafter called the Seller/Buyer”); thuật ngữ (nếu cần).", links: [{ label: "C6 · Cấu trúc 3 phần", to: "/learn/c6#contract-structure" }] },
  A("commodity", 1, "Commodity", 100, 165, "art-commodity", "Mô tả hàng đơn giản và chính xác: tên kỹ thuật & thương mại, nhà sản xuất, xuất xứ… Hàng phức tạp → mô tả trong phụ lục."),
  A("quality", 2, "Quality", 300, 165, "art-quality", "5 cách: theo mẫu; theo tiêu chuẩn (tổ chức ban hành, số hiệu, năm/phiên bản, cấp hạng); theo mô tả chi tiết; theo nhãn hiệu; theo tài liệu kỹ thuật. Lỗi thường gặp: tiêu chuẩn không ghi phiên bản/cấp hạng; theo mẫu không ghi ai giữ mẫu."),
  A("quantity", 3, "Quantity", 500, 165, "art-quantity", "Số lượng chính xác + đơn vị (MT, LT, ST…); dung sai (vd ±5%, ghi rõ do ai lựa chọn); cách xác định (trọng lượng tịnh/cả bì, chứng thư giám định). Lỗi: dung sai không ghi do bên nào lựa chọn."),
  A("packing", 4, "Packing & Marking", 700, 165, "art-packing", "Vật liệu, kích cỡ & hình dạng kiện, bên trong kiện, thể tích & trọng lượng kiện."),
  A("price", 5, "Price", 900, 165, "art-price", "5 yếu tố: đồng tiền; điều kiện Incoterms® (rule + version + nơi chỉ định, vd “CIF Hamburg, Germany – Incoterms® 2020”); đơn giá; tổng giá trị (bằng số và chữ); điều chỉnh giá. Lỗi: chỉ ghi “CIF”; tổng giá trị không ghi bằng chữ; đồng tiền giá ≠ đồng tiền thanh toán mà không có điều khoản tỷ giá."),
  A("other", 14, "Other terms", 100, 300, "art-other", "Sửa đổi phải bằng văn bản có chữ ký hai bên; không chuyển nhượng khi chưa có đồng ý bằng văn bản; toàn bộ thỏa thuận; ngôn ngữ (bản tiếng Anh ưu tiên khi có khác biệt); hiệu lực từ ngày hai bên ký."),
  A("payment", 7, "Payment", 300, 300, "art-payment", "Đồng tiền thanh toán; phương thức (T/T, D/A, D/P, L/C – ngân hàng, chứng từ, UCP 600, phí ngân hàng); thời hạn (trả trước, trả ngay, trả sau). Lỗi: phương thức không ghi ngân hàng/quy tắc áp dụng/phí ngân hàng."),
  A("documents", 8, "Documents", 500, 300, "art-documents", "Bộ chứng từ người bán phải cung cấp: hóa đơn thương mại, B/L, chứng nhận số lượng, chất lượng, phiếu đóng gói, chứng nhận/đơn bảo hiểm, C/O, các chứng từ khác."),
  A("insurance", 9, "Insurance", 700, 300, "art-insurance", "Ai mua bảo hiểm theo Incoterms (CIF & CIP: người bán); điều kiện ICC; số tiền bảo hiểm (vd 110% giá trị); đồng tiền; nơi trả bồi thường."),
  A("delivery", 6, "Delivery", 900, 300, "art-delivery", "Điều kiện giao hàng (Incoterms + version + nơi); thời gian giao (ngày cố định hoặc khoảng thời gian); nơi giao; thông báo giao hàng; giao từng phần/chuyển tải. Lỗi: “prompt”, “ASAP”, “subject to L/C opening”, “subject to shipping space”."),
  A("claim", 10, "Claim", 200, 435, "art-claim", "Căn cứ khiếu nại; thời hạn khiếu nại (kể cả khuyết tật ẩn); hồ sơ khiếu nại. Lỗi: không có thời hạn hoặc hồ sơ khiếu nại."),
  A("penalty", 11, "Penalty", 400, 435, "art-penalty", "Phạt giao chậm (X% giá trị hàng chưa giao/ngày), phạt thanh toán chậm (X% số tiền quá hạn/ngày), có mức trần. Lỗi: phạt không có mức trần."),
  A("force-majeure", 13, "Force Majeure", 600, 435, "art-force-majeure", "Sự kiện không lường trước, không tránh được, không khắc phục được; nghĩa vụ thông báo; cách giải quyết (chấm dứt hoặc kéo dài thời hạn). Lỗi: không có nghĩa vụ thông báo/cách giải quyết."),
  A("arbitration", 12, "Arbitration", 800, 435, "art-arbitration", "Luật áp dụng (CISG, luật nước người bán hoặc người mua); giải quyết bằng trọng tài; nơi trọng tài; chi phí. Lỗi: không ghi luật áp dụng hoặc nơi trọng tài."),
  { id: "signatures", label: "Phase 3 – Signatures", labelVi: "For the Seller / For the Buyer", role: "buyer", x: 500, y: 552, w: 960, h: 70, shape: "rect", descVi: "Chữ ký của đại diện hai bên (For the Seller / For the Buyer); hợp đồng có hiệu lực từ ngày hai bên ký.", links: [{ label: "C6 · Cấu trúc 3 phần", to: "/learn/c6#contract-structure" }] },
];

const dep = (from: string, to: string): DiagramEdge => ({ id: `${from}-${to}`, from, to, kind: "sequence", plain: true });

const edges: DiagramEdge[] = [
  dep("price", "delivery"),
  dep("delivery", "insurance"),
  dep("insurance", "documents"),
  dep("payment", "documents"),
  dep("claim", "penalty"),
  dep("penalty", "force-majeure"),
  dep("force-majeure", "arbitration"),
];

const spec: DiagramSpec = {
  id: "c6-contract-anatomy",
  chapter: "C6",
  title: "Anatomy of an international sale contract",
  titleVi: "Cấu trúc hợp đồng mua bán quốc tế – 3 phần, 14 điều khoản",
  provenance: "derived",
  note: "Đường nối = các điều khoản phải nhất quán với nhau: Price ↔ Delivery ↔ Insurance ↔ Documents; Payment ↔ Documents; Claim ↔ Penalty ↔ Force majeure ↔ Arbitration.",
  nodeFont: 15,
  legendRoles: false,
  nodes,
  edges,
  steps: [],
  keyTakeaways: [
    "3 phần: các bên ký kết → 14 điều khoản chính → chữ ký.",
    "Incoterms phải ghi đủ: rule + version + nơi chỉ định; điều khoản giá, giao hàng, bảo hiểm, chứng từ phải nhất quán.",
    "Phương thức thanh toán (L/C, UCP 600) quyết định bộ chứng từ (vd B/L “to order of the issuing bank”).",
  ],
};

export default spec;

/** "Bắt lỗi hợp đồng": draft clauses, correct or with a KB §6.17 mistake. */
export const DRAFT_CLAUSES = [
  { id: "d1", textVi: "Price: USD 500/MT CIF.", bucket: "error", whyVi: "Thiếu nơi chỉ định và phiên bản – phải ghi “CIF Hamburg, Germany – Incoterms® 2020”." },
  { id: "d2", textVi: "Price: USD 500/MT, CIF Hamburg, Germany – Incoterms® 2020.", bucket: "ok", whyVi: "Đủ rule + nơi chỉ định + version." },
  { id: "d3", textVi: "Time of delivery: prompt shipment.", bucket: "error", whyVi: "Không dùng cách diễn đạt chung chung như “prompt”, “ASAP”." },
  { id: "d4", textVi: "Time of delivery: shipped no later than Aug 30, 2026.", bucket: "ok", whyVi: "Thời hạn giao hàng cụ thể." },
  { id: "d5", textVi: "Time of delivery: subject to the opening of L/C.", bucket: "error", whyVi: "“Subject to the opening of L/C” là cách diễn đạt không nên dùng." },
  { id: "d6", textVi: "Total value: USD 250,000 – Say: US Dollars Two Hundred and Fifty Thousand Only.", bucket: "ok", whyVi: "Tổng giá trị ghi cả bằng số và bằng chữ." },
  { id: "d7", textVi: "Quantity: 1,000 MT ± 5%.", bucket: "error", whyVi: "Dung sai phải ghi rõ do bên nào lựa chọn (at the Seller's/Buyer's option)." },
  { id: "d8", textVi: "Penalty for late delivery: 0.5% of the value of undelivered goods per day.", bucket: "error", whyVi: "Phạt không có mức trần (cap)." },
  { id: "d9", textVi: "Payment: irrevocable documentary L/C at sight, subject to UCP 600.", bucket: "ok", whyVi: "Ghi rõ loại L/C và quy tắc áp dụng." },
  { id: "d10", textVi: "Delivery FOB Saigon Port – Incoterms® 2020; documents: B/L marked “Freight Prepaid”.", bucket: "error", whyVi: "Không nhất quán: theo FOB người mua trả cước chặng chính, nên B/L thường ghi “Freight Collect” ([EXT] lập luận từ nghĩa vụ FOB)." },
];
