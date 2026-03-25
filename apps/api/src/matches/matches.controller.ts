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
import { MatchesService } from "./matches.service";
import { MatchQueryDto, ReviewMatchDto, CreateManualMatchDto } from "./dto";

@Controller("matches")
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Get()
  findAll(@Query() query: MatchQueryDto) {
    return this.service.findAll(query);
  }

  /** Get the review queue — pending matches sorted by lowest confidence */
  @Get("review-queue")
  getReviewQueue(
    @Query("offset") offset?: number,
    @Query("limit") limit?: number,
  ) {
    return this.service.getReviewQueue(
      offset ? Number(offset) : 0,
      limit ? Number(limit) : 20,
    );
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /** Review a match (approve/reject) */
  @Patch(":id/review")
  review(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ReviewMatchDto,
  ) {
    return this.service.review(id, dto);
  }

  /** Create a manual match */
  @Post("manual")
  createManualMatch(@Body() dto: CreateManualMatchDto) {
    return this.service.createManualMatch(dto);
  }
}
