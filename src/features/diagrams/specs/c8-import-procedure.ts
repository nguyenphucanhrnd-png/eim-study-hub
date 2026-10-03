import type { DiagramSpec } from "../engine/types";
import { procedureLayout, type ProcStep } from "./c8-shared";

const SRC = "KB §8.3 · Slide C8 p.5–6";

/** D8.2 — Import procedures, 9 steps exactly as on the slide (KB §8.3). */
const STEPS: ProcStep[] = [
  {
    id: "i1",
    label: "Negotiate &\nsign the sale\ncontract",
    title: "Negotiate & sign the sale contract",
    titleVi: "Đàm phán & ký hợp đồng mua bán với nhà cung cấp",
    what: "Người mua đàm phán và ký hợp đồng mua bán với nhà cung cấp.",
    why: "Điều kiện Incoterms và phương thức thanh toán trong hợp đồng quyết định các bước người mua phải làm.",
    practiceTopic: "implementation-considerations",
    links: [{ label: "C6 · Cấu trúc hợp đồng", to: "/learn/c6#contract-structure" }],
  },
  {
    id: "i2",
    label: "Consider\npayment terms\n(open L/C)",
    title: "Consider payment terms – open the L/C if payment is by L/C",
    titleVi: "Xem xét điều kiện thanh toán – mở L/C nếu thanh toán bằng L/C",
    what: "Người mua thực hiện điều kiện thanh toán đã thỏa thuận; nếu thanh toán bằng L/C, người mua mở L/C tại ngân hàng phát hành.",
    why: "L/C phải được mở trước khi người bán giao hàng – người bán dựa vào cam kết của ngân hàng để giao hàng.",
    trap: "Nhà NK MỞ L/C (bước 2 NK); nhà XK KIỂM TRA L/C (bước 2 XK).",
    practiceTopic: "lc-procedure",
    links: [{ label: "Sơ đồ L/C 9 bước", to: "/diagrams/c5-lc-basic" }],
  },
  {
    id: "i3",
    label: "Arrange\ntransportation",
    title: "Arrange transportation",
    titleVi: "Thuê phương tiện vận tải",
    what: "Người mua thuê vận tải chính theo các điều kiện nhóm E & F.",
    why: "Theo C & D, người bán đã thuê vận tải chính.",
    trap: "Ở nhóm F người MUA thuê vận tải chính.",
    practiceTopic: "incoterms-procedure-link",
  },
  {
    id: "i4",
    label: "Arrange cargo\ninsurance",
    title: "Arrange cargo insurance (if any)",
    titleVi: "Mua bảo hiểm hàng hóa (nếu có)",
    what: "Nếu có: theo E, F, CPT, CFR – các điều kiện người bán không có nghĩa vụ mua bảo hiểm trong khi người mua chịu rủi ro chặng vận tải chính.",
    why: "Người chịu rủi ro chặng chính tự quyết định có mua bảo hiểm hay không; theo CIF/CIP người bán đã có nghĩa vụ mua.",
    documents: ["Insurance certificate", "Insurance policy"],
    practiceTopic: "incoterms-insurance",
  },
  {
    id: "i5",
    label: "Import customs\nclearance",
    title: "Complete import customs clearance",
    titleVi: "Làm thủ tục hải quan nhập khẩu",
    what: "Nộp tờ khai, cung cấp chứng từ, nộp thuế và phí nhập khẩu.",
    why: "Hàng chỉ được nhận khi đã thông quan nhập khẩu. Theo DDP, người bán làm cả thủ tục nhập khẩu.",
    trap: "DDP: người BÁN làm thủ tục nhập khẩu.",
    practiceTopic: "rule-ddp",
  },
  {
    id: "i6",
    label: "Take delivery\nof goods",
    title: "Take delivery of goods",
    titleVi: "Nhận hàng",
    what: "Nhận hàng từ người chuyên chở/terminal và thu xếp vận chuyển nội địa.",
    why: "Người mua cần chứng từ vận tải (vd. B/L) để nhận hàng từ người chuyên chở.",
    documents: ["Bill of lading (B/L)"],
    practiceTopic: "import-procedure",
    links: [{ label: "C7 · Chức năng của B/L", to: "/learn/c7#bl-functions" }],
  },
  {
    id: "i7",
    label: "Inspect\ngoods",
    title: "Inspect goods",
    titleVi: "Kiểm tra hàng",
    what: "Kiểm tra số lượng, chất lượng, tình trạng và sự phù hợp với hợp đồng.",
    why: "Phát hiện tổn thất/sai lệch là cơ sở để khiếu nại ở bước 8.",
    practiceTopic: "import-procedure",
  },
  {
    id: "i8",
    label: "Claim & settle\nclaims",
    title: "Claim & settle claims",
    titleVi: "Khiếu nại & giải quyết khiếu nại",
    what: "Khiếu nại người bán, người chuyên chở hoặc công ty bảo hiểm khi có tổn thất hoặc sai lệch.",
    why: "Khiếu nại đúng đối tượng giúp người mua được bồi thường.",
    practiceTopic: "art-claim",
  },
  {
    id: "i9",
    label: "Make\npayment",
    title: "Make payment",
    titleVi: "Thanh toán",
    what: "Người mua thanh toán theo điều kiện thanh toán đã thỏa thuận.",
    why: "Thời điểm thực tế của việc trả tiền phụ thuộc phương thức: trả trước, trả sau, D/P, D/A hay L/C.",
    trap: "Quy trình nhập khẩu kết thúc bằng THANH TOÁN (bước 9).",
    practiceTopic: "import-procedure",
    links: [{ label: "So sánh các phương thức thanh toán", to: "/diagrams/c5-method-compare" }],
  },
];

const layout = procedureLayout(STEPS, "buyer", SRC);

const spec: DiagramSpec = {
  id: "c8-import-procedure",
  chapter: "C8",
  title: "Import procedures",
  titleVi: "Quy trình nhập khẩu – 9 bước",
  provenance: "slide",
  slideRef: "C8 p.5",
  note: "Chọn điều kiện Incoterms và phương thức thanh toán để xem bước nào do ai thực hiện.",
  viewBox: { w: 1000, h: 560 },
  ...layout,
  keyTakeaways: [
    "Người mua mở L/C (bước 2) khi thanh toán bằng L/C.",
    "Người mua thuê vận tải chính theo E & F; có thể mua bảo hiểm theo E, F, CPT, CFR.",
    "DDP: người bán làm cả thủ tục nhập khẩu.",
    "Quy trình nhập khẩu kết thúc bằng thanh toán.",
  ],
  quiz: { order: true, gap: true },
};

export default spec;
