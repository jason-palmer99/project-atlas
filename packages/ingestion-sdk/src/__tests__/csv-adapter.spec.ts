import { describe, it, expect } from "vitest";
import { CsvAdapter } from "../adapters/csv-adapter";

const VALID_CSV = `Application,Vendor,Version,DeviceId,Department
Google Chrome,Google LLC,125.0,PC-001,Engineering
7-Zip,Igor Pavlov,24.05,PC-002,IT
Adobe Acrobat Reader,Adobe Systems Incorporated,2024.001,,Finance`;

const MINIMAL_CSV = `Application
Google Chrome
Firefox`;

describe("CsvAdapter", () => {
  const adapter = new CsvAdapter();

  describe("getMetadata", () => {
    it("returns correct metadata", () => {
      const meta = adapter.getMetadata();
      expect(meta.sourceId).toBe("csv-import");
      expect(meta.ingestionMethod).toBe("file-upload");
      expect(meta.produces).toContain("observation");
    });
  });

  describe("validate", () => {
    it("accepts valid CSV", () => {
      const result = adapter.validate(VALID_CSV);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects non-string data", () => {
      const result = adapter.validate(123);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("CSV string");
    });

    it("rejects empty string", () => {
      const result = adapter.validate("");
      expect(result.valid).toBe(false);
    });

    it("rejects header-only CSV", () => {
      const result = adapter.validate("Application,Vendor");
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("at least one data row");
    });

    it("rejects CSV missing required column", () => {
      const result = adapter.validate("Name,Vendor\nChrome,Google");
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain("Application");
    });
  });

  describe("parse", () => {
    it("parses valid CSV with all columns", () => {
      const result = adapter.parse(VALID_CSV);
      expect(result.validRows).toBe(3);
      expect(result.skippedRows).toBe(0);
      expect(result.records).toHaveLength(3);

      const chrome = result.records[0];
      expect(chrome.rawTitle).toBe("Google Chrome");
      expect(chrome.normalizedTitle).toBe("google chrome");
      expect(chrome.vendor).toBe("Google");
      expect(chrome.version).toBe("125.0");
      expect(chrome.deviceId).toBe("PC-001");
      expect(chrome.sourceSystem).toBe("csv-import");
    });

    it("normalizes vendor names", () => {
      const result = adapter.parse(VALID_CSV);
      const adobe = result.records[2];
      expect(adobe.vendor).toBe("Adobe");
    });

    it("handles minimal CSV with only required column", () => {
      const result = adapter.parse(MINIMAL_CSV);
      expect(result.validRows).toBe(2);
      expect(result.records[0].rawTitle).toBe("Google Chrome");
      expect(result.records[0].vendor).toBeNull();
      expect(result.records[0].deviceId).toBeNull();
    });

    it("skips rows with missing required field", () => {
      const csv = `Application,Vendor
Chrome,Google
,Microsoft
Firefox,Mozilla`;
      const result = adapter.parse(csv);
      expect(result.validRows).toBe(2);
      expect(result.skippedRows).toBe(1);
      expect(result.warnings).toHaveLength(1);
    });

    it("handles empty device ID gracefully", () => {
      const result = adapter.parse(VALID_CSV);
      const adobe = result.records[2];
      expect(adobe.deviceId).toBeNull();
    });

    it("returns empty records for invalid data", () => {
      const result = adapter.parse(42);
      expect(result.records).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("custom column mapping", () => {
    it("uses custom column names", () => {
      const csv = `Software Name,Manufacturer
Slack,Salesforce
Teams,Microsoft`;

      const customAdapter = new CsvAdapter({
        rawTitle: "Software Name",
        vendor: "Manufacturer",
      });

      const validation = customAdapter.validate(csv);
      expect(validation.valid).toBe(true);

      const result = customAdapter.parse(csv);
      expect(result.validRows).toBe(2);
      expect(result.records[0].rawTitle).toBe("Slack");
      expect(result.records[0].vendor).toBe("Salesforce");
    });
  });

  describe("CSV quoting", () => {
    it("handles quoted fields with commas", () => {
      const csv = `Application,Vendor,Version
"Microsoft Office 365, Business",Microsoft,16.0
Chrome,Google,125`;

      const result = adapter.parse(csv);
      expect(result.validRows).toBe(2);
      expect(result.records[0].rawTitle).toBe("Microsoft Office 365, Business");
    });

    it("handles escaped quotes", () => {
      const csv = `Application,Vendor
"App with ""quotes""",TestVendor`;

      const result = adapter.parse(csv);
      expect(result.records[0].rawTitle).toBe('App with "quotes"');
    });
  });
});
