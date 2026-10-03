import { DIAGRAM_BY_ID } from "@/features/diagrams/catalog";
import { resolveVariant, sortedSteps } from "@/features/diagrams/engine/types";
import { PAYMENT_FLOWS, RISK_LADDER } from "./data";

async function flowSteps(id: (typeof PAYMENT_FLOWS)[number]["id"]) {
  const f = PAYMENT_FLOWS.find((x) => x.id === id)!;
  const spec = await DIAGRAM_BY_ID.get(f.diagram)!.loadSpec!();
  const r = resolveVariant(spec, f.variant);
  const kindOf = new Map(r.edges.map((e) => [e.id, e]));
  return sortedSteps(r.steps).map((s) => ({ ...s, edge: kindOf.get(s.edgeIds[0]!)! }));
}

describe("Payment Flow Stepper (engine diagrams)", () => {
  it("every method points at an existing diagram and variant", async () => {
    for (const f of PAYMENT_FLOWS) {
      const meta = DIAGRAM_BY_ID.get(f.diagram);
      expect(meta?.loadSpec).toBeDefined();
      if (f.variant) expect((await meta!.loadSpec!()).variants?.some((v) => v.id === f.variant)).toBe(true);
    }
  });

  it("has the step counts from the KB (advance 5, deferred 5, Figure 11.2 = 7 (+5b for D/A), L/C = 9)", async () => {
    expect(await flowSteps("tt-advance")).toHaveLength(5);
    expect(await flowSteps("tt-deferred")).toHaveLength(5);
    expect(await flowSteps("dp")).toHaveLength(7);
    expect((await flowSteps("da")).filter((s) => !s.badge)).toHaveLength(7);
    expect(await flowSteps("lc")).toHaveLength(9);
  });

  it("T/T advance: money first, goods LAST; deferred: goods FIRST", async () => {
    const adv = await flowSteps("tt-advance");
    expect(adv.at(-1)!.edge.kind).toBe("goods");
    expect(adv.findIndex((s) => s.edge.kind === "money")).toBeLessThan(4);
    expect((await flowSteps("tt-deferred"))[0]!.edge.kind).toBe("goods");
  });

  it("D/P and D/A share steps 1–4; step 5 = pay vs accept, D/A adds 5b payment at maturity", async () => {
    const dp = await flowSteps("dp");
    const da = await flowSteps("da");
    for (let i = 0; i < 2; i++) expect(da[i]!.titleVi).toBe(dp[i]!.titleVi);
    expect(dp[4]!.edge.kind).toBe("money");
    expect(da[4]!.edge.kind).toBe("info");
    const b = da.find((s) => s.badge === "5b")!;
    expect([b.edge.kind, b.edge.dashed]).toEqual(["money", true]);
  });

  it("documents are held at the collecting bank until payment/acceptance", async () => {
    const dp = await flowSteps("dp");
    expect(dp[2]!.holds?.[0]?.node).toBe("collecting");
    expect(dp[3]!.holds?.[0]?.label).toMatch(/TRẢ TIỀN/);
    expect((await flowSteps("da"))[3]!.holds?.[0]?.label).toMatch(/CHẤP NHẬN/);
  });

  it("L/C: buyer opens with issuing bank first; seller is paid by the advising bank last", async () => {
    const s = await flowSteps("lc");
    expect([s[0]!.edge.from, s[0]!.edge.to]).toEqual(["importer", "issuing"]);
    expect([s[8]!.edge.from, s[8]!.edge.to, s[8]!.edge.kind]).toEqual(["advising", "exporter", "money"]);
  });

  it("risk ladder (EXT) runs cash-in-advance → consignment", () => {
    expect(RISK_LADDER[0]).toMatch(/Cash-in-advance/);
    expect(RISK_LADDER.at(-1)).toMatch(/Consignment/);
    expect(RISK_LADDER).toHaveLength(6);
  });
});
