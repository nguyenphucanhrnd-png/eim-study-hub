import { resolveVariant } from "../engine/types";
import exportPlan, { ELEVEN_QUESTIONS } from "../specs/c2-export-plan";
import subrogation from "../specs/c4-subrogation";
import contract, { DRAFT_CLAUSES } from "../specs/c6-contract-anatomy";
import lifecycle from "../specs/c7-document-lifecycle";
import blTypes, { BL_ITEMS } from "../specs/c7-bl-types";
import { YEAR_ITEMS } from "./P2Views";

describe("P2 derived diagrams", () => {
  it("D2.1: 9 components + the 11 questions mapped to existing components", () => {
    expect(exportPlan.nodes.filter((n) => n.id !== "plan")).toHaveLength(9);
    expect(ELEVEN_QUESTIONS).toHaveLength(11);
    const ids = new Set(exportPlan.nodes.map((n) => n.id));
    for (const q of ELEVEN_QUESTIONS) for (const c of q.components) expect(ids.has(c), c).toBe(true);
  });

  it("D3.4: 7 changes quiz – DAT is 2010, DPU is 2020", () => {
    expect(YEAR_ITEMS.find((i) => i.textVi.startsWith("DAT"))!.bucket).toBe("2010");
    expect(YEAR_ITEMS.find((i) => i.textVi.startsWith("DPU"))!.bucket).toBe("2020");
  });

  it("D4.1: subrogation only after payment; no insurable interest → rejected, no subrogation", () => {
    const ids = subrogation.steps.map((s) => s.id);
    expect(ids.indexOf("s3")).toBeLessThan(ids.indexOf("s4"));
    const v = resolveVariant(subrogation, "no-interest");
    expect(v.steps).toHaveLength(3);
    expect(v.edges.some((e) => e.id === "subrogate")).toBe(false);
  });

  it("D6.1: 3 phases + 14 articles, dependency lines as in the spec", () => {
    expect(contract.nodes).toHaveLength(16);
    const deps = contract.edges.map((e) => `${e.from}-${e.to}`);
    expect(deps).toEqual(expect.arrayContaining(["price-delivery", "delivery-insurance", "insurance-documents", "payment-documents", "claim-penalty", "penalty-force-majeure", "force-majeure-arbitration"]));
    expect(DRAFT_CLAUSES.some((c) => c.bucket === "ok") && DRAFT_CLAUSES.some((c) => c.bucket === "error")).toBe(true);
  });

  it("D7.1: commercial invoice is issued by the seller and used by buyer, customs and bank; checklists 7 / 19 / 4", () => {
    const inv = lifecycle.steps.find((s) => s.id === "invoice")!;
    expect(inv.actors).toEqual(["i-seller", "invoice", "u-buyer", "u-customs", "u-bank"]);
    expect(inv.details![0]!.items).toHaveLength(7);
    expect(lifecycle.steps.find((s) => s.id === "bl")!.details![0]!.items).toHaveLength(19);
    expect(lifecycle.steps.find((s) => s.id === "insurance")!.details![0]!.items).toHaveLength(4);
    expect(lifecycle.steps.find((s) => s.id === "bl")!.actors[0]).toBe("i-carrier");
  });

  it("D7.2: 7 B/L types, one quiz item each", () => {
    const types = blTypes.nodes.filter((n) => !n.id.startsWith("q-") && n.id !== "bl");
    expect(types).toHaveLength(7);
    expect(new Set(BL_ITEMS.map((i) => i.bucket))).toEqual(new Set(types.map((t) => t.id)));
  });
});
