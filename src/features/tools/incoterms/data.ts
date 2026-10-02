/**
 * Incoterms® 2020 data — KB §3.8 (obligation matrix) + §3.5 (mode groups).
 * Stage-level cost/risk splits follow the ICC "COSTS / RISKS" diagrams on the C3 slides:
 * seller pays until delivery (C-rules: plus main carriage up to arrival at destination);
 * risk passes at delivery; unloading at destination is the buyer's except under DPU.
 */
export type Party = "S" | "B";

export const STAGES = [
  { id: "seller-premises", vi: "Cơ sở người bán", en: "Seller premises" },
  { id: "pre-carriage", vi: "Vận tải chặng đầu", en: "Pre-carriage" },
  { id: "export-clearance", vi: "Thông quan XK", en: "Export clearance" },
  { id: "loading", vi: "Cảng/nơi bốc hàng", en: "Port/place of loading (on board / first carrier)" },
  { id: "main-carriage", vi: "Vận tải chặng chính", en: "Main carriage" },
  { id: "destination", vi: "Cảng/nơi đến", en: "Port/place of destination" },
  { id: "unloading", vi: "Dỡ hàng", en: "Unloading" },
  { id: "import-clearance", vi: "Thông quan NK", en: "Import clearance" },
  { id: "buyer-premises", vi: "Cơ sở người mua", en: "Buyer premises" },
] as const;

export type RuleCode = "EXW" | "FCA" | "FAS" | "FOB" | "CFR" | "CIF" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP";

export interface IncotermRule {
  code: RuleCode;
  name: string;
  group: "E" | "F" | "C" | "D";
  mode: "any" | "sea";
  namedPlace: string;
  exportLicence: Party;
  importLicence: Party;
  mainCarriage: Party;
  insurance: "none" | "ICC (C)" | "ICC (A)";
  deliveryEn: string;
  deliveryVi: string;
  /** Who pays the costs of each stage (index = STAGES). */
  costs: Party[];
  /** Who bears the risk of loss/damage at each stage. */
  risks: Party[];
  /** Stages covered by the seller's compulsory insurance (CIF/CIP only). */
  insuredStages: number[];
  notesVi: string[];
}

const p = (s: string): Party[] => s.split("").map((c) => (c === "S" ? "S" : "B"));

