import { Controller, Get, Post, Body } from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { IngestCsvDto } from "./dto";

@Controller("ingestion")
export class IngestionController {
  constructor(private readonly service: IngestionService) {}

  /** List all registered source adapters */
  @Get("adapters")
  getAdapters() {
    return this.service.getAdapters();
  }

  /** Ingest software observations from CSV data */
  @Post("csv")
  async ingestCsv(@Body() dto: IngestCsvDto) {
    return this.service.ingestCsv(dto.csv, dto.columnMapping);
  }
}
