import { z } from "zod";
import { CHAPTER_IDS } from "@/config/chapters";

/**
 * Diagram data model (DIAGRAMS_PROMPT §3.3). Every diagram is plain data validated by Zod
 * (`npm run validate:diagrams`), rendered by the shared engine.
 */

/** Flow kind drives edge style (line + dash pattern + token icon), never colour alone. */
export const FLOW_KINDS = ["goods", "document", "money", "info", "sequence"] as const;
export type FlowKind = (typeof FLOW_KINDS)[number];

export const ACTOR_ROLES = ["seller", "buyer", "sellerBank", "buyerBank", "carrier", "customsExport", "customsImport", "insurer", "other"] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

const LinkSchema = z.object({ label: z.string().min(1), to: z.string().min(1) });
export type DiagramLink = z.infer<typeof LinkSchema>;

export const NodeSchema = z.object({
  id: z.string().min(1),
  /** EN, as on the slide. */
  label: z.string().min(1),
  labelVi: z.string().optional(),
  role: z.enum(ACTOR_ROLES),
  x: z.number(),
  y: z.number(),
  w: z.number().positive().optional(),
  h: z.number().positive().optional(),
  shape: z.enum(["ellipse", "rect", "pill"]).optional(),
  /** VI: what this actor does in this diagram (node panel). */
  descVi: z.string().optional(),
  /** Alternative names shown in the node panel (e.g. Applicant / Beneficiary). */
  aka: z.array(z.string()).optional(),
  links: z.array(LinkSchema).optional(),
});
export type DiagramNode = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.enum(FLOW_KINDS),
  /** Text drawn next to the edge (e.g. "Goods"). Step numbers come from the steps. */
  label: z.string().optional(),
  /** Perpendicular offset (px in the viewBox) for parallel arrows, e.g. L/C (2)/(6)/(7). */
  curve: z.number().optional(),
  /** Arrowheads on both ends (e.g. Figure 11.3 arrows 1 and 6). */
  both: z.boolean().optional(),
  /** Drawn dashed regardless of kind (used for optional/derived sub-steps such as D/A 5b). */
  dashed: z.boolean().optional(),
  /** Badge position along the edge, 0 = start … 1 = end (default 0.5), plus a nudge to match the slide. */
  badgeAt: z.number().min(0).max(1).optional(),
  badgeDx: z.number().optional(),
  badgeDy: z.number().optional(),
});
export type DiagramEdge = z.infer<typeof EdgeSchema>;

const DetailSchema = z.object({
  title: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
  /** Render as a tickable checklist (e.g. the exporter's 14-point L/C checklist). */
  checklist: z.boolean().optional(),
});

export const StepSchema = z.object({
  id: z.string().min(1),
  /** Number as on the slide (1…n per lane). */
  order: z.number().int().positive(),
  /** Display label when it differs from `order` (e.g. "5b", "A"). A badge step with a letter suffix is a sub-step. */
  badge: z.string().optional(),
  /** Lane id for diagrams with parallel flows (e.g. goods lane / money lane). */
  lane: z.string().optional(),
  /** EN slide wording. */
  title: z.string().min(1),
  titleVi: z.string().min(1),
  edgeIds: z.array(z.string()),
  /** Node ids performing the step; the first one is "who does it" for the actor quiz. */
  actors: z.array(z.string()).min(1),
  what: z.string().min(1),
  why: z.string().min(1),
  documents: z.array(z.string()).optional(),
  trap: z.string().optional(),
  ext: z.string().optional(),
  source: z.string().min(1),
  practiceTopic: z.string().optional(),
  details: z.array(DetailSchema).optional(),
  links: z.array(LinkSchema).optional(),
  /** Something an actor keeps while this step is active (e.g. the collecting bank holds the documents). */
  holds: z.array(z.object({ node: z.string().min(1), kind: z.enum(["goods", "document", "money", "info"]), label: z.string().min(1) })).optional(),
});
export type DiagramStep = z.infer<typeof StepSchema>;

