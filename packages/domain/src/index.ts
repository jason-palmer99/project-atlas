// === Enums ===

export enum CatalogDecisionType {
  SANCTIONED = "SANCTIONED",
  UNSANCTIONED_RUNNING = "UNSANCTIONED_RUNNING",
  PENDING_GOVERNANCE = "PENDING_GOVERNANCE",
  BLOCKED = "BLOCKED",
  RETIRED = "RETIRED",
}

export enum EvidenceType {
  QNA = "QNA",
  VENDOR_RISK_ASSESSMENT = "VENDOR_RISK_ASSESSMENT",
  SOFTWARE_RISK_ASSESSMENT = "SOFTWARE_RISK_ASSESSMENT",
  SECURITY_SCAN = "SECURITY_SCAN",
}

export enum EvidenceStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  PENDING = "PENDING",
  REVOKED = "REVOKED",
}

export enum MatchMethod {
  EXACT = "EXACT",
  FUZZY = "FUZZY",
  VENDOR_PRODUCT = "VENDOR_PRODUCT",
  MANUAL = "MANUAL",
}

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NOT_REQUIRED = "NOT_REQUIRED",
}

export enum SoftwareTitleStatus {
  ACTIVE = "ACTIVE",
  RETIRED = "RETIRED",
  UNDER_REVIEW = "UNDER_REVIEW",
}

// === Entity Interfaces ===

export interface SoftwareTitle {
  id: string;
  canonicalName: string;
  vendor: string;
  productFamily: string | null;
  category: string | null;
  description: string | null;
  status: SoftwareTitleStatus;
  isSanctioned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftwareObservation {
  id: string;
  rawTitle: string;
  normalizedTitle: string | null;
  vendor: string | null;
  version: string | null;
  sourceSystem: string;
  deviceId: string | null;
  department: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  confidenceScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GovernanceEvidence {
  id: string;
  softwareTitleId: string;
  evidenceType: EvidenceType;
  referenceId: string | null;
  referenceUrl: string | null;
  status: EvidenceStatus;
  owner: string | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogDecision {
  id: string;
  softwareTitleId: string;
  decision: CatalogDecisionType;
  reason: string;
  decidedBy: string;
  decidedAt: Date;
  isManualOverride: boolean;
  createdAt: Date;
}

export interface MatchRecord {
  id: string;
  observationId: string;
  softwareTitleId: string;
  matchMethod: MatchMethod;
  confidenceScore: number;
  reviewStatus: ReviewStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// === Business Rule Input/Output Types ===

export interface EvidenceSummary {
  hasActiveQna: boolean;
  hasActiveVendorRiskAssessment: boolean;
  evidenceItems: GovernanceEvidence[];
}

export interface StatusDerivationInput {
  title: SoftwareTitle;
  evidence: EvidenceSummary;
  hasObservations: boolean;
  latestDecision: CatalogDecision | null;
}

export interface StatusDerivationResult {
  decision: CatalogDecisionType;
  reason: string;
}

// === Constants ===

export const MATCH_AUTO_APPROVE_THRESHOLD = 0.9;
export const MATCH_REVIEW_THRESHOLD = 0.7;

// === Rules ===

export { deriveStatus, buildEvidenceSummary } from "./rules/derive-status";
export {
  findBestMatch,
  scoreMatch,
  deriveReviewStatus,
  levenshteinDistance,
  levenshteinSimilarity,
} from "./rules/match-observation";
export type {
  CandidateTitle,
  ObservationInput,
  MatchCandidate,
} from "./rules/match-observation";
export {
  computeEvidenceGaps,
  EXPIRATION_WARNING_DAYS,
} from "./rules/evidence-gaps";
export type {
  EvidenceGapInput,
  EvidenceGap,
  EvidenceGapResult,
  ExpiringEvidence,
} from "./rules/evidence-gaps";
