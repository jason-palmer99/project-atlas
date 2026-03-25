/**
 * SourceAdapter contract — all ingestion sources must implement this interface.
 * See ADR-004 for design rationale.
 */

// ── Adapter Interface ──

export interface SourceAdapter {
  /** Unique identifier for this source (used as sourceSystem in observations) */
  readonly sourceId: string;
  /** Human-readable source name */
  readonly sourceName: string;

  /** Validate raw data before ingestion. Returns validation errors if any. */
  validate(data: unknown): ValidationResult;

  /** Parse and normalize raw data into observation records ready for persistence. */
  parse(data: unknown): ParseResult;

  /** Return metadata about this adapter's capabilities and configuration. */
  getMetadata(): SourceMetadata;
}

// ── Validation ──

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  row?: number;
  field?: string;
  message: string;
}

// ── Parse Result ──

export interface ParseResult {
  records: RawObservationRecord[];
  warnings: ParseWarning[];
  /** Total rows processed (including skipped) */
  totalRows: number;
  /** Rows that produced valid records */
  validRows: number;
  /** Rows that were skipped due to validation issues */
  skippedRows: number;
}

export interface ParseWarning {
  row?: number;
  field?: string;
  message: string;
}

/**
 * A normalized observation record ready for persistence.
 * Does NOT include `id`, `createdAt`, `updatedAt` — those are set by the database.
 */
export interface RawObservationRecord {
  rawTitle: string;
  normalizedTitle: string | null;
  vendor: string | null;
  version: string | null;
  sourceSystem: string;
  deviceId: string | null;
  department: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  confidenceScore: number | null;
}

// ── Ingestion Result ──

export interface IngestionResult {
  sourceId: string;
  /** Number of new observations created */
  created: number;
  /** Number of existing observations updated (dedup — lastSeenAt bump) */
  updated: number;
  /** Number of records that failed to persist */
  failed: number;
  /** Errors encountered during persistence */
  errors: IngestionError[];
  /** Duration in milliseconds */
  durationMs: number;
}

export interface IngestionError {
  row?: number;
  rawTitle?: string;
  message: string;
}

// ── Source Metadata ──

export interface SourceMetadata {
  sourceId: string;
  sourceName: string;
  /** How data arrives: 'file-upload', 'api-pull', 'webhook', 'manual' */
  ingestionMethod: IngestionMethod;
  /** What entity types this adapter produces */
  produces: EntityType[];
  /** Description of the source */
  description: string;
}

export type IngestionMethod = "file-upload" | "api-pull" | "webhook" | "manual";
export type EntityType = "observation" | "title" | "evidence";
