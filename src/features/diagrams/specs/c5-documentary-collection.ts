import type { DiagramEdge, DiagramSpec, DiagramStep } from "../engine/types";

const SRC = "KB §5.4 · Slide C5 p.15 (Figure 11.2)";

/**
 * D5.3 — Documentary Collection, Figure 11.2 (slide C5 p.15). Seller top-left, Buyer top-right,
 * Seller's/remitting bank bottom-left, Buyer's/collecting bank bottom-right. Arrow 1 is double-headed.
 * Variant D/P (sight draft) ⇄ D/A (time draft) changes steps 5–7 and adds the dashed "5b" for D/A.
 */
const BOX = { w: 250, h: 96, shape: "rect" as const };

const BASE_EDGES: DiagramEdge[] = [
  { id: "e1", from: "seller", to: "buyer", kind: "info", both: true },
  { id: "e2", from: "seller", to: "remitting", kind: "document", curve: 34 },
  { id: "e3", from: "remitting", to: "collecting", kind: "document", curve: -26 },
  { id: "e4", from: "collecting", to: "buyer", kind: "document", curve: -34 },
];

const DP_EDGES: DiagramEdge[] = [
  ...BASE_EDGES,
  { id: "e5", from: "buyer", to: "collecting", kind: "money", curve: -34 },
  { id: "e6", from: "collecting", to: "remitting", kind: "money", curve: -26 },
  { id: "e7", from: "remitting", to: "seller", kind: "money", curve: 34 },
];

const DA_EDGES: DiagramEdge[] = [
  ...BASE_EDGES,
  { id: "e5", from: "buyer", to: "collecting", kind: "info", curve: -34 },
  { id: "e5b", from: "buyer", to: "collecting", kind: "money", curve: -88, dashed: true },
  { id: "e6", from: "collecting", to: "remitting", kind: "info", curve: -26 },
  { id: "e7", from: "remitting", to: "seller", kind: "info", curve: 34 },
];

const DRAFT_CARD = [
  "Hối phiếu (Bill of Exchange / Draft): mệnh lệnh trả tiền vô điều kiện bằng văn bản",
  "Drawer (người ký phát) = nhà xuất khẩu / người bán",
  "Drawee (người bị ký phát) = nhà nhập khẩu / người mua",
  "Beneficiary (người hưởng) = người bán / người ký phát hoặc người khác",
  "Sight draft – trả tiền khi xuất trình cho người bị ký phát → D/P",
  "Time / usance draft – trả tiền trong một thời hạn sau khi người mua chấp nhận hối phiếu và nhận hàng → D/A",
];

const SELLER_CONDITIONS = [
  "Không nghi ngờ khả năng và thiện chí thanh toán của người mua",
  "Nước người mua ổn định về chính trị, kinh tế và pháp lý",
  "Nước người mua không hạn chế ngoại hối",
  "Hàng hóa dễ bán (easily marketable)",
];

const RISKS = [
  "Rủi ro cao cho người bán – không có ngân hàng nào bảo đảm thanh toán",
  "Không được bảo vệ khi người mua hủy đơn hàng",
  "Người bán chỉ được trả tiền sau khi đã giao hàng",
  "Rủi ro của người mua: hàng giao có thể không đúng quy cách",
];

