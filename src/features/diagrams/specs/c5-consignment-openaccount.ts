import type { DiagramSpec } from "../engine/types";

/** D5.6 — Consignment sale and open account as two mini flows (KB §5.1–5.2). Derived. */
const spec: DiagramSpec = {
  id: "c5-consignment-openaccount",
  chapter: "C5",
  title: "Consignment sale and open account",
  titleVi: "Bán hàng ký gửi & ghi sổ (open account)",
  provenance: "derived",
  lanes: [
    { id: "consignment", label: "Consignment sale" },
    { id: "open", label: "Open account" },
  ],
  zones: [
    { label: "Consignment sale – bán hàng ký gửi", x: 10, y: 10, w: 980, h: 270 },
    { label: "Open account – ghi sổ", x: 10, y: 310, w: 980, h: 280 },
  ],
  nodes: [
    { id: "c-exporter", label: "EXPORTER", role: "seller", x: 150, y: 150, w: 210, h: 90, shape: "ellipse", descVi: "Gửi hàng cho nhà nhập khẩu theo phương thức trả tiền sau; vẫn giữ quyền sở hữu cho đến khi được trả tiền." },
    { id: "c-importer", label: "IMPORTER", role: "buyer", x: 500, y: 150, w: 210, h: 90, shape: "ellipse", descVi: "Nhận hàng ký gửi, bán cho bên thứ ba rồi mới trả tiền cho nhà xuất khẩu." },
    { id: "c-third", label: "THIRD PARTY", labelVi: "Người mua cuối", role: "other", x: 850, y: 150, w: 210, h: 90, shape: "ellipse", descVi: "Bên thứ ba mua hàng từ nhà nhập khẩu." },
    { id: "o-exporter", label: "EXPORTER", role: "seller", x: 200, y: 460, w: 230, h: 100, shape: "ellipse", descVi: "Giao hàng theo phương thức bán chịu (on credit) và gửi chứng từ riêng cho người mua." },
    { id: "o-importer", label: "IMPORTER", role: "buyer", x: 800, y: 460, w: 230, h: 100, shape: "ellipse", descVi: "Nhận hàng và chứng từ, trả tiền trong thời hạn thỏa thuận (30–120 ngày)." },
  ],
  edges: [
    { id: "c1", from: "c-exporter", to: "c-importer", kind: "goods", curve: -22 },
    { id: "c2", from: "c-importer", to: "c-third", kind: "goods" },
    { id: "c3", from: "c-importer", to: "c-exporter", kind: "money", curve: -22 },
    { id: "o1", from: "o-exporter", to: "o-importer", kind: "goods", curve: -45 },
    { id: "o2", from: "o-exporter", to: "o-importer", kind: "document" },
    { id: "o3", from: "o-importer", to: "o-exporter", kind: "money", curve: -45 },
  ],
  steps: [
    { id: "c-s1", order: 1, lane: "consignment", title: "Exporter sends the goods on a deferred-payment basis", titleVi: "Nhà xuất khẩu gửi hàng (trả tiền sau)", edgeIds: ["c1"], actors: ["c-exporter", "c-importer"], what: "Nhà xuất khẩu gửi hàng cho nhà nhập khẩu theo phương thức trả tiền sau.", why: "Nhà nhập khẩu chưa phải trả tiền khi nhận hàng.", source: "KB §5.1", practiceTopic: "consignment" },
    { id: "c-s2", order: 2, lane: "consignment", title: "Importer sells the goods to a third party", titleVi: "Nhà nhập khẩu bán hàng cho bên thứ ba", edgeIds: ["c2"], actors: ["c-importer", "c-third"], what: "Nhà nhập khẩu chỉ trả tiền sau khi đã bán được hàng cho bên thứ ba.", why: "Rủi ro: chậm thanh toán, không được thanh toán, chi phí chở hàng về, nhà nhập khẩu ít nỗ lực bán.", source: "KB §5.1", practiceTopic: "consignment" },
    { id: "c-s3", order: 3, lane: "consignment", title: "Importer pays — title passes", titleVi: "Nhà nhập khẩu trả tiền → quyền sở hữu mới chuyển", edgeIds: ["c3"], actors: ["c-importer", "c-exporter"], what: "Nhà nhập khẩu trả tiền cho nhà xuất khẩu; quyền sở hữu hàng chỉ chuyển cho nhà nhập khẩu khi trả tiền.", why: "Đây là phương thức rủi ro cao nhất cho nhà xuất khẩu.", trap: "Quyền sở hữu chuyển khi người nhập khẩu TRẢ TIỀN, không phải khi nhận hàng.", source: "KB §5.1", practiceTopic: "consignment" },
    { id: "o-s1", order: 1, lane: "open", title: "Seller ships the goods on credit", titleVi: "Người bán giao hàng (bán chịu)", edgeIds: ["o1"], actors: ["o-exporter", "o-importer"], what: "Nhà xuất khẩu giao hàng cho khách hàng nước ngoài theo hình thức bán chịu.", why: "Người bán giao hàng trước khi được trả tiền.", source: "KB §5.2", practiceTopic: "open-account" },
    { id: "o-s2", order: 2, lane: "open", title: "Seller mails the shipping documents separately", titleVi: "Người bán gửi riêng bộ chứng từ cho người mua", edgeIds: ["o2"], actors: ["o-exporter", "o-importer"], what: "Người bán gửi riêng bộ chứng từ cho người mua (separately mails the shipping documents).", why: "Người mua có cả hàng và chứng từ trước khi trả tiền.", source: "KB §5.2", practiceTopic: "open-account" },
    { id: "o-s3", order: 3, lane: "open", title: "Buyer pays within 30–120 days", titleVi: "Người mua trả tiền trong 30–120 ngày", edgeIds: ["o3"], actors: ["o-importer", "o-exporter"], what: "Thời hạn thanh toán từ 30 đến 120 ngày kể từ ngày hóa đơn hoặc ngày nhận hàng, tùy quốc gia.", why: "Rủi ro thuộc về người bán trong suốt thời gian chờ.", source: "KB §5.2", practiceTopic: "open-account" },
  ],
  keyTakeaways: [
    "Consignment: nhà nhập khẩu chỉ trả tiền sau khi bán được hàng; quyền sở hữu chuyển khi trả tiền.",
    "Open account: giao hàng + gửi chứng từ riêng, trả tiền trong 30–120 ngày.",
    "Cả hai đều bất lợi cho người bán: hàng đi trước, tiền đến sau.",
  ],
  quiz: { order: true, actor: true, gap: true },
};

export default spec;
