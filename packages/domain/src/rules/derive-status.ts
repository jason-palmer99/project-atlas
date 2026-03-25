import {
  CatalogDecisionType,
  EvidenceStatus,
  EvidenceType,
  StatusDerivationInput,
  StatusDerivationResult,
} from "../index";

/**
 * Derives the catalog decision for a software title based on its evidence,
 * observation status, and the latest existing decision.
 *
 * Rules (evaluated in priority order):
 * 1. If latest decision is a manual override → preserve it
 * 2. If latest decision is RETIRED → preserve it
 * 3. If latest decision is BLOCKED (manual) → preserve it
 * 4. If all required evidence (QNA + vendor risk) is ACTIVE → SANCTIONED
 * 5. If some evidence exists but incomplete → PENDING_GOVERNANCE
 * 6. If observations exist but no evidence → UNSANCTIONED_RUNNING
 * 7. Default → PENDING_GOVERNANCE
 */
export function deriveStatus(input: StatusDerivationInput): StatusDerivationResult {
  const { evidence, hasObservations, latestDecision } = input;

  // Manual overrides are preserved
  if (latestDecision?.isManualOverride) {
    return {
      decision: latestDecision.decision,
      reason: `Manual override preserved: ${latestDecision.reason}`,
    };
  }

  // Explicit RETIRED decisions are preserved
  if (latestDecision?.decision === CatalogDecisionType.RETIRED) {
    return {
      decision: CatalogDecisionType.RETIRED,
      reason: "Title is retired",
    };
  }

  // Explicit manual BLOCKED decisions are preserved
  if (latestDecision?.decision === CatalogDecisionType.BLOCKED) {
    return {
      decision: CatalogDecisionType.BLOCKED,
      reason: latestDecision.reason,
    };
  }

  // Check for full governance compliance
  if (evidence.hasActiveQna && evidence.hasActiveVendorRiskAssessment) {
    return {
      decision: CatalogDecisionType.SANCTIONED,
      reason: "All required evidence present: active QNA and vendor risk assessment",
    };
  }

  // Some evidence exists but not complete
  const missingEvidence: string[] = [];
  if (!evidence.hasActiveQna) {
    missingEvidence.push("QNA");
  }
  if (!evidence.hasActiveVendorRiskAssessment) {
    missingEvidence.push("vendor risk assessment");
  }

  // Has observations but no evidence at all
  if (hasObservations && evidence.evidenceItems.length === 0) {
    return {
      decision: CatalogDecisionType.UNSANCTIONED_RUNNING,
      reason: `Telemetry shows usage but no governance evidence exists. Missing: ${missingEvidence.join(", ")}`,
    };
  }

  // Has some evidence but missing required items
  return {
    decision: CatalogDecisionType.PENDING_GOVERNANCE,
    reason: `Missing required evidence: ${missingEvidence.join(", ")}`,
  };
}

/**
 * Builds an EvidenceSummary from a list of GovernanceEvidence records.
 * Only considers ACTIVE evidence for governance compliance checks.
 */
export function buildEvidenceSummary(
  evidenceItems: Array<{ evidenceType: EvidenceType; status: EvidenceStatus }>,
) {
  return {
    hasActiveQna: evidenceItems.some(
      (e) => e.evidenceType === EvidenceType.QNA && e.status === EvidenceStatus.ACTIVE,
    ),
    hasActiveVendorRiskAssessment: evidenceItems.some(
      (e) =>
        e.evidenceType === EvidenceType.VENDOR_RISK_ASSESSMENT &&
        e.status === EvidenceStatus.ACTIVE,
    ),
    evidenceItems: evidenceItems as any[],
  };
}