const step1to4 = (held: string): DiagramStep[] => [
  {
    id: "s1",
    order: 1,
    title: "Agreement on terms of sale and payment; seller ships goods and prepares documents",
    titleVi: "Thỏa thuận điều kiện bán hàng & thanh toán; người bán giao hàng và lập chứng từ",
    edgeIds: ["e1"],
    actors: ["seller", "buyer"],
    what: "Hai bên thỏa thuận điều kiện bán hàng và thanh toán bằng nhờ thu. Người bán giao hàng, lập bộ chứng từ và ký phát hối phiếu đòi tiền người mua.",
    why: "Nhờ thu là dịch vụ ngân hàng hỗ trợ người bán thu tiền; người bán giao hàng TRƯỚC khi được trả tiền.",
    trap: "Hối phiếu do NGƯỜI BÁN ký phát (drawer) đòi tiền NGƯỜI MUA (drawee).",
    details: [{ title: "Thẻ hối phiếu", items: DRAFT_CARD }],
    source: SRC,
    practiceTopic: "bill-of-exchange",
  },
  {
    id: "s2",
    order: 2,
    title: "Seller presents documents to remitting bank",
    titleVi: "Người bán xuất trình chứng từ cho ngân hàng chuyển (remitting bank)",
    edgeIds: ["e2"],
    actors: ["seller", "remitting"],
    what: "Người bán giao bộ chứng từ (kèm hối phiếu) cho ngân hàng của mình – ngân hàng chuyển (remitting bank) – để nhờ thu tiền.",
    why: "Người bán giữ quyền kiểm soát hàng qua chứng từ: chứng từ chỉ đến tay người mua qua ngân hàng.",
    documents: ["Bill of exchange (draft)", "Shipping documents"],
    trap: "Remitting bank = ngân hàng bên BÁN; collecting bank = ngân hàng bên MUA.",
    source: SRC,
    practiceTopic: "documentary-collection",
  },
  {
    id: "s3",
    order: 3,
    title: "Remitting bank forwards documents to collecting bank",
    titleVi: "Ngân hàng chuyển gửi chứng từ đến ngân hàng thu hộ (collecting bank)",
    edgeIds: ["e3"],
    actors: ["remitting", "collecting"],
    what: "Ngân hàng chuyển gửi bộ chứng từ sang ngân hàng thu hộ ở nước người mua.",
    why: "Từ đây ngân hàng thu hộ GIỮ chứng từ – người mua chưa thể nhận hàng nếu chưa có chứng từ.",
    holds: [{ node: "collecting", kind: "document", label: held }],
    source: SRC,
    practiceTopic: "documentary-collection",
  },
  {
    id: "s4",
    order: 4,
    title: "Collecting bank presents documents to buyer",
    titleVi: "Ngân hàng thu hộ xuất trình chứng từ cho người mua",
    edgeIds: ["e4"],
    actors: ["collecting", "buyer"],
    what: "Ngân hàng thu hộ xuất trình (thông báo) bộ chứng từ cho người mua. Chứng từ vẫn do ngân hàng giữ cho đến khi người mua trả tiền (D/P) hoặc chấp nhận hối phiếu (D/A).",
    why: "Đây là điểm mấu chốt của nhờ thu: chứng từ được đổi lấy tiền hoặc lấy chữ ký chấp nhận.",
    holds: [{ node: "collecting", kind: "document", label: held }],
    source: SRC,
    practiceTopic: "dp-da",
  },
];

const DP_STEPS: DiagramStep[] = [
  ...step1to4("Giữ chứng từ đến khi người mua TRẢ TIỀN"),
  {
    id: "s5",
    order: 5,
    title: "Buyer pays on presentation of documents to collecting bank",
    titleVi: "Người mua trả tiền tại ngân hàng thu hộ → nhận chứng từ",
    edgeIds: ["e5"],
    actors: ["buyer", "collecting"],
    what: "D/P: người mua trả tiền theo hối phiếu trả ngay (sight draft) tại ngân hàng thu hộ, rồi mới nhận chứng từ để đi nhận hàng.",
    why: "Người mua chỉ nhận chứng từ SAU KHI TRẢ TIỀN → người bán không mất quyền kiểm soát hàng trước khi có tiền.",
    trap: "D/P: chứng từ đổi lấy TIỀN (sight draft); D/A: chứng từ đổi lấy CHỮ KÝ CHẤP NHẬN (time draft).",
    source: SRC,
    practiceTopic: "dp-da",
  },
  {
    id: "s6",
    order: 6,
    title: "Collecting bank remits payment to remitting bank",
    titleVi: "Ngân hàng thu hộ chuyển tiền cho ngân hàng chuyển",
    edgeIds: ["e6"],
    actors: ["collecting", "remitting"],
    what: "Ngân hàng thu hộ chuyển số tiền người mua đã trả sang ngân hàng chuyển.",
    why: "Ngân hàng chỉ chuyển tiền thu được – không ngân hàng nào cam kết trả thay người mua.",
    trap: "Trong nhờ thu, ngân hàng KHÔNG bảo đảm thanh toán (khác L/C).",
    details: [{ title: "Rủi ro của nhờ thu", items: RISKS }],
    source: SRC,
    practiceTopic: "documentary-collection",
  },
  {
    id: "s7",
    order: 7,
    title: "Remitting bank remits payment to seller",
    titleVi: "Ngân hàng chuyển trả tiền cho người bán",
    edgeIds: ["e7"],
    actors: ["remitting", "seller"],
    what: "Ngân hàng chuyển trả tiền cho người bán – kết thúc quy trình D/P.",
    why: "Người bán chỉ được trả tiền sau khi đã giao hàng; vì vậy chỉ nên nhận nhờ thu khi đủ 4 điều kiện.",
    details: [{ title: "Người bán nên đồng ý nhờ thu khi", items: SELLER_CONDITIONS }],
    source: SRC,
    practiceTopic: "documentary-collection",
  },
];

