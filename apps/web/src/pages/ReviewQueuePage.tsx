import { useState, useEffect, useCallback } from "react";
import {
  fetchReviewQueue,
  reviewMatch,
  triggerMatchAll,
  MatchRow,
} from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { Pagination } from "../components/Pagination";

export function ReviewQueuePage() {
  const [data, setData] = useState<MatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchReviewQueue({
        offset: String(offset),
        limit: String(limit),
      });
      setData(result.data);
      setTotal(result.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReview(matchId: string, status: "APPROVED" | "REJECTED") {
    try {
      await reviewMatch(matchId, {
        reviewStatus: status,
        reviewedBy: "ui-user", // TODO: replace with actual auth user
      });
      load(); // Refresh
    } catch (err) {
      console.error("Review failed:", err);
    }
  }

  async function handleMatchAll() {
    setMatchingInProgress(true);
    try {
      const result = await triggerMatchAll();
      alert(`Matching complete: ${result.matched} matched, ${result.unmatched} unmatched, ${result.errors} errors`);
      load();
    } catch (err) {
      console.error("Match all failed:", err);
    } finally {
      setMatchingInProgress(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Review Queue</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            {total} pending reviews
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleMatchAll}
            disabled={matchingInProgress}
          >
            {matchingInProgress ? "Matching..." : "Run Matching"}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Observed Title</th>
              <th>Source</th>
              <th>Matched To</th>
              <th>Method</th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">No pending reviews</td>
              </tr>
            ) : (
              data.map((match) => (
                <tr key={match.id}>
                  <td>
                    <div><strong>{match.observation?.rawTitle ?? "—"}</strong></div>
                    {match.observation?.vendor && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {match.observation.vendor}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem" }}>
                      {match.observation?.sourceSystem ?? "—"}
                    </span>
                  </td>
                  <td>
                    <div><strong>{match.softwareTitle?.canonicalName ?? "—"}</strong></div>
                    {match.softwareTitle?.vendor && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {match.softwareTitle.vendor}
                      </div>
                    )}
                  </td>
                  <td><StatusBadge value={match.matchMethod} /></td>
                  <td><ConfidenceBar score={match.confidenceScore} /></td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleReview(match.id, "APPROVED")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReview(match.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination total={total} offset={offset} limit={limit} onPageChange={setOffset} />
      </div>
    </div>
  );
}
