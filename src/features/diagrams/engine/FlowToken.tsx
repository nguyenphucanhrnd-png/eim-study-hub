import { motion, useReducedMotion } from "motion/react";
import { edgeGeometry } from "./geometry";
import { KIND_STYLE, KindIcon } from "./style";
import type { ResolvedSpec } from "./types";

export interface TokenRun {
  edgeId: string;
  /** Changes on every run so the animation restarts. */
  key: number;
  durationSec: number;
}

/** A token (goods / document / money / info icon) travelling along one edge. */
export function FlowToken({ run, spec }: { run: TokenRun; spec: ResolvedSpec }) {
  const reduced = useReducedMotion();
  const edge = spec.edges.find((e) => e.id === run.edgeId);
  const from = edge && spec.nodes.find((n) => n.id === edge.from);
  const to = edge && spec.nodes.find((n) => n.id === edge.to);
  if (!edge || !from || !to || reduced) return null;
  const g = edgeGeometry(edge, from, to);
  const k = KIND_STYLE[edge.kind];
  return (
    <motion.g
      key={run.key}
      initial={{ x: g.x1, y: g.y1, opacity: 0 }}
      animate={{ x: g.x2, y: g.y2, opacity: [0, 1, 1, 0.85] }}
      transition={{ duration: run.durationSec, ease: "easeInOut" }}
      aria-hidden
      className="pointer-events-none"
    >
      <circle r={15} style={{ fill: "var(--dg-surface)", stroke: k.stroke }} strokeWidth={2.4} />
      <g style={{ color: k.stroke }}>
        <KindIcon kind={edge.kind} size={17} />
      </g>
    </motion.g>
  );
}
