/**
 * Diagram catalog: lightweight metadata + lazy spec loaders (no React), shared by the app,
 * `npm run validate:diagrams` and the tests. Views live in registry.tsx.
 */
import type { ChapterId } from "@/config/chapters";
import type { DiagramSpec } from "./engine/types";
import type { PoolStep } from "./engine/quiz";

export interface DiagramMeta {
  id: string;
  chapter: ChapterId;
  title: string;
  titleVi: string;
  provenance: "slide" | "derived";
  slideRef?: string;
  /** Number of steps (or points/items for custom diagrams) — checked against the spec in tests. */
  stepCount: number;
  estMinutes: number;
  /** Theory section (anchor id on /learn/:chapter) where the diagram is embedded. */
  section: string;
  /** Quiz types offered (for the hub card). */
  quizzes: ("order" | "actor" | "gap" | "classify" | "incident" | "scenario")[];
  /** Data spec (engine-based diagrams). Custom views are registered in registry.tsx. */
  loadSpec?: () => Promise<DiagramSpec>;
}

const spec = (load: () => Promise<{ default: DiagramSpec }>) => () => load().then((m) => m.default);

export const DIAGRAMS: DiagramMeta[] = [
  {
    id: "c1-export-process",
    chapter: "C1",
    title: "Export process: from seller's factory to buyer in foreign country",
    titleVi: "Quy trình xuất khẩu – dòng hàng 9 bước",
    provenance: "slide",
    slideRef: "C1 p.4",
    stepCount: 9,
    estMinutes: 4,
    section: "physical-flow",
    quizzes: ["order", "gap", "classify"],
    loadSpec: spec(() => import("./specs/c1-export-process")),
  },
  {
    id: "c1-two-flows",
    chapter: "C1",
    title: "Export Management – Manage two key flows",
    titleVi: "Quản trị xuất khẩu – quản lý hai dòng chảy",
    provenance: "slide",
    slideRef: "C1 p.6",
    stepCount: 14,
    estMinutes: 5,
    section: "coordination",
    quizzes: ["order", "gap"],
    loadSpec: spec(() => import("./specs/c1-two-flows")),
  },
  {
    id: "c1-order-process",
    chapter: "C1",
    title: "Export order process",
    titleVi: "Quy trình đơn hàng xuất khẩu – 4 giai đoạn",
    provenance: "slide",
    slideRef: "C1 p.9",
    stepCount: 4,
    estMinutes: 2,
    section: "order-process",
    quizzes: ["order", "gap"],
    loadSpec: spec(() => import("./specs/c1-order-process")),
  },
  {
    id: "c1-stakeholder-hub",
    chapter: "C1",
    title: "Figure 1-6. Interrelationships with outside service providers",
    titleVi: "Bộ phận XNK và các nhà cung cấp dịch vụ bên ngoài (Figure 1-6)",
    provenance: "slide",
    slideRef: "C1 p.10",
    stepCount: 19,
    estMinutes: 5,
    section: "service-providers",
    quizzes: ["classify"],
    loadSpec: spec(() => import("./specs/c1-stakeholder-hub")),
  },
  {
    id: "c3-pricing-objectives",
    chapter: "C3",
    title: "Pricing objectives and pricing strategy",
    titleVi: "Mục tiêu định giá → chiến lược giá",
    provenance: "slide",
    slideRef: "C3 p.6",
    stepCount: 2,
    estMinutes: 3,
    section: "pricing-objectives",
    quizzes: ["classify"],
    loadSpec: spec(() => import("./specs/c3-pricing-objectives")),
  },
  {
    id: "c3-incoterms-purpose-scope",
    chapter: "C3",
    title: "Purpose and scope of Incoterms",
    titleVi: "Incoterms: mục đích và phạm vi điều chỉnh",
    provenance: "slide",
    slideRef: "C3 p.8",
    stepCount: 8,
    estMinutes: 3,
    section: "incoterms-scope",
    quizzes: ["classify"],
    loadSpec: spec(() => import("./specs/c3-incoterms-purpose-scope")),
  },
  {
    id: "c3-carriage-incoterms",
    chapter: "C3",
    title: "Pre-carriage, main-carriage, on-carriage + ICC rule diagrams",
    titleVi: "Chi phí – rủi ro – bảo hiểm trên chặng vận tải (11 điều kiện Incoterms®)",
    provenance: "slide",
    slideRef: "C3 p.11",
    stepCount: 10,
    estMinutes: 10,
    section: "carriage-stages",
    quizzes: ["incident"],
  },
  {
    id: "c5-tt-advance",
    chapter: "C5",
    title: "Remittance – payment in advance (Cash-in-Advance)",
    titleVi: "Chuyển tiền T/T trả trước – 5 bước",
    provenance: "slide",
    slideRef: "C5 p.7",
    stepCount: 5,
    estMinutes: 3,
    section: "remittance",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c5-tt-advance")),
  },
  {
    id: "c5-tt-deferred",
    chapter: "C5",
    title: "Remittance – deferred payment procedure",
    titleVi: "Chuyển tiền T/T trả sau – 5 bước",
    provenance: "slide",
    slideRef: "C5 p.10",
    stepCount: 5,
    estMinutes: 3,
    section: "remittance",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c5-tt-deferred")),
  },
  {
    id: "c5-documentary-collection",
    chapter: "C5",
    title: "Documentary collection procedure (Figure 11.2)",
    titleVi: "Quy trình nhờ thu kèm chứng từ – 7 bước",
    provenance: "slide",
    slideRef: "C5 p.15",
    stepCount: 7,
    estMinutes: 5,
    section: "documentary-collection",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c5-documentary-collection")),
  },
  {
    id: "c5-lc-basic",
    chapter: "C5",
    title: "Documentary credit procedures",
    titleVi: "Quy trình thư tín dụng (L/C) – 9 bước",
    provenance: "slide",
    slideRef: "C5 p.20",
    stepCount: 9,
    estMinutes: 6,
    section: "lc-procedure",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c5-lc-basic")),
  },
  {
    id: "c5-lc-fig113",
    chapter: "C5",
    title: "Figure 11.3 – Documentary Letter of Credit",
    titleVi: "Thư tín dụng theo Figure 11.3 – 11 bước (có người chuyên chở)",
    provenance: "slide",
    slideRef: "C5 p.21",
    stepCount: 11,
    estMinutes: 6,
    section: "lc-procedure",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c5-lc-fig113")),
  },
  {
    id: "c5-method-compare",
    chapter: "C5",
    title: "Payment methods compared: goods · documents · money",
    titleVi: "So sánh 6 phương thức thanh toán: hàng – chứng từ – tiền",
    provenance: "derived",
    stepCount: 6,
    estMinutes: 5,
    section: "method-selection",
    quizzes: ["scenario"],
  },
  {
    id: "c8-export-procedure",
    chapter: "C8",
    title: "Export procedures",
    titleVi: "Quy trình xuất khẩu – 10 bước",
    provenance: "slide",
    slideRef: "C8 p.3",
    stepCount: 10,
    estMinutes: 6,
    section: "export-procedure",
    quizzes: ["order", "gap", "scenario"],
    loadSpec: spec(() => import("./specs/c8-export-procedure")),
  },
  {
    id: "c8-import-procedure",
    chapter: "C8",
    title: "Import procedures",
    titleVi: "Quy trình nhập khẩu – 9 bước",
    provenance: "slide",
    slideRef: "C8 p.5",
    stepCount: 9,
    estMinutes: 5,
    section: "import-procedure",
    quizzes: ["order", "gap", "scenario"],
    loadSpec: spec(() => import("./specs/c8-import-procedure")),
  },
  {
    id: "c2-export-plan",
    chapter: "C2",
    title: "Export plan – 9 components",
    titleVi: "Kế hoạch xuất khẩu – 9 thành phần",
    provenance: "derived",
    stepCount: 10,
    estMinutes: 4,
    section: "export-plan",
    quizzes: [],
    loadSpec: spec(() => import("./specs/c2-export-plan")),
  },
  {
    id: "c3-2010-vs-2020",
    chapter: "C3",
    title: "Incoterms 2010 vs Incoterms® 2020 – 7 changes",
    titleVi: "7 thay đổi Incoterms 2010 → 2020",
    provenance: "derived",
    stepCount: 7,
    estMinutes: 3,
    section: "incoterms-2010-vs-2020",
    quizzes: ["classify"],
  },
  {
    id: "c4-subrogation",
    chapter: "C4",
    title: "Insurable interest and subrogation",
    titleVi: "Quyền lợi được bảo hiểm & thế quyền",
    provenance: "derived",
    stepCount: 4,
    estMinutes: 3,
    section: "insurance-principles",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c4-subrogation")),
  },
  {
    id: "c5-consignment-openaccount",
    chapter: "C5",
    title: "Consignment sale and open account",
    titleVi: "Bán hàng ký gửi & ghi sổ (open account)",
    provenance: "derived",
    stepCount: 6,
    estMinutes: 3,
    section: "consignment",
    quizzes: ["order", "actor", "gap"],
    loadSpec: spec(() => import("./specs/c5-consignment-openaccount")),
  },
  {
    id: "c6-contract-anatomy",
    chapter: "C6",
    title: "Anatomy of an international sale contract",
    titleVi: "Cấu trúc hợp đồng mua bán quốc tế – 3 phần, 14 điều khoản",
    provenance: "derived",
    stepCount: 16,
    estMinutes: 6,
    section: "contract-structure",
    quizzes: ["classify"],
    loadSpec: spec(() => import("./specs/c6-contract-anatomy")),
  },
  {
    id: "c7-document-lifecycle",
    chapter: "C7",
    title: "Document lifecycle: who issues, who uses",
    titleVi: "Vòng đời chứng từ: ai phát hành – ai sử dụng",
    provenance: "derived",
    stepCount: 8,
    estMinutes: 5,
    section: "document-lists",
    quizzes: ["classify"],
    loadSpec: spec(() => import("./specs/c7-document-lifecycle")),
  },
  {
    id: "c7-bl-types",
    chapter: "C7",
    title: "Types of bill of lading – decision tree",
    titleVi: "Các loại vận đơn (B/L) – cây quyết định",
    provenance: "derived",
    stepCount: 11,
    estMinutes: 3,
    section: "bl-types",
    quizzes: ["classify"],
    loadSpec: spec(() => import("./specs/c7-bl-types")),
  },
  {
    id: "c7-proforma-vs-commercial",
    chapter: "C7",
    title: "Pro forma invoice vs commercial invoice",
    titleVi: "Hóa đơn chiếu lệ ⇄ hóa đơn thương mại",
    provenance: "derived",
    stepCount: 4,
    estMinutes: 2,
    section: "proforma",
    quizzes: ["order", "gap", "classify"],
    loadSpec: spec(() => import("./specs/c7-proforma-vs-commercial")),
  },
];

