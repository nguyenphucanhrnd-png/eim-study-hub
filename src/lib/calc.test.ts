import { computeCalc, extractNumbers, textContainsValue } from "./calc";

describe("calc formulas (KB §2.9 slide examples)", () => {
  it("revenue: 18 t × EUR 2,800 = EUR 50,400", () => {
    expect(computeCalc({ kind: "revenue", inputs: { quantity: 18, price: 2800 }, expected: 50400 })).toBe(50400);
  });

  it("FX: EUR 50,000 from 30,000 to 28,000 → loss VND 100 million", () => {
    const v = computeCalc({ kind: "fx-gain-loss", inputs: { amount: 50000, rateAtContract: 30000, rateAtPayment: 28000 }, expected: -1e8 });
    expect(v).toBe(-100_000_000);
  });

  it("insured amount 110%", () => {
    expect(computeCalc({ kind: "insured-amount", inputs: { value: 250000, percent: 110 }, expected: 275000 })).toBeCloseTo(275000);
  });

  it("throws on missing input", () => {
    expect(() => computeCalc({ kind: "revenue", inputs: { quantity: 1 }, expected: 0 })).toThrow(/price/);
  });
});

describe("extractNumbers", () => {
  it("handles separators, decimals and scale words", () => {
    expect(extractNumbers("VND 1.40 billion")).toEqual([1.4e9]);
    expect(extractNumbers("EUR 50,400")).toEqual([50400]);
    expect(extractNumbers("12.5% margin")).toEqual([12.5]);
    expect(extractNumbers("loss of VND 100 million")).toEqual([1e8]);
  });

  it("matches values regardless of sign", () => {
    expect(textContainsValue("A loss of VND 100 million", -1e8)).toBe(true);
    expect(textContainsValue("A loss of VND 200 million", -1e8)).toBe(false);
  });
});