const DA_STEPS: DiagramStep[] = [
  ...step1to4("Giữ chứng từ đến khi người mua KÝ CHẤP NHẬN"),
  {
    id: "s5",
    order: 5,
    title: "Buyer accepts the time draft on presentation of documents",
    titleVi: "Người mua ký chấp nhận hối phiếu có kỳ hạn → nhận chứng từ",
    edgeIds: ["e5"],
    actors: ["buyer", "collecting"],
    what: "D/A: người mua ký chấp nhận hối phiếu có kỳ hạn (time/usance draft), hứa trả tiền sau, và nhận chứng từ sở hữu hàng ngay.",
    why: "Người mua nhận chứng từ (và hàng) TRƯỚC khi trả tiền → rủi ro của người bán cao hơn D/P.",
    trap: "D/A: người mua nhận chứng từ TRƯỚC khi trả tiền.",
    source: SRC,
    practiceTopic: "dp-da",
  },
  {
    id: "s5b",
    order: 5,
    badge: "5b",
    title: "Payment at maturity",
    titleVi: "Người mua trả tiền khi hối phiếu đến hạn",
    edgeIds: ["e5b"],
    actors: ["buyer", "collecting"],
    what: "Đến ngày đáo hạn của hối phiếu có kỳ hạn, người mua trả tiền tại ngân hàng thu hộ (“pay at a later date”).",
    why: "Tiền chỉ đến sau – lúc này người mua đã có hàng, nên việc trả tiền phụ thuộc vào thiện chí của người mua.",
    ext: "Slide định nghĩa time draft: “…after the buyer accepts the draft and receives the goods” (giữ nguyên khi làm bài). Thực tế ngày đáo hạn thường tính từ ngày chấp nhận/ngày xuất trình hoặc ngày vận đơn (ERRATA E-13).",
    source: SRC,
    practiceTopic: "dp-da",
  },
  {
    id: "s6",
    order: 6,
    title: "Collecting bank advises remitting bank of acceptance",
    titleVi: "Ngân hàng thu hộ báo cho ngân hàng chuyển về việc chấp nhận",
    edgeIds: ["e6"],
    actors: ["collecting", "remitting"],
    what: "Ngân hàng thu hộ báo cho ngân hàng chuyển rằng người mua đã chấp nhận hối phiếu (tiền sẽ được chuyển khi người mua trả lúc đáo hạn).",
    why: "Người bán chỉ có lời hứa trả tiền của người mua trên hối phiếu – không có cam kết của ngân hàng.",
    trap: "Trong nhờ thu, ngân hàng KHÔNG bảo đảm thanh toán (khác L/C).",
    details: [{ title: "Rủi ro của nhờ thu", items: RISKS }],
    source: SRC,
    practiceTopic: "documentary-collection",
  },
  {
    id: "s7",
    order: 7,
    title: "Remitting bank advises seller of acceptance",
    titleVi: "Ngân hàng chuyển báo cho người bán về việc chấp nhận",
    edgeIds: ["e7"],
    actors: ["remitting", "seller"],
    what: "Ngân hàng chuyển báo cho người bán rằng hối phiếu đã được chấp nhận.",
    why: "Người bán đã mất quyền kiểm soát hàng nhưng chưa có tiền → chỉ dùng D/A khi tin tưởng người mua.",
    details: [{ title: "Người bán nên đồng ý nhờ thu khi", items: SELLER_CONDITIONS }],
    source: SRC,
    practiceTopic: "documentary-collection",
  },
];

