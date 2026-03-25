import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health.controller";
import { SoftwareTitlesModule } from "./software-titles/software-titles.module";
import { GovernanceEvidenceModule } from "./governance-evidence/governance-evidence.module";
import { CatalogDecisionsModule } from "./catalog-decisions/catalog-decisions.module";
import { IngestionModule } from "./ingestion/ingestion.module";
import { ObservationsModule } from "./observations/observations.module";
import { MatchesModule } from "./matches/matches.module";

@Module({
  imports: [
    PrismaModule,
    SoftwareTitlesModule,
    GovernanceEvidenceModule,
    CatalogDecisionsModule,
    IngestionModule,
    ObservationsModule,
    MatchesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
