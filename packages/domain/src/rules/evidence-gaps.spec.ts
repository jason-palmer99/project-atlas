import { describe, it, expect } from "vitest";
import {
  computeEvidenceGaps,
  EXPIRATION_WARNING_DAYS,
} from "../rules/evidence-gaps";
import { EvidenceType, EvidenceStatus, CatalogDecisionType } from "../index";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

describe("computeEvidenceGaps", () => {
  it("returns no gaps when all required evidence is active (quality impacting)", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: true,
      evidence: [
        { evidenceType: EvidenceType.QNA, status: EvidenceStatus.ACTIVE, expirationDate: daysFromNow(365) },
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE, expirationDate: daysFromNow(365) },
      ],
      currentDecision: CatalogDecisionType.SANCTIONED,
    });
    expect(result.isComplete).toBe(true);
    expect(result.gaps).toHaveLength(0);
  });

  it("returns VRA gap when missing (non-quality-impacting)", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: false,
      evidence: [],
      currentDecision: null,
    });
    expect(result.isComplete).toBe(false);
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].evidenceType).toBe(EvidenceType.VENDOR_RISK_ASSESSMENT);
    expect(result.gaps[0].isBlocking).toBe(true);
  });

  it("returns both VRA and QNA gaps when quality impacting with no evidence", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: true,
      evidence: [],
      currentDecision: null,
    });
    expect(result.isComplete).toBe(false);
    expect(result.gaps).toHaveLength(2);
    const types = result.gaps.map((g) => g.evidenceType);
    expect(types).toContain(EvidenceType.VENDOR_RISK_ASSESSMENT);
    expect(types).toContain(EvidenceType.QNA);
  });

  it("does not require QNA for non-quality-impacting software", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: false,
      evidence: [
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE, expirationDate: null },
      ],
      currentDecision: null,
    });
    expect(result.isComplete).toBe(true);
    expect(result.gaps).toHaveLength(0);
  });

  it("treats expired evidence as missing", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: false,
      evidence: [
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.EXPIRED, expirationDate: daysFromNow(-30) },
      ],
      currentDecision: null,
    });
    expect(result.isComplete).toBe(false);
    expect(result.gaps).toHaveLength(1);
  });

  it("treats evidence with past expiration date as missing", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: false,
      evidence: [
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE, expirationDate: daysFromNow(-1) },
      ],
      currentDecision: null,
    });
    expect(result.isComplete).toBe(false);
    expect(result.gaps).toHaveLength(1);
  });

  it("skips gap analysis for RETIRED titles", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: true,
      evidence: [],
      currentDecision: CatalogDecisionType.RETIRED,
    });
    expect(result.isComplete).toBe(true);
    expect(result.gaps).toHaveLength(0);
  });

  it("skips gap analysis for BLOCKED titles", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: true,
      evidence: [],
      currentDecision: CatalogDecisionType.BLOCKED,
    });
    expect(result.isComplete).toBe(true);
    expect(result.gaps).toHaveLength(0);
  });

  it("detects evidence expiring within warning period", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: false,
      evidence: [
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE, expirationDate: daysFromNow(30) },
      ],
      currentDecision: null,
    });
    expect(result.isComplete).toBe(true);
    expect(result.expiringEvidence).toHaveLength(1);
    expect(result.expiringEvidence[0].daysUntilExpiration).toBeLessThanOrEqual(30);
  });

  it("does not flag evidence expiring beyond warning period", () => {
    const result = computeEvidenceGaps({
      isQualityImpacting: false,
      evidence: [
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE, expirationDate: daysFromNow(EXPIRATION_WARNING_DAYS + 1) },
      ],
      currentDecision: null,
    });
    expect(result.expiringEvidence).toHaveLength(0);
  });
});
