import type { DiagramNode, DiagramSpec } from "../engine/types";

/**
 * D2.1 — the 9 components of an export plan (KB §2.1–2.10) around the plan itself. Derived (no slide diagram).
 * A map diagram: each component is explored by clicking it; the 11 preparation questions (KB §2.11) are
 * mapped to components in the custom view.
 */
const COMPONENTS: { id: string; label: string; descVi: string; anchor: string; aka?: string[] }[] = [
  { id: "objectives", label: "1. Export\nobjectives", anchor: "objectives-kpi", descVi: "Mục tiêu: vào thị trường mới, tăng doanh số XK, phát triển khách hàng quốc tế mới. KPI: doanh thu XK, tăng trưởng (%), biên lợi nhuận gộp (%), lợi nhuận kỳ vọng (%), điểm hòa vốn, mức lỗ tối đa (%)." },
  { id: "market", label: "2. Target market\n& customer", anchor: "target-market", descVi: "Cơ hội thị trường (quy mô, tăng trưởng, xu hướng, nhu cầu); mức hấp dẫn & khả năng tiếp cận (cạnh tranh, quy định, rào cản thuế quan & phi thuế quan, TBT, kết nối logistics); khách hàng mục tiêu (B2B/B2C, phân khúc, Target Customer Profile)." },
  { id: "entry", label: "3. Market entry /\nDistribution", anchor: "market-entry", descVi: "Xuất khẩu trực tiếp; xuất khẩu gián tiếp (nhà nhập khẩu / nhà phân phối / đại lý / bán lẻ); thương mại điện tử xuyên biên giới. Kênh phân phối ảnh hưởng thiết kế sản phẩm, bao bì, logistics." },
  { id: "product", label: "4. Product for\nforeign market", anchor: "product", descVi: "Chọn/điều chỉnh/phát triển sản phẩm; phù hợp sản phẩm–thị trường–khách hàng; chất lượng, tiêu chuẩn; bao bì, nhãn, ký mã hiệu, ngôn ngữ; bảo hộ sở hữu trí tuệ ở nước ngoài." },
  { id: "pricing", label: "5. Pricing &\nPayment", anchor: "pricing-payment", descVi: "Giá xuất khẩu (chi phí & biên lợi nhuận, chiến lược giá); Incoterms (11 điều kiện) phân bổ chi phí và rủi ro; đồng tiền báo giá; điều kiện thanh toán: phương thức, thời điểm (trả trước, trả ngay, trả sau), đồng tiền, rủi ro thanh toán." },
  { id: "logistics", label: "6. Logistics &\nDelivery", anchor: "logistics", descVi: "Giao hàng & vận chuyển (thời gian, lịch giao, chọn phương thức vận tải); kho bãi & tồn kho; bảo hiểm hàng hóa; trung gian logistics (giao nhận, đại lý hải quan, hãng tàu); chứng từ." },
  { id: "resources", label: "7. Resources &\nResponsibilities", anchor: "resources", descVi: "Ai thực hiện kế hoạch: phòng XNK, bán hàng/marketing, sản xuất, tài chính/kế toán, logistics, chứng từ, QC, đối tác bên ngoài → quản trị xuất khẩu là quản trị liên chức năng." },
  { id: "finance", label: "8. Financial\nanalysis", anchor: "financial-analysis", descVi: "Doanh thu XK = số lượng × giá; chi phí sản phẩm, logistics, thuế & phí; lợi nhuận gộp và biên lợi nhuận gộp; ảnh hưởng tỷ giá khi thanh toán trả sau." },
  { id: "risk", label: "9. Risk\nmanagement", anchor: "risk-management", descVi: "6 nhóm rủi ro: vận tải; tín dụng/thanh toán; tỷ giá; thị trường; quy định & tuân thủ; chính trị/quốc gia." },
];

const nodes: DiagramNode[] = [
  { id: "plan", label: "EXPORT PLAN", labelVi: "Kế hoạch xuất khẩu", role: "seller", x: 500, y: 300, w: 230, h: 90, shape: "ellipse", descVi: "Kế hoạch xuất khẩu là đề xuất có cấu trúc để xuất khẩu một sản phẩm cụ thể sang một thị trường mục tiêu cụ thể, gồm 9 thành phần.", links: [{ label: "C2 · Kế hoạch xuất khẩu", to: "/learn/c2#export-plan" }] },
  ...COMPONENTS.map((c, i): DiagramNode => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / COMPONENTS.length;
    return {
      id: c.id,
      label: c.label,
      role: "other",
      x: Math.round(500 + 370 * Math.cos(a)),
      y: Math.round(300 + 235 * Math.sin(a)),
      w: 210,
      h: 70,
      shape: "rect",
      descVi: c.descVi,
      links: [{ label: "Lý thuyết C2", to: `/learn/c2#${c.anchor}` }],
    };
  }),
];

const spec: DiagramSpec = {
  id: "c2-export-plan",
  chapter: "C2",
  title: "Export plan – 9 components",
  titleVi: "Kế hoạch xuất khẩu – 9 thành phần",
  provenance: "derived",
  nodeFont: 16,
  legendRoles: false,
  nodes,
  edges: COMPONENTS.map((c) => ({ id: `e-${c.id}`, from: "plan", to: c.id, kind: "sequence", plain: true })),
  steps: [],
  keyTakeaways: [
    "Kế hoạch xuất khẩu: một sản phẩm cụ thể – một thị trường mục tiêu cụ thể – 9 thành phần.",
    "11 câu hỏi chuẩn bị xuất khẩu giúp kiểm tra từng thành phần của kế hoạch.",
  ],
};

export default spec;

/** KB §2.11 — the 11 preparation questions, mapped to the component(s) they check (suggested mapping). */
export const ELEVEN_QUESTIONS: { q: string; components: string[] }[] = [
  { q: "Sản phẩm nào được chọn để phát triển xuất khẩu, cần điều chỉnh gì cho thị trường nước ngoài?", components: ["product"] },
  { q: "Có cần giấy phép xuất khẩu không?", components: ["risk"] },
  { q: "Nhắm đến những quốc gia nào?", components: ["market"] },
  { q: "Ở mỗi nước, khách hàng cơ bản là ai, dùng kênh marketing và phân phối nào?", components: ["market", "entry"] },
  { q: "Mỗi thị trường có thách thức đặc biệt nào (cạnh tranh, văn hóa, kiểm soát XNK) và chiến lược đối phó?", components: ["market", "risk"] },
  { q: "Giá bán xuất khẩu được xác định thế nào?", components: ["pricing"] },
  { q: "Cần thực hiện những bước tác nghiệp cụ thể nào và khi nào?", components: ["logistics"] },
  { q: "Khung thời gian thực hiện từng phần của kế hoạch?", components: ["resources"] },
  { q: "Dành nhân sự và nguồn lực nào cho xuất khẩu?", components: ["resources"] },
  { q: "Chi phí về thời gian và tiền cho từng phần?", components: ["finance"] },
  { q: "Đánh giá kết quả và dùng để điều chỉnh kế hoạch thế nào?", components: ["objectives"] },
];
