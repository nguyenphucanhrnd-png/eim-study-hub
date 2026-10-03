import type { DiagramSpec } from "../engine/types";
import { procedureLayout, type ProcStep } from "./c8-shared";

const SRC = "KB §8.2 · Slide C8 p.3–4";

/** D8.1 — Export procedures, 10 steps exactly as on the slide (KB §8.2). */
const STEPS: ProcStep[] = [
  {
    id: "e1",
    label: "Negotiate &\nsign the sales\ncontract",
    title: "Negotiate and sign the sales contract",
    titleVi: "Đàm phán và ký hợp đồng mua bán",
    what: "Hai bên thỏa thuận giá, số lượng, chất lượng, điều kiện giao hàng, điều kiện thanh toán… và ký hợp đồng.",
    why: "Điều kiện Incoterms và phương thức thanh toán trong hợp đồng quyết định bước nào do bên nào thực hiện (C8 §8.1).",
    practiceTopic: "implementation-considerations",
    links: [{ label: "C6 · Cấu trúc hợp đồng", to: "/learn/c6#contract-structure" }],
  },
  {
    id: "e2",
    label: "Consider\npayment terms\n(check L/C)",
    title: "Consider payment terms – check the L/C if payment is by L/C",
    titleVi: "Xem xét điều kiện thanh toán – kiểm tra L/C nếu thanh toán bằng L/C",
    what: "Người bán thực hiện theo điều kiện thanh toán đã thỏa thuận (T/T, L/C, D/P…). Nếu thanh toán bằng L/C, người bán kiểm tra L/C.",
    why: "Sai sót trong L/C phải được phát hiện trước khi giao hàng, nếu không bộ chứng từ sẽ không phù hợp.",
    trap: "Nhà XK KIỂM TRA L/C; nhà NK MỞ L/C.",
    practiceTopic: "lc-checklist",
    links: [{ label: "C5 · Checklist L/C 14 điểm", to: "/learn/c5#lc-checklist" }],
  },
  {
    id: "e3",
    label: "Prepare goods\nfor export",
    title: "Prepare goods for export",
    titleVi: "Chuẩn bị hàng xuất khẩu",
    what: "Đóng gói, dán nhãn, ghi ký mã hiệu và chuẩn bị chứng từ xuất khẩu.",
    why: "Hàng và chứng từ phải đúng hợp đồng (và L/C nếu có). Giấy phép xuất khẩu không phải lúc nào cũng cần – chỉ khi hàng thuộc diện quản lý.",
    trap: "Giấy phép xuất khẩu KHÔNG bắt buộc với mọi lô hàng.",
    practiceTopic: "export-procedure",
    links: [{ label: "C6 · Đóng gói & ký mã hiệu", to: "/learn/c6#art-packing" }],
  },
  {
    id: "e4",
    label: "Inspect\ngoods",
    title: "Inspect goods",
    titleVi: "Kiểm tra hàng",
    what: "Kiểm tra hàng nếu hợp đồng, L/C hoặc quy định yêu cầu.",
    why: "Giấy chứng nhận kiểm tra/chất lượng/số lượng có thể là chứng từ bắt buộc trong bộ chứng từ thanh toán.",
    documents: ["Inspection certificate", "Certificate of quality"],
    practiceTopic: "export-procedure",
  },
  {
    id: "e5",
    label: "Arrange\ntransportation",
    title: "Arrange transportation",
    titleVi: "Thuê phương tiện vận tải",
    what: "Thuê vận tải theo điều kiện Incoterms: người bán thuê vận tải chính theo các điều kiện nhóm C & D.",
    why: "Vận tải phụ thuộc điều kiện Incoterms đã thỏa thuận; theo E & F, người mua thuê vận tải chính.",
    trap: "Người bán thuê vận tải chính ở nhóm C & D, không phải nhóm F.",
    practiceTopic: "incoterms-procedure-link",
  },
  {
    id: "e6",
    label: "Arrange cargo\ninsurance",
    title: "Arrange cargo insurance",
    titleVi: "Mua bảo hiểm hàng hóa",
    what: "Mua bảo hiểm nếu hợp đồng hoặc điều kiện Incoterms yêu cầu (CIF & CIP).",
    why: "Chỉ CIF và CIP buộc người bán mua bảo hiểm: CIF tối thiểu ICC (C), CIP ICC (A).",
    documents: ["Insurance certificate", "Insurance policy"],
    practiceTopic: "incoterms-insurance",
  },
  {
    id: "e7",
    label: "Export customs\nclearance",
    title: "Complete export customs clearance",
    titleVi: "Làm thủ tục hải quan xuất khẩu",
    what: "Chuẩn bị và nộp chứng từ, nộp thuế/phí (nếu có).",
    why: "Hàng chỉ được xuất khi đã thông quan. Theo EXW, người mua làm cả thủ tục xuất khẩu.",
    trap: "EXW: người MUA làm thủ tục xuất khẩu.",
    practiceTopic: "rule-exw",
  },
  {
    id: "e8",
    label: "Deliver\nthe goods",
    title: "Deliver the goods",
    titleVi: "Giao hàng",
    what: "Giao hàng theo điều kiện Incoterms (tại cảng, tại nơi đến…).",
    why: "“Giao hàng” là thời điểm và địa điểm do điều kiện Incoterms xác định – cũng là lúc rủi ro chuyển sang người mua.",
    documents: ["Bill of lading (B/L)"],
    practiceTopic: "incoterms-procedure-link",
    links: [{ label: "C3 · Bảng nghĩa vụ 11 điều kiện", to: "/learn/c3#obligation-matrix" }],
  },
  {
    id: "e9",
    label: "Present\nshipping docs\nfor payment",
    title: "Prepare and present shipping documents for payment",
    titleVi: "Lập và xuất trình chứng từ để thanh toán",
    what: "Lập bộ chứng từ và xuất trình theo yêu cầu của phương thức thanh toán (L/C, D/P, T/T…).",
    why: "Việc xuất trình chứng từ phụ thuộc phương thức thanh toán; với L/C, chứng từ phải phù hợp và xuất trình đúng hạn.",
    documents: ["Commercial invoice", "Packing list", "Bill of lading (B/L)", "Certificate of origin (C/O)"],
    practiceTopic: "document-lists",
    links: [{ label: "C7 · Bộ chứng từ", to: "/learn/c7#document-lists" }],
  },
  {
    id: "e10",
    label: "Handle claims\n& disputes",
    title: "Handle claims and resolve disputes",
    titleVi: "Giải quyết khiếu nại và tranh chấp",
    what: "Giải quyết khiếu nại nếu có (hàng hư hỏng, thiếu hụt, giao chậm…).",
    why: "Quy trình xuất khẩu kết thúc bằng khiếu nại/tranh chấp; quy trình nhập khẩu kết thúc bằng thanh toán.",
    practiceTopic: "art-claim",
  },
];

const layout = procedureLayout(STEPS, "seller", SRC);

const spec: DiagramSpec = {
  id: "c8-export-procedure",
  chapter: "C8",
  title: "Export procedures",
  titleVi: "Quy trình xuất khẩu – 10 bước",
  provenance: "slide",
  slideRef: "C8 p.3",
  note: "Chọn điều kiện Incoterms và phương thức thanh toán để xem bước nào do ai thực hiện.",
  viewBox: { w: 1000, h: 560 },
  ...layout,
  keyTakeaways: [
    "Incoterms + phương thức thanh toán quyết định bước nào do bên nào làm.",
    "Người bán thuê vận tải chính theo C & D; mua bảo hiểm bắt buộc theo CIF & CIP.",
    "Kiểm tra L/C chỉ khi thanh toán bằng L/C; giấy phép xuất khẩu không phải lúc nào cũng cần.",
    "EXW: người mua làm cả thủ tục xuất khẩu.",
  ],
  quiz: { order: true, gap: true },
};

export default spec;
