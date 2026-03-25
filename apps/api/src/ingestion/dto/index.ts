import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ColumnMappingDto {
  @IsString()
  rawTitle!: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  firstSeenAt?: string;

  @IsOptional()
  @IsString()
  lastSeenAt?: string;
}

export class IngestCsvDto {
  @IsString()
  csv!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ColumnMappingDto)
  columnMapping?: ColumnMappingDto;
}
