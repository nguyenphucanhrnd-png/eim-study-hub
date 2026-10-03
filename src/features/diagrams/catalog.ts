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
