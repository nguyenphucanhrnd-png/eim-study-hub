/**
 * D3.3 "Sự cố trên đường" — incident logic on top of the Explorer's stage data (single source of truth:
 * RULES[].costs / risks / insuredStages, see data.ts). Pure and unit-tested.
 */
import { FCA_AT_PREMISES, PARTY_VI, STAGES, type IncotermRule, type Party } from "./data";

/** The 10 points of the slide "Pre-carriage, main-carriage, on-carriage" (KB §3.7). */
export const STRIP_POINTS = [
  { id: "seller-premises", vi: "Cơ sở người bán", en: "Seller's premises", leg: "pre" },
  { id: "packaging", vi: "Đóng gói", en: "Packaging", leg: "pre" },
  { id: "loading", vi: "Bốc hàng", en: "Loading", leg: "pre" },
  { id: "export-clearance", vi: "Thông quan XK", en: "Export customs clearance", leg: "pre" },
  { id: "thc-origin", vi: "THC cảng đi", en: "THC (origin)", leg: "main" },
  { id: "main-transport", vi: "Vận tải chính", en: "Main transport", leg: "main" },
  { id: "thc-destination", vi: "THC cảng đến", en: "THC (destination)", leg: "main" },
  { id: "import-clearance", vi: "Thông quan NK", en: "Import customs clearance", leg: "on" },
  { id: "unloading", vi: "Dỡ hàng", en: "Unloading", leg: "on" },
  { id: "buyer-premises", vi: "Cơ sở người mua", en: "Buyer's premises", leg: "on" },
] as const;

export const LEGS = [
  { id: "pre", vi: "Pre-carriage (vận tải nội địa nước người bán)", from: 0, to: 3 },
  { id: "main", vi: "Main-carriage (vận tải quốc tế)", from: 4, to: 6 },
  { id: "on", vi: "On-carriage (vận tải nội địa nước người mua)", from: 7, to: 9 },
] as const;

/**
 * Where the first buyer stage of the Explorer data sits on the 10-point strip (x in strip units, 0…9),
 * used to draw the COSTS / RISKS transfer markers as on the ICC rule diagrams.
 */
const STAGE_START_X: Record<number, number> = {
  0: 1.75, // at the buyer's disposal at the seller's place, not loaded (EXW)
  1: 2.6, // once loaded at the seller's premises (FCA at premises)
  2: 2.9,
  3: 3.65, // handed to the carrier / alongside ship at the place or port of shipment
  4: 4.6, // on board the vessel (FOB, CFR, CIF)
  5: 5.75,
  6: 7.6, // on the arriving means of transport, ready for unloading (DAP, DDP; C-rule costs)
  7: 8.6, // once unloaded (DPU)
  8: 9.4,
};

export function transferX(row: Party[]): number {
  const k = row.indexOf("B");
  return k < 0 ? 9.6 : (STAGE_START_X[k] ?? 9.6);
}

/** Apply the FCA "seller's premises" variant. */
export function resolveRule(rule: IncotermRule, fcaPremises: boolean): IncotermRule {
  return rule.code === "FCA" && fcaPremises ? { ...rule, ...FCA_AT_PREMISES } : rule;
}

export interface IncidentPreset {
  id: string;
  /** Explorer stage index (data.ts STAGES). */
  stage: number;
  /** Marker position on the strip. */
  x: number;
  textVi: string;
}

/** One incident per stage of the Explorer data, placed on the strip. */
export const INCIDENTS: IncidentPreset[] = [
  { id: "at-premises", stage: 0, x: 0.5, textVi: "Hàng hư hỏng tại kho người bán khi đã sẵn sàng giao" },
  { id: "pre-carriage", stage: 1, x: 2.3, textVi: "Xe chở hàng gặp tai nạn trên chặng đầu (ra cảng/nơi giao)" },
  { id: "export-wait", stage: 2, x: 3.2, textVi: "Hàng hư hỏng khi đang chờ thông quan xuất khẩu" },
  { id: "loading-ship", stage: 3, x: 4.2, textVi: "Hàng rơi khi đang bốc lên tàu / giao cho người chuyên chở ở nơi đi" },
  { id: "storm", stage: 4, x: 5.3, textVi: "Tàu gặp bão giữa biển" },
  { id: "arrived", stage: 5, x: 6.6, textVi: "Hư hỏng khi phương tiện đã đến nơi đến, chưa dỡ hàng" },
  { id: "unloading", stage: 6, x: 8.2, textVi: "Hàng rơi khi dỡ khỏi phương tiện tại nơi đến" },
  { id: "import-wait", stage: 7, x: 7.2, textVi: "Hàng hư hỏng khi đang chờ thông quan nhập khẩu" },
  { id: "last-mile", stage: 8, x: 9.2, textVi: "Hư hỏng trên đường vào kho người mua" },
];

export type InsuranceStatus = { kind: "compulsory"; policy: string } | { kind: "optional"; bearer: Party };

export interface IncidentResult {
  /** Who bears the risk of loss/damage at that point. */
  risk: Party;
  /** Who pays the costs of that stage. */
  cost: Party;
  /** Who contracted (and paid) the main carriage. */
  mainCarriage: Party;
  insurance: InsuranceStatus;
  explanationVi: string;
}

export function incidentAt(rule: IncotermRule, stage: number): IncidentResult {
  const risk = rule.risks[stage]!;
  const cost = rule.costs[stage]!;
  const compulsory = rule.insuredStages.includes(stage) && rule.insurance !== "none";
  const insurance: InsuranceStatus = compulsory ? { kind: "compulsory", policy: rule.insurance } : { kind: "optional", bearer: risk };
  const where = STAGES[stage]!.vi.toLowerCase();
  const parts = [
    `${rule.code}: tại chặng “${where}”, ${PARTY_VI[risk].toLowerCase()} chịu rủi ro tổn thất`,
    `chi phí chặng này do ${PARTY_VI[cost].toLowerCase()} trả`,
  ];
  if (risk !== cost)
    parts.push(
      rule.group === "C"
        ? "— rủi ro và chi phí chuyển ở hai điểm khác nhau (hai điểm tới hạn của nhóm C)"
        : "— chi phí thủ tục do bên có nghĩa vụ làm thủ tục chịu",
    );
  const ins = compulsory
    ? `Người bán bắt buộc mua bảo hiểm ${rule.insurance} cho chặng này (${rule.code}).`
    : `Không có bảo hiểm bắt buộc; ${PARTY_VI[risk].toLowerCase()} (bên chịu rủi ro) có thể tự mua bảo hiểm.`;
  return { risk, cost, mainCarriage: rule.mainCarriage, insurance, explanationVi: `${parts.join(", ")}. ${ins}` };
}

/** Deterministic PRNG (mulberry32) for the incident challenge. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Challenge {
  rule: IncotermRule["code"];
  incident: IncidentPreset;
}

/** N (rule, incident) pairs for "Ai chịu rủi ro?" — distinct pairs, seeded. */
export function buildChallenge(rules: IncotermRule[], n: number, seed: number): Challenge[] {
  const r = rng(seed);
  const out: Challenge[] = [];
  const seen = new Set<string>();
  while (out.length < n && seen.size < rules.length * INCIDENTS.length) {
    const rule = rules[Math.floor(r() * rules.length)]!;
    const incident = INCIDENTS[Math.floor(r() * INCIDENTS.length)]!;
    const key = `${rule.code}-${incident.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ rule: rule.code, incident });
  }
  return out;
}
