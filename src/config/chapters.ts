export const CHAPTER_IDS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

export interface TopicDef {
  id: string;
  label: string; // VI label shown in UI
}

export interface ChapterDef {
  id: ChapterId;
  slug: string; // used in URLs: /learn/c3
  order: number;
  titleEn: string;
  titleVi: string;
  shortVi: string;
  /** Accent color (hex) used for chapter badges and charts. */
  color: string;
  topics: TopicDef[];
}

const t = (id: string, label: string): TopicDef => ({ id, label });

/**
 * Chapter order C5–C7 is an assumption from the slides (KB §0) — keep it editable here.
 */
export const CHAPTERS: ChapterDef[] = [
  {
    id: "C1",
    slug: "c1",
    order: 1,
    titleEn: "Overview of Export & Import Management",
    titleVi: "Tổng quan Quản trị Xuất Nhập khẩu",
    shortVi: "Tổng quan",
    color: "#0F766E",
    topics: [
      t("export-definition", "Định nghĩa xuất khẩu & quản trị XK"),
      t("two-flows", "Hai dòng chảy: hàng hóa & ngoại tệ"),
      t("export-process-steps", "9 bước dòng hàng xuất khẩu"),
      t("export-elements", "6 yếu tố của quy trình XK"),
      t("order-process", "Quy trình đơn hàng XK"),
      t("players", "Các bên tham gia giao dịch"),
      t("service-providers", "Quan hệ với nhà cung cấp dịch vụ"),
      t("roles", "Vai trò của quản trị XNK"),
    ],
  },
  {
    id: "C2",
    slug: "c2",
    order: 2,
    titleEn: "Planning and Preparations for Export",
    titleVi: "Lập kế hoạch & Chuẩn bị xuất khẩu",
    shortVi: "Kế hoạch XK",
    color: "#7C3AED",
    topics: [
      t("export-plan-components", "9 thành phần kế hoạch XK"),
      t("objectives-kpi", "Mục tiêu & KPI"),
      t("target-market", "Thị trường & khách hàng mục tiêu"),
      t("market-entry", "Thâm nhập thị trường / phân phối"),
      t("product-adaptation", "Sản phẩm cho thị trường nước ngoài"),
      t("pricing-payment-plan", "Giá & thanh toán"),
      t("logistics-plan", "Logistics & giao hàng"),
      t("financial-analysis", "Phân tích tài chính"),
      t("fx-risk", "Rủi ro tỷ giá"),
      t("risk-types", "6 nhóm rủi ro"),
      t("eleven-questions", "11 câu hỏi chuẩn bị XK"),
    ],
  },
  {
    id: "C3",
    slug: "c3",
    order: 3,
    titleEn: "Pricing in International Trade & Incoterms",
    titleVi: "Định giá trong TMQT & Incoterms",
    shortVi: "Giá & Incoterms",
    color: "#1D4ED8",
    topics: [
      t("pricing-approaches", "6 phương pháp định giá XK"),
      t("pricing-objectives", "Mục tiêu → chiến lược giá"),
      t("incoterms-basics", "Incoterms là gì"),
      t("incoterms-scope", "Phạm vi điều chỉnh của Incoterms"),
      t("incoterms-2010-vs-2020", "Khác biệt 2010 vs 2020"),
      t("carriage-stages", "Chặng vận tải đầu/chính/cuối"),
      t("rule-exw", "EXW"),
      t("rule-fca", "FCA"),
      t("rule-fas", "FAS"),
      t("rule-fob", "FOB"),
      t("rule-cfr", "CFR"),
      t("rule-cif", "CIF"),
      t("rule-cpt", "CPT"),
      t("rule-cip", "CIP"),
      t("rule-dap", "DAP"),
      t("rule-dpu", "DPU"),
      t("rule-ddp", "DDP"),
      t("rule-comparison", "So sánh các điều kiện"),
    ],
  },
  {
    id: "C4",
    slug: "c4",
    order: 4,
    titleEn: "Export and Import Cargo Insurance",
    titleVi: "Bảo hiểm hàng hóa XNK",
    shortVi: "Bảo hiểm",
    color: "#B45309",
    topics: [
      t("trade-risks", "4 loại rủi ro trong TMQT"),
      t("cargo-insurance-concept", "Khái niệm bảo hiểm hàng hóa"),
      t("insurance-principles", "Nguyên tắc bảo hiểm"),
      t("icc-abc", "ICC (A), (B), (C)"),
      t("peril-coverage", "Bảng rủi ro được bảo hiểm"),
      t("traditional-vs-icc", "Điều kiện truyền thống vs ICC"),
      t("incoterms-insurance", "Incoterms & bảo hiểm"),
    ],
  },
  {
    id: "C5",
    slug: "c5",
    order: 5,
    titleEn: "International Payment",
    titleVi: "Thanh toán quốc tế",
    shortVi: "Thanh toán",
    color: "#BE123C",
    topics: [
      t("consignment", "Bán hàng ký gửi"),
      t("open-account", "Ghi sổ (Open account)"),
      t("tt-advance", "T/T trả trước"),
      t("tt-deferred", "T/T trả sau"),
      t("documentary-collection", "Nhờ thu kèm chứng từ"),
      t("dp-da", "D/P vs D/A"),
      t("bill-of-exchange", "Hối phiếu"),
      t("lc-concept", "Khái niệm L/C"),
      t("lc-parties", "Các bên trong L/C"),
      t("lc-procedure", "Quy trình L/C"),
      t("lc-types", "Các loại L/C"),
      t("lc-contents", "Nội dung L/C"),
      t("lc-dates", "Các mốc ngày của L/C"),
      t("discrepancies", "Bất hợp lệ chứng từ"),
      t("lc-checklist", "Checklist L/C của nhà XK"),
      t("method-selection", "Lựa chọn phương thức thanh toán"),
    ],
  },
  {
    id: "C6",
    slug: "c6",
    order: 6,
    titleEn: "International Sale Contract",
    titleVi: "Hợp đồng mua bán quốc tế",
    shortVi: "Hợp đồng",
    color: "#4D7C0F",
    topics: [
      t("contract-structure", "Cấu trúc hợp đồng"),
      t("art-commodity", "Điều 1 – Tên hàng"),
      t("art-quality", "Điều 2 – Chất lượng"),
      t("art-quantity", "Điều 3 – Số lượng"),
      t("art-packing", "Điều 4 – Bao bì & ký mã hiệu"),
      t("art-price", "Điều 5 – Giá"),
      t("art-delivery", "Điều 6 – Giao hàng"),
      t("art-payment", "Điều 7 – Thanh toán"),
      t("art-documents", "Điều 8 – Chứng từ"),
      t("art-insurance", "Điều 9 – Bảo hiểm"),
      t("art-claim", "Điều 10 – Khiếu nại"),
      t("art-penalty", "Điều 11 – Phạt"),
      t("art-arbitration-cisg", "Điều 12 – Trọng tài & CISG"),
      t("art-force-majeure", "Điều 13 – Bất khả kháng"),
      t("art-other", "Điều 14 – Điều khoản khác"),
      t("contract-errors", "Lỗi thường gặp trong hợp đồng"),
    ],
  },
  {
    id: "C7",
    slug: "c7",
    order: 7,
    titleEn: "Export and Import Documents",
    titleVi: "Chứng từ Xuất Nhập khẩu",
    shortVi: "Chứng từ",
    color: "#0369A1",
    topics: [
      t("document-lists", "Danh mục chứng từ"),
      t("commercial-invoice", "Hóa đơn thương mại"),
      t("invoice-vs-lc", "Kiểm tra hóa đơn với L/C"),
      t("proforma", "Hóa đơn chiếu lệ"),
      t("bl-functions", "Chức năng vận đơn"),
      t("bl-types", "Các loại vận đơn"),
      t("bl-checklist", "Checklist vận đơn"),
      t("insurance-docs", "Chứng từ bảo hiểm"),
      t("quantity-quality-cert", "Giấy chứng nhận số lượng/chất lượng"),
      t("certificate-of-origin", "Giấy chứng nhận xuất xứ (C/O)"),
      t("co-forms-fta", "Mẫu C/O & FTA"),
      t("gsp", "GSP"),
      t("packing-list", "Phiếu đóng gói"),
      t("phyto-inspection", "Kiểm dịch thực vật & giám định"),
    ],
  },
  {
    id: "C8",
    slug: "c8",
    order: 8,
    titleEn: "Export & Import Procedures",
    titleVi: "Quy trình Xuất Nhập khẩu",
    shortVi: "Quy trình",
    color: "#475569",
    topics: [
      t("implementation-considerations", "Yếu tố cần cân nhắc khi thực hiện HĐ"),
      t("export-procedure", "10 bước quy trình xuất khẩu"),
      t("import-procedure", "9 bước quy trình nhập khẩu"),
      t("incoterms-procedure-link", "Liên hệ Incoterms – quy trình"),
    ],
  },
];

export const CHAPTER_BY_ID: Record<ChapterId, ChapterDef> = Object.fromEntries(
  CHAPTERS.map((c) => [c.id, c]),
) as Record<ChapterId, ChapterDef>;

export function chapterBySlug(slug: string | undefined): ChapterDef | undefined {
  if (!slug) return undefined;
  const s = slug.toLowerCase();
  return CHAPTERS.find((c) => c.slug === s);
}

export function isTopicOf(chapter: ChapterId, topic: string): boolean {
  return CHAPTER_BY_ID[chapter].topics.some((tp) => tp.id === topic);
}

export function topicLabel(chapter: ChapterId, topic: string): string {
  return CHAPTER_BY_ID[chapter].topics.find((tp) => tp.id === topic)?.label ?? topic;
}
