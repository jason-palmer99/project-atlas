import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class ObservationQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  /** Filter for unmatched observations only */
  @IsOptional()
  @Transform(({ value }) => value === "true")
  unmatched?: boolean;
}
