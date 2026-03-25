import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchTitle,
  fetchEvidenceGaps,
  SoftwareTitleDetail,
  EvidenceGapResult,
} from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ConfidenceBar } from "../components/ConfidenceBar";

export function SoftwareDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState<SoftwareTitleDetail | null>(null);
  const [gaps, setGaps] = useState<EvidenceGapResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchTitle(id), fetchEvidenceGaps(id)])
      .then(([t, g]) => {
        setTitle(t);
        setGaps(g);
      })
      .catch(() => setTitle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!title) return <div className="empty-state">Software title not found</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" style={{ fontSize: "0.875rem" }}>← Back to Catalog</Link>
          <h1 style={{ marginTop: "0.25rem" }}>{title.canonicalName}</h1>
        </div>
        <StatusBadge value={title.status} />
      </div>

      {/* Title Details */}
      <div className="card">
        <h3>Details</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <label>Vendor</label>
            <span>{title.vendor}</span>
          </div>
          <div className="detail-field">
            <label>Category</label>
            <span>{title.category ?? "—"}</span>
          </div>
          <div className="detail-field">
            <label>Product Family</label>
            <span>{title.productFamily ?? "—"}</span>
          </div>
          <div className="detail-field">
            <label>Sanctioned</label>
            <span>{title.isSanctioned ? "✓ Yes" : "✗ No"}</span>
          </div>
        </div>
      </div>

      {/* Evidence Gaps */}
      {gaps && (
        <div className="card">
          <h3>
            Evidence Status{" "}
            {gaps.isComplete ? (
              <span className="badge badge-sanctioned">Complete</span>
            ) : (
              <span className="badge badge-unsanctioned">Gaps Found</span>
            )}
          </h3>
          {gaps.gaps.length > 0 && (
            <div style={{ marginBottom: "0.75rem" }}>
              {gaps.gaps.map((gap, i) => (
                <div key={i} style={{ marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                  <strong style={{ color: "var(--color-danger)" }}>Missing:</strong>{" "}
                  {gap.evidenceType.replace(/_/g, " ")} — {gap.reason}
                </div>
              ))}
            </div>
          )}
          {gaps.expiringEvidence.length > 0 && (
            <div>
              {gaps.expiringEvidence.map((exp, i) => (
                <div key={i} style={{ fontSize: "0.875rem", color: "var(--color-warning)" }}>
                  ⚠ {exp.evidenceType.replace(/_/g, " ")} expires in {exp.daysUntilExpiration} days
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evidence Records */}
      <div className="card">
        <h3>Governance Evidence ({title.evidence?.length ?? 0})</h3>
        {title.evidence && title.evidence.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Effective</th>
                <th>Expires</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {title.evidence.map((e) => (
                <tr key={e.id}>
                  <td><StatusBadge value={e.evidenceType} /></td>
                  <td><StatusBadge value={e.status} /></td>
                  <td>{e.owner ?? "—"}</td>
                  <td>{e.effectiveDate ? new Date(e.effectiveDate).toLocaleDateString() : "—"}</td>
                  <td>{e.expirationDate ? new Date(e.expirationDate).toLocaleDateString() : "—"}</td>
                  <td>
                    {e.referenceUrl ? (
                      <a href={e.referenceUrl} target="_blank" rel="noopener noreferrer">View</a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No evidence records</div>
        )}
      </div>

      {/* Decision History */}
      <div className="card">
        <h3>Decision History ({title.decisions?.length ?? 0})</h3>
        {title.decisions && title.decisions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Decision</th>
                <th>Reason</th>
                <th>Decided By</th>
                <th>Date</th>
                <th>Override</th>
              </tr>
            </thead>
            <tbody>
              {title.decisions.map((d) => (
                <tr key={d.id}>
                  <td><StatusBadge value={d.decision} /></td>
                  <td style={{ maxWidth: "300px" }}>{d.reason}</td>
                  <td>{d.decidedBy}</td>
                  <td>{new Date(d.decidedAt).toLocaleDateString()}</td>
                  <td>{d.isManualOverride ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No decisions recorded</div>
        )}
      </div>

      {/* Matched Observations */}
      <div className="card">
        <h3>Matched Observations ({title.matches?.length ?? 0})</h3>
        {title.matches && title.matches.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Confidence</th>
                <th>Review Status</th>
              </tr>
            </thead>
            <tbody>
              {title.matches.map((m) => (
                <tr key={m.id}>
                  <td><StatusBadge value={m.matchMethod} /></td>
                  <td><ConfidenceBar score={m.confidenceScore} /></td>
                  <td><StatusBadge value={m.reviewStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No observations matched</div>
        )}
      </div>
    </div>
  );
}
