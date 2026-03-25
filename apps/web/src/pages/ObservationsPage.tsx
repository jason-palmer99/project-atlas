import { useState, useEffect, useCallback } from "react";
import { fetchObservations, ObservationRow } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { Pagination } from "../components/Pagination";

export function ObservationsPage() {
  const [data, setData] = useState<ObservationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [unmatched, setUnmatched] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        offset: String(offset),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (sourceSystem) params.sourceSystem = sourceSystem;
      if (unmatched) params.unmatched = "true";

      const result = await fetchObservations(params);
      setData(result.data);
      setTotal(result.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, sourceSystem, unmatched]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="page-header">
        <h1>Observations</h1>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {total} records
        </span>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search observations..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          style={{ width: "240px" }}
        />
        <input
          type="text"
          placeholder="Source system"
          value={sourceSystem}
          onChange={(e) => { setSourceSystem(e.target.value); setOffset(0); }}
          style={{ width: "160px" }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem" }}>
          <input
            type="checkbox"
            checked={unmatched}
            onChange={(e) => { setUnmatched(e.target.checked); setOffset(0); }}
          />
          Unmatched only
        </label>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Raw Title</th>
              <th>Vendor</th>
              <th>Version</th>
              <th>Source</th>
              <th>Last Seen</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">No observations found</td>
              </tr>
            ) : (
              data.map((obs) => {
                const topMatch = obs.matches?.[0];
                return (
                  <tr key={obs.id}>
                    <td>
                      <div><strong>{obs.rawTitle}</strong></div>
                      {obs.normalizedTitle && obs.normalizedTitle !== obs.rawTitle && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          → {obs.normalizedTitle}
                        </div>
                      )}
                    </td>
                    <td>{obs.vendor ?? "—"}</td>
                    <td>{obs.version ?? "—"}</td>
                    <td>{obs.sourceSystem}</td>
                    <td>{new Date(obs.lastSeenAt).toLocaleDateString()}</td>
                    <td>
                      {topMatch ? (
                        <div>
                          <StatusBadge value={topMatch.matchMethod} />{" "}
                          <ConfidenceBar score={topMatch.confidenceScore} />
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          No match
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination total={total} offset={offset} limit={limit} onPageChange={setOffset} />
      </div>
    </div>
  );
}
