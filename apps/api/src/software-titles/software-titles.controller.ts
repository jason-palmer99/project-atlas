import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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

  @Post("import/csv")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }))
  importCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded. Send a multipart/form-data request with field name 'file'.");
    }
    return this.service.importCsv(file.buffer);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSoftwareTitleDto) {
    return this.service.update(id, dto);
  }
}
