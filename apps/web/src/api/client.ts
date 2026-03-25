const API_BASE = "/api";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText, body);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Software Titles ──

export interface SoftwareTitleRow {
  id: string;
  canonicalName: string;
  vendor: string;
  productFamily: string | null;
  category: string | null;
  status: string;
  isSanctioned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareTitleDetail extends SoftwareTitleRow {
  description: string | null;
  evidence: EvidenceRow[];
  decisions: DecisionRow[];
  matches: MatchRow[];
  observations: ObservationRow[];
}

export function fetchTitles(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<PaginatedResponse<SoftwareTitleRow>>(`/software-titles${qs}`);
}

export function fetchTitle(id: string) {
  return request<SoftwareTitleDetail>(`/software-titles/${id}`);
}

// ── Governance Evidence ──

export interface EvidenceRow {
  id: string;
  softwareTitleId: string;
  evidenceType: string;
  referenceId: string | null;
  referenceUrl: string | null;
  status: string;
  owner: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
}

export interface EvidenceGapResult {
  softwareTitleId: string;
  canonicalName: string;
  isQualityImpacting: boolean;
  gaps: { evidenceType: string; reason: string; isBlocking: boolean }[];
  isComplete: boolean;
  expiringEvidence: {
    evidenceType: string;
    expirationDate: string;
    daysUntilExpiration: number;
  }[];
}

export function fetchEvidenceGaps(softwareTitleId: string) {
  return request<EvidenceGapResult>(
    `/governance-evidence/gaps/${softwareTitleId}`,
  );
}

// ── Catalog Decisions ──

export interface DecisionRow {
  id: string;
  softwareTitleId: string;
  decision: string;
  reason: string;
  decidedBy: string;
  decidedAt: string;
  isManualOverride: boolean;
}

export function deriveStatus(softwareTitleId: string) {
  return request<DecisionRow>("/catalog-decisions/derive", {
    method: "POST",
    body: JSON.stringify({ softwareTitleId }),
  });
}

// ── Observations ──

export interface ObservationRow {
  id: string;
  rawTitle: string;
  normalizedTitle: string | null;
  vendor: string | null;
  version: string | null;
  sourceSystem: string;
  deviceId: string | null;
  lastSeenAt: string;
  matches: MatchRow[];
}

export function fetchObservations(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<PaginatedResponse<ObservationRow>>(`/observations${qs}`);
}

export function fetchSourceSystems() {
  return request<string[]>("/observations/source-systems");
}

export function triggerMatchAll() {
  return request<{ total: number; matched: number; unmatched: number; errors: number }>(
    "/observations/match-all",
    { method: "POST" },
  );
}

// ── Matches ──

export interface MatchRow {
  id: string;
  observationId: string;
  softwareTitleId: string;
  matchMethod: string;
  confidenceScore: number;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  observation?: { id: string; rawTitle: string; normalizedTitle: string | null; vendor: string | null; sourceSystem: string };
  softwareTitle?: { id: string; canonicalName: string; vendor: string };
}

export function fetchReviewQueue(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<PaginatedResponse<MatchRow>>(`/matches/review-queue${qs}`);
}

export function reviewMatch(
  id: string,
  data: { reviewStatus: "APPROVED" | "REJECTED"; reviewedBy: string; reassignToTitleId?: string },
) {
  return request<MatchRow>(`/matches/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Ingestion ──

export interface IngestionResult {
  sourceId: string;
  created: number;
  updated: number;
  failed: number;
  durationMs: number;
}

export function ingestCsv(csv: string, columnMapping?: Record<string, string>) {
  return request<IngestionResult>("/ingestion/csv", {
    method: "POST",
    body: JSON.stringify({ csv, columnMapping }),
  });
}
