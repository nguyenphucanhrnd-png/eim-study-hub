import type { DiagramSpec } from "../engine/types";

const SRC = "KB §4.2–4.3";

/**
 * D4.1 — the two essential principles of insurance as a flow (derived from KB §4.3): insurable interest
 * and subrogation. Variant: the claimant has no insurable interest → the claim is rejected.
 */
const spec: DiagramSpec = {
  id: "c4-subrogation",
  chapter: "C4",
  title: "Insurable interest and subrogation",
  titleVi: "Quyền lợi được bảo hiểm & thế quyền",
  provenance: "derived",
  note: "Ví dụ minh họa: hàng tổn thất do lỗi người chuyên chở (KB nêu người chuyên chở là ví dụ về bên phải chịu trách nhiệm).",
  nodes: [
    { id: "insured", label: "INSURED", labelVi: "Người được bảo hiểm", role: "buyer", x: 200, y: 420, w: 280, h: 120, shape: "ellipse", descVi: "Người có quyền lợi được bảo hiểm đối với hàng hóa: có lợi ích tài chính dựa trên quyền hợp pháp đối với việc bảo toàn tài sản được bảo hiểm.", links: [{ label: "C4 · Hai nguyên tắc bảo hiểm", to: "/learn/c4#insurance-principles" }] },
    { id: "insurer", label: "INSURER", labelVi: "Công ty bảo hiểm", role: "insurer", x: 500, y: 130, w: 280, h: 120, shape: "ellipse", descVi: "Nhận phí bảo hiểm; bồi thường tổn thất do rủi ro được bảo hiểm (hợp đồng bồi thường – contract of indemnity); sau khi bồi thường được thế quyền đòi bên có lỗi." },
    { id: "carrier", label: "CARRIER", labelVi: "Người chuyên chở (bên có lỗi)", role: "carrier", x: 800, y: 420, w: 280, h: 120, shape: "ellipse", descVi: "Ví dụ về bên phải chịu trách nhiệm về tổn thất mà công ty bảo hiểm có thể đòi sau khi đã bồi thường." },
  ],
  edges: [
    { id: "damage", from: "carrier", to: "insured", kind: "goods", label: "hàng tổn thất" },
    { id: "claim", from: "insured", to: "insurer", kind: "document", curve: -30 },
    { id: "pay", from: "insurer", to: "insured", kind: "money", curve: -30 },
    { id: "subrogate", from: "insurer", to: "carrier", kind: "info" },
  ],
  steps: [
    { id: "s1", order: 1, title: "Goods damaged in transit (carrier at fault)", titleVi: "Hàng bị tổn thất khi vận chuyển do lỗi người chuyên chở", edgeIds: ["damage"], actors: ["carrier", "insured"], what: "Hàng được bảo hiểm bị tổn thất trong quá trình vận chuyển; người chuyên chở là bên có lỗi.", why: "Bảo hiểm hàng hóa bảo vệ tài chính trước tổn thất hàng hóa trên đường vận chuyển do rủi ro được bảo hiểm.", source: SRC, practiceTopic: "cargo-insurance-concept" },
    { id: "s2", order: 2, title: "The insured claims against the insurer", titleVi: "Người được bảo hiểm khiếu nại công ty bảo hiểm", edgeIds: ["claim"], actors: ["insured", "insurer"], what: "Người được bảo hiểm gửi hồ sơ khiếu nại cho công ty bảo hiểm. Người khiếu nại phải có quyền lợi được bảo hiểm đối với hàng.", why: "Nguyên tắc quyền lợi được bảo hiểm (insurable interest): chỉ người có lợi ích tài chính hợp pháp đối với hàng mới được bồi thường.", trap: "Không có quyền lợi được bảo hiểm → không được bồi thường (xem biến thể).", source: SRC, practiceTopic: "insurance-principles" },
    { id: "s3", order: 3, title: "The insurer pays the insured", titleVi: "Công ty bảo hiểm bồi thường cho người được bảo hiểm", edgeIds: ["pay"], actors: ["insurer", "insured"], what: "Công ty bảo hiểm bồi thường tổn thất do rủi ro được bảo hiểm theo hợp đồng.", why: "Bảo hiểm hàng hóa là hợp đồng bồi thường (contract of indemnity).", source: SRC, practiceTopic: "cargo-insurance-concept" },
    { id: "s4", order: 4, title: "Subrogation: the insurer claims against the carrier", titleVi: "Thế quyền: công ty bảo hiểm đòi người chuyên chở", edgeIds: ["subrogate"], actors: ["insurer", "carrier"], what: "Sau khi bồi thường, công ty bảo hiểm đứng vào vị trí của người được bảo hiểm để đòi bên có lỗi (người chuyên chở).", why: "Nguyên tắc thế quyền (subrogation).", trap: "Thế quyền chỉ phát sinh SAU KHI công ty bảo hiểm đã bồi thường.", source: SRC, practiceTopic: "insurance-principles" },
  ],
  variants: [
    { id: "normal", label: "Có quyền lợi được bảo hiểm", patch: {} },
    {
      id: "no-interest",
      label: "Không có quyền lợi được bảo hiểm",
      patch: {
        note: "Người khiếu nại không có lợi ích tài chính hợp pháp đối với hàng → không đáp ứng nguyên tắc quyền lợi được bảo hiểm.",
        edges: [
          { id: "damage", from: "carrier", to: "insured", kind: "goods", label: "hàng tổn thất" },
          { id: "claim", from: "insured", to: "insurer", kind: "document", curve: -30 },
          { id: "reject", from: "insurer", to: "insured", kind: "info", curve: -30, label: "từ chối" },
        ],
        steps: [
          { id: "s1", order: 1, title: "Goods damaged in transit", titleVi: "Hàng bị tổn thất khi vận chuyển", edgeIds: ["damage"], actors: ["carrier", "insured"], what: "Hàng bị tổn thất trong quá trình vận chuyển.", why: "Tổn thất xảy ra – câu hỏi là AI được đòi bồi thường.", source: SRC, practiceTopic: "cargo-insurance-concept" },
          { id: "s2", order: 2, title: "A party without insurable interest claims", titleVi: "Bên không có quyền lợi được bảo hiểm khiếu nại", edgeIds: ["claim"], actors: ["insured", "insurer"], what: "Bên khiếu nại không có lợi ích tài chính dựa trên quyền hợp pháp đối với việc bảo toàn hàng hóa.", why: "Nguyên tắc quyền lợi được bảo hiểm là điều kiện để được bồi thường.", source: SRC, practiceTopic: "insurance-principles" },
          { id: "s3", order: 3, title: "Claim rejected", titleVi: "Khiếu nại bị từ chối – không có thế quyền", edgeIds: ["reject"], actors: ["insurer", "insured"], what: "Công ty bảo hiểm không bồi thường; vì không bồi thường nên cũng không có thế quyền đòi người chuyên chở.", why: "Thế quyền chỉ phát sinh khi công ty bảo hiểm đã bồi thường.", source: SRC, practiceTopic: "insurance-principles" },
        ],
      },
    },
  ],
  keyTakeaways: [
    "Insurable interest: phải có lợi ích tài chính hợp pháp đối với hàng mới được bồi thường.",
    "Subrogation: bồi thường xong, công ty bảo hiểm đứng vào vị trí người được bảo hiểm để đòi bên có lỗi.",
  ],
  quiz: { order: true, actor: true, gap: true },
};

export default spec;
