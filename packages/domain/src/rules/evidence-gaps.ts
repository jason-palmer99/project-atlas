/**
 * Evidence gap computation — determine which governance evidence is missing for a software title.
 * Pure functions, no side effects.
 */

import { EvidenceType, EvidenceStatus, CatalogDecisionType } from "../index";

// ── Types ──

export interface EvidenceRecord {
  evidenceType: EvidenceType;
  status: EvidenceStatus;
  expirationDate: Date | null;
}

export interface EvidenceGapInput {
  /** Is this software quality impacting? (requires QNA + SRA if true) */
  isQualityImpacting: boolean;
  /** Current evidence records for this title */
  evidence: EvidenceRecord[];
  /** Current decision for this title (if any) */
  currentDecision: CatalogDecisionType | null;
}

export interface EvidenceGap {
  /** Missing evidence type */
  evidenceType: EvidenceType;
  /** Why this evidence is required */
  reason: string;
  /** Is this a blocking gap? (blocks SANCTIONED status) */
  isBlocking: boolean;
}

export interface EvidenceGapResult {
  /** All identified gaps */
  gaps: EvidenceGap[];
  /** Whether the title has all required evidence */
  isComplete: boolean;
  /** Evidence items expiring within the warning period */
  expiringEvidence: ExpiringEvidence[];
}

export interface ExpiringEvidence {
  evidenceType: EvidenceType;
  expirationDate: Date;
  daysUntilExpiration: number;
}

// ── Constants ──

/** Days before expiration to start warning */
export const EXPIRATION_WARNING_DAYS = 90;

// ── Main function ──

/**
 * Compute evidence gaps for a software title.
 *
 * Rules:
 * - ALL titles require: active VRA (Vendor Risk Assessment)
 * - Quality Impacting titles additionally require: active QNA
 * - RETIRED or BLOCKED titles skip gap analysis
 */
export function computeEvidenceGaps(input: EvidenceGapInput): EvidenceGapResult {
  const { isQualityImpacting, evidence, currentDecision } = input;

  // Skip gap analysis for RETIRED or BLOCKED titles
  if (
    currentDecision === CatalogDecisionType.RETIRED ||
    currentDecision === CatalogDecisionType.BLOCKED
  ) {
    return { gaps: [], isComplete: true, expiringEvidence: [] };
  }

  const gaps: EvidenceGap[] = [];
  const now = new Date();

  // Check for active VRA (required for all)
  const hasActiveVra = evidence.some(
    (e) =>
      e.evidenceType === EvidenceType.VENDOR_RISK_ASSESSMENT &&
      e.status === EvidenceStatus.ACTIVE &&
      (!e.expirationDate || e.expirationDate > now),
  );

  if (!hasActiveVra) {
    gaps.push({
      evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT,
      reason: "Vendor Risk Assessment is required for all software titles",
      isBlocking: true,
    });
  }

  // Check for active QNA (required for quality impacting)
  if (isQualityImpacting) {
    const hasActiveQna = evidence.some(
      (e) =>
        e.evidenceType === EvidenceType.QNA &&
        e.status === EvidenceStatus.ACTIVE &&
        (!e.expirationDate || e.expirationDate > now),
    );

    if (!hasActiveQna) {
      gaps.push({
        evidenceType: EvidenceType.QNA,
        reason: "QNA is required for Quality Impacting software",
        isBlocking: true,
      });
    }
  }

  // Check for expiring evidence
  const expiringEvidence: ExpiringEvidence[] = [];
  const warningThreshold = new Date();
  warningThreshold.setDate(warningThreshold.getDate() + EXPIRATION_WARNING_DAYS);

  for (const e of evidence) {
    if (
      e.status === EvidenceStatus.ACTIVE &&
      e.expirationDate &&
      e.expirationDate > now &&
      e.expirationDate <= warningThreshold
    ) {
      const daysUntilExpiration = Math.ceil(
        (e.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      expiringEvidence.push({
        evidenceType: e.evidenceType,
        expirationDate: e.expirationDate,
        daysUntilExpiration,
      });
    }
  }

  return {
    gaps,
    isComplete: gaps.length === 0,
    expiringEvidence,
  };
}
