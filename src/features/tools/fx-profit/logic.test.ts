import { computeFx, SLIDE_EXAMPLE } from "./logic";

describe("FX & Export Profit Calculator", () => {
  const base = {
    quantity: SLIDE_EXAMPLE.quantity,
    unitPrice: SLIDE_EXAMPLE.unitPrice,
    rateAtContract: SLIDE_EXAMPLE.rateAtContract,
    costs: 0,
  };

  it("slide: expected revenue at contract = VND 1.50 billion", () => {
    expect(computeFx({ ...base, rateAtPayment: 30_000 }).revenueAtContract).toBe(1_500_000_000);
  });

  it("slide scenario 1: EUR → 28,000 gives VND 1.40 billion, loss VND 100 million", () => {
    const r = computeFx({ ...base, rateAtPayment: 28_000 });
    expect(r.revenueAtPayment).toBe(1_400_000_000);
    expect(r.fxGainLoss).toBe(-100_000_000);
  });

  it("slide scenario 2: EUR → 32,000 gives VND 1.60 billion, gain VND 100 million", () => {
    const r = computeFx({ ...base, rateAtPayment: 32_000 });
    expect(r.revenueAtPayment).toBe(1_600_000_000);
    expect(r.fxGainLoss).toBe(100_000_000);
  });

  it("revenue = quantity × price (KB: 18 t × EUR 2,800 = EUR 50,400)", () => {
    expect(computeFx({ quantity: 18, unitPrice: 2_800, rateAtContract: 1, rateAtPayment: 1, costs: 0 }).revenueForeign).toBe(50_400);
  });

  it("gross profit and margin use revenue − costs", () => {
    const r = computeFx({ ...base, rateAtPayment: 28_000, costs: 1_200_000_000 });
    expect(r.grossProfitExpected).toBe(300_000_000);
    expect(r.marginExpected).toBeCloseTo(20);
    expect(r.grossProfitActual).toBe(200_000_000);
    expect(r.marginActual).toBeCloseTo(14.2857, 3);
  });

  it("returns null margins when revenue is zero", () => {
    const r = computeFx({ quantity: 0, unitPrice: 10, rateAtContract: 1, rateAtPayment: 1, costs: 5 });
    expect(r.marginExpected).toBeNull();
    expect(r.marginActual).toBeNull();
  });
});
