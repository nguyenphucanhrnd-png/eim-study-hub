import type { ActorRole, DiagramEdge, DiagramNode, DiagramSpec, DiagramStep } from "../engine/types";

const SRC = "KB §1.2 · Slide C1 p.4";

interface Station {
  id: string;
  label: string;
  role: ActorRole;
  x: number;
  y: number;
  title: string;
  titleVi: string;
  what: string;
  why: string;
  trap?: string;
  documents?: string[];
  practiceTopic?: string;
  links?: { label: string; to: string }[];
}

/**
 * D1.1 — "Export process: from seller's factory to buyer in foreign country" (slide C1 p.4), 9 stations.
 * Laid out as a U: seller's country left → right on top, international transport on the right,
 * buyer's country right → left at the bottom, so every label stays readable.
 */
const STATIONS: Station[] = [
  {
    id: "factory",
    label: "Seller's\nfactory",
    role: "seller",
    x: 105,
    y: 150,
    title: "Seller's factory",
    titleVi: "Nhà máy người bán",
    what: "Hàng được sản xuất và chuẩn bị để xuất khẩu tại nhà máy của người bán.",
    why: "Điểm khởi đầu của dòng hàng (outflow of goods) – dòng thứ nhất mà quản trị xuất khẩu phải quản lý.",
    practiceTopic: "export-process-steps",
  },
  {
    id: "packing",
    label: "Packing &\nloading",
    role: "seller",
    x: 290,
    y: 150,
    title: "Packing & loading at origin",
    titleVi: "Đóng gói & bốc hàng tại nơi đi",
    what: "Hàng được đóng gói và bốc lên phương tiện để chở đến cảng/sân bay.",
    why: "Đóng gói, ghi ký mã hiệu đúng giúp hàng an toàn và khớp với chứng từ (Packing List).",
    documents: ["Packing list"],
    practiceTopic: "export-process-steps",
  },
  {
    id: "export-customs",
    label: "Export customs\nclearance",
    role: "customsExport",
    x: 475,
    y: 150,
    title: "Export customs clearance",
    titleVi: "Thông quan xuất khẩu (nước người bán)",
    what: "Khai báo xuất khẩu, kiểm tra chứng từ, kiểm hóa và thông quan (export release) tại nước người bán.",
    why: "Hàng chỉ được rời nước người bán khi đã thông quan xuất khẩu.",
    trap: "Thông quan XUẤT khẩu diễn ra ở nước NGƯỜI BÁN; thuế nhập khẩu nộp ở bước 7 (nước người mua).",
    documents: ["Export declaration", "Commercial invoice", "Packing list"],
    practiceTopic: "export-process-steps",
    links: [{ label: "C8 · Thông quan xuất khẩu", to: "/learn/c8#export-procedure" }],
  },
  {
    id: "port-loading",
    label: "Port/airport\nof loading",
    role: "carrier",
    x: 660,
    y: 150,
    title: "Port/airport of loading",
    titleVi: "Cảng/sân bay xếp hàng",
    what: "Hàng được đưa đến cảng/sân bay và xếp lên tàu/máy bay.",
    why: "Người chuyên chở nhận hàng và cấp chứng từ vận tải (B/L hoặc AWB).",
    documents: ["Bill of lading (B/L)", "Air waybill (AWB)"],
    practiceTopic: "export-process-steps",
  },
  {
    id: "intl-transport",
    label: "International\ntransport",
    role: "carrier",
    x: 880,
    y: 330,
    title: "International transport",
    titleVi: "Vận tải quốc tế",
    what: "Hàng được chở bằng đường biển, đường hàng không hoặc phương thức khác sang nước người mua.",
    why: "Chặng vận tải chính (main carriage) – ai thuê và ai chịu rủi ro chặng này do điều kiện Incoterms quyết định.",
    practiceTopic: "carriage-stages",
    links: [{ label: "C3 · Pre/main/on-carriage", to: "/learn/c3#carriage-stages" }],
  },
  {
    id: "port-discharge",
    label: "Port/airport\nof discharge",
    role: "carrier",
    x: 660,
    y: 510,
    title: "Port/airport of discharge",
    titleVi: "Cảng/sân bay dỡ hàng",
    what: "Hàng đến cảng/sân bay ở nước người mua.",
    why: "Người mua cần chứng từ vận tải để nhận hàng từ người chuyên chở.",
    practiceTopic: "export-process-steps",
  },
  {
    id: "import-customs",
    label: "Import customs\nclearance",
    role: "customsImport",
    x: 475,
    y: 510,
    title: "Import customs clearance",
    titleVi: "Thông quan nhập khẩu (nước người mua)",
    what: "Khai báo nhập khẩu, kiểm tra chứng từ, kiểm hóa, nộp thuế và các khoản thuế nhập khẩu, rồi thông quan.",
    why: "Thuế nhập khẩu được nộp ở bước này, tại nước người mua.",
    trap: "Nộp thuế NHẬP khẩu (import duties & taxes) thuộc bước thông quan nhập khẩu, không phải thông quan xuất khẩu.",
    documents: ["Import declaration", "Commercial invoice", "Bill of lading (B/L)"],
    practiceTopic: "export-process-steps",
    links: [{ label: "C8 · Thông quan nhập khẩu", to: "/learn/c8#import-procedure" }],
  },
  {
    id: "inland",
    label: "Inland transport\nto buyer",
    role: "buyer",
    x: 290,
    y: 510,
    title: "Inland transport to buyer",
    titleVi: "Vận chuyển nội địa đến người mua",
    what: "Hàng được chở đến kho hoặc địa điểm cuối cùng của người mua.",
    why: "Chặng cuối (on-carriage) ở nước người mua.",
    practiceTopic: "export-process-steps",
  },
  {
    id: "buyer-premises",
    label: "Buyer's\npremises",
    role: "buyer",
    x: 105,
    y: 510,
    title: "Buyer's premises",
    titleVi: "Cơ sở người mua",
    what: "Người mua nhận hàng tại cơ sở của mình.",
    why: "Hàng đến tay người mua thành công – một nửa mục tiêu của quản trị xuất khẩu (nửa còn lại: nhận đủ tiền, đúng hạn).",
    practiceTopic: "export-process-steps",
  },
];

