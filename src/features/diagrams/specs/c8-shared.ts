import type { ActorRole, DiagramEdge, DiagramNode, DiagramStep } from "../engine/types";

/** One procedure step: the box on the canvas + the step panel content. */
export interface ProcStep {
  id: string;
  label: string;
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
 * Procedure layout: a "snake" of boxes — the first row left → right, the second row right → left —
 * joined by plain sequence arrows. Each step is a box (edge-less step, badge on the box corner).
 */
export function procedureLayout(steps: ProcStep[], role: ActorRole, source: string): { nodes: DiagramNode[]; edges: DiagramEdge[]; steps: DiagramStep[] } {
  const perRow = Math.ceil(steps.length / 2);
  const xs = [105, 297.5, 490, 682.5, 875];
  const nodes: DiagramNode[] = steps.map((s, i) => {
    const row = i < perRow ? 0 : 1;
    const col = row === 0 ? i : 4 - (i - perRow);
    return { id: s.id, label: s.label, role, x: xs[col]!, y: row === 0 ? 130 : 430, w: 184, h: 128, shape: "rect" };
  });
  const edges: DiagramEdge[] = steps.slice(1).map((s, i) => ({ id: `q${i + 1}`, from: steps[i]!.id, to: s.id, kind: "sequence" }));
  const out: DiagramStep[] = steps.map((s, i) => ({
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
    source,
    practiceTopic: s.practiceTopic,
    links: s.links,
  }));
  return { nodes, edges, steps: out };
}
