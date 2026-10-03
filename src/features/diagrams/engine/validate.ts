import { CHAPTERS } from "@/config/chapters";
import { DiagramSpecSchema, isSubStep, resolveVariant, type DiagramSpec } from "./types";

export interface DiagramIssue {
  where: string;
  message: string;
}

const TOPIC_IDS = new Set(CHAPTERS.flatMap((c) => c.topics.map((t) => t.id)));

function dupes(ids: string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const id of ids) (seen.has(id) ? out : seen).add(id);
  return [...out];
}

/** Structural checks on one (resolved) node/edge/step set. */
function checkGraph(spec: DiagramSpec, where: string): DiagramIssue[] {
  const issues: DiagramIssue[] = [];
  const add = (message: string) => issues.push({ where, message });
  const nodeIds = new Set(spec.nodes.map((n) => n.id));
  const edgeIds = new Set(spec.edges.map((e) => e.id));

  for (const d of dupes(spec.nodes.map((n) => n.id))) add(`duplicate node id "${d}"`);
  for (const d of dupes(spec.edges.map((e) => e.id))) add(`duplicate edge id "${d}"`);
  for (const d of dupes(spec.steps.map((s) => s.id))) add(`duplicate step id "${d}"`);

  for (const e of spec.edges) {
    if (!nodeIds.has(e.from)) add(`edge "${e.id}" starts at missing node "${e.from}"`);
    if (!nodeIds.has(e.to)) add(`edge "${e.id}" ends at missing node "${e.to}"`);
  }
  for (const s of spec.steps) {
    for (const id of s.edgeIds) if (!edgeIds.has(id)) add(`step "${s.id}" references missing edge "${id}"`);
    for (const id of s.actors) if (!nodeIds.has(id)) add(`step "${s.id}" references missing actor "${id}"`);
    for (const h of s.holds ?? []) if (!nodeIds.has(h.node)) add(`step "${s.id}" holds at missing node "${h.node}"`);
    if (s.practiceTopic && !TOPIC_IDS.has(s.practiceTopic)) add(`step "${s.id}" has unknown practiceTopic "${s.practiceTopic}"`);
    if (spec.lanes && !spec.lanes.some((l) => l.id === s.lane)) add(`step "${s.id}" is not in a declared lane`);
  }

  // Step numbers must be exactly 1…n (per lane), sub-steps such as "5b" excepted.
  const lanes = new Map<string, number[]>();
  for (const s of spec.steps) {
    if (isSubStep(s)) continue;
    const key = s.lane ?? "";
    lanes.set(key, [...(lanes.get(key) ?? []), s.order]);
  }
  for (const [lane, orders] of lanes) {
    const sorted = [...orders].sort((a, b) => a - b);
    const ok = sorted.every((o, i) => o === i + 1);
    if (!ok) add(`step order${lane ? ` in lane "${lane}"` : ""} must be 1…${sorted.length} without gaps (got ${sorted.join(", ")})`);
  }
  for (const s of spec.steps.filter(isSubStep)) {
    if (!spec.steps.some((p) => !isSubStep(p) && p.order === s.order && p.lane === s.lane))
      add(`sub-step "${s.badge}" has no parent step ${s.order}`);
  }
  return issues;
}

/** Validate a diagram spec; returns an empty array when it is valid. */
export function validateDiagram(raw: unknown): DiagramIssue[] {
  const parsed = DiagramSpecSchema.safeParse(raw);
  const id = (raw as { id?: string } | null)?.id ?? "(unknown)";
  if (!parsed.success) return parsed.error.issues.map((i) => ({ where: `${id} ${i.path.join(".")}`, message: i.message }));
  const spec = parsed.data;
  const issues: DiagramIssue[] = [];
  if (spec.provenance === "slide" && !spec.slideRef) issues.push({ where: spec.id, message: "slide diagram needs a slideRef" });
  issues.push(...checkGraph(spec, spec.id));
  for (const v of spec.variants ?? []) issues.push(...checkGraph(resolveVariant(spec, v.id), `${spec.id} [variant ${v.id}]`));
  return issues;
}
