import type { ActorRole, DiagramEdge, DiagramNode, DiagramSpec } from "../engine/types";

/**
 * D1.4 — Figure 1-6 "Interrelationships with outside service providers" (slide C1 p.10). Hub-and-spoke with
 * the spokes exactly as in KB §1.8, positioned like the figure. A map diagram: no steps, every node is
 * explored by clicking it. Node panels only carry KB-backed links (no invented job descriptions).
 */
type Kind = "internal" | "external";

const N = (
  id: string,
  label: string,
  x: number,
  y: number,
  kind: Kind,
  role: ActorRole,
  descVi: string,
  links: { label: string; to: string }[] = [],
  w = 160,
): DiagramNode & { kind: Kind } => ({ id, label, x, y, w, h: 58, shape: "rect", role, descVi, links, kind });

const HUB_NODES = [
  N("hub", "VP (Director)\nExport/Import Operations", 500, 255, "internal", "seller", "Trung tâm của Figure 1-6: bộ phận xuất nhập khẩu kết nối với các phòng ban nội bộ và các nhà cung cấp dịch vụ bên ngoài. Vai trò điều phối: nhà quản trị xuất khẩu đảm bảo các bên phối hợp và trao đổi thông tin hiệu quả (KB §1.10, vai trò 2).", [{ label: "C1 · 6 vai trò của quản trị XNK", to: "/learn/c1#roles" }], 250),
  N("treasury", "Treasury or\nAccounting Dept.", 140, 62, "internal", "seller", "Phòng ngân quỹ/kế toán – trên Figure 1-6 nằm cùng ô với Banks.", []),
  N("banks", "Banks", 140, 132, "external", "sellerBank", "Ngân hàng: xử lý thanh toán quốc tế (T/T, nhờ thu, L/C).", [{ label: "C5 · Các phương thức thanh toán", to: "/learn/c5#method-selection" }]),
  N("is", "Information\nSystems", 365, 62, "internal", "seller", "Phòng hệ thống thông tin (bộ phận nội bộ trên Figure 1-6).", [{ label: "C1 · Vai trò 6: chuyển đổi số", to: "/learn/c1#roles" }]),
  N("legal", "Legal", 625, 62, "internal", "seller", "Phòng pháp chế (bộ phận nội bộ trên Figure 1-6).", [{ label: "C6 · Hợp đồng mua bán quốc tế", to: "/learn/c6#contract-structure" }]),
  N("manufacturing", "Manufacturing", 860, 62, "internal", "seller", "Bộ phận sản xuất (bộ phận nội bộ trên Figure 1-6).", []),
  N("customers", "Customers", 85, 255, "external", "buyer", "Khách hàng – kết nối qua VP Marketing (Sales).", [], 130),
  N("marketing", "VP Marketing\n(Sales)", 255, 255, "internal", "seller", "Phó giám đốc Marketing (bán hàng) – nối bộ phận XNK với khách hàng.", [], 150),
  N("purchasing", "VP\nPurchasing", 745, 255, "internal", "seller", "Phó giám đốc Mua hàng – nối bộ phận XNK với nhà cung cấp.", [], 150),
  N("suppliers", "Suppliers", 915, 255, "external", "other", "Nhà cung cấp – kết nối qua VP Purchasing.", [], 130),
  N("preshipment", "Preshipment\nInspection Cos.", 895, 340, "external", "other", "Công ty giám định trước khi giao hàng.", [{ label: "C7 · Giấy chứng nhận giám định (Inspection Certificate)", to: "/learn/c7#phyto-inspection" }]),
  N("consulates", "Consulates", 850, 410, "external", "other", "Lãnh sự quán (nhà cung cấp dịch vụ bên ngoài trên Figure 1-6).", []),
  N("translators", "Translators", 790, 480, "external", "other", "Biên dịch viên (nhà cung cấp dịch vụ bên ngoài trên Figure 1-6).", []),
  N("government", "Government\nAgencies", 665, 545, "external", "customsExport", "Cơ quan nhà nước – nhà quản trị XNK phối hợp với cơ quan nhà nước và cơ quan hải quan (KB §1.10, vai trò 2).", [{ label: "C8 · Thông quan xuất khẩu / nhập khẩu", to: "/learn/c8#export-procedure" }]),
  N("packing", "Packing\nCompanies", 500, 568, "external", "carrier", "Công ty đóng gói (nhà cung cấp dịch vụ bên ngoài).", [{ label: "C6 · Đóng gói & ký mã hiệu", to: "/learn/c6#art-packing" }]),
  N("insurance", "Insurance Cos.\n& Sureties", 335, 540, "external", "insurer", "Công ty bảo hiểm và bảo lãnh – bảo hiểm hàng hóa.", [{ label: "C4 · Bảo hiểm hàng hóa XNK", to: "/learn/c4#cargo-insurance" }]),
  N("brokers", "Customs\nBrokers", 240, 470, "external", "customsExport", "Đại lý hải quan – trung gian giúp làm thủ tục hải quan.", [{ label: "C2 · Logistics & giao hàng", to: "/learn/c2#logistics" }]),
  N("forwarders", "Freight\nForwarders", 165, 405, "external", "carrier", "Người giao nhận – trung gian logistics.", [{ label: "C2 · Logistics & giao hàng", to: "/learn/c2#logistics" }]),
  N("carriers", "Transportation\nCarriers", 110, 335, "external", "carrier", "Người chuyên chở – cấp vận đơn (B/L).", [{ label: "C7 · Vận đơn đường biển (B/L)", to: "/learn/c7#bl-functions" }]),
];

