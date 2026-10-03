/**
 * Master trade journey (DIAGRAMS_PROMPT §5): one transaction across 8 swimlanes × 11 phases, rebuilt for
 * any Incoterms rule × payment method × transport mode. Pure; encodes only KB facts (§3.8, §5.3–5.5, §8).
 */
import type { ChapterId } from "@/config/chapters";
import { PARTY_VI, RULE_BY_CODE, type Party, type RuleCode } from "@/features/tools/incoterms/data";

export const LANES = [
  { id: "seller", vi: "Người bán", en: "Seller" },
  { id: "sellerBank", vi: "Ngân hàng người bán", en: "Seller's bank" },
  { id: "carrier", vi: "Người chuyên chở / giao nhận", en: "Carrier / Forwarder" },
  { id: "exportCustoms", vi: "Hải quan xuất khẩu", en: "Export customs" },
  { id: "insurer", vi: "Bảo hiểm", en: "Insurer" },
  { id: "importCustoms", vi: "Hải quan nhập khẩu", en: "Import customs" },
  { id: "buyerBank", vi: "Ngân hàng người mua", en: "Buyer's bank" },
  { id: "buyer", vi: "Người mua", en: "Buyer" },
] as const;
export type LaneId = (typeof LANES)[number]["id"];

export const PHASES: { n: number; vi: string; chapters: ChapterId[] }[] = [
  { n: 1, vi: "Lập kế hoạch & báo giá", chapters: ["C1", "C2", "C3"] },
  { n: 2, vi: "Ký hợp đồng", chapters: ["C6"] },
  { n: 3, vi: "Thiết lập thanh toán", chapters: ["C5"] },
  { n: 4, vi: "Chuẩn bị & kiểm tra hàng", chapters: ["C8"] },
  { n: 5, vi: "Thuê vận tải & mua bảo hiểm", chapters: ["C3", "C4"] },
  { n: 6, vi: "Thông quan xuất khẩu", chapters: ["C8"] },
  { n: 7, vi: "Giao hàng → chuyển rủi ro", chapters: ["C3"] },
  { n: 8, vi: "Vận tải chính", chapters: ["C3"] },
  { n: 9, vi: "Chứng từ & thanh toán", chapters: ["C5", "C7"] },
  { n: 10, vi: "Thông quan NK & nhận hàng", chapters: ["C8"] },
  { n: 11, vi: "Kiểm tra, khiếu nại, tranh chấp", chapters: ["C6", "C4"] },
];

export const PAYMENTS = [
  { id: "tt-advance", label: "T/T trả trước" },
  { id: "tt-deferred", label: "T/T trả sau" },
  { id: "dp", label: "D/P" },
  { id: "da", label: "D/A" },
  { id: "lc", label: "L/C trả ngay" },
] as const;
export type PaymentId = (typeof PAYMENTS)[number]["id"];

export const MODES = [
  { id: "sea", label: "Đường biển" },
  { id: "air", label: "Hàng không" },
  { id: "road", label: "Đường bộ" },
] as const;
export type TransportMode = (typeof MODES)[number]["id"];

export type CardKind = "goods" | "document" | "money" | "info" | "action";

export interface JourneyCard {
  id: string;
  /** Global order of events (play order). */
  seq: number;
  phase: number;
  /** Lane of the party performing the event. */
  lane: LaneId;
  /** Receiving lane for flows. */
  to?: LaneId;
  kind: CardKind;
  titleVi: string;
  detailVi: string;
  documents?: string[];
  learn: string;
  topic?: string;
  /** Optional step (not compulsory under this scenario). */
  optional?: boolean;
}

export type RiskWhere =
  | "disposal-not-loaded"
  | "loaded-at-premises"
  | "carrier-other-place"
  | "alongside-ship"
  | "on-board"
  | "first-carrier"
  | "ready-for-unloading"
  | "unloaded"
  | "cleared-ready-for-unloading";

export interface Journey {
  ok: true;
  rule: RuleCode;
  payment: PaymentId;
  mode: TransportMode;
  transportDoc: string;
  exportClearance: Party;
  importClearance: Party;
  mainCarriage: Party;
  unloadedBy: Party;
  insurance: { mandatory: boolean; by: Party; policy: "ICC (A)" | "ICC (C)" | null; noteVi: string };
  /** ⚑ risk transfer marker on the goods lane. */
  risk: { phase: number; where: RiskWhere; labelVi: string };
  /** $ cost transfer marker (differs from the risk marker under C-rules). */
  cost: { phase: number; labelVi: string };
  cards: JourneyCard[];
}

