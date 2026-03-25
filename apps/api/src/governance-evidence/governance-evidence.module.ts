import { Module } from "@nestjs/common";
import { GovernanceEvidenceController } from "./governance-evidence.controller";
import { GovernanceEvidenceService } from "./governance-evidence.service";
import { CatalogDecisionsModule } from "../catalog-decisions/catalog-decisions.module";

@Module({
  imports: [CatalogDecisionsModule],
  controllers: [GovernanceEvidenceController],
  providers: [GovernanceEvidenceService],
  exports: [GovernanceEvidenceService],
})
export class GovernanceEvidenceModule {}
