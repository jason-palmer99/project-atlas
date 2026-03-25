/**
 * Matching rules — determine how observations map to canonical software titles.
 * Pure functions, no side effects.
 *
 * Match methods (in priority order):
 * 1. EXACT — normalized title matches canonicalName exactly
 * 2. VENDOR_PRODUCT — vendor matches AND normalized title contains canonicalName (or vice versa)
 * 3. FUZZY — Levenshtein-based similarity above threshold
 */

import {
  MatchMethod,
  ReviewStatus,
  MATCH_AUTO_APPROVE_THRESHOLD,
  MATCH_REVIEW_THRESHOLD,
} from "../index";

// ── Types ──

export interface CandidateTitle {
  id: string;
  canonicalName: string;
  vendor: string;
  productFamily: string | null;
}

export interface ObservationInput {
  normalizedTitle: string;
  vendor: string | null;
}

export interface MatchCandidate {
  titleId: string;
  matchMethod: MatchMethod;
  confidenceScore: number;
  reviewStatus: ReviewStatus;
}

// ── Main matching function ──

/**
 * Find the best match for an observation against a list of candidate titles.
 * Returns the highest-confidence match, or null if no match meets the minimum threshold.
 */
export function findBestMatch(
  observation: ObservationInput,
  candidates: CandidateTitle[],
  minConfidence: number = 0.3,
): MatchCandidate | null {
  let best: MatchCandidate | null = null;

  for (const candidate of candidates) {
    const result = scoreMatch(observation, candidate);

    if (result && result.confidenceScore >= minConfidence) {
      if (!best || result.confidenceScore > best.confidenceScore) {
        best = result;
      }
    }
  }

  return best;
}

/**
 * Score a single observation against a single candidate title.
 * Tries matching methods in priority order: EXACT → VENDOR_PRODUCT → FUZZY.
 */
export function scoreMatch(
  observation: ObservationInput,
  candidate: CandidateTitle,
): MatchCandidate | null {
  const obsTitle = observation.normalizedTitle.toLowerCase().trim();
  const candTitle = candidate.canonicalName.toLowerCase().trim();

  // 1. Exact match
  if (obsTitle === candTitle) {
    return {
      titleId: candidate.id,
      matchMethod: MatchMethod.EXACT,
      confidenceScore: 1.0,
      reviewStatus: ReviewStatus.NOT_REQUIRED,
    };
  }

  // 2. Vendor + product match
  const obsVendor = observation.vendor?.toLowerCase().trim() ?? "";
  const candVendor = candidate.vendor.toLowerCase().trim();

  if (obsVendor && candVendor && obsVendor === candVendor) {
    // Same vendor — check if titles are closely related
    if (obsTitle.includes(candTitle) || candTitle.includes(obsTitle)) {
      return {
        titleId: candidate.id,
        matchMethod: MatchMethod.VENDOR_PRODUCT,
        confidenceScore: 0.9,
        reviewStatus: ReviewStatus.NOT_REQUIRED,
      };
    }

    // Same vendor, partial title overlap via product family
    if (candidate.productFamily) {
      const family = candidate.productFamily.toLowerCase().trim();
      if (obsTitle.includes(family)) {
        return {
          titleId: candidate.id,
          matchMethod: MatchMethod.VENDOR_PRODUCT,
          confidenceScore: 0.8,
          reviewStatus: deriveReviewStatus(0.8),
        };
      }
    }
  }

  // 3. Fuzzy match (Levenshtein similarity)
  const similarity = levenshteinSimilarity(obsTitle, candTitle);
  if (similarity >= 0.6) {
    const confidenceScore = similarity;
    return {
      titleId: candidate.id,
      matchMethod: MatchMethod.FUZZY,
      confidenceScore,
      reviewStatus: deriveReviewStatus(confidenceScore),
    };
  }

  return null;
}

/**
 * Derive review status from confidence score using thresholds.
 * - >= 0.9: auto-approved (NOT_REQUIRED)
 * - 0.7 - 0.89: needs review (PENDING)
 * - < 0.7: needs review (PENDING), flagged as low-confidence
 */
export function deriveReviewStatus(confidenceScore: number): ReviewStatus {
  if (confidenceScore >= MATCH_AUTO_APPROVE_THRESHOLD) {
    return ReviewStatus.NOT_REQUIRED;
  }
  return ReviewStatus.PENDING;
}

// ── Levenshtein Distance ──

/**
 * Compute Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use single-row optimization for memory efficiency
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/**
 * Compute similarity ratio (0-1) based on Levenshtein distance.
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}
