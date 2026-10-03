import { scoreClassify } from "../engine/modes/ClassifyQuiz";
import { playFrames } from "../engine/types";
import exportProcess, { COUNTRY_ITEMS, EXPORT_DOCS, IMPORT_DOCS } from "../specs/c1-export-process";
import twoFlows, { COURSE_CHIPS } from "../specs/c1-two-flows";
import hub, { HUB_KIND, PLAYERS } from "../specs/c1-stakeholder-hub";
import pricing, { PRICING_SCENARIOS } from "../specs/c3-pricing-objectives";
import scope, { SCOPE_ITEMS } from "../specs/c3-incoterms-purpose-scope";

describe("C1 / C3 diagrams", () => {
  it("D1.1: 9 stations — 4 in the seller's country, international transport, 4 in the buyer's country", () => {
    expect(exportProcess.steps).toHaveLength(9);
    expect(COUNTRY_ITEMS.map((i) => i.bucket).join(",")).toBe("seller,seller,seller,seller,intl,buyer,buyer,buyer,buyer");
    expect(exportProcess.steps[6]!.what).toMatch(/thuế/);
    expect(EXPORT_DOCS).toHaveLength(6);
    expect(IMPORT_DOCS).toHaveLength(6);
  });

  it("D1.2: 9 goods stations + 5 FX steps A–E, played in parallel", () => {
    expect(twoFlows.steps.filter((s) => s.lane === "goods")).toHaveLength(9);
    expect(twoFlows.steps.filter((s) => s.lane === "money").map((s) => s.badge).join("")).toBe("ABCDE");
    const frames = playFrames(twoFlows);
    expect(frames).toHaveLength(9);
    expect(frames[0]!.map((s) => s.id).sort()).toEqual(["g1", "mA"]);
    expect(COURSE_CHIPS.find((c) => c.id === "payment")!.lanes).toEqual(["money"]);
    expect(COURSE_CHIPS.find((c) => c.id === "insurance")!.lanes).toEqual(["goods"]);
  });

  it("D1.4: Figure 1-6 spokes + 12 players; every node is classified", () => {
    expect(PLAYERS).toHaveLength(12);
    for (const n of hub.nodes) expect(HUB_KIND[n.id], n.id).toBeDefined();
    expect(HUB_KIND.banks).toBe("external");
    expect(HUB_KIND.legal).toBe("internal");
    // every edge is a plain spoke (no arrowheads)
    expect(hub.edges.every((e) => e.plain)).toBe(true);
  });

  it("D3.1: KB wording, two branches, 3 + 3 scenarios", () => {
    expect(pricing.nodes.find((n) => n.id === "p-max")!.labelVi).toBe("Different prices for different markets");
    expect(pricing.note).toMatch(/all markets/);
    expect(PRICING_SCENARIOS.filter((s) => s.bucket === "low")).toHaveLength(3);
    expect(PRICING_SCENARIOS).toHaveLength(6);
  });

  it("D3.2: 4 purposes + 3 not covered", () => {
    expect(scope.nodes.filter((n) => n.id.startsWith("pu-"))).toHaveLength(4);
    expect(scope.nodes.filter((n) => n.id.startsWith("nc-"))).toHaveLength(3);
    expect(SCOPE_ITEMS.filter((i) => i.bucket === "not")).toHaveLength(3);
  });

  it("classify scoring", () => {
    expect(scoreClassify(SCOPE_ITEMS, Object.fromEntries(SCOPE_ITEMS.map((i) => [i.id, i.bucket])))).toBe(100);
    expect(scoreClassify(SCOPE_ITEMS, {})).toBe(0);
    expect(scoreClassify([], {})).toBe(0);
  });
});