const spoke = (to: string, from = "hub"): DiagramEdge => ({ id: `${from}-${to}`, from, to, kind: "sequence", plain: true });

const edges: DiagramEdge[] = [
  spoke("treasury"),
  spoke("banks", "treasury"),
  spoke("is"),
  spoke("legal"),
  spoke("manufacturing"),
  spoke("marketing"),
  spoke("customers", "marketing"),
  spoke("purchasing"),
  spoke("suppliers", "purchasing"),
  ...["preshipment", "consulates", "translators", "government", "packing", "insurance", "brokers", "forwarders", "carriers"].map((id) => spoke(id)),
];

const spec: DiagramSpec = {
  id: "c1-stakeholder-hub",
  chapter: "C1",
  title: "Figure 1-6. Interrelationships with outside service providers",
  titleVi: "Bộ phận XNK và các nhà cung cấp dịch vụ bên ngoài (Figure 1-6)",
  provenance: "slide",
  slideRef: "C1 p.10",
  note: "Bấm vào từng ô để xem vai trò và chương liên quan. Lọc phòng ban nội bộ / nhà cung cấp bên ngoài ở thanh công cụ.",
  nodeFont: 15,
  legendRoles: false,
  nodes: HUB_NODES.map(({ kind: _kind, ...n }) => n),
  edges,
  steps: [],
  keyTakeaways: [
    "Bộ phận XNK (VP/Director Export/Import Operations) là trung tâm kết nối nội bộ và bên ngoài.",
    "Nhà quản trị xuất khẩu đóng vai trò điều phối giữa tất cả các bên.",
  ],
};

export default spec;

export const HUB_KIND: Record<string, Kind> = Object.fromEntries(HUB_NODES.map((n) => [n.id, n.kind]));

/** KB §1.9 — 12 players in an international trade transaction. */
export const PLAYERS = [
  "Exporter",
  "Importer",
  "Banks",
  "Port authorities/companies",
  "Carrier/transporter",
  "Freight forwarder",
  "Customs",
  "Clearing agent",
  "Insurance companies",
  "Inspection companies",
  "Arbitrator",
  "Chamber of Commerce",
];
