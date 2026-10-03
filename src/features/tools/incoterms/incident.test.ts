import { RULES, RULE_BY_CODE, STAGES } from "./data";
import { INCIDENTS, STRIP_POINTS, buildChallenge, incidentAt, resolveRule, transferX } from "./incident";

const stage = (id: string) => STAGES.findIndex((s) => s.id === id);
const at = (code: keyof typeof RULE_BY_CODE, st: string, fca = false) => incidentAt(resolveRule(RULE_BY_CODE[code], fca), stage(st));

describe("D3.3 strip and incident logic", () => {
  it("the strip has the 10 points of the slide (KB §3.7)", () => {
    expect(STRIP_POINTS).toHaveLength(10);
    expect(STRIP_POINTS[0]!.id).toBe("seller-premises");
    expect(STRIP_POINTS[9]!.id).toBe("buyer-premises");
  });

  it("one incident per Explorer stage", () => {
    expect(INCIDENTS.map((i) => i.stage).sort()).toEqual(STAGES.map((_, i) => i));
  });

  it("loading on board: seller's risk under FOB, buyer's under FAS", () => {
    expect(at("FOB", "loading").risk).toBe("S");
    expect(at("FAS", "loading").risk).toBe("B");
  });

  it("storm at sea under CIF: buyer bears the risk, seller paid the freight and must insure ICC (C)", () => {
    const r = at("CIF", "main-carriage");
    expect([r.risk, r.cost, r.mainCarriage]).toEqual(["B", "S", "S"]);
    expect(r.insurance).toEqual({ kind: "compulsory", policy: "ICC (C)" });
    expect(r.explanationVi).toMatch(/hai điểm tới hạn/);
  });

  it("storm under CIP = ICC (A); under CFR no compulsory insurance, the buyer may insure", () => {
    expect(at("CIP", "main-carriage").insurance).toEqual({ kind: "compulsory", policy: "ICC (A)" });
    expect(at("CFR", "main-carriage").insurance).toEqual({ kind: "optional", bearer: "B" });
  });

  it("unloading at destination: seller only under DPU", () => {
    for (const r of RULES) expect(incidentAt(r, stage("unloading")).risk, r.code).toBe(r.code === "DPU" ? "S" : "B");
  });

  it("formalities: EXW export clearance paid by buyer, DDP import clearance by seller", () => {
    expect(at("EXW", "export-clearance").cost).toBe("B");
    expect(at("DDP", "import-clearance").cost).toBe("S");
    expect(at("FCA", "export-clearance", true).cost).toBe("S");
  });

  it("C-rules draw two different markers; other rules one", () => {
    for (const r of RULES) {
      const two = Math.abs(transferX(r.costs) - transferX(r.risks)) > 0.01;
      expect(two, r.code).toBe(r.group === "C");
    }
  });

  it("FCA at premises transfers risk earlier than FCA at another place", () => {
    const premises = resolveRule(RULE_BY_CODE.FCA, true);
    expect(transferX(premises.risks)).toBeLessThan(transferX(RULE_BY_CODE.FCA.risks));
  });

  it("challenge pairs are distinct and reproducible", () => {
    const a = buildChallenge(RULES, 5, 42);
    expect(a).toHaveLength(5);
    expect(new Set(a.map((c) => `${c.rule}-${c.incident.id}`)).size).toBe(5);
    expect(buildChallenge(RULES, 5, 42)).toEqual(a);
  });
});
