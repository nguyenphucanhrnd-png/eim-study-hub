import { normalizeSupabaseUrl } from "./cloud";

describe("normalizeSupabaseUrl", () => {
  it.each([
    ["https://abc.supabase.co", "https://abc.supabase.co"],
    ["https://abc.supabase.co/", "https://abc.supabase.co"],
    ["https://abc.supabase.co/rest/v1/", "https://abc.supabase.co"],
    ["  https://abc.supabase.co/rest/v1  ", "https://abc.supabase.co"],
    ['"https://abc.supabase.co"', "https://abc.supabase.co"],
  ])("%s → %s", (raw, expected) => expect(normalizeSupabaseUrl(raw)).toBe(expected));

  it("returns undefined for empty values", () => {
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined();
    expect(normalizeSupabaseUrl("  ")).toBeUndefined();
  });
});
