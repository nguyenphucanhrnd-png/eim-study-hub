import type { DiagramSpec } from "../engine/types";

/**
 * D3.2 — infographic "Purpose / Scope of Incoterms" (slide C3 p.8): 4 purpose cards, 3 "DO NOT cover" cards
 * and the key point. A map diagram (no steps): each card is explored by clicking it.
 */
const SRC_LINK = [{ label: "C3 · Incoterms là gì?", to: "/learn/c3#incoterms-basics" }];
const SCOPE_LINK = [{ label: "C3 · Phạm vi điều chỉnh", to: "/learn/c3#incoterms-scope" }];

const spec: DiagramSpec = {
  id: "c3-incoterms-purpose-scope",
  chapter: "C3",
  title: "Purpose and scope of Incoterms",
  titleVi: "Incoterms: mục đích và phạm vi điều chỉnh",
  provenance: "slide",
  slideRef: "C3 p.8",
  nodeFont: 16,
  legendRoles: false,
  zones: [
    { label: "Purpose – Incoterms quy định", x: 10, y: 10, w: 480, h: 470 },
    { label: "Scope – Incoterms DO NOT cover", x: 510, y: 10, w: 480, h: 470 },
  ],
  nodes: [
    { id: "pu-obligations", label: "Obligations of\nseller and buyer", labelVi: "Nghĩa vụ của người bán và người mua", role: "seller", x: 250, y: 105, w: 420, h: 84, shape: "rect", descVi: "Mục đích 1: xác định nghĩa vụ của người bán và người mua.", links: SRC_LINK },
    { id: "pu-costs", label: "Division of costs\nand expenses", labelVi: "Phân chia chi phí", role: "seller", x: 250, y: 200, w: 420, h: 84, shape: "rect", descVi: "Mục đích 2: phân chia chi phí giữa hai bên.", links: SRC_LINK },
    { id: "pu-risk", label: "Transfer of risk", labelVi: "Điểm chuyển rủi ro mất mát/hư hỏng", role: "seller", x: 250, y: 295, w: 420, h: 84, shape: "rect", descVi: "Mục đích 3: xác định điểm rủi ro mất mát/hư hỏng chuyển từ người bán sang người mua.", links: [{ label: "Sơ đồ chi phí – rủi ro 11 điều kiện", to: "/diagrams/c3-carriage-incoterms" }] },
    { id: "pu-price", label: "Calculate the\nexport price", labelVi: "Giúp tính giá xuất khẩu", role: "seller", x: 250, y: 390, w: 420, h: 84, shape: "rect", descVi: "Mục đích 4: giúp nhà xuất khẩu tính giá xuất khẩu theo điều kiện đã chọn.", links: SRC_LINK },
    { id: "nc-title", label: "Transfer of title", labelVi: "Chuyển quyền sở hữu", role: "buyer", x: 750, y: 125, w: 420, h: 90, shape: "rect", descVi: "Incoterms KHÔNG xác định khi nào quyền sở hữu hàng hóa chuyển sang người mua.", links: SCOPE_LINK },
    { id: "nc-payment", label: "Payment terms\nor methods", labelVi: "Điều kiện / phương thức thanh toán", role: "buyer", x: 750, y: 245, w: 420, h: 90, shape: "rect", descVi: "Incoterms KHÔNG quy định trả tiền khi nào, bằng phương thức nào.", links: [...SCOPE_LINK, { label: "C5 · Thanh toán quốc tế", to: "/learn/c5#method-selection" }] },
    { id: "nc-breach", label: "Breach of contract", labelVi: "Vi phạm hợp đồng", role: "buyer", x: 750, y: 365, w: 420, h: 90, shape: "rect", descVi: "Incoterms KHÔNG đề cập biện pháp khắc phục, trách nhiệm pháp lý, hậu quả khi vi phạm hợp đồng.", links: [...SCOPE_LINK, { label: "C6 · Khiếu nại, phạt, trọng tài", to: "/learn/c6#art-claim" }] },
    { id: "key", label: "Key point: costs, risks & responsibilities of DELIVERY only", labelVi: "Incoterms không điều chỉnh bản thân hợp đồng", role: "other", x: 500, y: 540, w: 960, h: 80, shape: "rect", descVi: "Incoterms chỉ điều chỉnh việc phân chia chi phí, rủi ro và trách nhiệm liên quan đến việc giao hàng; không điều chỉnh bản thân hợp đồng.", links: SCOPE_LINK },
  ],
  edges: [],
  steps: [],
  keyTakeaways: [
    "Incoterms quy định: nghĩa vụ hai bên, phân chia chi phí, điểm chuyển rủi ro, giúp tính giá xuất khẩu.",
    "Incoterms KHÔNG quy định: chuyển quyền sở hữu, thanh toán, vi phạm hợp đồng.",
    "Incoterms không phải là luật – là quy tắc của ICC.",
  ],
};

export default spec;

/** "Incoterms quy định / không quy định" sorting quiz. */
export const SCOPE_ITEMS = [
  { id: "i1", textVi: "Nghĩa vụ của người bán và người mua", bucket: "covers", whyVi: "Mục đích 1." },
  { id: "i2", textVi: "Phân chia chi phí giữa hai bên", bucket: "covers", whyVi: "Mục đích 2." },
  { id: "i3", textVi: "Điểm rủi ro mất mát/hư hỏng chuyển sang người mua", bucket: "covers", whyVi: "Mục đích 3." },
  { id: "i4", textVi: "Cơ sở để tính giá xuất khẩu", bucket: "covers", whyVi: "Mục đích 4." },
  { id: "i5", textVi: "Thời điểm chuyển quyền sở hữu hàng hóa", bucket: "not", whyVi: "Transfer of title – không thuộc Incoterms." },
  { id: "i6", textVi: "Phương thức thanh toán (L/C, T/T…)", bucket: "not", whyVi: "Payment terms/methods – không thuộc Incoterms." },
  { id: "i7", textVi: "Hậu quả và trách nhiệm khi vi phạm hợp đồng", bucket: "not", whyVi: "Breach of contract – không thuộc Incoterms." },
];
