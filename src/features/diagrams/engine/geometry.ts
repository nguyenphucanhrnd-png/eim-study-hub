import type { DiagramEdge, DiagramNode } from "./types";

export const DEFAULT_VIEWBOX = { w: 1000, h: 600 };
const DEFAULT_W = 190;
const DEFAULT_H = 64;
/** Space left between an arrow tip and the node outline. */
const GAP = 5;

export interface Box {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  shape: "ellipse" | "rect" | "pill";
}

export function nodeBox(n: DiagramNode): Box {
  return { cx: n.x, cy: n.y, hw: (n.w ?? DEFAULT_W) / 2, hh: (n.h ?? DEFAULT_H) / 2, shape: n.shape ?? "rect" };
}

/** Smallest t > 0 at which the ray S + t·d leaves the box (S is assumed inside or on the box). */
function exitT(b: Box, sx: number, sy: number, dx: number, dy: number): number {
  const rx = sx - b.cx;
  const ry = sy - b.cy;
  if (b.shape === "ellipse") {
    // ((rx + t dx)/a)² + ((ry + t dy)/b)² = 1
    const a2 = b.hw * b.hw;
    const b2 = b.hh * b.hh;
    const A = (dx * dx) / a2 + (dy * dy) / b2;
    const B = 2 * ((rx * dx) / a2 + (ry * dy) / b2);
    const C = (rx * rx) / a2 + (ry * ry) / b2 - 1;
    const disc = B * B - 4 * A * C;
    if (A === 0 || disc < 0) return 0;
    return (-B + Math.sqrt(disc)) / (2 * A);
  }
  const ts: number[] = [];
  if (dx !== 0) ts.push(((dx > 0 ? b.hw : -b.hw) - rx) / dx);
  if (dy !== 0) ts.push(((dy > 0 ? b.hh : -b.hh) - ry) / dy);
  const pos = ts.filter((t) => t >= 0);
  return pos.length ? Math.min(...pos) : 0;
}

export interface EdgeGeometry {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Point at `badgeAt` along the edge, plus the badge nudge. */
  bx: number;
  by: number;
  /** Unit direction and normal, used for labels and tokens. */
  ux: number;
  uy: number;
}

/**
 * Straight arrow between two nodes, shifted sideways by `curve` (parallel arrows) and clipped
 * to both node outlines.
 */
export function edgeGeometry(edge: DiagramEdge, from: DiagramNode, to: DiagramNode): EdgeGeometry {
  const a = nodeBox(from);
  const b = nodeBox(to);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Normal to the left of the direction of travel; `curve` shifts both ends along it.
  const nx = -uy;
  const ny = ux;
  const off = edge.curve ?? 0;
  const sx = a.cx + nx * off;
  const sy = a.cy + ny * off;
  const ex = b.cx + nx * off;
  const ey = b.cy + ny * off;
  const t1 = exitT(a, sx, sy, ux, uy) + GAP;
  const t2 = exitT(b, ex, ey, -ux, -uy) + GAP;
  const x1 = sx + ux * t1;
  const y1 = sy + uy * t1;
  const x2 = ex - ux * t2;
  const y2 = ey - uy * t2;
  const at = edge.badgeAt ?? 0.5;
  return {
    x1,
    y1,
    x2,
    y2,
    bx: x1 + (x2 - x1) * at + (edge.badgeDx ?? 0),
    by: y1 + (y2 - y1) * at + (edge.badgeDy ?? 0),
    ux,
    uy,
  };
}
