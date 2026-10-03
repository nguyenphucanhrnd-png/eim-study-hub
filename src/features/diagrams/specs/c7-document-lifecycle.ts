import type { DiagramEdge, DiagramNode, DiagramSpec, DiagramStep } from "../engine/types";

const SRC = "KB §7.3–7.9";

/**
 * D7.1 — who ISSUES each document and who USES it (KB §7.3–7.9; C/O issued by VCCI per the C6 contract
 * example). Derived. Each document is a step: highlight shows its issuer and users; panels carry the checklists.
 */
const ISSUERS: DiagramNode[] = [
  { id: "i-seller", label: "Seller /\nshipper", role: "seller", x: 115, y: 95, w: 190, h: 70, shape: "rect" },
  { id: "i-carrier", label: "Carrier", role: "carrier", x: 115, y: 205, w: 190, h: 60, shape: "rect" },
  { id: "i-insurer", label: "Insurer /\nauthorized agent", role: "insurer", x: 115, y: 305, w: 190, h: 70, shape: "rect" },
  { id: "i-chamber", label: "Chamber of\nCommerce (VCCI)", role: "other", x: 115, y: 405, w: 190, h: 70, shape: "rect" },
  { id: "i-gov", label: "Government\nauthority", role: "customsExport", x: 115, y: 505, w: 190, h: 70, shape: "rect" },
];

const USERS: DiagramNode[] = [
  { id: "u-buyer", label: "Buyer", role: "buyer", x: 885, y: 150, w: 190, h: 70, shape: "rect" },
  { id: "u-customs", label: "Customs /\nimporting authority", role: "customsImport", x: 885, y: 300, w: 190, h: 80, shape: "rect" },
  { id: "u-bank", label: "Bank (L/C)", role: "buyerBank", x: 885, y: 450, w: 190, h: 70, shape: "rect" },
];

const INVOICE_VS_LC = [
  "Do người thụ hưởng ghi trong L/C phát hành?",
  "Cùng đồng tiền với L/C?",
  "Mô tả hàng phù hợp L/C?",
  "Số lượng phù hợp (kể cả dung sai)?",
  "Đơn giá & tổng tiền phù hợp?",
  "Điều kiện giao hàng/Incoterms nhất quán với L/C (nếu yêu cầu)?",
  "Ký mã hiệu, số hiệu và chi tiết khác nhất quán với L/C và chứng từ khác?",
];
const BL_CHECKLIST = [
  "Tên tàu",
  "Cảng xếp & cảng dỡ",
  "Nơi & ngày phát hành",
  "Người phát hành (người chuyên chở/đại lý/thuyền trưởng/đại lý thuyền trưởng)",
  "Chữ ký",
  "Ngày xếp hàng lên tàu",
  "Số bản gốc",
  "Clean on board",
  "Số L/C trên B/L",
  "Order party (người mua)",
  "Tên/địa chỉ người gửi hàng",
  "Tên/địa chỉ người nhận hàng",
  "Tên/địa chỉ bên được thông báo",
  "Ký mã hiệu",
  "Số kiện",
  "Mô tả hàng",
  "Trọng lượng",
  "Cước: Freight Prepaid hoặc Freight Collect/Payable at Destination",
  "Ghi chú bổ sung (theo L/C)",
];
const INSURANCE_CHECKLIST = [
  "Xuất trình đủ bản gốc theo L/C?",
  "Do công ty bảo hiểm hoặc đại lý được ủy quyền phát hành? (cover note của môi giới không được chấp nhận theo UCP 600)",
  "Ghi ngày và ký đúng?",
  "Ngày không muộn hơn ngày giao hàng?",
];

interface Doc {
  id: string;
  label: string;
  issuer: string;
  users: string[];
  title: string;
  titleVi: string;
  what: string;
  why: string;
  topic: string;
  details?: DiagramStep["details"];
}

