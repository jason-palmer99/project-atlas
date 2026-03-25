import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTitles, SoftwareTitleRow } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { Pagination } from "../components/Pagination";

export function CatalogListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<SoftwareTitleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState("");
  const [status, setStatus] = useState("");
  const [sanctioned, setSanctioned] = useState("");

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        offset: String(offset),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (vendor) params.vendor = vendor;
      if (status) params.decisionStatus = status;
      if (sanctioned) params.isSanctioned = sanctioned;

      const result = await fetchTitles(params);
      setData(result.data);
      setTotal(result.total);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, vendor, status, sanctioned]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(value: string) {
    setSearch(value);
    setOffset(0);
  }

  return (
    <div>
      <div className="page-header">
        <h1>Software Catalog</h1>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {total} titles
        </span>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search titles..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: "240px" }}
        />
        <input
          type="text"
          placeholder="Vendor"
          value={vendor}
          onChange={(e) => { setVendor(e.target.value); setOffset(0); }}
          style={{ width: "160px" }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}>
          <option value="">All Statuses</option>
          <option value="SANCTIONED">Sanctioned</option>
          <option value="UNSANCTIONED_RUNNING">Unsanctioned Running</option>
          <option value="PENDING_GOVERNANCE">Pending Governance</option>
          <option value="BLOCKED">Blocked</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select value={sanctioned} onChange={(e) => { setSanctioned(e.target.value); setOffset(0); }}>
          <option value="">Sanctioned?</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Status</th>
              <th>Sanctioned</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="loading">Loading...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">No software titles found</td>
              </tr>
            ) : (
              data.map((title) => (
                <tr
                  key={title.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/titles/${title.id}`)}
                >
                  <td><strong>{title.canonicalName}</strong></td>
                  <td>{title.vendor}</td>
                  <td>{title.category ?? "—"}</td>
                  <td><StatusBadge value={title.status} /></td>
                  <td>{title.isSanctioned ? "✓ Yes" : "✗ No"}</td>
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
