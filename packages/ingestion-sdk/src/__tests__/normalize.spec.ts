import { describe, it, expect } from "vitest";
import { normalizeTitle, normalizeVendor, parseDate, parseVersion } from "../normalize";

describe("normalizeTitle", () => {
  it("trims and lowercases", () => {
    expect(normalizeTitle("  Google Chrome  ")).toBe("google chrome");
  });

  it("removes architecture suffixes in parens", () => {
    expect(normalizeTitle("7-Zip (x64)")).toBe("7-zip");
    expect(normalizeTitle("App (64-bit)")).toBe("app");
  });

  it("removes edition suffixes", () => {
    expect(normalizeTitle("Visual Studio Enterprise")).toBe("visual studio");
    expect(normalizeTitle("Windows 10 Professional")).toBe("windows 10");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeTitle("Adobe   Acrobat   Reader")).toBe("adobe acrobat reader");
  });
});

describe("normalizeVendor", () => {
  it("normalizes known vendor names", () => {
    expect(normalizeVendor("Adobe Systems Incorporated")).toBe("Adobe");
    expect(normalizeVendor("Microsoft Corporation")).toBe("Microsoft");
    expect(normalizeVendor("Google LLC")).toBe("Google");
  });

  it("strips common suffixes for unknown vendors", () => {
    expect(normalizeVendor("Acme Corp.")).toBe("Acme");
    expect(normalizeVendor("Widgets Inc.")).toBe("Widgets");
    expect(normalizeVendor("Tools Ltd")).toBe("Tools");
  });

  it("preserves clean vendor names", () => {
    expect(normalizeVendor("Midmark")).toBe("Midmark");
  });
});

describe("parseDate", () => {
  it("parses valid date strings", () => {
    const d = parseDate("2024-01-15");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2024);
  });

  it("returns null for empty/null/undefined", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("  ")).toBeNull();
  });

  it("returns null for invalid dates", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });
});

describe("parseVersion", () => {
  it("trims version strings", () => {
    expect(parseVersion("  1.2.3  ")).toBe("1.2.3");
  });

  it("returns null for empty values", () => {
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion(undefined)).toBeNull();
    expect(parseVersion("")).toBeNull();
  });
});