export const ZoneSchema = z.object({ label: z.string().min(1), x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive() });
export type DiagramZone = z.infer<typeof ZoneSchema>;

export const LaneSchema = z.object({ id: z.string().min(1), label: z.string().min(1) });

export const VariantSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Fields replaced wholesale when the variant is active. */
  patch: z.object({
    nodes: z.array(NodeSchema).optional(),
    edges: z.array(EdgeSchema).optional(),
    steps: z.array(StepSchema).optional(),
    keyTakeaways: z.array(z.string()).optional(),
    note: z.string().optional(),
  }),
});
export type DiagramVariant = z.infer<typeof VariantSchema>;

export const DiagramSpecSchema = z.object({
  id: z.string().regex(/^c[1-8]-[a-z0-9-]+$/),
  chapter: z.enum(CHAPTER_IDS),
  title: z.string().min(1),
  titleVi: z.string().min(1),
  provenance: z.enum(["slide", "derived"]),
  /** "C5 p.20" — required for slide diagrams. */
  slideRef: z.string().optional(),
  /** Extra provenance remark (e.g. "order inferred from the arrows"). */
  note: z.string().optional(),
  viewBox: z.object({ w: z.number().positive(), h: z.number().positive() }).optional(),
  zones: z.array(ZoneSchema).optional(),
  lanes: z.array(LaneSchema).optional(),
  /** "parallel-lanes": play step n of every lane together (e.g. goods + money flows). */
  playback: z.enum(["sequential", "parallel-lanes"]).optional(),
  nodes: z.array(NodeSchema).min(1),
  edges: z.array(EdgeSchema),
  steps: z.array(StepSchema),
  variants: z.array(VariantSchema).optional(),
  keyTakeaways: z.array(z.string().min(1)).min(1),
  quiz: z.object({ order: z.boolean().optional(), actor: z.boolean().optional(), gap: z.boolean().optional() }).optional(),
});
export type DiagramSpec = z.infer<typeof DiagramSpecSchema>;

/** Spec with a variant applied (the shape the viewer renders). */
export interface ResolvedSpec extends DiagramSpec {
  variantId: string | null;
  variantNote?: string;
}

export function resolveVariant(spec: DiagramSpec, variantId: string | null): ResolvedSpec {
  const v = variantId ? spec.variants?.find((x) => x.id === variantId) : undefined;
  if (!v) return { ...spec, variantId: null };
  const { note, ...patch } = v.patch;
  return { ...spec, ...patch, variantId: v.id, variantNote: note };
}

/** Steps sorted for display/play: by lane order, then number, then badge. */
export function sortedSteps(steps: DiagramStep[], lanes?: { id: string }[]): DiagramStep[] {
  const laneIdx = (s: DiagramStep) => (lanes ? Math.max(0, lanes.findIndex((l) => l.id === s.lane)) : 0);
  return [...steps].sort((a, b) => laneIdx(a) - laneIdx(b) || a.order - b.order || (a.badge ?? "").localeCompare(b.badge ?? ""));
}

/** Badge text of a step ("5", "5b", "A"). */
export const stepLabel = (s: DiagramStep) => s.badge ?? String(s.order);

/** A sub-step such as "5b" (badge = number + letter); it does not count in the 1…n order. */
export const isSubStep = (s: DiagramStep) => !!s.badge && /^\d+[a-z]$/.test(s.badge);

/**
 * Play frames: sequential → one step per frame; parallel lanes → frame n contains step n of every lane.
 */
export function playFrames(spec: Pick<DiagramSpec, "steps" | "lanes" | "playback">): DiagramStep[][] {
  const steps = sortedSteps(spec.steps, spec.lanes);
  if (spec.playback !== "parallel-lanes") return steps.map((s) => [s]);
  const max = Math.max(0, ...steps.map((s) => s.order));
  const frames: DiagramStep[][] = [];
  for (let n = 1; n <= max; n++) frames.push(steps.filter((s) => s.order === n));
  return frames.filter((f) => f.length > 0);
}
