/**
 * Payment Flow Stepper data. The flows themselves are now engine diagrams (src/features/diagrams/specs):
 * c5-tt-advance / c5-tt-deferred, c5-documentary-collection (D/P ⇄ D/A) and c5-lc-basic.
 */
export const PAYMENT_FLOWS = [
  { id: "tt-advance", label: "T/T trả trước", diagram: "c5-tt-advance", variant: "advance" },
  { id: "tt-deferred", label: "T/T trả sau", diagram: "c5-tt-advance", variant: "deferred" },
  { id: "dp", label: "Nhờ thu D/P", diagram: "c5-documentary-collection", variant: "dp" },
  { id: "da", label: "Nhờ thu D/A", diagram: "c5-documentary-collection", variant: "da" },
  { id: "lc", label: "Thư tín dụng L/C", diagram: "c5-lc-basic", variant: null },
] as const;

export type PaymentFlowId = (typeof PAYMENT_FLOWS)[number]["id"];

/**
 * [EXT – teaching aid] Exporter's risk ladder, lowest → highest (KB §5.5, source: U.S. DoC/ITA Trade Finance Guide).
 * Reversed for the importer.
 */
export const RISK_LADDER = [
  "Cash-in-advance (T/T trả trước)",
  "L/C (có xác nhận an toàn hơn không xác nhận)",
  "D/P (nhờ thu trả tiền đổi chứng từ)",
  "D/A (nhờ thu chấp nhận đổi chứng từ)",
  "Open account (ghi sổ)",
  "Consignment (bán hàng ký gửi)",
] as const;
