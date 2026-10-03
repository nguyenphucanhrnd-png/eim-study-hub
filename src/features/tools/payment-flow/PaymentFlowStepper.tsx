import { useState } from "react";
import { Link } from "react-router-dom";
import { Segmented } from "@/components/ui/form";
import { useAsync } from "@/lib/useAsync";
import { DIAGRAM_BY_ID } from "@/features/diagrams/catalog";
import { PAYMENT_FLOWS, type PaymentFlowId } from "./data";
import { RiskLadder } from "./RiskLadder";

export { RiskLadder } from "./RiskLadder";

/**
 * /tools/payment-flow — the payment procedures rendered by the diagram engine (same diagrams as the
 * chapter pages): T/T advance ⇄ deferred, documentary collection D/P ⇄ D/A and the 9-step L/C.
 */
export default function PaymentFlowStepper({ initial = "tt-advance" }: { initial?: PaymentFlowId }) {
  const [flowId, setFlowId] = useState<PaymentFlowId>(initial);
  const flow = PAYMENT_FLOWS.find((f) => f.id === flowId) ?? PAYMENT_FLOWS[0];
  const meta = DIAGRAM_BY_ID.get(flow.diagram);
  const loaded = useAsync(
    () => Promise.all([import("@/features/diagrams/engine/DiagramViewer"), meta!.loadSpec!()]),
    [flow.diagram],
  );

  const Viewer = loaded.status === "ready" ? loaded.data[0].DiagramViewer : null;

  return (
    <div className="space-y-4">
      <Segmented
        label="Phương thức thanh toán"
        value={flowId}
        onChange={setFlowId}
        options={PAYMENT_FLOWS.map((f) => ({ value: f.id, label: f.label }))}
      />
      {loaded.status === "loading" && <p role="status">Đang tải sơ đồ…</p>}
      {loaded.status === "error" && <p className="text-wrong">Không tải được sơ đồ.</p>}
      {loaded.status === "ready" && Viewer && loaded.data[1].id === flow.diagram && (
        <Viewer
          key={flow.diagram}
          spec={loaded.data[1]}
          initialVariant={flow.variant ?? undefined}
          onVariantChange={(v) => {
            const match = PAYMENT_FLOWS.find((f) => f.diagram === flow.diagram && f.variant === v);
            if (match) setFlowId(match.id);
          }}
        />
      )}
      {meta && (
        <p className="text-sm">
          <Link to={`/diagrams/${meta.id}`} className="text-navy-700 underline dark:text-navy-200">
            Mở sơ đồ “{meta.titleVi}” toàn trang →
          </Link>{" "}
          ·{" "}
          <Link to="/diagrams/c5-method-compare" className="text-navy-700 underline dark:text-navy-200">
            So sánh thứ tự hàng – chứng từ – tiền của 6 phương thức →
          </Link>
        </p>
      )}
      <RiskLadder />
    </div>
  );
}
