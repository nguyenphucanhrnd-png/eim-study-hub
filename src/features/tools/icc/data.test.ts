import { PERILS, covers } from "./data";

describe("ICC Coverage data (Table 6.2)", () => {
  it("has the 20 perils of the slide table", () => {
    expect(PERILS).toHaveLength(20);
  });

  it("ICC (C) covers the 6 major casualties + nondelivery/theft (slide values)", () => {
    const c = PERILS.filter((p) => covers(p, "ICC-C")).map((p) => p.id);
    expect(c).toEqual(["collision", "discharge", "ga-salvage", "jettison", "overturning", "grounded", "nondelivery", "theft"]);
  });

  it("ICC (B) adds exactly the four 'b-adds' perils to ICC (C)", () => {
    const added = PERILS.filter((p) => covers(p, "ICC-B") && !covers(p, "ICC-C"));
    expect(added.map((p) => p.tier)).toEqual(["b-adds", "b-adds", "b-adds", "b-adds"]);
  });

  it("ICC (A) and All Risks cover every peril", () => {
    expect(PERILS.every((p) => covers(p, "ICC-A") && covers(p, "AR"))).toBe(true);
  });

  it("WA/FPA differ from ICC-B/C only on nondelivery and theft (E-05)", () => {
    const diffB = PERILS.filter((p) => covers(p, "WA") !== covers(p, "ICC-B")).map((p) => p.id);
    const diffC = PERILS.filter((p) => covers(p, "FPA") !== covers(p, "ICC-C")).map((p) => p.id);
    expect(diffB).toEqual(["nondelivery", "theft"]);
    expect(diffC).toEqual(["nondelivery", "theft"]);
  });

  it("flags the E-04 cells", () => {
    expect(PERILS.filter((p) => p.errata).map((p) => p.id)).toEqual(["nondelivery", "theft"]);
  });
});
