// Adapter contract
export type {
  SourceAdapter,
  ValidationResult,
  ValidationError,
  ParseResult,
  ParseWarning,
  RawObservationRecord,
  IngestionResult,
  IngestionError,
  SourceMetadata,
  IngestionMethod,
  EntityType,
} from "./adapter";

// Normalization utilities
export {
  normalizeTitle,
  normalizeVendor,
  parseDate,
  parseVersion,
} from "./normalize";

// Built-in adapters
export { CsvAdapter } from "./adapters";
export type { CsvColumnMapping } from "./adapters";
