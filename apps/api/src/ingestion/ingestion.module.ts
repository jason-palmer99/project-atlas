import { Module } from "@nestjs/common";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";
import { ObservationsModule } from "../observations/observations.module";

@Module({
  imports: [ObservationsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