const nodes: DiagramNode[] = STATIONS.map((s) => ({
  id: s.id,
  label: s.label,
  role: s.role,
  x: s.x,
  y: s.y,
  w: s.id === "intl-transport" ? 170 : 172,
  h: 104,
  shape: "rect",
}));

const edges: DiagramEdge[] = STATIONS.slice(1).map((s, i) => ({ id: `g${i + 1}`, from: STATIONS[i]!.id, to: s.id, kind: "goods" }));

const steps: DiagramStep[] = STATIONS.map((s, i) => ({
  id: s.id,
  order: i + 1,
  title: s.title,
  titleVi: s.titleVi,
  edgeIds: [],
  actors: [s.id],
  what: s.what,
  why: s.why,
  trap: s.trap,
  documents: s.documents,
  source: SRC,
  practiceTopic: s.practiceTopic,
  links: s.links,
}));

const spec: DiagramSpec = {
  id: "c1-export-process",
  chapter: "C1",
  title: "Export process: from seller's factory to buyer in foreign country",
  titleVi: "Quy trình xuất khẩu – dòng hàng 9 bước",
  provenance: "slide",
  slideRef: "C1 p.4",
  note: "Bố cục hình chữ U để dễ đọc: nước người bán ở trên, vận tải quốc tế bên phải, nước người mua ở dưới.",
  nodeFont: 18,
  zones: [
    { label: "Seller's country", x: 10, y: 60, w: 755, h: 190 },
    { label: "Int’l transport", x: 785, y: 60, w: 205, h: 540 },
    { label: "Buyer's country", x: 10, y: 410, w: 755, h: 190 },
  ],
  nodes,
  edges,
  steps,
  keyTakeaways: [
    "Dòng hàng đi qua 9 bước: 4 bước ở nước người bán, vận tải quốc tế, 4 bước ở nước người mua.",
    "Thông quan xuất khẩu (bước 3) ở nước người bán; thông quan nhập khẩu kèm nộp thuế nhập khẩu (bước 7) ở nước người mua.",
    "Mỗi bước cần chứng từ: hóa đơn, phiếu đóng gói, tờ khai, B/L/AWB, C/O (nếu cần)…",
  ],
  quiz: { order: true, gap: true },
};

export default spec;

/** "Hiện chứng từ" tray (KB §1.4). */
export const EXPORT_DOCS = ["Commercial invoice", "Packing list", "Export declaration", "Bill of lading (B/L) / Air waybill (AWB)", "Certificate of origin (C/O) – nếu cần", "Other certificates – nếu cần"];
export const IMPORT_DOCS = ["Import declaration", "Bill of lading (B/L) / Air waybill (AWB)", "Commercial invoice", "Packing list", "Certificate of origin (C/O) – nếu cần", "Other certificates – nếu cần"];

/** "Nước người bán hay nước người mua?" sorting quiz. */
export const COUNTRY_ITEMS = STATIONS.map((s, i) => ({
  id: s.id,
  textVi: `${i + 1}. ${s.titleVi}`,
  bucket: i < 4 ? "seller" : i === 4 ? "intl" : "buyer",
}));
