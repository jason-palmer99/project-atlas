import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { GovernanceEvidenceService } from "./governance-evidence.service";
import {
  CreateGovernanceEvidenceDto,
  UpdateGovernanceEvidenceDto,
  GovernanceEvidenceQueryDto,
} from "./dto";

@Controller("governance-evidence")
export class GovernanceEvidenceController {
  constructor(private readonly service: GovernanceEvidenceService) {}

  @Get()
  findAll(@Query() query: GovernanceEvidenceQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGovernanceEvidenceDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateGovernanceEvidenceDto) {
    return this.service.update(id, dto);
  }

  /** Get evidence gaps for a specific software title */
  @Get("gaps/:softwareTitleId")
  getEvidenceGaps(@Param("softwareTitleId", ParseUUIDPipe) softwareTitleId: string) {
    return this.service.getEvidenceGaps(softwareTitleId);
  }
}
