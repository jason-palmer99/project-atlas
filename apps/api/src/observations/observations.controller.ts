import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ObservationsService } from "./observations.service";
import { ObservationQueryDto } from "./dto";

@Controller("observations")
export class ObservationsController {
  constructor(private readonly service: ObservationsService) {}

  @Get()
  findAll(@Query() query: ObservationQueryDto) {
    return this.service.findAll(query);
  }

  /** Get distinct source systems for filter dropdowns */
  @Get("source-systems")
  getSourceSystems() {
    return this.service.getSourceSystems();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** Trigger matching for a single observation */
  @Post(":id/match")
  matchObservation(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.matchObservation(id);
  }

  /** Trigger matching for all unmatched observations */
  @Post("match-all")
  matchAllUnmatched() {
    return this.service.matchAllUnmatched();
  }
}
