import type { DiagramSpec } from "../engine/types";
import { ADVANCE_VARIANT, DEFERRED_VARIANT, TT_EDGES_DEFERRED, TT_NODES, TT_NOTE, TT_STEPS_DEFERRED, TT_TAKEAWAYS_DEFERRED } from "./c5-tt-shared";

/** D5.2 — Remittance deferred payment procedure (slide C5 p.10), with the Deferred ⇄ Advance toggle. */
const spec: DiagramSpec = {
  id: "c5-tt-deferred",
  chapter: "C5",
  title: "Remittance – deferred payment procedure",
  titleVi: "Chuyển tiền T/T trả sau – 5 bước",
  provenance: "slide",
  slideRef: "C5 p.10",
  note: TT_NOTE,
  nodes: TT_NODES,
  edges: TT_EDGES_DEFERRED,
  steps: TT_STEPS_DEFERRED,
  variants: [DEFERRED_VARIANT, ADVANCE_VARIANT],
  keyTakeaways: TT_TAKEAWAYS_DEFERRED,
  quiz: { order: true, actor: true, gap: true },
};

export default spec;
