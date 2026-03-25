/**
 * Shared normalization utilities used by all source adapters.
 * Pure functions — no side effects.
 */

/**
 * Normalize a raw software title string for matching purposes.
 * - Trims whitespace
 * - Lowercases
 * - Removes common suffixes (edition names, architecture tags)
 * - Collapses multiple spaces
 */
export function normalizeTitle(raw: string): string {
  let title = raw.trim().toLowerCase();

  // Remove common version-like suffixes in parens: "(x64)", "(64-bit)", "(v2.1)"
  title = title.replace(/\s*\((?:x64|x86|64-bit|32-bit|v[\d.]+)\)\s*/gi, " ");

  // Remove trailing edition markers
  title = title.replace(
    /\s+(enterprise|professional|pro|standard|home|premium|ultimate|community|express|free|trial)\s*$/i,
    "",
  );

  // Collapse whitespace
  title = title.replace(/\s+/g, " ").trim();

  return title;
}

/**
 * Normalize a vendor name for consistent matching.
 */
export function normalizeVendor(raw: string): string {
  let vendor = raw.trim();

  // Common vendor name normalizations
  const vendorMap: Record<string, string> = {
    "microsoft corporation": "Microsoft",
    "microsoft corp": "Microsoft",
    "microsoft corp.": "Microsoft",
    "adobe systems incorporated": "Adobe",
    "adobe systems": "Adobe",
    "adobe inc": "Adobe",
    "adobe inc.": "Adobe",
    "google llc": "Google",
    "google inc": "Google",
    "google inc.": "Google",
    "apple inc": "Apple",
    "apple inc.": "Apple",
    "oracle corporation": "Oracle",
    "oracle corp": "Oracle",
  };

  const key = vendor.toLowerCase();
  if (vendorMap[key]) {
    return vendorMap[key];
  }

  // Remove common suffixes: Inc, Inc., LLC, Corp, Corporation, Ltd, Ltd.
  vendor = vendor.replace(
    /\s*,?\s*(Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?|Limited|GmbH|S\.?A\.?|B\.?V\.?|Co\.?)$/i,
    "",
  );

  return vendor.trim();
}

/**
 * Parse a date string into a Date, returning null if unparseable.
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value.trim());
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse a version string, trimming whitespace.
 */
export function parseVersion(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value.trim();
}
