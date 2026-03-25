import { IsOptional, IsString, IsEnum, IsUUID, IsBoolean, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

export class CreateCatalogDecisionDto {
  @IsUUID()
  softwareTitleId!: string;

  @IsEnum(["SANCTIONED", "UNSANCTIONED_RUNNING", "PENDING_GOVERNANCE", "BLOCKED", "RETIRED"])
  decision!: string;

  @IsString()
  reason!: string;

  @IsString()
  decidedBy!: string;

  @IsOptional()
  @IsBoolean()
  isManualOverride?: boolean;
}

export class CatalogDecisionQueryDto {
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
  @IsUUID()
  softwareTitleId?: string;

  @IsOptional()
  @IsEnum(["SANCTIONED", "UNSANCTIONED_RUNNING", "PENDING_GOVERNANCE", "BLOCKED", "RETIRED"])
  decision?: string;
}

export class DeriveStatusDto {
  @IsUUID()
  softwareTitleId!: string;
}
