import type { DiagramSpec } from "../engine/types";

const SRC = "KB §7.3–7.4";

/** D7.3 — Pro forma ⇄ commercial invoice on a timeline (from the slide comparison table, KB §7.4). Derived. */
const spec: DiagramSpec = {
  id: "c7-proforma-vs-commercial",
  chapter: "C7",
  title: "Pro forma invoice vs commercial invoice",
  titleVi: "Hóa đơn chiếu lệ ⇄ hóa đơn thương mại",
  provenance: "derived",
  nodeFont: 16,
  zones: [
    { label: "Trước khi bán / giao hàng", x: 10, y: 20, w: 480, h: 560 },
    { label: "Giao dịch & giao hàng thực tế", x: 510, y: 20, w: 480, h: 560 },
  ],
  nodes: [
    { id: "seller", label: "SELLER", role: "seller", x: 500, y: 300, w: 170, h: 80, shape: "ellipse", descVi: "Người bán lập cả hai loại hóa đơn." },
    { id: "proforma", label: "PRO FORMA\nINVOICE", labelVi: "Sơ bộ / tạm thời", role: "other", x: 250, y: 140, w: 250, h: 90, shape: "rect", descVi: "Chứng từ sơ bộ gửi người mua tiềm năng: mô tả, số lượng, giá & đồng tiền, điều kiện giao hàng/Incoterms, thời gian giao dự kiến, điều kiện thanh toán. Không dùng để thanh toán.", links: [{ label: "C7 · Pro forma invoice", to: "/learn/c7#proforma" }] },
    { id: "pf-use", label: "Quotation · import permit /\nFX approval · non-commercial\nshipments (samples)", role: "buyer", x: 250, y: 460, w: 330, h: 110, shape: "rect", descVi: "Đi kèm báo giá; hải quan với hàng phi mậu dịch (hàng mẫu, quảng cáo); hồ sơ xin giấy phép nhập khẩu hoặc phê duyệt ngoại tệ; giúp người mua thu xếp giao dịch trước khi giao hàng." },
    { id: "commercial", label: "COMMERCIAL\nINVOICE", labelVi: "Chứng từ thương mại cuối cùng", role: "seller", x: 750, y: 140, w: 250, h: 90, shape: "rect", descVi: "Do người bán lập cho người mua, thể hiện giao dịch thực tế.", links: [{ label: "C7 · Commercial invoice", to: "/learn/c7#commercial-invoice" }] },
    { id: "ci-use", label: "Customs valuation ·\npayment · import procedures", role: "buyer", x: 750, y: 460, w: 330, h: 110, shape: "rect", descVi: "Hải quan dùng để xác định trị giá hải quan và tính thuế; người mua dùng để thông quan, chứng minh quyền sở hữu, thanh toán." },
  ],
  edges: [
    { id: "e1", from: "seller", to: "proforma", kind: "document" },
    { id: "e2", from: "proforma", to: "pf-use", kind: "document" },
    { id: "e3", from: "seller", to: "commercial", kind: "document" },
    { id: "e4", from: "commercial", to: "ci-use", kind: "document" },
  ],
  steps: [
    { id: "s1", order: 1, title: "Seller issues a pro forma invoice to a prospective buyer", titleVi: "Người bán lập hóa đơn chiếu lệ cho người mua tiềm năng", edgeIds: ["e1"], actors: ["seller", "proforma"], what: "Thường lập TRƯỚC khi bán và giao hàng, kèm báo giá.", why: "Chứng từ sơ bộ, tạm thời.", trap: "Hóa đơn chiếu lệ KHÔNG dùng để thanh toán.", source: SRC, practiceTopic: "proforma" },
    { id: "s2", order: 2, title: "Pro forma used for quotation and preliminary/import procedures", titleVi: "Dùng cho báo giá và thủ tục sơ bộ", edgeIds: ["e2"], actors: ["proforma", "pf-use"], what: "Đi kèm báo giá; hàng phi mậu dịch; xin giấy phép nhập khẩu hoặc phê duyệt ngoại tệ.", why: "Giúp người mua thu xếp giao dịch trước khi giao hàng.", source: SRC, practiceTopic: "proforma" },
    { id: "s3", order: 3, title: "Seller issues the commercial invoice for the actual shipment", titleVi: "Người bán lập hóa đơn thương mại cho lô hàng thực tế", edgeIds: ["e3"], actors: ["seller", "commercial"], what: "Lập cho giao dịch/lô hàng thực tế, ghi mô tả, số lượng, giá, giao hàng, thanh toán…", why: "Chứng từ thương mại cuối cùng, thể hiện giao dịch thực tế.", source: SRC, practiceTopic: "commercial-invoice" },
    { id: "s4", order: 4, title: "Commercial invoice used for customs valuation and payment", titleVi: "Dùng để xác định trị giá hải quan, thanh toán, nhập khẩu", edgeIds: ["e4"], actors: ["commercial", "ci-use"], what: "Hải quan xác định trị giá hải quan và tính thuế; người mua thông quan, chứng minh quyền sở hữu, thanh toán.", why: "Theo L/C, hóa đơn thương mại được kiểm tra theo 7 điểm.", source: SRC, practiceTopic: "invoice-vs-lc" },
  ],
  keyTakeaways: ["Pro forma: sơ bộ, trước khi bán/giao hàng, không dùng để thanh toán.", "Commercial invoice: chứng từ cuối cùng cho giao dịch thực tế – trị giá hải quan, thanh toán."],
  quiz: { order: true, gap: true },
};

export default spec;

export const INVOICE_ITEMS = [
  { id: "v1", textVi: "Sơ bộ / tạm thời (preliminary / provisional)", bucket: "proforma" },
  { id: "v2", textVi: "Chứng từ thương mại cuối cùng", bucket: "commercial" },
  { id: "v3", textVi: "Thường lập trước khi bán và giao hàng", bucket: "proforma" },
  { id: "v4", textVi: "Lập cho giao dịch/lô hàng thực tế", bucket: "commercial" },
  { id: "v5", textVi: "Dùng để xác định trị giá hải quan", bucket: "commercial" },
  { id: "v6", textVi: "Không dùng để thanh toán", bucket: "proforma" },
  { id: "v7", textVi: "Hồ sơ xin giấy phép nhập khẩu / phê duyệt ngoại tệ", bucket: "proforma" },
];
