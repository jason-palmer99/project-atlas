import { Module } from "@nestjs/common";
import { CatalogDecisionsController } from "./catalog-decisions.controller";
import { CatalogDecisionsService } from "./catalog-decisions.service";

@Module({
  controllers: [CatalogDecisionsController],
  providers: [CatalogDecisionsService],
  exports: [CatalogDecisionsService],
})
export class CatalogDecisionsModule {}
