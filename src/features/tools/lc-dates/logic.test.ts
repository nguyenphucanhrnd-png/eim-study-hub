import { addDays, checkLcDates, presentationDeadline, toDay, type LcDatesInput } from "./logic";

const base: LcDatesInput = {
  issue: "2026-07-01",
  latestShipment: "2026-08-30",
  shipment: "2026-08-20",
  presentation: "2026-09-05",
  expiry: "2026-09-30",
};

const statusOf = (input: LcDatesInput) => Object.fromEntries(checkLcDates(input).map((r) => [r.id, r.status]));

describe("L/C Date Checker", () => {
  it("passes a fully compliant set of dates", () => {
    expect(Object.values(statusOf(base))).toEqual(["pass", "pass", "pass", "pass", "pass"]);
  });

  it("fails when the L/C is issued on or after the shipment date", () => {
    expect(statusOf({ ...base, issue: "2026-08-20" })["issue-before-shipment"]).toBe("fail");
    expect(statusOf({ ...base, issue: "2026-08-25" })["issue-before-shipment"]).toBe("fail");
  });

  it("allows shipment ON the latest shipment date but not after", () => {
    expect(statusOf({ ...base, shipment: "2026-08-30" })["shipment-by-latest"]).toBe("pass");
    expect(statusOf({ ...base, shipment: "2026-08-31" })["shipment-by-latest"]).toBe("fail");
  });

  it("requires shipment strictly before expiry", () => {
    const s = statusOf({ ...base, shipment: "2026-09-30", latestShipment: "2026-09-30", presentation: "2026-09-30" });
    expect(s["shipment-before-expiry"]).toBe("fail");
  });

  it("uses 21 days by default: day 21 passes, day 22 fails", () => {
    expect(statusOf({ ...base, presentation: addDays(base.shipment, 21) })["presentation-period"]).toBe("pass");
    expect(statusOf({ ...base, presentation: addDays(base.shipment, 22) })["presentation-period"]).toBe("fail");
  });

  it("uses the presentation period stated in the L/C when given (e.g. 20 days, cf. ERRATA E-12)", () => {
    const at21 = { ...base, presentation: addDays(base.shipment, 21), presentationDays: 20 };
    expect(statusOf(at21)["presentation-period"]).toBe("fail");
    expect(statusOf({ ...at21, presentation: addDays(base.shipment, 20) })["presentation-period"]).toBe("pass");
  });

  it("fails presentation after expiry even inside the 21-day window", () => {
    const s = statusOf({ ...base, expiry: "2026-09-01", presentation: "2026-09-05" });
    expect(s["presentation-period"]).toBe("pass");
    expect(s["presentation-by-expiry"]).toBe("fail");
  });

  it("allows presentation ON the expiry date", () => {
    expect(statusOf({ ...base, presentation: "2026-09-30", expiry: "2026-09-30", shipment: "2026-09-15" })["presentation-by-expiry"]).toBe(
      "pass",
    );
  });

  it("flags presentation before shipment as a failure", () => {
    expect(statusOf({ ...base, presentation: "2026-08-10" })["presentation-period"]).toBe("fail");
  });

  it("marks rules as missing when a needed date is empty", () => {
    const s = statusOf({ ...base, expiry: "" });
    expect(s["shipment-before-expiry"]).toBe("missing");
    expect(s["presentation-by-expiry"]).toBe("missing");
    expect(s["issue-before-shipment"]).toBe("pass");
  });

  it("handles month/leap-year boundaries", () => {
    expect(addDays("2028-02-20", 21)).toBe("2028-03-12");
    expect(addDays("2026-12-20", 21)).toBe("2027-01-10");
    expect(toDay("2026-02-30")).toBeNull();
    expect(toDay("2028-02-29")).not.toBeNull();
  });

  it("computes the effective presentation deadline as the earlier of shipment+N and expiry", () => {
    expect(presentationDeadline(base)).toBe("2026-09-10");
    expect(presentationDeadline({ ...base, expiry: "2026-09-01" })).toBe("2026-09-01");
  });
});
