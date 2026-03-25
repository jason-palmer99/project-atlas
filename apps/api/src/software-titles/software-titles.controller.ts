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
import { SoftwareTitlesService } from "./software-titles.service";
import {
  CreateSoftwareTitleDto,
  UpdateSoftwareTitleDto,
  SoftwareTitleQueryDto,
} from "./dto";

@Controller("software-titles")
export class SoftwareTitlesController {
  constructor(private readonly service: SoftwareTitlesService) {}

  @Get()
  findAll(@Query() query: SoftwareTitleQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSoftwareTitleDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSoftwareTitleDto) {
    return this.service.update(id, dto);
  }
}
