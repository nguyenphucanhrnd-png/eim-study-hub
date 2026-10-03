import { RULES, type RuleCode } from "@/features/tools/incoterms/data";
import { MODES, PAYMENTS, buildJourney, ruleAllowed, type Journey, type PaymentId } from "./buildJourney";

const ok = (rule: RuleCode, payment: PaymentId = "lc", mode: "sea" | "air" | "road" = "sea"): Journey => {
  const j = buildJourney(rule, payment, mode);
  if (!j.ok) throw new Error(j.reasonVi);
  return j;
};
const seqOf = (j: Journey, id: string) => {
  const c = j.cards.find((x) => x.id === id);
  if (!c) throw new Error(`no card ${id}`);
  return c.seq;
};

describe("buildJourney (DIAGRAMS_PROMPT §5.3)", () => {
  it("all 11 × 5 × valid-mode combinations build without error", () => {
    let n = 0;
    for (const r of RULES)
      for (const p of PAYMENTS)
        for (const m of MODES) {
          const j = buildJourney(r.code, p.id, m.id);
          expect(j.ok, `${r.code}/${p.id}/${m.id}`).toBe(ruleAllowed(r.code, m.id));
          if (j.ok) {
            n++;
            expect(j.cards.length).toBeGreaterThan(10);
            // seq is 1…n and phases never go backwards in play order
            j.cards.forEach((c, i) => expect(c.seq).toBe(i + 1));
            for (let i = 1; i < j.cards.length; i++) expect(j.cards[i]!.phase, `${r.code}/${p.id}`).toBeGreaterThanOrEqual(j.cards[i - 1]!.phase);
          }
        }
    expect(n).toBe(11 * 5 + 7 * 5 * 2);
  });

  it("export clearance: EXW → buyer, otherwise seller; import clearance: DDP → seller, otherwise buyer", () => {
    for (const r of RULES) {
      const j = ok(r.code);
      expect(j.exportClearance, r.code).toBe(r.code === "EXW" ? "B" : "S");
      expect(j.importClearance, r.code).toBe(r.code === "DDP" ? "S" : "B");
    }
  });

  it("main carriage: C & D → seller, E & F → buyer", () => {
    for (const r of RULES) expect(ok(r.code).mainCarriage, r.code).toBe(r.group === "C" || r.group === "D" ? "S" : "B");
  });

  it("DPU is the only rule where the seller unloads", () => {
    expect(RULES.filter((r) => ok(r.code).unloadedBy === "S").map((r) => r.code)).toEqual(["DPU"]);
  });

  it("risk points per KB §3.8", () => {
    for (const c of ["FOB", "CFR", "CIF"] as const) expect(ok(c).risk.where).toBe("on-board");
    for (const c of ["CPT", "CIP"] as const) expect(ok(c).risk.where).toBe("first-carrier");
    expect(ok("FAS").risk.where).toBe("alongside-ship");
    expect(ok("EXW").risk.where).toBe("disposal-not-loaded");
    expect(ok("DAP").risk.where).toBe("ready-for-unloading");
    expect(ok("DPU").risk.where).toBe("unloaded");
    expect(ok("DDP").risk.where).toBe("cleared-ready-for-unloading");
    const fca = buildJourney("FCA", "lc", "sea", { fcaAtPremises: true });
    expect(fca.ok && fca.risk.where).toBe("loaded-at-premises");
  });

  it("C-rules have two different markers; other rules one", () => {
    for (const r of RULES) {
      const j = ok(r.code);
      expect(j.risk.phase !== j.cost.phase, r.code).toBe(r.group === "C");
    }
    expect(ok("CIF").risk.phase).toBeLessThan(ok("CIF").cost.phase);
  });

  it("insurance: CIF = seller ICC (C), CIP = seller ICC (A), otherwise optional for the risk bearer", () => {
    expect(ok("CIF").insurance).toMatchObject({ mandatory: true, by: "S", policy: "ICC (C)" });
    expect(ok("CIP").insurance).toMatchObject({ mandatory: true, by: "S", policy: "ICC (A)" });
    expect(ok("FOB").insurance).toMatchObject({ mandatory: false, by: "B", policy: null });
    expect(ok("CFR").insurance).toMatchObject({ mandatory: false, by: "B" });
    expect(ok("DAP").insurance).toMatchObject({ mandatory: false, by: "S" });
  });

  it("FAS/FOB/CFR/CIF reject air and road; air uses the AWB", () => {
    for (const c of ["FAS", "FOB", "CFR", "CIF"] as const)
      for (const m of ["air", "road"] as const) {
        const j = buildJourney(c, "lc", m);
        expect(j.ok).toBe(false);
        if (!j.ok) expect(j.reasonVi).toMatch(/đường biển/);
      }
    expect(ok("FCA", "lc", "air").transportDoc).toBe("Air waybill (AWB)");
    expect(ok("FOB").transportDoc).toBe("Bill of lading (B/L)");
  });

  it("D/P releases documents after payment, D/A after acceptance (and before payment)", () => {
    const dp = ok("CIF", "dp");
    expect(seqOf(dp, "pay-money")).toBeLessThan(seqOf(dp, "docs-release"));
    const da = ok("CIF", "da");
    expect(seqOf(da, "accept")).toBeLessThan(seqOf(da, "docs-release"));
    expect(seqOf(da, "docs-release")).toBeLessThan(seqOf(da, "pay-money"));
  });

  it("T/T advance: money before goods; T/T deferred: goods before money", () => {
    const adv = ok("FOB", "tt-advance");
    expect(seqOf(adv, "pay-money")).toBeLessThan(seqOf(adv, "deliver"));
    const def = ok("FOB", "tt-deferred");
    expect(seqOf(def, "deliver")).toBeLessThan(seqOf(def, "pay-money"));
  });

  it("L/C: open L/C precedes shipment", () => {
    for (const r of RULES) {
      const j = ok(r.code, "lc");
      expect(seqOf(j, "lc-open"), r.code).toBeLessThan(seqOf(j, "deliver"));
    }
  });
});
