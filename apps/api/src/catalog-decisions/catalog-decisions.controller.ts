import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { CatalogDecisionsService } from "./catalog-decisions.service";
import {
  CreateCatalogDecisionDto,
  CatalogDecisionQueryDto,
  DeriveStatusDto,
} from "./dto";

@Controller("catalog-decisions")
export class CatalogDecisionsController {
  constructor(private readonly service: CatalogDecisionsService) {}

  @Get()
  findAll(@Query() query: CatalogDecisionQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** Manually create a new decision (append-only). */
  @Post()
  create(@Body() dto: CreateCatalogDecisionDto) {
    return this.service.create(dto);
  }

  /** Derive status using the rules engine and create a new decision record. */
  @Post("derive")
  deriveStatus(@Body() dto: DeriveStatusDto) {
    return this.service.deriveStatusForTitle(dto.softwareTitleId);
  }
}
