import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTitles, importCatalogCsv, SoftwareTitleRow, CatalogImportResult } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { Pagination } from "../components/Pagination";

export function CatalogListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<SoftwareTitleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<CatalogImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after a fix
    e.target.value = "";
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const result = await importCatalogCsv(file);
      setImportResult(result);
      load(); // Refresh the catalog list
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setImportError(msg);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Software Catalog</h1>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          {total} titles
        </span>
        <div style={{ marginLeft: "auto" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import CSV"}
          </button>
        </div>
      </div>

      {importResult && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          borderRadius: "6px",
          background: importResult.errors.length > 0 ? "var(--color-warning-bg, #fffbeb)" : "var(--color-success-bg, #f0fdf4)",
          border: `1px solid ${importResult.errors.length > 0 ? "#fbbf24" : "#86efac"}`,
          fontSize: "0.875rem",
        }}>
          <strong>Import complete:</strong>{" "}
          {importResult.created} created, {importResult.updated} updated, {importResult.skipped} skipped.
          {importResult.errors.length > 0 && (
            <details style={{ marginTop: "0.5rem" }}>
              <summary style={{ cursor: "pointer" }}>{importResult.errors.length} row error(s)</summary>
              <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0 }}>
                {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
          <button
            onClick={() => setImportResult(null)}
            style={{ marginLeft: "1rem", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}
          >
            ✕
          </button>
        </div>
      )}

      {importError && (
        <div style={{
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
          borderRadius: "6px",
          background: "var(--color-danger-bg, #fef2f2)",
          border: "1px solid #fca5a5",
          fontSize: "0.875rem",
          color: "#991b1b",
        }}>
          <strong>Import failed:</strong> {importError}
          <button
            onClick={() => setImportError(null)}
            style={{ marginLeft: "1rem", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}
          >
            ✕
          </button>
        </div>
      )}

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
