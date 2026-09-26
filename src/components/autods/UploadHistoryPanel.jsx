import { useEffect, useMemo, useState } from "react";
import { LuLoader, LuX } from "react-icons/lu";
import { getImportHistory } from "../../services/ProductService";
import { formatDisplayDateTime, getListingImageUrl } from "./helpers";
import GridSortHeader from "./GridSortHeader";
import AdminPagination from "./AdminPagination";

function statusLabel(status) {
  if (!status) return "—";
  return String(status).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isProcessingStatus(status) {
  const value = String(status ?? "").toLowerCase();
  return value === "processing" || value === "queued" || value === "fetching" || value === "publishing";
}

function actionLabel(action) {
  if (action === "publish") return "Publish";
  if (action === "schedule") return "Schedule";
  return "Draft";
}

function buildHistoryRows(payload) {
  const rows = [];

  for (const batch of payload?.batches ?? []) {
    const isSchedule = batch.action === "schedule";

    rows.push({
      id: `batch-${batch.id}`,
      kind: "batch",
      date: batch.created_at,
      title: isSchedule
        ? `Scheduled publish (${batch.total} item${batch.total === 1 ? "" : "s"})`
        : `Bulk import (${batch.total} item${batch.total === 1 ? "" : "s"})`,
      detail: isSchedule
        ? `${batch.completed} completed · ${batch.failed} failed · Schedule`
        : `${batch.completed} succeeded · ${batch.failed} failed · ${actionLabel(batch.action)} · ${batch.warehouse_country ?? "CN"}`,
      status: batch.status,
      source: batch.source_type === "csv" ? "CSV" : "URLs",
    });
  }

  for (const listing of payload?.listings ?? []) {
    rows.push({
      id: `listing-${listing.id}`,
      kind: "listing",
      date: listing.published_at ?? listing.scheduled_at ?? listing.created_at,
      title: listing.title ?? "Imported product",
      detail: `${statusLabel(listing.source_platform)} · ${actionLabel(listing.status === "active" ? "publish" : "draft")}`,
      status: listing.import_status ?? listing.status,
      image: getListingImageUrl(listing),
    });
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function UploadHistoryPanel({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getImportHistory()
      .then((res) => {
        if (!cancelled) {
          setPayload(res.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error ?? "Failed to load upload history.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const rows = useMemo(() => buildHistoryRows(payload), [payload]);

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      setSortDirection("asc");
    }
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === "date") {
        const timeA = new Date(valA).getTime() || 0;
        const timeB = new Date(valB).getTime() || 0;
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
      valA = (valA ?? "").toString().toLowerCase();
      valB = (valB ?? "").toString().toLowerCase();
      return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [rows, sortBy, sortDirection]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  if (!visible) {
    return null;
  }

  return (
    <div className="upload-history-panel card-wrapper">
      <div className="upload-history-panel__head">
        <div>
          <h4>Upload history</h4>
          <p>Recent imports and bulk upload batches.</p>
        </div>
        <button type="button" className="upload-history-panel__close" onClick={onClose} aria-label="Close history">
          <LuX />
        </button>
      </div>

      <div className="upload-history-panel__table-wrap">
        <table className="upload-history-panel__table">
          <thead>
            <tr>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("date")}>
                <GridSortHeader columnId="date" label="Date" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("title")}>
                <GridSortHeader columnId="title" label="Activity" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("detail")}>
                <GridSortHeader columnId="detail" label="Details" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
                <GridSortHeader columnId="status" label="Status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="upload-history-panel__loading" colSpan={4}>
                  <LuLoader className="spin-icon" />
                  <span>Loading history…</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="upload-history-panel__empty upload-history-panel__empty--error" colSpan={4}>
                  {error}
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td className="upload-history-panel__empty" colSpan={4}>
                  No upload history yet. Import products to see activity here.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{formatDisplayDateTime(row.date)}</td>
                  <td>
                    <div className="upload-history-panel__activity">
                      {row.image ? (
                        <img src={row.image} alt="" className="upload-history-panel__thumb" />
                      ) : (
                        <span className="upload-history-panel__badge">{row.kind === "batch" ? "Bulk" : "Import"}</span>
                      )}
                      <span>{row.title}</span>
                    </div>
                  </td>
                  <td>{row.detail}</td>
                  <td>
                    <span className={`upload-history-panel__status upload-history-panel__status--${row.status ?? "ready"}`}>
                      {isProcessingStatus(row.status) ? <LuLoader className="spin-icon upload-history-panel__status-loader" /> : null}
                      {statusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={page}
        lastPage={totalPages}
        total={sortedRows.length}
        perPage={pageSize}
        onPageChange={setPage}
        onPerPageChange={setPageSize}
        entityName="records"
      />
    </div>
  );
}

export default UploadHistoryPanel;
