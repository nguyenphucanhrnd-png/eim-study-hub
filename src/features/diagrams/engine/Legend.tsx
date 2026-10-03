import { KIND_STYLE, KindIcon, ROLE_STYLE } from "./style";
import { FLOW_KINDS, type ActorRole, type ResolvedSpec } from "./types";

const ROLE_ORDER: ActorRole[] = ["seller", "buyer", "sellerBank", "carrier", "customsExport", "insurer", "other"];
const sameRole = (r: ActorRole): ActorRole =>
  r === "buyerBank" ? "sellerBank" : r === "customsImport" ? "customsExport" : r;

/** Flow kinds (line style + icon) and actor colours actually used by this diagram. */
export function Legend({ spec }: { spec: ResolvedSpec }) {
  const kinds = FLOW_KINDS.filter((k) => k !== "sequence" && spec.edges.some((e) => e.kind === k));
  const roles = ROLE_ORDER.filter((r) => spec.nodes.some((n) => sameRole(n.role) === r));
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300" aria-label="Chú giải">
      {kinds.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <svg width="44" height="18" viewBox="0 0 44 18" aria-hidden>
            <line x1="2" y1="9" x2="24" y2="9" style={{ stroke: KIND_STYLE[k].stroke }} strokeWidth={KIND_STYLE[k].width} strokeDasharray={KIND_STYLE[k].dash} />
            <g transform="translate(35 9)" style={{ color: KIND_STYLE[k].stroke }}>
              <KindIcon kind={k} size={15} />
            </g>
          </svg>
          {KIND_STYLE[k].vi}
        </span>
      ))}
      {roles.map((r) => (
        <span key={r} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-sm border-2" style={{ borderColor: ROLE_STYLE[r].stroke, background: ROLE_STYLE[r].fill }} />
          {ROLE_STYLE[r].vi}
        </span>
      ))}
    </div>
  );
}
