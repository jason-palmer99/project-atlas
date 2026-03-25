import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ObservationsService } from "../observations/observations.service";
import {
  SourceAdapter,
  IngestionResult,
  IngestionError,
  RawObservationRecord,
  CsvAdapter,
  CsvColumnMapping,
} from "@atlas/ingestion-sdk";

@Injectable()
export class IngestionService {
  private adapters = new Map<string, SourceAdapter>();

  constructor(
    private prisma: PrismaService,
    private observationsService: ObservationsService,
  ) {
    // Register built-in adapters
    const csvAdapter = new CsvAdapter();
    this.adapters.set(csvAdapter.sourceId, csvAdapter);
  }

  /** Get all registered adapter metadata */
  getAdapters() {
    return Array.from(this.adapters.values()).map((a) => a.getMetadata());
  }

  /** Get a specific adapter by sourceId */
  getAdapter(sourceId: string): SourceAdapter | undefined {
    return this.adapters.get(sourceId);
  }

  /** Register a new adapter (used by source-specific modules) */
  registerAdapter(adapter: SourceAdapter) {
    this.adapters.set(adapter.sourceId, adapter);
  }

  /**
   * Ingest CSV data using the CSV adapter with optional column mapping.
   */
  async ingestCsv(
    csv: string,
    columnMapping?: Partial<CsvColumnMapping>,
  ): Promise<IngestionResult> {
    const adapter = columnMapping
      ? new CsvAdapter(columnMapping)
      : (this.adapters.get("csv-import") as CsvAdapter);

    // Validate
    const validation = adapter.validate(csv);
    if (!validation.valid) {
      throw new BadRequestException({
        message: "CSV validation failed",
        errors: validation.errors,
      });
    }

    // Parse
    const parseResult = adapter.parse(csv);
    if (parseResult.records.length === 0) {
      return {
        sourceId: adapter.sourceId,
        created: 0,
        updated: 0,
        failed: 0,
        errors: parseResult.warnings.map((w) => ({
          row: w.row,
          message: w.message,
        })),
        durationMs: 0,
      };
    }

    // Persist with dedup
    const result = await this.persistObservations(adapter.sourceId, parseResult.records);

    // Trigger matching for newly created observations (async, non-blocking)
    if (result.created > 0) {
      this.observationsService.matchAllUnmatched().catch(() => {
        // Matching errors should not fail ingestion
      });
    }

    return result;
  }

  /**
   * Persist observation records with deduplication.
   *
   * Dedup key: sourceSystem + rawTitle + deviceId
   * - If a matching record exists, update lastSeenAt (bump to latest)
   * - If no match, create a new observation
   */
  async persistObservations(
    sourceId: string,
    records: RawObservationRecord[],
  ): Promise<IngestionResult> {
    const start = Date.now();
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: IngestionError[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        // Look for existing observation with same dedup key
        const existing = await this.prisma.softwareObservation.findFirst({
          where: {
            sourceSystem: record.sourceSystem,
            rawTitle: record.rawTitle,
            deviceId: record.deviceId,
          },
        });

        if (existing) {
          // Update lastSeenAt if the new record is more recent
          if (record.lastSeenAt > existing.lastSeenAt) {
            await this.prisma.softwareObservation.update({
              where: { id: existing.id },
              data: {
                lastSeenAt: record.lastSeenAt,
                // Also update normalized fields if they were null before
                normalizedTitle:
                  record.normalizedTitle ?? existing.normalizedTitle,
                vendor: record.vendor ?? existing.vendor,
                version: record.version ?? existing.version,
              },
            });
          }
          updated++;
        } else {
          await this.prisma.softwareObservation.create({
            data: record,
          });
          created++;
        }
      } catch (err: any) {
        failed++;
        errors.push({
          row: i + 1,
          rawTitle: record.rawTitle,
          message: err.message ?? "Unknown persistence error",
        });
      }
    }

    return {
      sourceId,
      created,
      updated,
      failed,
      errors,
      durationMs: Date.now() - start,
    };
  }
}
