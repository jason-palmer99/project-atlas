import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateGovernanceEvidenceDto {
  @IsUUID()
  softwareTitleId!: string;

  @IsEnum(["QNA", "VENDOR_RISK_ASSESSMENT", "SOFTWARE_RISK_ASSESSMENT", "SECURITY_SCAN"])
  evidenceType!: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceUrl?: string;

  @IsOptional()
  @IsEnum(["ACTIVE", "EXPIRED", "PENDING", "REVOKED"])
  status?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}

export class UpdateGovernanceEvidenceDto {
  @IsOptional()
  @IsEnum(["ACTIVE", "EXPIRED", "PENDING", "REVOKED"])
  status?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceUrl?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}

export class GovernanceEvidenceQueryDto {
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
  @IsEnum(["QNA", "VENDOR_RISK_ASSESSMENT", "SOFTWARE_RISK_ASSESSMENT", "SECURITY_SCAN"])
  evidenceType?: string;

  @IsOptional()
  @IsEnum(["ACTIVE", "EXPIRED", "PENDING", "REVOKED"])
  status?: string;
}
