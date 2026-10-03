import { METHODS, SELECTION_OPTIONS, SELECTION_SCENARIOS, eventOrder, exposedParty } from "./methodCompare";
import { MIRROR_PAIRS, PAYMENTS, RULES, exportStates, importStates, ruleGroup } from "./procedureStates";
import exportSpec from "../specs/c8-export-procedure";
import importSpec from "../specs/c8-import-procedure";

const m = (id: string) => METHODS.find((x) => x.id === id)!;

describe("D5.7 method comparison", () => {
  it("covers the six methods of the risk ladder", () => {
    expect(METHODS.map((x) => x.id)).toEqual(["cash-in-advance", "lc", "dp", "da", "open-account", "consignment"]);
  });

  it("cash-in-advance: money before goods → buyer exposed; every other method → seller exposed", () => {
    expect(eventOrder(m("cash-in-advance"))).toEqual(["money", "goods"]);
    expect(exposedParty(m("cash-in-advance"))).toBe("buyer");
    for (const x of METHODS.filter((y) => y.id !== "cash-in-advance")) expect(exposedParty(x), x.id).toBe("seller");
  });

  it("D/P releases documents after payment, D/A after acceptance and before payment", () => {
    expect(eventOrder(m("dp"))).toEqual(["goods", "money", "documents"]);
    expect(eventOrder(m("da"))).toEqual(["goods", "documents", "money"]);
  });

  it("open account mails documents with the goods; L/C is opened before shipment", () => {
    expect(eventOrder(m("open-account"))).toEqual(["goods", "documents", "money"]);
    expect(m("open-account").events.find((e) => e.kind === "documents")!.slot).toBe(1);
    expect(m("lc").beforeVi).toMatch(/TRƯỚC khi giao hàng/);
  });

  it("selection quiz answers are valid options with a KB reason", () => {
    const ids = new Set(SELECTION_OPTIONS.map((o) => o.id));
    for (const s of SELECTION_SCENARIOS) {
      expect(ids.has(s.answer)).toBe(true);
      expect(s.whyVi).toMatch(/KB §5\.\d/);
    }
    expect(SELECTION_SCENARIOS.find((s) => s.id === "new-political")!.answer).toBe("cash-in-advance");
  });
});

describe("D8.1 / D8.2 procedure state badges", () => {
  it("returns a state for every step of both procedures, for all 11 × 5 scenarios", () => {
    for (const r of RULES)
      for (const p of PAYMENTS) {
        expect(Object.keys(exportStates(r, p.id)).sort()).toEqual(exportSpec.steps.map((s) => s.id).sort());
        expect(Object.keys(importStates(r, p.id)).sort()).toEqual(importSpec.steps.map((s) => s.id).sort());
      }
  });

  it("rule groups", () => {
    expect(RULES.map(ruleGroup).join("")).toBe("EFFFCCCCDDD");
  });

  it("main transport: seller under C & D, buyer under E & F (both procedures)", () => {
    for (const r of RULES) {
      const g = ruleGroup(r);
      const who = g === "C" || g === "D" ? "seller" : "buyer";
      expect(exportStates(r, "lc").e5.state, r).toBe(who);
      expect(importStates(r, "lc").i3.state, r).toBe(who);
    }
  });

  it("insurance: mandatory for the seller under CIF & CIP; buyer may insure under E, F, CPT, CFR", () => {
    for (const r of RULES) {
      const e6 = exportStates(r, "lc").e6.state;
      const i4 = importStates(r, "lc").i4.state;
      if (r === "CIF" || r === "CIP") expect([e6, i4], r).toEqual(["seller", "na"]);
      else expect(e6, r).toBe("optional");
      if (["EXW", "FCA", "FAS", "FOB", "CPT", "CFR"].includes(r)) expect(i4, r).toBe("optional");
      if (["DAP", "DPU", "DDP"].includes(r)) expect(i4, r).toBe("na");
    }
    expect(exportStates("CIF", "lc").e6.noteVi).toMatch(/ICC \(C\)/);
    expect(exportStates("CIP", "lc").e6.noteVi).toMatch(/ICC \(A\)/);
  });

  it("EXW: buyer clears export; DDP: seller clears import; otherwise the usual party", () => {
    expect(exportStates("EXW", "lc").e7.state).toBe("buyer");
    expect(importStates("DDP", "lc").i5.state).toBe("seller");
    for (const r of RULES.filter((x) => x !== "EXW")) expect(exportStates(r, "lc").e7.state).toBe("seller");
    for (const r of RULES.filter((x) => x !== "DDP")) expect(importStates(r, "lc").i5.state).toBe("buyer");
  });

  it("check L/C (export 2) and open L/C (import 2) only when paying by L/C", () => {
    expect(exportStates("FOB", "lc").e2.noteVi).toMatch(/Kiểm tra L\/C/);
    expect(importStates("FOB", "lc").i2.noteVi).toMatch(/Mở L\/C/);
    for (const p of PAYMENTS.filter((x) => x.id !== "lc")) {
      expect(exportStates("FOB", p.id).e2.noteVi).toMatch(/Không có L\/C/);
      expect(importStates("FOB", p.id).i2.noteVi).toMatch(/Không cần mở L\/C/);
    }
  });

  it("presenting documents depends on the payment method", () => {
    expect(exportStates("CIF", "lc").e9.noteVi).toMatch(/21 ngày/);
    expect(exportStates("CIF", "dp").e9.noteVi).toMatch(/trả tiền/);
    expect(exportStates("CIF", "da").e9.noteVi).toMatch(/chấp nhận/);
    expect(exportStates("CIF", "tt-deferred").e9.noteVi).toMatch(/Theo hợp đồng/);
    expect(importStates("CIF", "tt-advance").i9.noteVi).toMatch(/TRƯỚC/);
  });

  it("only DPU says the seller unloads; inspection and claims are optional", () => {
    for (const r of RULES) expect(/người bán đã dỡ/.test(importStates(r, "lc").i6.noteVi), r).toBe(r === "DPU");
    expect(exportStates("FOB", "lc").e4.state).toBe("optional");
    expect(exportStates("FOB", "lc").e10.state).toBe("optional");
  });

  it("mirror pairs reference existing steps, each step at most once", () => {
    const ex = new Set(exportSpec.steps.map((s) => s.id));
    const im = new Set(importSpec.steps.map((s) => s.id));
    for (const p of MIRROR_PAIRS) expect(ex.has(p.exportId) && im.has(p.importId), p.labelVi).toBe(true);
    expect(new Set(MIRROR_PAIRS.map((p) => p.exportId)).size).toBe(MIRROR_PAIRS.length);
    expect(new Set(MIRROR_PAIRS.map((p) => p.importId)).size).toBe(MIRROR_PAIRS.length);
  });
});
