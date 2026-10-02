import { RULES, RULE_BY_CODE, FCA_AT_PREMISES, STAGES, type Party, type RuleCode } from "./data";

/**
 * Independent transcription of KB §3.8 (obligation matrix) — the Explorer data must match it.
 * Columns: mode, named place, export licence, import licence, main carriage, insurance.
 */
const KB_3_8: Record<RuleCode, [string, string, Party, Party, Party, string]> = {
  EXW: ["any", "Named place of delivery", "B", "B", "B", "none"],
  FCA: ["any", "Named place of delivery", "S", "B", "B", "none"],
  FAS: ["sea", "Named port of shipment", "S", "B", "B", "none"],
  FOB: ["sea", "Named port of shipment", "S", "B", "B", "none"],
  CFR: ["sea", "Named port of destination", "S", "B", "S", "none"],
  CIF: ["sea", "Named port of destination", "S", "B", "S", "ICC (C)"],
  CPT: ["any", "Named place of destination", "S", "B", "S", "none"],
  CIP: ["any", "Named place of destination", "S", "B", "S", "ICC (A)"],
  DAP: ["any", "Named place of destination", "S", "B", "S", "none"],
  DPU: ["any", "Named place of destination", "S", "B", "S", "none"],
  DDP: ["any", "Named place of destination", "S", "S", "S", "none"],
};

/** Stage at which risk passes to the buyer (first buyer stage), per the KB delivery column. */
const KB_RISK_POINT: Record<RuleCode, string> = {
  EXW: "seller-premises", // at buyer's disposal, not loaded
  FCA: "loading", // delivered to the carrier at the named (other) place
  FAS: "loading", // alongside ship — loading on board is the buyer's
  FOB: "main-carriage", // on board
  CFR: "main-carriage", // on board at port of shipment
  CIF: "main-carriage",
  CPT: "loading", // first carrier
  CIP: "loading",
  DAP: "unloading", // ready for unloading
  DPU: "import-clearance", // once unloaded
  DDP: "unloading", // ready for unloading, cleared for import
};

const stageIndex = (id: string) => STAGES.findIndex((s) => s.id === id);

describe("Incoterms Explorer data vs KB §3.8", () => {
  it("has exactly the 11 Incoterms® 2020 rules", () => {
    expect(RULES.map((r) => r.code).sort()).toEqual(Object.keys(KB_3_8).sort());
  });

  it.each(Object.entries(KB_3_8))("%s matches the obligation matrix", (code, [mode, place, exp, imp, carriage, ins]) => {
    const r = RULE_BY_CODE[code as RuleCode];
    expect([r.mode, r.namedPlace, r.exportLicence, r.importLicence, r.mainCarriage, r.insurance]).toEqual([
      mode,
      place,
      exp,
      imp,
      carriage,
      ins,
    ]);
  });

  it.each(Object.entries(KB_RISK_POINT))("%s: risk passes at the KB delivery point", (code, stage) => {
    const r = RULE_BY_CODE[code as RuleCode];
    expect(r.risks.indexOf("B")).toBe(stageIndex(stage));
  });

  it("every rule has a value for each of the 9 stages", () => {
    for (const r of RULES) {
      expect(r.costs).toHaveLength(STAGES.length);
      expect(r.risks).toHaveLength(STAGES.length);
    }
  });

  it("seller pays costs at least as long as it bears risk (general rule: costs until delivery)", () => {
    for (const r of RULES) r.risks.forEach((party, i) => party === "S" && expect(r.costs[i]).toBe("S"));
  });

  it("C-group: risk passes at origin but seller pays main carriage to destination", () => {
    for (const code of ["CFR", "CIF", "CPT", "CIP"] as const) {
      const r = RULE_BY_CODE[code];
      expect(r.costs[stageIndex("main-carriage")]).toBe("S");
      expect(r.risks[stageIndex("main-carriage")]).toBe("B");
    }
  });

  it("only CIF and CIP carry compulsory insurance, covering stages where the buyer bears risk", () => {
    for (const r of RULES) {
      if (r.code === "CIF" || r.code === "CIP") {
        expect(r.insuredStages.length).toBeGreaterThan(0);
        for (const i of r.insuredStages) expect(r.risks[i]).toBe("B");
      } else expect(r.insuredStages).toEqual([]);
    }
  });

  it("customs formalities follow the licence columns", () => {
    for (const r of RULES) {
      expect(r.costs[stageIndex("export-clearance")]).toBe(r.exportLicence);
      expect(r.costs[stageIndex("import-clearance")]).toBe(r.importLicence);
    }
  });

  it("DPU is the only rule where the seller unloads at destination", () => {
    const unloading = stageIndex("unloading");
    expect(RULES.filter((r) => r.costs[unloading] === "S").map((r) => r.code)).toEqual(["DPU"]);
  });

  it("FCA at seller's premises: risk passes once loaded, export clearance still the seller's", () => {
    expect(FCA_AT_PREMISES.risks.indexOf("B")).toBe(stageIndex("pre-carriage"));
    expect(FCA_AT_PREMISES.costs[stageIndex("export-clearance")]).toBe("S");
  });
});
