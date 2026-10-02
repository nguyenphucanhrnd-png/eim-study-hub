/** FX & export profit — KB §2.9: Revenue = Quantity × Price; Gross Profit = Revenue − COGS; Margin = GP / Revenue × 100%. */
export interface FxInput {
  quantity: number;
  unitPrice: number; // foreign currency per unit
  rateAtContract: number; // home currency per 1 unit of foreign currency
  rateAtPayment: number;
  costs: number; // total export costs (COGS) in home currency
}

export interface FxResult {
  revenueForeign: number;
  revenueAtContract: number; // expected home-currency revenue at the contract rate
  revenueAtPayment: number; // actual home-currency revenue at the payment rate
  fxGainLoss: number; // revenueAtPayment − revenueAtContract (negative = loss)
  grossProfitExpected: number;
  grossProfitActual: number;
  marginExpected: number | null; // %
  marginActual: number | null; // %
}

export function computeFx(i: FxInput): FxResult {
  const revenueForeign = i.quantity * i.unitPrice;
  const revenueAtContract = revenueForeign * i.rateAtContract;
  const revenueAtPayment = revenueForeign * i.rateAtPayment;
  const grossProfitExpected = revenueAtContract - i.costs;
  const grossProfitActual = revenueAtPayment - i.costs;
  return {
    revenueForeign,
    revenueAtContract,
    revenueAtPayment,
    fxGainLoss: revenueAtPayment - revenueAtContract,
    grossProfitExpected,
    grossProfitActual,
    marginExpected: revenueAtContract ? (grossProfitExpected / revenueAtContract) * 100 : null,
    marginActual: revenueAtPayment ? (grossProfitActual / revenueAtPayment) * 100 : null,
  };
}

/**
 * Slide example (KB §2.9): EUR 50,000 coffee export, 1 EUR = 30,000 VND at contract;
 * after 6 months 28,000 (scenario 1) or 32,000 (scenario 2). Entered as 1 lot × EUR 50,000.
 * The slide gives no cost figure, so costs start at 0.
 */
export const SLIDE_EXAMPLE = {
  currency: "EUR",
  quantity: 1,
  unitPrice: 50_000,
  rateAtContract: 30_000,
  scenarios: [
    { label: "Kịch bản 1 – EUR giảm giá", rateAtPayment: 28_000 },
    { label: "Kịch bản 2 – EUR tăng giá", rateAtPayment: 32_000 },
  ],
} as const;

export function formatMoney(n: number, currency: string, fractionDigits = 0): string {
  return `${currency} ${n.toLocaleString("en-US", { maximumFractionDigits: fractionDigits, minimumFractionDigits: 0 })}`;
}
