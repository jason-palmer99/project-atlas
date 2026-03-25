import { Module } from "@nestjs/common";
import { SoftwareTitlesController } from "./software-titles.controller";
import { SoftwareTitlesService } from "./software-titles.service";

@Module({
  controllers: [SoftwareTitlesController],
  providers: [SoftwareTitlesService],
  exports: [SoftwareTitlesService],
})
export class SoftwareTitlesModule {}
