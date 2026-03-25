import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class MatchQueryDto {
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
  @IsEnum(["PENDING", "APPROVED", "REJECTED", "NOT_REQUIRED"])
  reviewStatus?: string;

  @IsOptional()
  @IsUUID()
  softwareTitleId?: string;

  @IsOptional()
  @IsUUID()
  observationId?: string;
}

export class ReviewMatchDto {
  @IsEnum(["APPROVED", "REJECTED"])
  reviewStatus!: string;

  @IsString()
  reviewedBy!: string;

  /** If rejecting, optionally specify a different title to reassign to */
  @IsOptional()
  @IsUUID()
  reassignToTitleId?: string;
}

export class CreateManualMatchDto {
  @IsUUID()
  observationId!: string;

  @IsUUID()
  softwareTitleId!: string;

  @IsString()
  reviewedBy!: string;
}
