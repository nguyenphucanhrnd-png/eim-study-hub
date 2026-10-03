import type { ActorRole, FlowKind } from "./types";

/** Actor colours (CSS variables defined in index.css, dark-mode aware). */
export const ROLE_STYLE: Record<ActorRole, { stroke: string; fill: string; vi: string }> = {
  seller: { stroke: "var(--dg-seller)", fill: "var(--dg-seller-fill)", vi: "Người bán / nhà XK" },
  buyer: { stroke: "var(--dg-buyer)", fill: "var(--dg-buyer-fill)", vi: "Người mua / nhà NK" },
  sellerBank: { stroke: "var(--dg-bank)", fill: "var(--dg-bank-fill)", vi: "Ngân hàng" },
  buyerBank: { stroke: "var(--dg-bank)", fill: "var(--dg-bank-fill)", vi: "Ngân hàng" },
  carrier: { stroke: "var(--dg-carrier)", fill: "var(--dg-carrier-fill)", vi: "Người chuyên chở" },
  customsExport: { stroke: "var(--dg-customs)", fill: "var(--dg-customs-fill)", vi: "Hải quan" },
  customsImport: { stroke: "var(--dg-customs)", fill: "var(--dg-customs-fill)", vi: "Hải quan" },
  insurer: { stroke: "var(--dg-insurer)", fill: "var(--dg-insurer-fill)", vi: "Bảo hiểm" },
  other: { stroke: "var(--dg-other)", fill: "var(--dg-other-fill)", vi: "Khác" },
};

/** Flow kinds: distinguished by dash pattern + width + token icon, not by colour alone. */
export const KIND_STYLE: Record<FlowKind, { stroke: string; width: number; dash?: string; vi: string; en: string }> = {
  goods: { stroke: "var(--dg-goods)", width: 3.2, vi: "Hàng hóa", en: "goods" },
  document: { stroke: "var(--dg-document)", width: 2.2, dash: "9 6", vi: "Chứng từ", en: "documents" },
  money: { stroke: "var(--dg-money)", width: 2.2, vi: "Tiền", en: "money" },
  info: { stroke: "var(--dg-info)", width: 2, dash: "2 5", vi: "Thông tin / chỉ thị", en: "information" },
  /** Plain "next step" arrows of procedure diagrams (not a flow; left out of the legend). */
  sequence: { stroke: "var(--dg-muted)", width: 1.8, vi: "Trình tự", en: "sequence" },
};

/** Tiny 20×20 icons (centred on 0,0) drawn inside tokens and in the legend. */
export function KindIcon({ kind, size = 14 }: { kind: FlowKind; size?: number }) {
  const s = size / 20;
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8 / s, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <g transform={`scale(${s})`} aria-hidden>
      {kind === "goods" && (
        <>
          <path d="M-8 -4 L0 -8 L8 -4 L8 5 L0 9 L-8 5 Z" {...common} />
          <path d="M-8 -4 L0 0 L8 -4 M0 0 L0 9" {...common} />
        </>
      )}
      {kind === "document" && (
        <>
          <path d="M-6 -9 L3 -9 L7 -5 L7 9 L-6 9 Z" {...common} />
          <path d="M-3 -2 L4 -2 M-3 2 L4 2 M-3 6 L2 6" {...common} />
        </>
      )}
      {kind === "money" && (
        <>
          <circle r="8.5" {...common} />
          <path d="M3 -4 C1 -6 -4 -6 -4 -3 C-4 0 4 0 4 3 C4 6 -1 6 -3 4 M0 -7 L0 7" {...common} />
        </>
      )}
      {kind === "sequence" && <path d="M-7 0 L7 0 M2 -5 L7 0 L2 5" {...common} />}
      {kind === "info" && (
        <>
          <rect x="-9" y="-6" width="18" height="12" rx="1.5" {...common} />
          <path d="M-9 -6 L0 1 L9 -6" {...common} />
        </>
      )}
    </g>
  );
}

/** "C5 p.20" → "Sơ đồ từ slide – Chương 5, trang 20". */
export function provenanceLabel(provenance: "slide" | "derived", slideRef?: string): string {
  if (provenance === "derived") return "Sơ đồ tổng hợp từ nội dung slide";
  const m = slideRef ? /^C(\d)\s+pp?\.(.+)$/.exec(slideRef.trim()) : null;
  return m ? `Sơ đồ từ slide – Chương ${m[1]}, trang ${m[2]}` : `Sơ đồ từ slide${slideRef ? ` – ${slideRef}` : ""}`;
}
