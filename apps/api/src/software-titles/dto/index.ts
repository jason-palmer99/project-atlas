import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

export class CreateSoftwareTitleDto {
  @IsString()
  canonicalName!: string;

  @IsString()
  vendor!: string;

  @IsOptional()
  @IsString()
  productFamily?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @IsEnum(["YES", "NO", "UNKNOWN"])
  isBusinessCritical?: string;

  @IsOptional()
  @IsEnum(["YES", "NO", "UNKNOWN"])
  isQualityImpacting?: string;
}

export class UpdateSoftwareTitleDto {
  @IsOptional()
  @IsString()
  canonicalName?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  productFamily?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(["ACTIVE", "RETIRED", "UNDER_REVIEW"])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isSanctioned?: boolean;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @IsEnum(["YES", "NO", "UNKNOWN"])
  isBusinessCritical?: string;

  @IsOptional()
  @IsEnum(["YES", "NO", "UNKNOWN"])
  isQualityImpacting?: string;
}

export class SoftwareTitleQueryDto {
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
  vendor?: string;

  @IsOptional()
  @IsEnum(["ACTIVE", "RETIRED", "UNDER_REVIEW"])
  status?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isSanctioned?: boolean;

  @IsOptional()
  @IsEnum(["SANCTIONED", "UNSANCTIONED_RUNNING", "PENDING_GOVERNANCE", "BLOCKED", "RETIRED"])
  decisionStatus?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  missingQna?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  missingVendorRisk?: boolean;
}