const spec: DiagramSpec = {
  id: "c5-documentary-collection",
  chapter: "C5",
  title: "Documentary collection procedure (Figure 11.2)",
  titleVi: "Quy trình nhờ thu kèm chứng từ – 7 bước",
  provenance: "slide",
  slideRef: "C5 p.15",
  nodes: [
    {
      id: "seller",
      label: "Seller",
      labelVi: "Người bán – Drawer",
      role: "seller",
      x: 210,
      y: 110,
      ...BOX,
      aka: ["Exporter", "Drawer (người ký phát hối phiếu)"],
      descVi: "Người bán giao hàng, lập chứng từ, ký phát hối phiếu và nhờ ngân hàng thu tiền.",
      links: [{ label: "C5 · Hối phiếu", to: "/learn/c5#documentary-collection" }],
    },
    {
      id: "buyer",
      label: "Buyer",
      labelVi: "Người mua – Drawee",
      role: "buyer",
      x: 790,
      y: 110,
      ...BOX,
      aka: ["Importer", "Drawee (người bị ký phát)"],
      descVi: "Người mua trả tiền (D/P) hoặc ký chấp nhận hối phiếu (D/A) tại ngân hàng thu hộ để nhận chứng từ.",
    },
    {
      id: "remitting",
      label: "Seller's bank\nor remitting bank",
      labelVi: "Ngân hàng chuyển",
      role: "sellerBank",
      x: 210,
      y: 470,
      ...BOX,
      aka: ["Remitting bank", "Seller's bank"],
      descVi: "Ngân hàng bên bán: nhận chứng từ từ người bán, gửi sang ngân hàng thu hộ, chuyển tiền hoặc báo chấp nhận cho người bán.",
    },
    {
      id: "collecting",
      label: "Buyer's bank\nor collecting bank",
      labelVi: "Ngân hàng thu hộ",
      role: "buyerBank",
      x: 790,
      y: 470,
      ...BOX,
      aka: ["Collecting bank", "Buyer's bank"],
      descVi: "Ngân hàng bên mua: GIỮ chứng từ và chỉ giao cho người mua khi người mua trả tiền (D/P) hoặc chấp nhận hối phiếu (D/A).",
    },
  ],
  edges: DP_EDGES,
  steps: DP_STEPS,
  variants: [
    {
      id: "dp",
      label: "D/P – sight draft",
      patch: { note: "D/P (Documents against Payment): người mua nhận chứng từ chỉ SAU KHI TRẢ TIỀN tại ngân hàng." },
    },
    {
      id: "da",
      label: "D/A – time draft",
      patch: {
        edges: DA_EDGES,
        steps: DA_STEPS,
        note: "D/A (Documents against Acceptance): người mua nhận chứng từ sau khi KÝ CHẤP NHẬN hối phiếu có kỳ hạn, trả tiền sau (bước 5b, nét đứt).",
        keyTakeaways: [
          "D/A: chứng từ đổi lấy CHỮ KÝ CHẤP NHẬN hối phiếu có kỳ hạn; tiền đến sau (5b).",
          "Người mua có hàng trước khi trả tiền → rủi ro của người bán cao hơn D/P.",
          "Ngân hàng không bảo đảm thanh toán – người bán chỉ có lời hứa trên hối phiếu.",
        ],
      },
    },
  ],
  keyTakeaways: [
    "Ngân hàng thu hộ GIỮ chứng từ cho đến khi người mua trả tiền (D/P) hoặc ký chấp nhận (D/A).",
    "Ngân hàng KHÔNG bảo đảm thanh toán – khác với L/C.",
    "Remitting bank = ngân hàng bên bán; collecting bank = ngân hàng bên mua.",
    "Người bán nên nhận nhờ thu khi: tin người mua, nước người mua ổn định, không hạn chế ngoại hối, hàng dễ bán.",
  ],
  quiz: { order: true, actor: true, gap: true },
};

export default spec;
