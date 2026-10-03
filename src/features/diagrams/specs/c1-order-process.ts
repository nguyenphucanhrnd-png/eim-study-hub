import type { DiagramSpec } from "../engine/types";

const SRC = "KB §1.7 · Slide C1 p.9";

const STAGES = [
  {
    id: "quotation",
    label: "Quotation",
    labelVi: "Báo giá",
    titleVi: "Báo giá (price quotation)",
    what: "Người bán đưa ra báo giá cho người mua – giá gắn với một điều kiện Incoterms.",
    why: "Giá chào phải tính đúng chi phí và rủi ro theo điều kiện giao hàng đã chọn.",
    link: { label: "C3 · Định giá & Incoterms", to: "/learn/c3#pricing-approaches" },
    topic: "order-process",
  },
  {
    id: "order-entry",
    label: "Order entry",
    labelVi: "Nhận đơn hàng",
    titleVi: "Nhận và xác lập đơn hàng (order entry)",
    what: "Đơn hàng được xác nhận – hai bên thống nhất các điều khoản trong hợp đồng mua bán.",
    why: "Hợp đồng là cơ sở pháp lý nối dòng hàng và dòng tiền.",
    link: { label: "C6 · Hợp đồng mua bán quốc tế", to: "/learn/c6#contract-structure" },
    topic: "order-process",
  },
  {
    id: "shipment",
    label: "Shipment",
    labelVi: "Giao hàng",
    titleVi: "Giao hàng (shipment)",
    what: "Người bán chuẩn bị hàng, chứng từ và giao hàng theo hợp đồng.",
    why: "Giao hàng đúng và đủ chứng từ là điều kiện để được thanh toán.",
    link: { label: "C8 · Quy trình xuất khẩu", to: "/learn/c8#export-procedure" },
    topic: "order-process",
  },
  {
    id: "collection",
    label: "Collection",
    labelVi: "Thu tiền",
    titleVi: "Thu tiền (collection)",
    what: "Người bán thu tiền hàng theo phương thức thanh toán đã thỏa thuận.",
    why: "Kết thúc chu trình: tiền về đủ và đúng hạn.",
    link: { label: "C5 · Thanh toán quốc tế", to: "/learn/c5#method-selection" },
    topic: "order-process",
  },
];

/** D1.3 — Export order process, 4 stages (slide C1 p.9). Each stage links to the chapter that covers it. */
const spec: DiagramSpec = {
  id: "c1-order-process",
  chapter: "C1",
  title: "Export order process",
  titleVi: "Quy trình đơn hàng xuất khẩu – 4 giai đoạn",
  provenance: "slide",
  slideRef: "C1 p.9",
  viewBox: { w: 1000, h: 240 },
  legendRoles: false,
  nodes: STAGES.map((s, i) => ({ id: s.id, label: s.label, labelVi: s.labelVi, role: "seller", x: 125 + i * 250, y: 130, w: 200, h: 92, shape: "pill" })),
  edges: STAGES.slice(1).map((s, i) => ({ id: `q${i + 1}`, from: STAGES[i]!.id, to: s.id, kind: "sequence" })),
  steps: STAGES.map((s, i) => ({
    id: s.id,
    order: i + 1,
    title: s.label,
    titleVi: s.titleVi,
    edgeIds: [],
    actors: [s.id],
    what: s.what,
    why: s.why,
    source: SRC,
    practiceTopic: s.topic,
    links: [s.link],
  })),
  keyTakeaways: ["Quotation → Order entry → Shipment → Collection.", "Mỗi giai đoạn ứng với một chương: báo giá (C3), hợp đồng (C6), giao hàng & chứng từ (C7, C8), thu tiền (C5)."],
  quiz: { order: true, gap: true },
};

export default spec;
