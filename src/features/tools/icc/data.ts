/** Table 6.2 (KB §4.5) — slide values kept as-is; cells flagged `errata` carry the E-04 footnote. */
export const POLICIES = ["AR", "WA", "FPA", "ICC-A", "ICC-B", "ICC-C"] as const;
export type Policy = (typeof POLICIES)[number];

export const POLICY_LABEL: Record<Policy, string> = {
  AR: "AR (All Risks)",
  WA: "WA (With Average)",
  FPA: "FPA (Free of Particular Average)",
  "ICC-A": "ICC (A)",
  "ICC-B": "ICC (B)",
  "ICC-C": "ICC (C)",
};

export type PerilTier = "major" | "b-adds" | "a-adds" | "special";

export interface Peril {
  id: string;
  en: string;
  vi: string;
  /** Y/N per policy, order = POLICIES. */
  cover: [boolean, boolean, boolean, boolean, boolean, boolean];
  tier: PerilTier;
  /** Policies whose "Y" is subject to ERRATA E-04. */
  errata?: Policy[];
}

const Y = true;
const N = false;

export const PERILS: Peril[] = [
  { id: "collision", en: "Collision", vi: "Đâm va", cover: [Y, Y, Y, Y, Y, Y], tier: "major" },
  { id: "discharge", en: "Discharge of cargo at port", vi: "Dỡ hàng tại cảng", cover: [Y, Y, Y, Y, Y, Y], tier: "major" },
  { id: "ga-salvage", en: "Cost of general average and salvage", vi: "Chi phí tổn thất chung & cứu hộ", cover: [Y, Y, Y, Y, Y, Y], tier: "major" },
  { id: "jettison", en: "Jettison", vi: "Ném hàng xuống biển", cover: [Y, Y, Y, Y, Y, Y], tier: "major" },
  { id: "overturning", en: "Overturning or derailment of land conveyance", vi: "Lật/trật bánh phương tiện vận tải bộ/đường sắt", cover: [Y, Y, Y, Y, Y, Y], tier: "major" },
  { id: "grounded", en: "Vessel grounded, sunk, or stranded", vi: "Tàu mắc cạn, chìm, mắc kẹt", cover: [Y, Y, Y, Y, Y, Y], tier: "major" },
  { id: "earthquake", en: "Earthquake, volcano, lightning", vi: "Động đất, núi lửa, sét", cover: [Y, Y, N, Y, Y, N], tier: "b-adds" },
  { id: "water-entry", en: "Entry of sea, lake, or river water into vessel or storage", vi: "Nước biển/hồ/sông tràn vào tàu hoặc nơi chứa hàng", cover: [Y, Y, N, Y, Y, N], tier: "b-adds" },
  { id: "total-loss-overboard", en: "Total loss of cargo overboard or during loading/unloading", vi: "Tổn thất toàn bộ do rơi xuống biển hoặc khi xếp/dỡ", cover: [Y, Y, N, Y, Y, N], tier: "b-adds" },
  { id: "washing-overboard", en: "Washing overboard", vi: "Bị sóng cuốn", cover: [Y, Y, N, Y, Y, N], tier: "b-adds" },
  { id: "external-cause", en: "Breakage, loss, or damage from any external cause", vi: "Vỡ/mất/hư hỏng do mọi nguyên nhân bên ngoài", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "contact", en: "Contact with other cargo", vi: "Va chạm với hàng khác", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "deliberate", en: "Deliberate damage or destruction", vi: "Cố ý phá hoại", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "fresh-water", en: "Fresh water", vi: "Nước ngọt", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "hook", en: "Hook damage, mud grease", vi: "Móc cẩu, bùn, dầu mỡ", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "stowage", en: "Improper stowage by shipowner", vi: "Xếp hàng sai cách do chủ tàu", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "nondelivery", en: "Nondelivery", vi: "Không giao hàng", cover: [Y, N, N, Y, Y, Y], tier: "special", errata: ["ICC-B", "ICC-C"] },
  { id: "pilferage", en: "Pilferage", vi: "Mất cắp một phần", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "sweat", en: "Ship sweat, steam of hold", vi: "Mồ hôi tàu, hơi nước hầm tàu", cover: [Y, N, N, Y, N, N], tier: "a-adds" },
  { id: "theft", en: "Theft", vi: "Trộm cắp", cover: [Y, N, N, Y, Y, Y], tier: "special", errata: ["ICC-B", "ICC-C"] },
];

export const E04_NOTE =
  "Ghi chú về slide (ERRATA E-04): Bảng 6.2 ghi ICC (B)/(C) = Y cho Theft và Nondelivery. Trong bộ Institute Cargo Clauses (B) & (C) chính thức, trộm cắp/không giao hàng không phải là rủi ro được nêu tên — thường phải mua thêm điều khoản mở rộng (ví dụ TPND).";

export function covers(peril: Peril, policy: Policy): boolean {
  return peril.cover[POLICIES.indexOf(policy)] ?? false;
}
