import { describe, it, expect } from "vitest";
import {
  findBestMatch,
  scoreMatch,
  deriveReviewStatus,
  levenshteinDistance,
  levenshteinSimilarity,
  CandidateTitle,
} from "../rules/match-observation";
import { MatchMethod, ReviewStatus } from "../index";

const CANDIDATES: CandidateTitle[] = [
  { id: "t1", canonicalName: "Google Chrome", vendor: "Google", productFamily: "Chrome" },
  { id: "t2", canonicalName: "Microsoft Teams", vendor: "Microsoft", productFamily: "Microsoft 365" },
  { id: "t3", canonicalName: "7-Zip", vendor: "Igor Pavlov", productFamily: null },
  { id: "t4", canonicalName: "Adobe Acrobat Reader", vendor: "Adobe", productFamily: "Acrobat" },
  { id: "t5", canonicalName: "Visual Studio Code", vendor: "Microsoft", productFamily: "Visual Studio" },
];

describe("scoreMatch", () => {
  it("returns EXACT match for identical normalized titles", () => {
    const result = scoreMatch(
      { normalizedTitle: "google chrome", vendor: "Google" },
      CANDIDATES[0],
    );
    expect(result).not.toBeNull();
    expect(result!.matchMethod).toBe(MatchMethod.EXACT);
    expect(result!.confidenceScore).toBe(1.0);
    expect(result!.reviewStatus).toBe(ReviewStatus.NOT_REQUIRED);
  });

  it("returns VENDOR_PRODUCT match when vendor matches and title contains canonical name", () => {
    const result = scoreMatch(
      { normalizedTitle: "microsoft teams desktop", vendor: "Microsoft" },
      CANDIDATES[1],
    );
    expect(result).not.toBeNull();
    expect(result!.matchMethod).toBe(MatchMethod.VENDOR_PRODUCT);
    expect(result!.confidenceScore).toBe(0.9);
  });

  it("returns VENDOR_PRODUCT via product family when vendor matches", () => {
    const result = scoreMatch(
      { normalizedTitle: "acrobat dc", vendor: "Adobe" },
      CANDIDATES[3],
    );
    expect(result).not.toBeNull();
    expect(result!.matchMethod).toBe(MatchMethod.VENDOR_PRODUCT);
    expect(result!.confidenceScore).toBe(0.8);
  });

  it("returns FUZZY match for similar titles", () => {
    const result = scoreMatch(
      { normalizedTitle: "google chrom", vendor: null },
      CANDIDATES[0],
    );
    expect(result).not.toBeNull();
    expect(result!.matchMethod).toBe(MatchMethod.FUZZY);
    expect(result!.confidenceScore).toBeGreaterThan(0.6);
  });

  it("returns null for completely different titles", () => {
    const result = scoreMatch(
      { normalizedTitle: "slack", vendor: "Salesforce" },
      CANDIDATES[0],
    );
    expect(result).toBeNull();
  });
});

describe("findBestMatch", () => {
  it("finds exact match as best", () => {
    const result = findBestMatch(
      { normalizedTitle: "7-zip", vendor: "Igor Pavlov" },
      CANDIDATES,
    );
    expect(result).not.toBeNull();
    expect(result!.titleId).toBe("t3");
    expect(result!.matchMethod).toBe(MatchMethod.EXACT);
  });

  it("returns null when no candidate meets minimum threshold", () => {
    const result = findBestMatch(
      { normalizedTitle: "completely unknown software xyz", vendor: null },
      CANDIDATES,
    );
    expect(result).toBeNull();
  });

  it("prefers higher confidence match", () => {
    const result = findBestMatch(
      { normalizedTitle: "visual studio code", vendor: "Microsoft" },
      CANDIDATES,
    );
    expect(result).not.toBeNull();
    expect(result!.titleId).toBe("t5");
    expect(result!.confidenceScore).toBe(1.0);
  });
});

describe("deriveReviewStatus", () => {
  it("returns NOT_REQUIRED for high confidence (>= 0.9)", () => {
    expect(deriveReviewStatus(0.95)).toBe(ReviewStatus.NOT_REQUIRED);
    expect(deriveReviewStatus(0.9)).toBe(ReviewStatus.NOT_REQUIRED);
    expect(deriveReviewStatus(1.0)).toBe(ReviewStatus.NOT_REQUIRED);
  });

  it("returns PENDING for mid/low confidence (< 0.9)", () => {
    expect(deriveReviewStatus(0.89)).toBe(ReviewStatus.PENDING);
    expect(deriveReviewStatus(0.7)).toBe(ReviewStatus.PENDING);
    expect(deriveReviewStatus(0.5)).toBe(ReviewStatus.PENDING);
  });
});

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("abc", "abc")).toBe(0);
  });

  it("returns correct distance for simple edits", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });

  it("handles empty strings", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });
});

describe("levenshteinSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(levenshteinSimilarity("abc", "abc")).toBe(1);
  });

  it("returns 0 for completely different strings of equal length", () => {
    // "abc" vs "xyz" => distance 3, maxLen 3 => similarity 0
    expect(levenshteinSimilarity("abc", "xyz")).toBe(0);
  });

  it("returns value between 0 and 1 for partial matches", () => {
    const sim = levenshteinSimilarity("google chrome", "google chrom");
    expect(sim).toBeGreaterThan(0.9);
    expect(sim).toBeLessThan(1);
  });
});
