import type { DiagramEdge, DiagramNode, DiagramSpec, DiagramStep } from "../engine/types";

const SRC = "KB §1.1–1.3 · Slide C1 p.6";

/**
 * D1.2 — "Export Management – Manage two key flows" (slide C1 p.6). Top lane: outflow of goods, 9 stations
 * left → right (as on this slide: origin/destination transport instead of ports). Bottom lane: inflow of
 * foreign exchange A → E, right → left. Play runs both lanes in parallel.
 */
const GOODS: { id: string; label: string; titleVi: string; title: string; what: string; customs?: "ex" | "im" }[] = [
  { id: "g1", label: "1. Seller's\nfactory", title: "Seller's factory", titleVi: "Nhà máy người bán", what: "Hàng được sản xuất và chuẩn bị để xuất khẩu." },
  { id: "g2", label: "2. Packing &\nloading", title: "Packing & loading", titleVi: "Đóng gói & bốc hàng", what: "Hàng được đóng gói và bốc lên phương tiện để vận chuyển." },
  { id: "g3", label: "3. Export\ncustoms", title: "Export customs (seller's country)", titleVi: "Hải quan xuất khẩu (nước người bán)", what: "Khai báo xuất khẩu, kiểm tra chứng từ, kiểm hóa, thông quan xuất khẩu.", customs: "ex" },
  { id: "g4", label: "4. Origin\ntransport", title: "Origin transport to port/airport", titleVi: "Vận chuyển đến cảng/sân bay đi", what: "Hàng được chở đến cảng hoặc sân bay." },
  { id: "g5", label: "5. International\ntransport", title: "International transport", titleVi: "Vận tải quốc tế", what: "Hàng được chở bằng đường biển hoặc hàng không sang nước người mua." },
  { id: "g6", label: "6. Destination\ntransport", title: "Destination transport", titleVi: "Vận chuyển ở nơi đến", what: "Hàng đến cảng/sân bay và được chở vào nội địa." },
  { id: "g7", label: "7. Import\ncustoms", title: "Import customs (buyer's country)", titleVi: "Hải quan nhập khẩu (nước người mua)", what: "Khai báo nhập khẩu, kiểm tra chứng từ, kiểm hóa, nộp thuế nhập khẩu, thông quan.", customs: "im" },
  { id: "g8", label: "8. Inland\ntransport", title: "Inland transport to buyer", titleVi: "Vận chuyển nội địa đến người mua", what: "Hàng được chở đến kho hoặc địa điểm cuối cùng của người mua." },
  { id: "g9", label: "9. Buyer's\npremises", title: "Buyer's premises (foreign country)", titleVi: "Cơ sở người mua (nước ngoài)", what: "Người mua nhận hàng." },
];

const MONEY: { id: string; badge: string; label: string; title: string; titleVi: string; what: string; role: DiagramNode["role"] }[] = [
  { id: "mA", badge: "A", label: "A. Buyer", title: "Buyer pays per contract", titleVi: "Người mua trả tiền theo hợp đồng", what: "Người mua (ở nước ngoài) thanh toán theo điều khoản của hợp đồng.", role: "buyer" },
  { id: "mB", badge: "B", label: "B. Buyer's\nbank", title: "Buyer's bank processes and remits", titleVi: "Ngân hàng người mua xử lý và chuyển tiền", what: "Ngân hàng của người mua xử lý khoản thanh toán và chuyển tiền đến ngân hàng của người bán.", role: "buyerBank" },
  { id: "mC", badge: "C", label: "C. Payment\nmethods", title: "Payment methods", titleVi: "Phương thức thanh toán", what: "Thanh toán bằng L/C, T/T, D/P, D/A hoặc điều kiện khác đã thỏa thuận.", role: "other" },
  { id: "mD", badge: "D", label: "D. Seller's\nbank", title: "Seller's bank receives FX and credits the account", titleVi: "Ngân hàng người bán nhận ngoại tệ, ghi có", what: "Ngân hàng của người bán nhận ngoại tệ và ghi có vào tài khoản người bán.", role: "sellerBank" },
  { id: "mE", badge: "E", label: "E. Seller", title: "Seller receives foreign exchange", titleVi: "Người bán nhận ngoại tệ", what: "Người bán nhận ngoại tệ – dòng ngoại tệ đi vào (inflow of foreign currency).", role: "seller" },
];

const nodes: DiagramNode[] = [
  ...GOODS.map(
    (g, i): DiagramNode => ({
      id: g.id,
      label: g.label,
      role: g.customs === "ex" ? "customsExport" : g.customs === "im" ? "customsImport" : i < 4 ? "seller" : i === 4 ? "carrier" : i === 5 ? "carrier" : "buyer",
      x: 58 + i * 110.5,
      y: 170,
      w: 104,
      h: 92,
      shape: "rect",
    }),
  ),
  ...MONEY.map((m, i): DiagramNode => ({ id: m.id, label: m.label, role: m.role, x: 890 - i * 197, y: 450, w: 150, h: 92, shape: "rect" })),
];