export const RULES: IncotermRule[] = [
  {
    code: "EXW",
    name: "Ex Works",
    group: "E",
    mode: "any",
    namedPlace: "Named place of delivery",
    exportLicence: "B",
    importLicence: "B",
    mainCarriage: "B",
    insurance: "none",
    deliveryEn: "Goods placed at the buyer's disposal at the named place (factory/warehouse), not loaded",
    deliveryVi: "Hàng đặt dưới quyền định đoạt của người mua tại nơi chỉ định (xưởng/kho), chưa bốc lên phương tiện",
    costs: p("BBBBBBBBB"),
    risks: p("BBBBBBBBB"),
    insuredStages: [],
    notesVi: [
      "Nghĩa vụ tối thiểu của người bán: người mua làm cả thủ tục xuất khẩu.",
      "Nơi chỉ định có thể là hoặc không phải cơ sở của người bán.",
    ],
  },
  {
    code: "FCA",
    name: "Free Carrier",
    group: "F",
    mode: "any",
    namedPlace: "Named place of delivery",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "B",
    insurance: "none",
    deliveryEn:
      "Delivered to the carrier: at seller's premises → once loaded on the means of transport; any other place → on seller's means of transport, ready for unloading",
    deliveryVi:
      "Giao cho người chuyên chở: tại cơ sở người bán → khi đã bốc lên phương tiện; nơi khác → trên phương tiện của người bán, sẵn sàng để dỡ",
    costs: p("SSSBBBBBB"),
    risks: p("SSSBBBBBB"),
    insuredStages: [],
    notesVi: [
      "Sơ đồ mặc định: nơi giao là một địa điểm khác cơ sở người bán (ví dụ bãi/terminal của người chuyên chở).",
      "Incoterms® 2020: các bên có thể thỏa thuận người mua chỉ thị người chuyên chở cấp vận đơn đã bốc hàng (on-board B/L) cho người bán.",
    ],
  },
  {
    code: "FAS",
    name: "Free Alongside Ship",
    group: "F",
    mode: "sea",
    namedPlace: "Named port of shipment",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "B",
    insurance: "none",
    deliveryEn: "Placed alongside the ship (on quay or barge) nominated by the buyer at the named port of shipment",
    deliveryVi: "Đặt dọc mạn tàu (trên cầu cảng hoặc sà lan) do người mua chỉ định tại cảng bốc hàng quy định",
    costs: p("SSSBBBBBB"),
    risks: p("SSSBBBBBB"),
    insuredStages: [],
    notesVi: ["Chi phí và rủi ro bốc hàng lên tàu thuộc người mua (khác FOB)."],
  },
  {
    code: "FOB",
    name: "Free On Board",
    group: "F",
    mode: "sea",
    namedPlace: "Named port of shipment",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "B",
    insurance: "none",
    deliveryEn: "On board the vessel nominated by the buyer at the named port of shipment",
    deliveryVi: "Hàng đã xếp lên tàu do người mua chỉ định tại cảng bốc hàng quy định",
    costs: p("SSSSBBBBB"),
    risks: p("SSSSBBBBB"),
    insuredStages: [],
    notesVi: ["Người mua thuê tàu và trả cước chặng chính."],
  },
  {
    code: "CFR",
    name: "Cost and Freight",
    group: "C",
    mode: "sea",
    namedPlace: "Named port of destination",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "S",
    insurance: "none",
    deliveryEn: "On board the vessel at the port of shipment",
    deliveryVi: "Hàng đã xếp lên tàu tại cảng bốc hàng",
    costs: p("SSSSSSBBB"),
    risks: p("SSSSBBBBB"),
    insuredStages: [],
    notesVi: [
      "Hai điểm tới hạn: rủi ro chuyển ở cảng đi (on board), nhưng người bán trả cước đến cảng đích.",
      "Không có nghĩa vụ mua bảo hiểm; người mua chịu rủi ro chặng chính nên có thể tự mua.",
    ],
  },
  {
    code: "CIF",
    name: "Cost, Insurance and Freight",
    group: "C",
    mode: "sea",
    namedPlace: "Named port of destination",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "S",
    insurance: "ICC (C)",
    deliveryEn: "On board the vessel at the port of shipment",
    deliveryVi: "Hàng đã xếp lên tàu tại cảng bốc hàng",
    costs: p("SSSSSSBBB"),
    risks: p("SSSSBBBBB"),
    insuredStages: [4, 5],
    notesVi: [
      "“CIF Hamburg” ≠ rủi ro chuyển ở Hamburg: rủi ro chuyển khi hàng lên tàu ở cảng đi.",
      "Người bán mua bảo hiểm tối thiểu ICC (C) — cho rủi ro mà người mua đang chịu.",
    ],
  },
  {
    code: "CPT",
    name: "Carriage Paid To",
    group: "C",
    mode: "any",
    namedPlace: "Named place of destination",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "S",
    insurance: "none",
    deliveryEn: "Delivered to the first carrier",
    deliveryVi: "Giao cho người chuyên chở đầu tiên",
    costs: p("SSSSSSBBB"),
    risks: p("SSSBBBBBB"),
    insuredStages: [],
    notesVi: [
      "Rủi ro chuyển khi giao cho người chuyên chở đầu tiên; người bán trả cước đến nơi đích.",
      "Phiên bản đa phương thức của CFR.",
    ],
  },
  {
    code: "CIP",
    name: "Carriage and Insurance Paid To",
    group: "C",
    mode: "any",
    namedPlace: "Named place of destination",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "S",
    insurance: "ICC (A)",
    deliveryEn: "Delivered to the first carrier",
    deliveryVi: "Giao cho người chuyên chở đầu tiên",
    costs: p("SSSSSSBBB"),
    risks: p("SSSBBBBBB"),
    insuredStages: [3, 4, 5],
    notesVi: ["Người bán mua bảo hiểm ICC (A) — mức cao hơn CIF (ICC (C))."],
  },
  {
    code: "DAP",
    name: "Delivered at Place",
    group: "D",
    mode: "any",
    namedPlace: "Named place of destination",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "S",
    insurance: "none",
    deliveryEn: "At the buyer's disposal on the arriving means of transport, ready for unloading, at the named place",
    deliveryVi: "Đặt dưới quyền định đoạt của người mua trên phương tiện vận tải đến, sẵn sàng để dỡ, tại nơi chỉ định",
    costs: p("SSSSSSBBB"),
    risks: p("SSSSSSBBB"),
    insuredStages: [],
    notesVi: ["Người mua dỡ hàng và làm thủ tục nhập khẩu."],
  },
  {
    code: "DPU",
    name: "Delivered at Place Unloaded",
    group: "D",
    mode: "any",
    namedPlace: "Named place of destination",
    exportLicence: "S",
    importLicence: "B",
    mainCarriage: "S",
    insurance: "none",
    deliveryEn: "Once unloaded from the arriving means of transport, at the named place",
    deliveryVi: "Khi hàng đã được dỡ khỏi phương tiện vận tải đến, tại nơi chỉ định",
    costs: p("SSSSSSSBB"),
    risks: p("SSSSSSSBB"),
    insuredStages: [],
    notesVi: ["Điều kiện duy nhất người bán phải dỡ hàng tại nơi đến.", "Thay cho DAT (Incoterms 2010); nơi đến không bắt buộc là terminal."],
  },
  {
    code: "DDP",
    name: "Delivered Duty Paid",
    group: "D",
    mode: "any",
    namedPlace: "Named place of destination",
    exportLicence: "S",
    importLicence: "S",
    mainCarriage: "S",
    insurance: "none",
    deliveryEn: "At the buyer's disposal, cleared for import, on the arriving means ready for unloading, at the named place",
    deliveryVi: "Đặt dưới quyền định đoạt của người mua, đã thông quan nhập khẩu, trên phương tiện đến sẵn sàng để dỡ, tại nơi chỉ định",
    costs: p("SSSSSSBSB"),
    risks: p("SSSSSSBSB"),
    insuredStages: [],
    notesVi: [
      "Nghĩa vụ tối đa của người bán: làm cả thủ tục nhập khẩu.",
      "Thông quan NK do người bán thực hiện trước khi giao hàng; việc dỡ hàng sau khi giao thuộc người mua.",
    ],
  },
];

export const RULE_BY_CODE = Object.fromEntries(RULES.map((r) => [r.code, r])) as Record<RuleCode, IncotermRule>;

/** FCA when the named place is the seller's premises: delivery once loaded, so the buyer takes over from loading. */
export const FCA_AT_PREMISES: Pick<IncotermRule, "costs" | "risks"> = {
  // Export clearance remains a seller obligation (cost), but risk has already passed on loading.
  costs: p("SBSBBBBBB"),
  risks: p("SBBBBBBBB"),
};

export const PARTY_VI: Record<Party, string> = { S: "Người bán", B: "Người mua" };
