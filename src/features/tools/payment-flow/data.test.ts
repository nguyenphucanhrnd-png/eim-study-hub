import { FLOWS, RISK_LADDER } from "./data";

const flow = (id: string) => FLOWS.find((f) => f.id === id)!;

describe("Payment Flow data", () => {
  it("has the step counts from the KB (advance 4, deferred 5, Figure 11.2 = 7, L/C = 9)", () => {
    expect(flow("tt-advance").steps).toHaveLength(4);
    expect(flow("tt-deferred").steps).toHaveLength(5);
    expect(flow("dp").steps).toHaveLength(7);
    expect(flow("da").steps).toHaveLength(7);
    expect(flow("lc").steps).toHaveLength(9);
  });

  it("T/T advance: money first, goods LAST; deferred: goods FIRST", () => {
    expect(flow("tt-advance").steps.at(-1)!.kind).toBe("goods");
    expect(flow("tt-advance").steps.findIndex((s) => s.kind === "money")).toBeLessThan(3);
    expect(flow("tt-deferred").steps[0]!.kind).toBe("goods");
  });

  it("D/P and D/A differ only in steps 5–7 (pay vs accept)", () => {
    const dp = flow("dp").steps;
    const da = flow("da").steps;
    for (let i = 0; i < 4; i++) expect(da[i]).toEqual(dp[i]);
    expect(dp[4]!.textVi).toMatch(/TRẢ TIỀN/);
    expect(da[4]!.textVi).toMatch(/CHẤP NHẬN/);
  });

  it("L/C: buyer opens with issuing bank first; seller is paid by the advising bank last", () => {
    const s = flow("lc").steps;
    expect([s[0]!.from, s[0]!.to]).toEqual(["importer", "importerBank"]);
    expect([s[8]!.from, s[8]!.to, s[8]!.kind]).toEqual(["exporterBank", "exporter", "money"]);
  });

  it("risk ladder (EXT) runs cash-in-advance → consignment", () => {
    expect(RISK_LADDER[0]).toMatch(/Cash-in-advance/);
    expect(RISK_LADDER.at(-1)).toMatch(/Consignment/);
    expect(RISK_LADDER).toHaveLength(6);
  });
});