const edges: DiagramEdge[] = [
  ...GOODS.slice(1).map((g, i): DiagramEdge => ({ id: `ge${i + 1}`, from: GOODS[i]!.id, to: g.id, kind: "goods" })),
  ...MONEY.slice(1).map((m, i): DiagramEdge => ({ id: `me${i + 1}`, from: MONEY[i]!.id, to: m.id, kind: "money" })),
];

const steps: DiagramStep[] = [
  ...GOODS.map(
    (g, i): DiagramStep => ({
      id: g.id,
      order: i + 1,
      lane: "goods",
      title: g.title,
      titleVi: g.titleVi,
      edgeIds: [],
      actors: [g.id],
      what: g.what,
      why: "Dòng hàng (outflow of goods) – dòng thứ nhất của quản trị xuất khẩu: hàng phải đến tay người mua thành công.",
      source: SRC,
      practiceTopic: "two-flows",
    }),
  ),
  ...MONEY.map(
    (m, i): DiagramStep => ({
      id: m.id,
      order: i + 1,
      badge: m.badge,
      lane: "money",
      title: m.title,
      titleVi: m.titleVi,
      edgeIds: [],
      actors: [m.id],
      what: m.what,
      why: "Dòng ngoại tệ (inflow of foreign exchange) – dòng thứ hai: tiền phải về đủ và đúng hạn.",
      source: SRC,
      practiceTopic: "two-flows",
      links: i === 2 ? [{ label: "C5 · So sánh các phương thức thanh toán", to: "/diagrams/c5-method-compare" }] : undefined,
    }),
  ),
];

const spec: DiagramSpec = {
  id: "c1-two-flows",
  chapter: "C1",
  title: "Export Management – Manage two key flows",
  titleVi: "Quản trị xuất khẩu – quản lý hai dòng chảy",
  provenance: "slide",
  slideRef: "C1 p.6",
  note: "Bấm ▶ để chạy song song hai dòng: hàng đi ra (trái → phải) và ngoại tệ đi vào (phải → trái).",
  nodeFont: 14,
  lanes: [
    { id: "goods", label: "Outflow of goods (physical flow)" },
    { id: "money", label: "Inflow of foreign exchange (financial flow)" },
  ],
  playback: "parallel-lanes",
  zones: [
    { label: "Outflow of goods (physical flow)", x: 2, y: 80, w: 996, h: 160 },
    { label: "Inflow of foreign exchange (financial flow)", x: 2, y: 360, w: 996, h: 160 },
  ],
  nodes,
  edges,
  steps,
  legendRoles: false,
  keyTakeaways: [
    "Quản trị xuất khẩu quản lý HAI dòng: dòng hàng đi ra và dòng ngoại tệ đi vào.",
    "Mục tiêu: hàng đến tay người mua thành công VÀ tiền về đủ, đúng hạn.",
    "Quản lý thông qua: Planning & Coordination, Documentation, Risk Management, Control & Monitoring.",
  ],
  quiz: { order: true, gap: true },
};

export default spec;

/** "Môn học nằm ở đâu trên 2 dòng chảy?" (KB §1.5). */
export const COURSE_CHIPS: { id: string; label: string; roleVi: string; lanes: ("goods" | "money")[]; to: string }[] = [
  { id: "planning", label: "Planning & Preparation", roleVi: "lập kế hoạch cho cả hai dòng", lanes: ["goods", "money"], to: "/learn/c2" },
  { id: "pricing", label: "Pricing & Incoterms®", roleVi: "phân chia chi phí/rủi ro trong dòng hàng", lanes: ["goods"], to: "/learn/c3" },
  { id: "insurance", label: "Cargo Insurance", roleVi: "bảo vệ dòng hàng", lanes: ["goods"], to: "/learn/c4" },
  { id: "payment", label: "International Payment", roleVi: "quản lý dòng tài chính", lanes: ["money"], to: "/learn/c5" },
  { id: "contract", label: "International Sale Contract", roleVi: "kết nối hai dòng về mặt pháp lý", lanes: ["goods", "money"], to: "/learn/c6" },
  { id: "documents", label: "Documents & Procedures", roleVi: "giúp thực hiện và kiểm soát cả hai dòng", lanes: ["goods", "money"], to: "/learn/c7" },
];

export const RIGHT_CHAIN = ["Right goods", "Right place", "Right time", "Right documents", "Right payment", "Acceptable risk"];
export const MANAGED_THROUGH = ["Planning & Coordination", "Documentation", "Risk Management", "Control & Monitoring"];
