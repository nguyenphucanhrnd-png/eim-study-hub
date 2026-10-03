import { useId, type KeyboardEvent } from "react";
import { DEFAULT_VIEWBOX, edgeGeometry, nodeBox } from "./geometry";
import { KIND_STYLE, KindIcon, ROLE_STYLE } from "./style";
import { FLOW_KINDS, stepLabel, type DiagramNode, type DiagramStep, type ResolvedSpec } from "./types";
import { FlowToken, type TokenRun } from "./FlowToken";

export type NodeMark = "correct" | "wrong" | "reveal";

export interface DiagramCanvasProps {
  spec: ResolvedSpec;
  /** Steps of the current frame; when non-empty everything else is dimmed to 30%. */
  activeSteps: DiagramStep[];
  visited: ReadonlySet<string>;
  selectedNodeId?: string | null;
  /** Extra emphasis from outside (e.g. "Môn học nằm ở đâu?" chips); dims everything else. */
  highlight?: { nodes: ReadonlySet<string>; edges: ReadonlySet<string> } | null;
  /** Steps briefly flashed after a variant switch. */
  flashStepIds?: ReadonlySet<string>;
  hiddenNodeIds?: ReadonlySet<string>;
  /** Actor quiz: hide node labels and step badges. */
  quizMode?: boolean;
  nodeMarks?: Record<string, NodeMark>;
  /** Tokens travelling along edges of the current frame. */
  tokens?: TokenRun[];
  onNodeClick?: (nodeId: string) => void;
  onStepClick?: (stepId: string) => void;
  ariaLabel: string;
}

const onKeyActivate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

function NodeShape({ node, mark }: { node: DiagramNode; mark?: NodeMark }) {
  const b = nodeBox(node);
  const role = ROLE_STYLE[node.role];
  const stroke = mark === "correct" ? "var(--color-correct)" : mark === "wrong" ? "var(--color-wrong)" : role.stroke;
  const sw = mark ? 3.5 : 2;
  if (b.shape === "ellipse")
    return <ellipse cx={b.cx} cy={b.cy} rx={b.hw} ry={b.hh} fill={role.fill} stroke={stroke} strokeWidth={sw} />;
  return (
    <rect
      x={b.cx - b.hw}
      y={b.cy - b.hh}
      width={b.hw * 2}
      height={b.hh * 2}
      rx={b.shape === "pill" ? b.hh : 10}
      fill={role.fill}
      stroke={stroke}
      strokeWidth={sw}
    />
  );
}

function NodeLabel({ node }: { node: DiagramNode }) {
  const lines = node.label.split("\n");
  const vi = node.labelVi?.split("\n") ?? [];
  const lh = 25;
  const total = lines.length + vi.length;
  const y0 = node.y - ((total - 1) * lh) / 2;
  return (
    <text textAnchor="middle" style={{ fill: "var(--dg-text)" }} className="pointer-events-none select-none">
      {lines.map((l, i) => (
        <tspan key={`en${i}`} x={node.x} y={y0 + i * lh} dominantBaseline="middle" fontSize="21" fontWeight={700}>
          {l}
        </tspan>
      ))}
      {vi.map((l, i) => (
        <tspan
          key={`vi${i}`}
          x={node.x}
          y={y0 + (lines.length + i) * lh}
          dominantBaseline="middle"
          fontSize="16.5"
          style={{ fill: "var(--dg-muted)" }}
        >
          {l}
        </tspan>
      ))}
    </text>
  );
}

