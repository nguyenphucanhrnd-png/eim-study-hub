/**
 * D5.7 — payment methods compared by the order of three events: goods shipped · documents released ·
 * money paid (KB §5.1–5.5). Pure data + helpers, unit-tested.
 */
export type EventKind = "goods" | "documents" | "money";

export interface TimelineEvent {
  kind: EventKind;
  /** Position on the timeline (1 = first). Equal slots happen at about the same time. */
  slot: number;
  textVi: string;
}

export interface MethodTimeline {
  id: "cash-in-advance" | "lc" | "dp" | "da" | "open-account" | "consignment";
  label: string;
  labelVi: string;
  /** Something that happens before the first event (e.g. the L/C is opened before shipment). */
  beforeVi?: string;
  events: TimelineEvent[];
  /** Why an event is not drawn (the slides do not describe it). */
  missingVi?: string;
  gapVi: string;
  source: string;
  topic: string;
  learn: string;
}

export const METHODS: MethodTimeline[] = [
  {
    id: "cash-in-advance",
    label: "Cash-in-advance",
    labelVi: "T/T trả trước",
    events: [
      { kind: "money", slot: 1, textVi: "Người mua chuyển tiền trước (bước 1–4)" },
      { kind: "goods", slot: 2, textVi: "Người bán giao hàng sau cùng (bước 5)" },
    ],
    missingVi: "Slide không mô tả riêng đường đi của chứng từ trong T/T.",
    gapVi: "Người MUA chịu rủi ro: đã trả tiền nhưng chưa có hàng – người bán có thể giao sai hoặc giao chậm.",
    source: "KB §5.3 · Slide C5 p.7",
    topic: "tt-advance",
    learn: "/learn/c5#remittance",
  },
  {
    id: "lc",
    label: "Letter of credit (L/C)",
    labelVi: "Thư tín dụng",
    beforeVi: "Người mua mở L/C, L/C được thông báo cho người bán TRƯỚC khi giao hàng (bước 1–3)",
    events: [
      { kind: "goods", slot: 1, textVi: "Người bán giao hàng khi điều kiện L/C được đáp ứng (bước 4)" },
      { kind: "money", slot: 2, textVi: "Ngân hàng phát hành trả tiền khi chứng từ phù hợp (bước 7, 9)" },
      { kind: "documents", slot: 3, textVi: "Ngân hàng phát hành giao chứng từ cho người mua; người mua trả tiền (bước 8)" },
    ],
    gapVi: "Người bán giao hàng trước khi có tiền nhưng đã có CAM KẾT TRẢ TIỀN của ngân hàng – điều kiện là chứng từ phù hợp với L/C.",
    source: "KB §5.5 · Slide C5 p.20",
    topic: "lc-procedure",
    learn: "/learn/c5#lc-procedure",
  },
  {
    id: "dp",
    label: "Documents against Payment (D/P)",
    labelVi: "Nhờ thu D/P",
    events: [
      { kind: "goods", slot: 1, textVi: "Người bán giao hàng, lập chứng từ (bước 1)" },
      { kind: "money", slot: 2, textVi: "Người mua trả tiền tại ngân hàng thu hộ (bước 5)" },
      { kind: "documents", slot: 3, textVi: "Người mua nhận chứng từ sau khi trả tiền" },
    ],
    gapVi: "Người BÁN chịu rủi ro: đã giao hàng, ngân hàng không bảo đảm thanh toán – nhưng ngân hàng thu hộ giữ chứng từ đến khi người mua trả tiền.",
    source: "KB §5.4 · Slide C5 p.15",
    topic: "dp-da",
    learn: "/learn/c5#documentary-collection",
  },
  {
    id: "da",
    label: "Documents against Acceptance (D/A)",
    labelVi: "Nhờ thu D/A",
    events: [
      { kind: "goods", slot: 1, textVi: "Người bán giao hàng, lập chứng từ (bước 1)" },
      { kind: "documents", slot: 2, textVi: "Người mua ký chấp nhận hối phiếu có kỳ hạn → nhận chứng từ (bước 5)" },
      { kind: "money", slot: 3, textVi: "Người mua trả tiền khi hối phiếu đến hạn" },
    ],
    gapVi: "Người BÁN chịu rủi ro cao hơn D/P: người mua đã có chứng từ (và hàng) nhưng chỉ mới hứa trả tiền.",
    source: "KB §5.4 · Slide C5 p.15",
    topic: "dp-da",
    learn: "/learn/c5#documentary-collection",
  },
  {
    id: "open-account",
    label: "Open account",
    labelVi: "Ghi sổ",
    events: [
      { kind: "goods", slot: 1, textVi: "Người bán giao hàng (bán chịu)" },
      { kind: "documents", slot: 1, textVi: "Người bán gửi chứng từ riêng, trực tiếp cho người mua" },
      { kind: "money", slot: 2, textVi: "Người mua trả tiền trong 30–120 ngày" },
    ],
    gapVi: "Người BÁN chịu rủi ro: hàng và chứng từ đều đã đến tay người mua, tiền đến sau 30–120 ngày.",
    source: "KB §5.2",
    topic: "open-account",
    learn: "/learn/c5#open-account",
  },
  {
    id: "consignment",
    label: "Consignment",
    labelVi: "Bán hàng ký gửi",
    events: [
      { kind: "goods", slot: 1, textVi: "Nhà xuất khẩu gửi hàng cho nhà nhập khẩu" },
      { kind: "money", slot: 2, textVi: "Nhà nhập khẩu trả tiền sau khi bán được hàng cho bên thứ ba → quyền sở hữu mới chuyển" },
    ],
    missingVi: "Slide không mô tả đường đi của chứng từ trong bán hàng ký gửi.",
    gapVi: "Người BÁN chịu rủi ro cao nhất: chậm thanh toán, không được thanh toán, chi phí chở hàng về, nhà nhập khẩu ít nỗ lực bán.",
    source: "KB §5.1",
    topic: "consignment",
    learn: "/learn/c5#consignment",
  },
];

