import type { DiagramNode, DiagramSpec } from "../engine/types";

/**
 * D7.2 — B/L types as a decision tree (KB §7.5): condition notation → clean / unclean; loaded? → shipped on
 * board / received for shipment; consignee → to order / straight / bearer; plus the 3 functions. Derived.
 */
const Q = (id: string, label: string, x: number, y: number, descVi: string): DiagramNode => ({ id, label, role: "seller", x, y, w: 230, h: 70, shape: "pill", descVi });
const T = (id: string, label: string, labelVi: string, x: number, y: number, descVi: string): DiagramNode => ({
  id,
  label,
  labelVi,
  role: "buyer",
  x,
  y,
  w: 170,
  h: 80,
  shape: "rect",
  descVi,
  links: [{ label: "C7 · 7 loại B/L", to: "/learn/c7#bl-types" }],
});

const spec: DiagramSpec = {
  id: "c7-bl-types",
  chapter: "C7",
  title: "Types of bill of lading – decision tree",
  titleVi: "Các loại vận đơn (B/L) – cây quyết định",
  provenance: "derived",
  nodeFont: 15,
  legendRoles: false,
  nodes: [
    { id: "bl", label: "BILL OF LADING", labelVi: "3 chức năng: biên lai · bằng chứng HĐ vận chuyển · chứng từ sở hữu", role: "carrier", x: 500, y: 50, w: 640, h: 72, shape: "rect", descVi: "Chứng từ vận tải do người chuyên chở cấp cho người gửi hàng. 3 chức năng: (1) biên lai nhận hàng; (2) bằng chứng của hợp đồng vận chuyển; (3) chứng từ sở hữu – B/L có thể chuyển nhượng cho phép người cầm B/L nhận/kiểm soát hàng.", links: [{ label: "C7 · Chức năng của B/L", to: "/learn/c7#bl-functions" }] },
    Q("q-condition", "Ghi chú về tình trạng\nhàng/bao bì?", 175, 200, "Câu hỏi 1: B/L có ghi chú (clause/notation) cho thấy hàng hoặc bao bì có khuyết tật không?"),
    Q("q-loaded", "Hàng đã xếp\nlên tàu chưa?", 500, 200, "Câu hỏi 2: B/L xác nhận hàng đã xếp lên tàu, hay người chuyên chở mới nhận hàng?"),
    Q("q-consignee", "Giao hàng\ncho ai?", 825, 200, "Câu hỏi 3: B/L ghi người nhận hàng thế nào?"),
    T("clean", "Clean B/L", "B/L hoàn hảo", 110, 400, "Không có ghi chú về hàng/bao bì khuyết tật."),
    T("unclean", "Unclean B/L", "claused / dirty", 310, 400, "Có ghi chú về khuyết tật, ví dụ mùi lạ, bao bì hư hỏng."),
    T("shipped", "Shipped on\nboard B/L", "đã xếp hàng", 360, 520, "Xác nhận hàng đã được xếp lên tàu."),
    T("received", "Received for\nshipment B/L", "nhận hàng để xếp", 500, 400, "Người chuyên chở đã nhận hàng nhưng chưa xếp lên tàu."),
    T("to-order", "B/L to order", "chuyển nhượng được", 680, 400, "Có thể chuyển nhượng (negotiable) bằng ký hậu và giao B/L: theo lệnh ngân hàng phát hành / người mở L/C / người gửi hàng / “to order”."),
    T("straight", "Straight B/L", "đích danh", 900, 400, "Giao cho người nhận hàng được ghi đích danh."),
    T("bearer", "Bearer B/L", "vô danh", 790, 520, "Giao cho người cầm B/L."),
  ],
  edges: [
    { id: "r1", from: "bl", to: "q-condition", kind: "sequence" },
    { id: "r2", from: "bl", to: "q-loaded", kind: "sequence" },
    { id: "r3", from: "bl", to: "q-consignee", kind: "sequence" },
    { id: "a1", from: "q-condition", to: "clean", kind: "sequence", label: "không" },
    { id: "a2", from: "q-condition", to: "unclean", kind: "sequence", label: "có" },
    { id: "b1", from: "q-loaded", to: "shipped", kind: "sequence", label: "rồi" },
    { id: "b2", from: "q-loaded", to: "received", kind: "sequence", label: "chưa" },
    { id: "c1", from: "q-consignee", to: "to-order", kind: "sequence" },
    { id: "c2", from: "q-consignee", to: "straight", kind: "sequence" },
    { id: "c3", from: "q-consignee", to: "bearer", kind: "sequence" },
  ],
  steps: [],
  keyTakeaways: [
    "Clean / unclean: có hay không ghi chú khuyết tật.",
    "Shipped on board / received for shipment: đã xếp lên tàu hay mới nhận hàng.",
    "To order (chuyển nhượng bằng ký hậu) / straight (đích danh) / bearer (người cầm).",
  ],
};

export default spec;

export const BL_ITEMS = [
  { id: "b1", textVi: "B/L ghi chú “bao bì bị rách”.", bucket: "unclean" },
  { id: "b2", textVi: "B/L không có ghi chú nào về khuyết tật của hàng/bao bì.", bucket: "clean" },
  { id: "b3", textVi: "B/L xác nhận hàng đã được xếp lên tàu.", bucket: "shipped" },
  { id: "b4", textVi: "Người chuyên chở đã nhận hàng nhưng chưa xếp lên tàu.", bucket: "received" },
  { id: "b5", textVi: "B/L ghi “to order of the issuing bank”, chuyển nhượng bằng ký hậu.", bucket: "to-order" },
  { id: "b6", textVi: "Hàng chỉ giao cho người nhận được ghi tên cụ thể.", bucket: "straight" },
  { id: "b7", textVi: "Hàng giao cho bất kỳ ai cầm B/L.", bucket: "bearer" },
];