const DOCS: Doc[] = [
  { id: "invoice", label: "Commercial invoice", issuer: "i-seller", users: ["u-buyer", "u-customs", "u-bank"], title: "Commercial invoice", titleVi: "Hóa đơn thương mại", what: "Do người bán lập cho người mua, ghi chi tiết hàng và giao dịch (mô tả, số lượng, giá, giao hàng, thanh toán…).", why: "Người mua dùng để thông quan, chứng minh quyền sở hữu, thu xếp thanh toán; hải quan dùng để xác định trị giá hải quan và tính thuế.", topic: "commercial-invoice", details: [{ title: "Kiểm tra hóa đơn với L/C", items: INVOICE_VS_LC, checklist: true }] },
  { id: "packing", label: "Packing list", issuer: "i-seller", users: ["u-buyer"], title: "Packing list", titleVi: "Phiếu đóng gói", what: "Do người gửi hàng lập, liệt kê loại và số lượng hàng trong lô; một bản gửi người nhận hàng.", why: "Giúp người nhận kiểm tra lô hàng khi hàng đến.", topic: "packing-list" },
  { id: "proforma", label: "Pro forma invoice", issuer: "i-seller", users: ["u-buyer", "u-customs"], title: "Pro forma invoice", titleVi: "Hóa đơn chiếu lệ", what: "Chứng từ sơ bộ người bán gửi người mua tiềm năng, thường TRƯỚC khi bán và giao hàng.", why: "Đi kèm báo giá; dùng cho hải quan với hàng phi mậu dịch (hàng mẫu, quảng cáo); hỗ trợ xin giấy phép nhập khẩu/phê duyệt ngoại tệ. Không dùng để thanh toán.", topic: "proforma" },
  { id: "inspection", label: "Inspection / quantity /\nquality certificate", issuer: "i-seller", users: ["u-buyer"], title: "Inspection / quantity / quality certificate", titleVi: "Chứng nhận giám định / số lượng / chất lượng", what: "Do người bán/nhà sản xuất hoặc tổ chức giám định độc lập cấp, theo yêu cầu của hợp đồng/người mua.", why: "Xác nhận hàng đúng số lượng, chất lượng, quy cách theo hợp đồng.", topic: "quantity-quality-cert" },
  { id: "bl", label: "Bill of lading (B/L)", issuer: "i-carrier", users: ["u-buyer", "u-bank"], title: "Bill of lading", titleVi: "Vận đơn đường biển (B/L)", what: "Chứng từ vận tải do người chuyên chở cấp cho người gửi hàng, xác nhận đã nhận hàng và điều kiện chuyên chở.", why: "3 chức năng: biên lai nhận hàng; bằng chứng hợp đồng vận chuyển; chứng từ sở hữu hàng hóa.", topic: "bl-functions", details: [{ title: "Checklist B/L", items: BL_CHECKLIST, checklist: true }] },
  { id: "insurance", label: "Insurance cert. /\npolicy", issuer: "i-insurer", users: ["u-bank"], title: "Insurance certificate / policy", titleVi: "Chứng nhận / đơn bảo hiểm", what: "Chứng nhận bảo hiểm do công ty bảo hiểm hoặc đại lý được ủy quyền cấp; đơn bảo hiểm nêu điều khoản hợp đồng bảo hiểm.", why: "Theo L/C, chứng từ bảo hiểm phải đúng người phát hành, đúng ngày.", topic: "insurance-docs", details: [{ title: "Checklist chứng từ bảo hiểm", items: INSURANCE_CHECKLIST, checklist: true }] },
  { id: "co", label: "Certificate of\norigin (C/O)", issuer: "i-chamber", users: ["u-customs"], title: "Certificate of origin", titleVi: "Giấy chứng nhận xuất xứ (C/O)", what: "Chứng nhận nước xuất xứ của hàng xuất khẩu (ví dụ hợp đồng C6: C/O do VCCI cấp).", why: "Tùy hiệp định thương mại, dùng để xác định hàng có được hưởng ưu đãi thuế quan hay không.", topic: "certificate-of-origin" },
  { id: "phyto", label: "Phytosanitary\ncertificate", issuer: "i-gov", users: ["u-customs"], title: "Phytosanitary inspection certificate", titleVi: "Giấy chứng nhận kiểm dịch thực vật", what: "Do cơ quan nhà nước cấp, xác nhận lô hàng đã được kiểm tra và không có sâu bệnh hại.", why: "Đáp ứng quy định của nước nhập khẩu.", topic: "phyto-inspection" },
];

const docNodes: DiagramNode[] = DOCS.map((d, i) => ({ id: d.id, label: d.label, role: "other", x: 500, y: 45 + i * 72, w: 250, h: 58, shape: "rect" }));

const edges: DiagramEdge[] = DOCS.flatMap((d) => [
  { id: `${d.issuer}>${d.id}`, from: d.issuer, to: d.id, kind: "document", badgeAt: 0.84 },
  ...d.users.map((u): DiagramEdge => ({ id: `${d.id}>${u}`, from: d.id, to: u, kind: "document" })),
]);

const steps: DiagramStep[] = DOCS.map((d, i) => ({
  id: d.id,
  order: i + 1,
  title: d.title,
  titleVi: d.titleVi,
  edgeIds: [`${d.issuer}>${d.id}`, ...d.users.map((u) => `${d.id}>${u}`)],
  actors: [d.issuer, d.id, ...d.users],
  what: d.what,
  why: d.why,
  details: d.details,
  source: SRC,
  practiceTopic: d.topic,
}));

const spec: DiagramSpec = {
  id: "c7-document-lifecycle",
  chapter: "C7",
  title: "Document lifecycle: who issues, who uses",
  titleVi: "Vòng đời chứng từ: ai phát hành – ai sử dụng",
  provenance: "derived",
  note: "Bấm một chứng từ (hoặc ▶) để thấy bên phát hành bên trái và các bên sử dụng bên phải.",
  nodeFont: 15,
  zones: [
    { label: "Phát hành (issues)", x: 10, y: 0, w: 210, h: 600 },
    { label: "Sử dụng (uses)", x: 780, y: 0, w: 210, h: 600 },
  ],
  nodes: [...ISSUERS, ...docNodes, ...USERS],
  edges,
  steps,
  keyTakeaways: [
    "Người bán lập: hóa đơn thương mại, phiếu đóng gói, hóa đơn chiếu lệ; người chuyên chở cấp B/L/AWB; công ty bảo hiểm cấp chứng từ bảo hiểm.",
    "Hải quan dùng hóa đơn thương mại để xác định trị giá hải quan; C/O để xét ưu đãi thuế quan.",
    "Ngân hàng (L/C) kiểm tra hóa đơn (7 điểm), B/L (19 điểm), chứng từ bảo hiểm (4 điểm).",
  ],
  quiz: { order: false, gap: false, actor: false },
};

export default spec;