export const EVENT_VI: Record<EventKind, string> = { goods: "Giao hàng", documents: "Giao chứng từ", money: "Trả tiền" };

/** Events in timeline order (stable for equal slots: goods, documents, money). */
export function eventOrder(m: MethodTimeline): EventKind[] {
  const rank: Record<EventKind, number> = { goods: 0, documents: 1, money: 2 };
  return [...m.events].sort((a, b) => a.slot - b.slot || rank[a.kind] - rank[b.kind]).map((e) => e.kind);
}

const slotOf = (m: MethodTimeline, k: EventKind) => m.events.find((e) => e.kind === k)?.slot;

/** Who waits in the gap: money before goods → buyer; goods before money → seller. */
export function exposedParty(m: MethodTimeline): "buyer" | "seller" {
  const money = slotOf(m, "money");
  const goods = slotOf(m, "goods");
  if (money === undefined || goods === undefined) throw new Error(`${m.id}: missing goods/money event`);
  return money < goods ? "buyer" : "seller";
}

/** "Chọn phương thức" quiz — each answer follows a KB "when to use" criterion. */
export interface SelectionScenario {
  id: string;
  textVi: string;
  answer: "cash-in-advance" | "lc" | "collection" | "open-account";
  whyVi: string;
}

export const SELECTION_OPTIONS: { id: SelectionScenario["answer"]; label: string }[] = [
  { id: "cash-in-advance", label: "Cash-in-advance (T/T trả trước)" },
  { id: "lc", label: "Thư tín dụng (L/C)" },
  { id: "collection", label: "Nhờ thu (D/P, D/A)" },
  { id: "open-account", label: "Ghi sổ (Open account)" },
];

export const SELECTION_SCENARIOS: SelectionScenario[] = [
  {
    id: "new-political",
    textVi: "Khách hàng mới, quốc gia của người mua có rủi ro chính trị rất cao. Người bán nên chọn phương thức nào?",
    answer: "cash-in-advance",
    whyVi: "KB §5.3: dùng cash-in-advance khi nhà nhập khẩu là khách hàng mới và khi rủi ro chính trị, thương mại ở nước nhà nhập khẩu rất cao.",
  },
  {
    id: "unique-product",
    textVi: "Sản phẩm của người bán độc đáo, không có ở nơi khác và đang có nhu cầu rất lớn.",
    answer: "cash-in-advance",
    whyVi: "KB §5.3: sản phẩm độc đáo, không có ở nơi khác hoặc nhu cầu rất lớn là một trong 4 trường hợp dùng cash-in-advance.",
  },
  {
    id: "unverifiable-credit",
    textVi: "Không kiểm chứng được khả năng tín dụng của nhà nhập khẩu.",
    answer: "cash-in-advance",
    whyVi: "KB §5.3: khả năng tín dụng của nhà nhập khẩu đáng ngờ, không đạt hoặc không kiểm chứng được → cash-in-advance.",
  },
  {
    id: "trusted-stable",
    textVi: "Người bán không nghi ngờ khả năng và thiện chí trả tiền của người mua; nước người mua ổn định, không hạn chế ngoại hối; hàng dễ bán. Người bán muốn một phương thức qua ngân hàng nhưng không cần ngân hàng cam kết trả tiền.",
    answer: "collection",
    whyVi: "KB §5.4: đây chính là 4 điều kiện để người bán đồng ý nhờ thu kèm chứng từ; trong nhờ thu ngân hàng không bảo đảm thanh toán.",
  },
  {
    id: "bank-promise",
    textVi: "Người bán muốn dựa vào cam kết trả tiền của một ngân hàng thay vì uy tín của người mua, với điều kiện xuất trình đúng chứng từ.",
    answer: "lc",
    whyVi: "KB §5.5: L/C là cam kết trả tiền của ngân hàng thay cho người mua, nếu người bán đáp ứng các điều kiện của L/C.",
  },
];