export const DIAGRAM_BY_ID = new Map(DIAGRAMS.map((d) => [d.id, d]));

/** All engine specs (validation script, tests, gap-quiz pool). */
export async function loadAllSpecs(): Promise<DiagramSpec[]> {
  return Promise.all(DIAGRAMS.filter((d) => d.loadSpec).map((d) => d.loadSpec!()));
}

/** Every step title of every engine diagram (base + variants), for "Bước còn thiếu" distractors. */
export async function loadStepPool(): Promise<PoolStep[]> {
  const specs = await loadAllSpecs();
  const pool: PoolStep[] = [];
  for (const s of specs) {
    const all = [s.steps, ...(s.variants ?? []).map((v) => v.patch.steps ?? [])].flat();
    for (const st of all) pool.push({ diagramId: s.id, titleVi: st.titleVi, title: st.title });
  }
  // A few C-chapter steps outside the diagrams keep the pool large enough while few diagrams exist.
  return pool.concat(FALLBACK_POOL);
}

/** Steps of KB processes (KB §1.2, §8.2, §8.3, §5.4) used as distractors before every diagram is loaded. */
const FALLBACK_POOL: PoolStep[] = [
  { diagramId: "kb-c1", titleVi: "Thông quan xuất khẩu", title: "Export customs clearance" },
  { diagramId: "kb-c1", titleVi: "Vận chuyển nội địa đến người mua", title: "Inland transport to buyer" },
  { diagramId: "kb-c8", titleVi: "Mua bảo hiểm hàng hóa", title: "Arrange cargo insurance" },
  { diagramId: "kb-c8", titleVi: "Kiểm tra hàng hóa", title: "Inspect goods" },
  { diagramId: "kb-c5", titleVi: "Ngân hàng thu hộ xuất trình chứng từ cho người mua", title: "Collecting bank presents documents to buyer" },
  { diagramId: "kb-c5", titleVi: "Người mua ký chấp nhận hối phiếu có kỳ hạn", title: "Buyer accepts the time draft" },
];
