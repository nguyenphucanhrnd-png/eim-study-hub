import type { DiagramSpec } from "../engine/types";
import { ADVANCE_VARIANT, DEFERRED_VARIANT, TT_EDGES_ADVANCE, TT_NODES, TT_NOTE, TT_STEPS_ADVANCE, TT_TAKEAWAYS_ADVANCE } from "./c5-tt-shared";

/** D5.1 — Remittance: payment in advance (slide C5 p.7), with the Advance ⇄ Deferred toggle. */
const spec: DiagramSpec = {
  id: "c5-tt-advance",
  chapter: "C5",
  title: "Remittance – payment in advance (Cash-in-Advance)",
  titleVi: "Chuyển tiền T/T trả trước – 5 bước",
  provenance: "slide",
  slideRef: "C5 p.7",
  note: TT_NOTE,
  nodes: TT_NODES,
  edges: TT_EDGES_ADVANCE,
  steps: TT_STEPS_ADVANCE,
  variants: [ADVANCE_VARIANT, DEFERRED_VARIANT],
  keyTakeaways: TT_TAKEAWAYS_ADVANCE,
  quiz: { order: true, actor: true, gap: true },
};

export default spec;
