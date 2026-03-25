import {
  SourceAdapter,
  ValidationResult,
  ValidationError,
  ParseResult,
  ParseWarning,
  RawObservationRecord,
  SourceMetadata,
} from "../adapter";
import { normalizeTitle, normalizeVendor, parseVersion } from "../normalize";

/**
 * Configuration for the CSV adapter — maps CSV column headers to observation fields.
 */
export interface CsvColumnMapping {
  /** Column name for the software application name (required) */
  rawTitle: string;
  /** Column name for vendor/manufacturer */
  vendor?: string;
  /** Column name for version */
  version?: string;
  /** Column name for device identifier */
  deviceId?: string;
  /** Column name for department */
  department?: string;
  /** Column name for first seen date */
  firstSeenAt?: string;
  /** Column name for last seen date */
  lastSeenAt?: string;
}

/** Default mapping assumes standard column names */
const DEFAULT_MAPPING: CsvColumnMapping = {
  rawTitle: "Application",
  vendor: "Vendor",
  version: "Version",
  deviceId: "DeviceId",
  department: "Department",
  firstSeenAt: "FirstSeenAt",
  lastSeenAt: "LastSeenAt",
};

/**
 * CSV Source Adapter — parses CSV text into SoftwareObservation records.
 *
 * Expects data as a string of CSV content. Uses configurable column mapping
 * so the same adapter works for different CSV formats.
 */
export class CsvAdapter implements SourceAdapter {
  readonly sourceId = "csv-import";
  readonly sourceName = "CSV File Import";

  private mapping: CsvColumnMapping;

  constructor(mapping?: Partial<CsvColumnMapping>) {
    this.mapping = { ...DEFAULT_MAPPING, ...mapping };
  }

  getMetadata(): SourceMetadata {
    return {
      sourceId: this.sourceId,
      sourceName: this.sourceName,
      ingestionMethod: "file-upload",
      produces: ["observation"],
      description:
        "Imports software observations from CSV files. Supports configurable column mapping.",
    };
  }

  validate(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    if (typeof data !== "string") {
      errors.push({ message: "Data must be a CSV string" });
      return { valid: false, errors };
    }

    if (!data.trim()) {
      errors.push({ message: "CSV data is empty" });
      return { valid: false, errors };
    }

    const lines = data.trim().split(/\r?\n/);
    if (lines.length < 2) {
      errors.push({
        message: "CSV must contain a header row and at least one data row",
      });
      return { valid: false, errors };
    }

    const headers = parseCsvLine(lines[0]);
    const requiredColumn = this.mapping.rawTitle;

    if (!headers.includes(requiredColumn)) {
      errors.push({
        field: requiredColumn,
        message: `Required column "${requiredColumn}" not found in CSV headers. Found: ${headers.join(", ")}`,
      });
    }

    return { valid: errors.length === 0, errors };
  }

  parse(data: unknown): ParseResult {
    const validation = this.validate(data);
    if (!validation.valid) {
      return {
        records: [],
        warnings: validation.errors.map((e) => ({
          message: e.message,
          field: e.field,
        })),
        totalRows: 0,
        validRows: 0,
        skippedRows: 0,
      };
    }

    const csvString = data as string;
    const lines = csvString.trim().split(/\r?\n/);
    const headers = parseCsvLine(lines[0]);
    const dataLines = lines.slice(1);

    const records: RawObservationRecord[] = [];
    const warnings: ParseWarning[] = [];
    let skippedRows = 0;

    const now = new Date();

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2; // 1-indexed, accounting for header
      const line = dataLines[i].trim();

      if (!line) {
        skippedRows++;
        continue;
      }

      const values = parseCsvLine(line);
      const row = mapToObject(headers, values);

      const rawTitle = row[this.mapping.rawTitle]?.trim();
      if (!rawTitle) {
        warnings.push({
          row: rowNum,
          field: this.mapping.rawTitle,
          message: `Missing required field "${this.mapping.rawTitle}"`,
        });
        skippedRows++;
        continue;
      }

      const vendor = this.mapping.vendor
        ? row[this.mapping.vendor]?.trim() || null
        : null;
      const version = this.mapping.version
        ? parseVersion(row[this.mapping.version])
        : null;
      const deviceId = this.mapping.deviceId
        ? row[this.mapping.deviceId]?.trim() || null
        : null;
      const department = this.mapping.department
        ? row[this.mapping.department]?.trim() || null
        : null;

      const firstSeenRaw = this.mapping.firstSeenAt
        ? row[this.mapping.firstSeenAt]?.trim()
        : null;
      const lastSeenRaw = this.mapping.lastSeenAt
        ? row[this.mapping.lastSeenAt]?.trim()
        : null;

      const firstSeenAt = firstSeenRaw ? new Date(firstSeenRaw) : now;
      const lastSeenAt = lastSeenRaw ? new Date(lastSeenRaw) : now;

      if (isNaN(firstSeenAt.getTime())) {
        warnings.push({
          row: rowNum,
          field: "firstSeenAt",
          message: `Invalid date "${firstSeenRaw}", using current time`,
        });
        firstSeenAt.setTime(now.getTime());
      }

      if (isNaN(lastSeenAt.getTime())) {
        warnings.push({
          row: rowNum,
          field: "lastSeenAt",
          message: `Invalid date "${lastSeenRaw}", using current time`,
        });
        lastSeenAt.setTime(now.getTime());
      }

      records.push({
        rawTitle,
        normalizedTitle: normalizeTitle(rawTitle),
        vendor: vendor ? normalizeVendor(vendor) : null,
        version,
        sourceSystem: this.sourceId,
        deviceId,
        department,
        firstSeenAt,
        lastSeenAt,
        confidenceScore: null,
      });
    }

    return {
      records,
      warnings,
      totalRows: dataLines.length,
      validRows: records.length,
      skippedRows,
    };
  }
}

// ── CSV Parsing Helpers ──

/**
 * Parse a single CSV line, handling quoted fields with commas and escaped quotes.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Zip headers and values into a key-value record.
 */
function mapToObject(
  headers: string[],
  values: string[],
): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    obj[headers[i]] = values[i] ?? "";
  }
  return obj;
}