export interface JourneyError {
  ok: false;
  reasonVi: string;
}

const SEA_ONLY: RuleCode[] = ["FAS", "FOB", "CFR", "CIF"];

/** Rules allowed for a transport mode (KB §3.5: FAS/FOB/CFR/CIF are for sea and inland waterway only). */
export const ruleAllowed = (rule: RuleCode, mode: TransportMode) => mode === "sea" || !SEA_ONLY.includes(rule);

const RISK_WHERE: Record<RuleCode, RiskWhere> = {
  EXW: "disposal-not-loaded",
  FCA: "carrier-other-place",
  FAS: "alongside-ship",
  FOB: "on-board",
  CFR: "on-board",
  CIF: "on-board",
  CPT: "first-carrier",
  CIP: "first-carrier",
  DAP: "ready-for-unloading",
  DPU: "unloaded",
  DDP: "cleared-ready-for-unloading",
};

const LANE_OF: Record<Party, LaneId> = { S: "seller", B: "buyer" };

export function buildJourney(rule: RuleCode, payment: PaymentId, mode: TransportMode, opts: { fcaAtPremises?: boolean } = {}): Journey | JourneyError {
  if (!ruleAllowed(rule, mode))
    return {
      ok: false,
      reasonVi: `${rule} chỉ dùng cho vận tải đường biển và thủy nội địa (KB §3.5) – không dùng cho ${mode === "air" ? "hàng không" : "đường bộ"}. Với hàng không/đường bộ hãy dùng FCA, CPT hoặc CIP.`,
    };
  const r = RULE_BY_CODE[rule];
  const group = r.group;
  const transportDoc = mode === "air" ? "Air waybill (AWB)" : mode === "sea" ? "Bill of lading (B/L)" : "Transport document";
  const docShort = mode === "air" ? "AWB" : mode === "sea" ? "B/L" : "chứng từ vận tải";
  const where: RiskWhere = rule === "FCA" && opts.fcaAtPremises ? "loaded-at-premises" : RISK_WHERE[rule];
  const riskBearerMain: Party = group === "D" ? "S" : "B";
  const insurance: Journey["insurance"] =
    rule === "CIF"
      ? { mandatory: true, by: "S", policy: "ICC (C)", noteVi: "CIF: người bán bắt buộc mua bảo hiểm, tối thiểu ICC (C)." }
      : rule === "CIP"
        ? { mandatory: true, by: "S", policy: "ICC (A)", noteVi: "CIP: người bán bắt buộc mua bảo hiểm ICC (A)." }
        : {
            mandatory: false,
            by: riskBearerMain,
            policy: null,
            noteVi: `${rule}: không có nghĩa vụ bảo hiểm; ${PARTY_VI[riskBearerMain].toLowerCase()} chịu rủi ro chặng chính nên có thể tự mua.`,
          };

  const deliveryAtOrigin = group !== "D";
  const cards: JourneyCard[] = [];
  let seq = 0;
  const add = (c: Omit<JourneyCard, "seq" | "id"> & { id?: string }) => {
    seq++;
    cards.push({ id: c.id ?? `c${seq}`, seq, ...c });
  };

  const deliverCard = (phase: number) =>
    add({
      id: "deliver",
      phase,
      lane: "seller",
      to: rule === "EXW" || group === "D" ? "buyer" : "carrier",
      kind: "goods",
      titleVi: `Giao hàng theo ${rule}`,
      detailVi: `${r.deliveryVi}. Rủi ro chuyển sang người mua tại điểm này.`,
      learn: "/learn/c3#obligation-matrix",
      topic: `rule-${rule.toLowerCase()}`,
    });

  // 1 – plan & quote
  add({ phase: 1, lane: "seller", to: "buyer", kind: "info", titleVi: `Báo giá theo ${rule}`, detailVi: `Người bán tính giá xuất khẩu theo điều kiện ${rule} (${r.namedPlace}) và gửi báo giá.`, learn: "/learn/c3#pricing-approaches", topic: "order-process" });
  // 2 – contract
  add({ phase: 2, lane: "seller", to: "buyer", kind: "info", titleVi: "Ký hợp đồng mua bán", detailVi: `Ghi đúng “${rule} + nơi chỉ định + Incoterms® 2020” và phương thức thanh toán ${PAYMENTS.find((p) => p.id === payment)!.label}.`, documents: ["Sales contract"], learn: "/learn/c6#contract-structure", topic: "contract-structure" });

  // 3 – payment set-up
  if (payment === "tt-advance") {
    add({ id: "pay-instruct", phase: 3, lane: "buyer", to: "buyerBank", kind: "info", titleVi: "Người mua chỉ thị chuyển tiền", detailVi: "T/T trả trước: người mua chỉ thị ngân hàng chuyển tiền TRƯỚC khi có hàng.", learn: "/learn/c5#remittance", topic: "tt-advance" });
    add({ id: "pay-money", phase: 3, lane: "buyerBank", to: "sellerBank", kind: "money", titleVi: "Chuyển tiền sang ngân hàng người bán", detailVi: "Ngân hàng bên nhập khẩu chuyển tiền sang ngân hàng bên xuất khẩu.", learn: "/learn/c5#remittance", topic: "tt-advance" });
    add({ phase: 3, lane: "sellerBank", to: "seller", kind: "money", titleVi: "Ghi có cho người bán", detailVi: "Người bán nhận tiền trước khi giao hàng → rủi ro thuộc về người mua.", learn: "/learn/c5#remittance", topic: "tt-advance" });
  } else if (payment === "lc") {
    add({ id: "lc-open", phase: 3, lane: "buyer", to: "buyerBank", kind: "info", titleVi: "Người mua mở L/C", detailVi: "Người mua (applicant) làm đơn mở L/C tại ngân hàng phát hành – trước khi người bán giao hàng.", learn: "/learn/c5#lc-procedure", topic: "lc-procedure" });
    add({ phase: 3, lane: "buyerBank", to: "sellerBank", kind: "info", titleVi: "Phát hành L/C", detailVi: "Ngân hàng phát hành chuyển L/C cho ngân hàng thông báo.", documents: ["Letter of credit (L/C)"], learn: "/learn/c5#lc-procedure", topic: "lc-procedure" });
    add({ phase: 3, lane: "sellerBank", to: "seller", kind: "info", titleVi: "Thông báo L/C – người bán kiểm tra", detailVi: "Ngân hàng thông báo báo L/C; người bán kiểm tra L/C theo checklist 14 điểm.", learn: "/learn/c5#lc-checklist", topic: "lc-checklist" });
  } else if (payment === "dp" || payment === "da") {
    add({ phase: 3, lane: "seller", kind: "action", titleVi: `Thỏa thuận nhờ thu ${payment === "dp" ? "D/P" : "D/A"}`, detailVi: `Người bán sẽ ký phát hối phiếu ${payment === "dp" ? "trả ngay (sight draft)" : "có kỳ hạn (time draft)"} sau khi giao hàng; ngân hàng không bảo đảm thanh toán.`, learn: "/learn/c5#documentary-collection", topic: "dp-da" });
  } else {
    add({ phase: 3, lane: "seller", kind: "action", titleVi: "T/T trả sau: chưa có thanh toán", detailVi: "Hàng đi trước, tiền đi sau → rủi ro thuộc về người bán.", learn: "/learn/c5#remittance", topic: "tt-deferred" });
  }

  // 4 – prepare & inspect
  add({ phase: 4, lane: "seller", kind: "action", titleVi: "Chuẩn bị hàng", detailVi: "Đóng gói, dán nhãn, ghi ký mã hiệu, chuẩn bị chứng từ xuất khẩu.", documents: ["Commercial invoice", "Packing list"], learn: "/learn/c8#export-procedure", topic: "export-procedure" });
  add({ phase: 4, lane: "seller", kind: "action", optional: true, titleVi: "Kiểm tra hàng (nếu yêu cầu)", detailVi: "Chỉ khi hợp đồng, L/C hoặc quy định yêu cầu.", documents: ["Inspection certificate"], learn: "/learn/c8#export-procedure", topic: "export-procedure" });

  if (rule === "EXW") deliverCard(4);

  // 5 – transport & insurance
  add({ phase: 5, lane: LANE_OF[r.mainCarriage], to: "carrier", kind: "info", titleVi: `${PARTY_VI[r.mainCarriage]} thuê vận tải chính`, detailVi: `${rule}: ${r.mainCarriage === "S" ? "nhóm C & D – người bán" : "nhóm E & F – người mua"} ký hợp đồng vận tải chính.`, learn: "/learn/c8#incoterms-procedure-link", topic: "incoterms-procedure-link" });
  add({
    phase: 5,
    lane: LANE_OF[insurance.by],
    to: "insurer",
    kind: "info",
    optional: !insurance.mandatory,
    titleVi: insurance.mandatory ? `Người bán mua bảo hiểm ${insurance.policy}` : `${PARTY_VI[insurance.by]} có thể mua bảo hiểm`,
    detailVi: insurance.noteVi,
    documents: insurance.mandatory ? ["Insurance certificate"] : undefined,
    learn: "/learn/c4#incoterms-insurance",
    topic: "incoterms-insurance",
  });

  // 6 – export clearance
  add({ phase: 6, lane: LANE_OF[r.exportLicence], to: "exportCustoms", kind: "document", titleVi: `${PARTY_VI[r.exportLicence]} làm thủ tục xuất khẩu`, detailVi: rule === "EXW" ? "EXW: người mua làm cả thủ tục xuất khẩu." : "Khai báo xuất khẩu, kiểm tra chứng từ, kiểm hóa, thông quan.", documents: ["Export declaration", "Commercial invoice", "Packing list"], learn: "/learn/c8#export-procedure", topic: rule === "EXW" ? "rule-exw" : "export-procedure" });

  // 7 – delivery (risk transfer at origin for E/F/C rules)
  if (group === "F" || group === "C") deliverCard(7);
  else
    add({
      phase: 7,
      lane: rule === "EXW" ? "buyer" : "seller",
      to: "carrier",
      kind: "goods",
      titleVi: rule === "EXW" ? "Người mua tự bốc hàng và giao cho người chuyên chở" : "Người bán giao hàng cho người chuyên chở",
      detailVi: rule === "EXW" ? "EXW: hàng đã được giao (chưa bốc) – từ đây người mua chịu mọi chi phí, rủi ro." : `${rule}: người bán vẫn chịu rủi ro – hàng chưa được giao cho người mua.`,
      learn: "/learn/c3#obligation-matrix",
      topic: `rule-${rule.toLowerCase()}`,
    });

  // 8 – main carriage
  add({ phase: 8, lane: "carrier", to: "seller", kind: "document", titleVi: `Người chuyên chở cấp ${docShort}`, detailVi: `Chứng từ vận tải: ${transportDoc}.${mode === "sea" ? " B/L là chứng từ sở hữu hàng hóa." : ""}`, documents: [transportDoc], learn: "/learn/c7#bl-functions", topic: "bl-functions" });
  add({ phase: 8, lane: "carrier", kind: "goods", titleVi: "Vận tải chính", detailVi: `Cước do ${PARTY_VI[r.mainCarriage].toLowerCase()} trả; rủi ro chặng này: ${PARTY_VI[riskBearerMain].toLowerCase()}.${insurance.mandatory ? ` Có bảo hiểm ${insurance.policy} do người bán mua.` : ""}`, learn: "/learn/c3#carriage-stages", topic: "carriage-stages" });

  // 9 – documents & payment
  const docs = ["Commercial invoice", "Packing list", transportDoc];
  if (payment === "lc") {
    add({ phase: 9, lane: "seller", to: "sellerBank", kind: "document", titleVi: "Xuất trình chứng từ theo L/C", detailVi: "Không muộn hơn 21 ngày sau ngày giao hàng và trong thời hạn hiệu lực của L/C.", documents: docs, learn: "/learn/c5#lc-dates", topic: "lc-dates" });
    add({ phase: 9, lane: "sellerBank", to: "buyerBank", kind: "document", titleVi: "Chuyển chứng từ cho ngân hàng phát hành", detailVi: "Ngân hàng chỉ xét chứng từ, không xét hàng hóa.", learn: "/learn/c5#lc-procedure", topic: "discrepancies" });
    add({ phase: 9, lane: "buyerBank", to: "sellerBank", kind: "money", titleVi: "Ngân hàng phát hành thanh toán", detailVi: "Kiểm tra, chấp nhận chứng từ phù hợp và thanh toán cho ngân hàng bên bán.", learn: "/learn/c5#lc-procedure", topic: "lc-procedure" });
    add({ id: "docs-release", phase: 9, lane: "buyerBank", to: "buyer", kind: "document", titleVi: "Giao chứng từ cho người mua", detailVi: "Người mua trả tiền hoặc bị ghi nợ tài khoản.", learn: "/learn/c5#lc-procedure", topic: "lc-procedure" });
    add({ phase: 9, lane: "buyer", to: "buyerBank", kind: "money", titleVi: "Người mua trả tiền / bị ghi nợ", detailVi: "Ngân hàng phát hành thu lại khoản đã trả.", learn: "/learn/c5#lc-procedure", topic: "lc-procedure" });
    add({ phase: 9, lane: "sellerBank", to: "seller", kind: "money", titleVi: "Người bán được trả tiền", detailVi: "Theo slide: ngân hàng thông báo trả tiền cho người bán (xem ERRATA E-15).", learn: "/learn/c5#lc-procedure", topic: "lc-procedure" });
  } else if (payment === "dp" || payment === "da") {
    const dp = payment === "dp";
    add({ phase: 9, lane: "seller", to: "sellerBank", kind: "document", titleVi: "Xuất trình chứng từ + hối phiếu cho ngân hàng chuyển", detailVi: "Người bán giao bộ chứng từ cho remitting bank.", documents: ["Bill of exchange (draft)", ...docs], learn: "/learn/c5#documentary-collection", topic: "documentary-collection" });
    add({ phase: 9, lane: "sellerBank", to: "buyerBank", kind: "document", titleVi: "Chuyển chứng từ đến ngân hàng thu hộ", detailVi: "Ngân hàng thu hộ GIỮ chứng từ.", learn: "/learn/c5#documentary-collection", topic: "documentary-collection" });
    if (dp) add({ id: "pay-money", phase: 9, lane: "buyer", to: "buyerBank", kind: "money", titleVi: "Người mua trả tiền (D/P)", detailVi: "Trả tiền theo hối phiếu trả ngay tại ngân hàng thu hộ.", learn: "/learn/c5#documentary-collection", topic: "dp-da" });
    else add({ id: "accept", phase: 9, lane: "buyer", to: "buyerBank", kind: "info", titleVi: "Người mua ký chấp nhận hối phiếu (D/A)", detailVi: "Chấp nhận hối phiếu có kỳ hạn, hứa trả tiền sau.", learn: "/learn/c5#documentary-collection", topic: "dp-da" });
    add({ id: "docs-release", phase: 9, lane: "buyerBank", to: "buyer", kind: "document", titleVi: dp ? "Giao chứng từ sau khi trả tiền" : "Giao chứng từ sau khi chấp nhận", detailVi: dp ? "D/P: chứng từ đổi lấy tiền." : "D/A: chứng từ đổi lấy chữ ký chấp nhận – người mua có chứng từ TRƯỚC khi trả tiền.", learn: "/learn/c5#documentary-collection", topic: "dp-da" });
    if (dp) {
      add({ phase: 9, lane: "buyerBank", to: "sellerBank", kind: "money", titleVi: "Ngân hàng thu hộ chuyển tiền", detailVi: "Chuyển tiền thu được sang ngân hàng chuyển.", learn: "/learn/c5#documentary-collection", topic: "documentary-collection" });
      add({ phase: 9, lane: "sellerBank", to: "seller", kind: "money", titleVi: "Người bán nhận tiền", detailVi: "Ngân hàng không bảo đảm thanh toán – chỉ chuyển số tiền thu được.", learn: "/learn/c5#documentary-collection", topic: "documentary-collection" });
    } else {
      add({ phase: 9, lane: "buyerBank", to: "sellerBank", kind: "info", titleVi: "Báo chấp nhận cho ngân hàng chuyển", detailVi: "Ngân hàng thu hộ báo việc chấp nhận hối phiếu.", learn: "/learn/c5#documentary-collection", topic: "documentary-collection" });
    }
  } else {
    add({ phase: 9, lane: "seller", to: "buyer", kind: "document", titleVi: "Gửi chứng từ theo hợp đồng", detailVi: "T/T: chứng từ gửi theo thỏa thuận trong hợp đồng.", documents: docs, learn: "/learn/c8#export-procedure", topic: "export-procedure" });
  }

  // 10 – import clearance & take delivery
  add({ phase: 10, lane: LANE_OF[r.importLicence], to: "importCustoms", kind: "document", titleVi: `${PARTY_VI[r.importLicence]} làm thủ tục nhập khẩu`, detailVi: rule === "DDP" ? "DDP: người bán làm cả thủ tục nhập khẩu, nộp thuế nhập khẩu." : "Nộp tờ khai, chứng từ, thuế và phí nhập khẩu.", documents: ["Import declaration"], learn: "/learn/c8#import-procedure", topic: rule === "DDP" ? "rule-ddp" : "import-procedure" });
  if (group === "D") deliverCard(10);
  add({ phase: 10, lane: "buyer", to: "carrier", kind: "document", titleVi: `Người mua xuất trình ${docShort} để nhận hàng`, detailVi: mode === "sea" ? "Người chuyên chở giao hàng cho người cầm B/L." : "Người mua nhận hàng từ người chuyên chở.", learn: "/learn/c7#bl-functions", topic: "bl-functions" });
  add({ phase: 10, lane: LANE_OF[rule === "DPU" ? "S" : "B"], kind: "goods", titleVi: rule === "DPU" ? "Người bán dỡ hàng (DPU)" : "Người mua dỡ hàng", detailVi: rule === "DPU" ? "DPU là điều kiện duy nhất người bán phải dỡ hàng tại nơi đến." : "Dỡ hàng tại nơi đến thuộc người mua.", learn: "/learn/c3#obligation-matrix", topic: rule === "DPU" ? "rule-dpu" : "import-procedure" });
  add({ phase: 10, lane: "carrier", to: "buyer", kind: "goods", titleVi: "Người mua nhận hàng", detailVi: "Nhận hàng và vận chuyển nội địa về kho.", learn: "/learn/c8#import-procedure", topic: "import-procedure" });
  if (payment === "tt-deferred") {
    add({ phase: 10, lane: "buyer", to: "buyerBank", kind: "info", titleVi: "Người mua chỉ thị chuyển tiền", detailVi: "T/T trả sau: người mua trả tiền sau khi đã nhận hàng.", learn: "/learn/c5#remittance", topic: "tt-deferred" });
    add({ id: "pay-money", phase: 10, lane: "buyerBank", to: "sellerBank", kind: "money", titleVi: "Chuyển tiền cho ngân hàng người bán", detailVi: "Ngân hàng bên nhập khẩu chuyển tiền.", learn: "/learn/c5#remittance", topic: "tt-deferred" });
    add({ phase: 10, lane: "sellerBank", to: "seller", kind: "money", titleVi: "Người bán nhận tiền – sau cùng", detailVi: "Người bán chịu rủi ro suốt thời gian chờ.", learn: "/learn/c5#remittance", topic: "tt-deferred" });
  }

  // 11 – inspect, claim, disputes
  add({ phase: 11, lane: "buyer", kind: "action", titleVi: "Kiểm tra hàng", detailVi: "Số lượng, chất lượng, tình trạng, sự phù hợp với hợp đồng.", learn: "/learn/c8#import-procedure", topic: "import-procedure" });
  if (payment === "da")
    add({ id: "pay-money", phase: 11, lane: "buyer", to: "buyerBank", kind: "money", titleVi: "Trả tiền khi hối phiếu đến hạn (D/A)", detailVi: "Tiền đến sau cùng – phụ thuộc thiện chí người mua.", learn: "/learn/c5#documentary-collection", topic: "dp-da" });
  add({ phase: 11, lane: "buyer", to: "seller", kind: "info", optional: true, titleVi: "Khiếu nại (nếu có)", detailVi: "Với người bán, người chuyên chở hoặc công ty bảo hiểm khi có tổn thất/sai lệch.", learn: "/learn/c6#art-claim", topic: "art-claim" });

  const riskPhase = rule === "EXW" ? 4 : deliveryAtOrigin ? 7 : 10;
  const costPhase = group === "C" || group === "D" ? 10 : riskPhase;
  return {
    ok: true,
    rule,
    payment,
    mode,
    transportDoc,
    exportClearance: r.exportLicence,
    importClearance: r.importLicence,
    mainCarriage: r.mainCarriage,
    unloadedBy: rule === "DPU" ? "S" : "B",
    insurance,
    risk: { phase: riskPhase, where, labelVi: r.deliveryVi },
    cost: {
      phase: costPhase,
      labelVi: group === "C" ? "Người bán trả cước vận tải chính đến nơi đến" : group === "D" ? "Người bán chịu chi phí đến nơi đến" : "Chi phí chuyển cùng điểm giao hàng",
    },
    cards,
  };
}
