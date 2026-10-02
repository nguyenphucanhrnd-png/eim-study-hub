/**
 * L/C date rules — KB §5.5 "Remarks on dates" (rephrased per ERRATA E-06):
 * issue < shipment; shipment ≤ latest shipment date; shipment < expiry;
 * presentation ≤ shipment + N days (default 21, or the period stated in the L/C); presentation ≤ expiry.
 */
export interface LcDatesInput {
  issue: string; // ISO yyyy-mm-dd
  latestShipment: string;
  shipment: string;
  presentation: string;
  expiry: string;
  /** Presentation period stated in the L/C (days after shipment). Empty → 21 days. */
  presentationDays?: number | null;
}

export type RuleStatus = "pass" | "fail" | "missing";

export interface RuleResult {
  id: "issue-before-shipment" | "shipment-by-latest" | "shipment-before-expiry" | "presentation-period" | "presentation-by-expiry";
  status: RuleStatus;
  labelVi: string;
  detailVi: string;
}

export const DEFAULT_PRESENTATION_DAYS = 21;

const DAY_MS = 86_400_000;

/** Parse an ISO date (yyyy-mm-dd) as a UTC day number; null if empty/invalid. */
export function toDay(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  // Reject impossible dates (e.g. 2026-02-30) instead of letting them roll over.
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== iso) return null;
  return Math.round(t / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  const d = toDay(iso);
  if (d === null) return "";
  return new Date((d + days) * DAY_MS).toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = toDay(iso);
  if (d === null) return "—";
  const [y, m, dd] = iso.split("-");
  return `${dd}/${m}/${y}`;
}

export function checkLcDates(input: LcDatesInput): RuleResult[] {
  const issue = toDay(input.issue);
  const latest = toDay(input.latestShipment);
  const ship = toDay(input.shipment);
  const pres = toDay(input.presentation);
  const exp = toDay(input.expiry);
  const n = input.presentationDays && input.presentationDays > 0 ? input.presentationDays : DEFAULT_PRESENTATION_DAYS;
  const stated = !!(input.presentationDays && input.presentationDays > 0);

  const rule = (
    id: RuleResult["id"],
    labelVi: string,
    values: (number | null)[],
    ok: () => boolean,
    detail: (pass: boolean) => string,
  ): RuleResult => {
    if (values.some((v) => v === null)) return { id, labelVi, status: "missing", detailVi: "Chưa nhập đủ ngày để kiểm tra." };
    const pass = ok();
    return { id, labelVi, status: pass ? "pass" : "fail", detailVi: detail(pass) };
  };

  return [
    rule(
      "issue-before-shipment",
      "Ngày phát hành L/C trước ngày giao hàng",
      [issue, ship],
      () => issue! < ship!,
      (pass) =>
        pass
          ? "L/C được phát hành trước khi giao hàng."
          : "Ngày phát hành phải TRƯỚC ngày giao hàng — người bán không nên giao hàng khi chưa có L/C.",
    ),
    rule(
      "shipment-by-latest",
      "Giao hàng không muộn hơn ngày giao hàng chậm nhất",
      [ship, latest],
      () => ship! <= latest!,
      (pass) => (pass ? "Giao hàng đúng hạn theo L/C." : "Giao hàng trễ so với ngày giao hàng chậm nhất (latest shipment date)."),
    ),
    rule(
      "shipment-before-expiry",
      "Ngày giao hàng trong thời hạn hiệu lực (trước ngày hết hạn)",
      [ship, exp],
      () => ship! < exp!,
      (pass) =>
        pass ? "Ngày giao hàng nằm trong thời hạn hiệu lực của L/C." : "Ngày hết hạn phải SAU ngày giao hàng; giao hàng đã ngoài thời hạn hiệu lực.",
    ),
    rule(
      "presentation-period",
      `Xuất trình chứng từ không quá ${n} ngày sau ngày giao hàng${stated ? " (theo L/C)" : " (mặc định 21 ngày)"}`,
      [pres, ship],
      () => pres! >= ship! && pres! - ship! <= n,
      (pass) => {
        const gap = pres! - ship!;
        if (gap < 0) return "Ngày xuất trình đang trước ngày giao hàng — kiểm tra lại dữ liệu.";
        return pass
          ? `Xuất trình sau giao hàng ${gap} ngày (giới hạn ${n} ngày).`
          : `Xuất trình muộn: ${gap} ngày sau giao hàng, vượt giới hạn ${n} ngày (hạn chót ${formatDate(addDays(input.shipment, n))}).`;
      },
    ),
    rule(
      "presentation-by-expiry",
      "Xuất trình chứng từ trong thời hạn hiệu lực (không sau ngày hết hạn)",
      [pres, exp],
      () => pres! <= exp!,
      (pass) => (pass ? "Xuất trình trước hoặc đúng ngày hết hạn." : "Xuất trình sau ngày hết hạn — L/C đã hết hiệu lực."),
    ),
  ];
}

/** Effective presentation deadline: the earlier of shipment + N days and the expiry date. */
export function presentationDeadline(input: LcDatesInput): string | null {
  if (toDay(input.shipment) === null || toDay(input.expiry) === null) return null;
  const n = input.presentationDays && input.presentationDays > 0 ? input.presentationDays : DEFAULT_PRESENTATION_DAYS;
  const byPeriod = addDays(input.shipment, n);
  return toDay(byPeriod)! <= toDay(input.expiry)! ? byPeriod : input.expiry;
}
