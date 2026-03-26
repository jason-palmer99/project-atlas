import { describe, it, expect } from "vitest";
import { deriveStatus, buildEvidenceSummary } from "./derive-status";
import {
  CatalogDecisionType,
  EvidenceType,
  EvidenceStatus,
  SoftwareTitleStatus,
  StatusDerivationInput,
  Tristate,
} from "../index";

function makeTitle(overrides = {}) {
  return {
    id: "title-1",
    canonicalName: "Test Software",
    vendor: "Test Vendor",
    productFamily: null,
    category: null,
    description: null,
    status: SoftwareTitleStatus.ACTIVE,
    isSanctioned: false,
    sourceSystem: null,
    isBusinessCritical: Tristate.UNKNOWN,
    isQualityImpacting: Tristate.UNKNOWN,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDecision(overrides = {}) {
  return {
    id: "decision-1",
    softwareTitleId: "title-1",
    decision: CatalogDecisionType.SANCTIONED,
    reason: "Test reason",
    decidedBy: "system:rules-engine",
    decidedAt: new Date(),
    isManualOverride: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("deriveStatus", () => {
  it("returns SANCTIONED when all required evidence is active", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([
        { evidenceType: EvidenceType.QNA, status: EvidenceStatus.ACTIVE },
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE },
      ]),
      hasObservations: true,
      latestDecision: null,
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.SANCTIONED);
    expect(result.reason).toContain("All required evidence present");
  });

  it("returns PENDING_GOVERNANCE when QNA is missing", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE },
      ]),
      hasObservations: true,
      latestDecision: null,
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.PENDING_GOVERNANCE);
    expect(result.reason).toContain("QNA");
  });

  it("returns PENDING_GOVERNANCE when vendor risk assessment is missing", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([
        { evidenceType: EvidenceType.QNA, status: EvidenceStatus.ACTIVE },
      ]),
      hasObservations: true,
      latestDecision: null,
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.PENDING_GOVERNANCE);
    expect(result.reason).toContain("vendor risk assessment");
  });

  it("returns UNSANCTIONED_RUNNING when observations exist but no evidence", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([]),
      hasObservations: true,
      latestDecision: null,
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.UNSANCTIONED_RUNNING);
    expect(result.reason).toContain("Telemetry shows usage");
  });

  it("returns PENDING_GOVERNANCE when no observations and no evidence", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([]),
      hasObservations: false,
      latestDecision: null,
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.PENDING_GOVERNANCE);
  });

  it("preserves manual override decisions", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([
        { evidenceType: EvidenceType.QNA, status: EvidenceStatus.ACTIVE },
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE },
      ]),
      hasObservations: true,
      latestDecision: makeDecision({
        decision: CatalogDecisionType.BLOCKED,
        reason: "Manually blocked by admin",
        isManualOverride: true,
      }),
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.BLOCKED);
    expect(result.reason).toContain("Manual override preserved");
  });

  it("preserves RETIRED decisions", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([]),
      hasObservations: false,
      latestDecision: makeDecision({
        decision: CatalogDecisionType.RETIRED,
        reason: "No longer supported",
      }),
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.RETIRED);
  });

  it("preserves BLOCKED decisions", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([]),
      hasObservations: true,
      latestDecision: makeDecision({
        decision: CatalogDecisionType.BLOCKED,
        reason: "Security concern",
      }),
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.BLOCKED);
  });

  it("does not count expired evidence as active", () => {
    const input: StatusDerivationInput = {
      title: makeTitle(),
      evidence: buildEvidenceSummary([
        { evidenceType: EvidenceType.QNA, status: EvidenceStatus.EXPIRED },
        { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE },
      ]),
      hasObservations: true,
      latestDecision: null,
    };

    const result = deriveStatus(input);
    expect(result.decision).toBe(CatalogDecisionType.PENDING_GOVERNANCE);
    expect(result.reason).toContain("QNA");
  });
});

describe("buildEvidenceSummary", () => {
  it("detects active QNA", () => {
    const summary = buildEvidenceSummary([
      { evidenceType: EvidenceType.QNA, status: EvidenceStatus.ACTIVE },
    ]);
    expect(summary.hasActiveQna).toBe(true);
    expect(summary.hasActiveVendorRiskAssessment).toBe(false);
  });

  it("detects active vendor risk assessment", () => {
    const summary = buildEvidenceSummary([
      { evidenceType: EvidenceType.VENDOR_RISK_ASSESSMENT, status: EvidenceStatus.ACTIVE },
    ]);
    expect(summary.hasActiveQna).toBe(false);
    expect(summary.hasActiveVendorRiskAssessment).toBe(true);
  });

  it("returns false for expired evidence", () => {
    const summary = buildEvidenceSummary([
      { evidenceType: EvidenceType.QNA, status: EvidenceStatus.EXPIRED },
    ]);
    expect(summary.hasActiveQna).toBe(false);
  });

  it("handles empty evidence list", () => {
    const summary = buildEvidenceSummary([]);
    expect(summary.hasActiveQna).toBe(false);
    expect(summary.hasActiveVendorRiskAssessment).toBe(false);
    expect(summary.evidenceItems).toHaveLength(0);
  });
});