export function DiagramCanvas({
  spec,
  activeSteps,
  visited,
  selectedNodeId,
  highlight,
  flashStepIds,
  hiddenNodeIds,
  quizMode,
  nodeMarks,
  tokens,
  onNodeClick,
  onStepClick,
  ariaLabel,
}: DiagramCanvasProps) {
  const uid = useId().replace(/:/g, "");
  const vb = spec.viewBox ?? DEFAULT_VIEWBOX;
  const nodeById = new Map(spec.nodes.map((n) => [n.id, n]));
  const visibleNodes = spec.nodes.filter((n) => !hiddenNodeIds?.has(n.id));
  const visibleEdges = spec.edges.filter((e) => !hiddenNodeIds?.has(e.from) && !hiddenNodeIds?.has(e.to));

  // Emphasis: the current frame, or an external highlight set.
  const activeEdgeIds = new Set(activeSteps.flatMap((s) => s.edgeIds));
  const activeNodeIds = new Set(activeSteps.flatMap((s) => s.actors));
  for (const e of spec.edges) if (activeEdgeIds.has(e.id)) activeNodeIds.add(e.from).add(e.to);
  const dimmingByStep = !quizMode && activeSteps.length > 0;
  const dimmingByHighlight = !quizMode && !!highlight && (highlight.nodes.size > 0 || highlight.edges.size > 0);
  const nodeOpacity = (id: string) => {
    if (dimmingByHighlight) return highlight!.nodes.has(id) ? 1 : 0.3;
    if (dimmingByStep) return activeNodeIds.has(id) ? 1 : 0.3;
    return 1;
  };
  const edgeOpacity = (id: string) => {
    if (dimmingByHighlight) return highlight!.edges.has(id) ? 1 : 0.3;
    if (dimmingByStep) return activeEdgeIds.has(id) ? 1 : 0.3;
    return 1;
  };

  // Step badges sit on their first edge; steps without edges get a badge on their first actor.
  const stepsByEdge = new Map<string, DiagramStep[]>();
  for (const s of spec.steps) {
    const anchor = s.edgeIds[0];
    if (anchor) stepsByEdge.set(anchor, [...(stepsByEdge.get(anchor) ?? []), s]);
  }
  const activeIds = new Set(activeSteps.map((s) => s.id));

  return (
    <svg
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      role="group"
      aria-label={ariaLabel}
      className="h-auto w-full"
      style={{ maxHeight: 520 }}
    >
      <defs>
        {FLOW_KINDS.map((k) => (
          <marker
            key={k}
            id={`${uid}-arrow-${k}`}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" style={{ fill: KIND_STYLE[k].stroke }} />
          </marker>
        ))}
      </defs>

      {spec.zones?.map((z) => (
        <g key={z.label} aria-hidden>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} style={{ fill: "var(--dg-zone)", stroke: "var(--dg-muted)" }} strokeOpacity={0.25} />
          <text x={z.x + z.w / 2} y={z.y + 24} textAnchor="middle" fontSize="16" fontWeight={700} style={{ fill: "var(--dg-muted)" }} letterSpacing="0.06em">
            {z.label.toUpperCase()}
          </text>
        </g>
      ))}

      {/* Edges */}
      {visibleEdges.map((e) => {
        const from = nodeById.get(e.from);
        const to = nodeById.get(e.to);
        if (!from || !to) return null;
        const g = edgeGeometry(e, from, to);
        const k = KIND_STYLE[e.kind];
        const isActive = activeEdgeIds.has(e.id);
        return (
          <g key={e.id} style={{ opacity: edgeOpacity(e.id), transition: "opacity 200ms" }}>
            <line
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              style={{ stroke: k.stroke }}
              strokeWidth={isActive && !quizMode ? k.width + 1.4 : k.width}
              strokeDasharray={e.dashed ? "6 6" : k.dash}
              markerEnd={`url(#${uid}-arrow-${e.kind})`}
              markerStart={e.both ? `url(#${uid}-arrow-${e.kind})` : undefined}
            />
            {e.label && (
              <text
                x={(g.x1 + g.x2) / 2 - g.uy * 34}
                y={(g.y1 + g.y2) / 2 + g.ux * 34}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="19"
                fontWeight={600}
                style={{ fill: "var(--dg-text)" }}
                aria-hidden
              >
                {e.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {visibleNodes.map((n, idx) => {
        const name = `${n.label.replace(/\n/g, " ")}${n.labelVi ? ` (${n.labelVi.replace(/\n/g, " ")})` : ""}`;
        return (
          <g
            key={n.id}
            role="button"
            tabIndex={0}
            aria-label={quizMode && !nodeMarks?.[n.id] ? `Đối tượng ${idx + 1} (nhãn bị ẩn)` : name}
            aria-pressed={selectedNodeId === n.id}
            onClick={() => onNodeClick?.(n.id)}
            onKeyDown={onKeyActivate(() => onNodeClick?.(n.id))}
            className="cursor-pointer outline-none [&:focus-visible>*:first-child]:[stroke-width:5]"
            style={{ opacity: quizMode ? 1 : nodeOpacity(n.id), transition: "opacity 200ms" }}
          >
            <NodeShape node={n} mark={nodeMarks?.[n.id] ?? (selectedNodeId === n.id ? "reveal" : undefined)} />
            {quizMode && !nodeMarks?.[n.id] ? (
              <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight={700} style={{ fill: "var(--dg-muted)" }}>
                ?
              </text>
            ) : (
              <NodeLabel node={n} />
            )}
          </g>
        );
      })}

      {/* Step badges */}
      {!quizMode &&
        visibleEdges.map((e) => {
          const steps = stepsByEdge.get(e.id);
          const from = nodeById.get(e.from);
          const to = nodeById.get(e.to);
          if (!steps || !from || !to) return null;
          const g = edgeGeometry(e, from, to);
          return steps.map((s, i) => {
            const label = stepLabel(s);
            const active = activeIds.has(s.id);
            const flash = flashStepIds?.has(s.id);
            const r = label.length > 2 ? 22 : 19;
            const x = g.bx + i * (r * 2 + 4);
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`Bước ${label}: ${s.titleVi}${visited.has(s.id) ? " (đã xem)" : ""}`}
                aria-current={active ? "step" : undefined}
                onClick={() => onStepClick?.(s.id)}
                onKeyDown={onKeyActivate(() => onStepClick?.(s.id))}
                className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:[stroke-width:4]"
              >
                {flash && <circle cx={x} cy={g.by} r={r + 7} style={{ fill: "none", stroke: "var(--color-flag)" }} strokeWidth={3} className="animate-ping" />}
                <circle
                  cx={x}
                  cy={g.by}
                  r={r}
                  style={{
                    fill: active ? "var(--dg-badge)" : "var(--dg-surface)",
                    stroke: "var(--dg-badge)",
                  }}
                  strokeWidth={2}
                />
                <text
                  x={x}
                  y={g.by}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="18"
                  fontWeight={700}
                  style={{ fill: active ? "var(--dg-badge-text)" : "var(--dg-badge)" }}
                  className="pointer-events-none select-none"
                >
                  {label}
                </text>
                {visited.has(s.id) && !active && (
                  <g transform={`translate(${x + r - 2} ${g.by - r + 2})`} aria-hidden>
                    <circle r={8.5} style={{ fill: "var(--color-correct)" }} />
                    <path d="M-3.2 0 L-0.8 2.4 L3.4 -2.4" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          });
        })}

      {/* Steps without an edge: badge above the acting node. */}
      {!quizMode &&
        spec.steps
          .filter((s) => s.edgeIds.length === 0)
          .map((s) => {
            const n = nodeById.get(s.actors[0]!);
            if (!n || hiddenNodeIds?.has(n.id)) return null;
            const b = nodeBox(n);
            const active = activeIds.has(s.id);
            const label = stepLabel(s);
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                aria-label={`Bước ${label}: ${s.titleVi}`}
                aria-current={active ? "step" : undefined}
                onClick={() => onStepClick?.(s.id)}
                onKeyDown={onKeyActivate(() => onStepClick?.(s.id))}
                className="cursor-pointer outline-none"
              >
                <circle
                  cx={b.cx - b.hw + 4}
                  cy={b.cy - b.hh + 4}
                  r={18}
                  style={{ fill: active ? "var(--dg-badge)" : "var(--dg-surface)", stroke: "var(--dg-badge)" }}
                  strokeWidth={2}
                />
                <text
                  x={b.cx - b.hw + 4}
                  y={b.cy - b.hh + 4}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="17"
                  fontWeight={700}
                  style={{ fill: active ? "var(--dg-badge-text)" : "var(--dg-badge)" }}
                  className="pointer-events-none"
                >
                  {label}
                </text>
                {visited.has(s.id) && !active && (
                  <g transform={`translate(${b.cx - b.hw + 20} ${b.cy - b.hh - 10})`} aria-hidden>
                    <circle r={6} style={{ fill: "var(--color-correct)" }} />
                    <path d="M-2.8 0 L-0.7 2.1 L3 -2.1" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}

      {/* "Held" items (e.g. documents kept at the collecting bank until payment/acceptance). */}
      {!quizMode &&
        activeSteps.flatMap((s) =>
          (s.holds ?? []).map((h, i) => {
            const n = nodeById.get(h.node);
            if (!n || hiddenNodeIds?.has(n.id)) return null;
            const b = nodeBox(n);
            const w = Math.max(150, h.label.length * 9.4 + 46);
            const x = Math.min(Math.max(8, b.cx - w / 2), vb.w - w - 8);
            const y = b.cy + b.hh + 10 + i * 40;
            return (
              <g key={`hold-${s.id}-${i}`} role="note" aria-label={h.label}>
                <rect x={x} y={y} width={w} height={34} rx={17} style={{ fill: "var(--dg-surface)", stroke: KIND_STYLE[h.kind].stroke }} strokeWidth={2} />
                <g transform={`translate(${x + 20} ${y + 17})`} style={{ color: KIND_STYLE[h.kind].stroke }}>
                  <KindIcon kind={h.kind} size={17} />
                </g>
                <text x={x + 36} y={y + 18} dominantBaseline="middle" fontSize="15.5" fontWeight={600} style={{ fill: "var(--dg-text)" }}>
                  {h.label}
                </text>
              </g>
            );
          }),
        )}

      {!quizMode && tokens?.map((t) => <FlowToken key={`${t.edgeId}-${t.key}`} run={t} spec={spec} />)}
    </svg>
  );
}
