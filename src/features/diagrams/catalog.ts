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
