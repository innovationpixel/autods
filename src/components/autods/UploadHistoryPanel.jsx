import { useEffect, useMemo, useState } from "react";
import { LuLoader, LuX } from "react-icons/lu";
import { getImportHistory } from "../../services/ProductService";
import { formatDisplayDateTime, getListingImageUrl } from "./helpers";

function statusLabel(status) {
  if (!status) return "—";
  return String(status).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isProcessingStatus(status) {
  const value = String(status ?? "").toLowerCase();
  return value === "processing" || value === "queued" || value === "fetching" || value === "publishing";
}

function actionLabel(action) {
  return action === "publish" ? "Publish" : "Draft";
}

function buildHistoryRows(payload) {
  const rows = [];

  for (const batch of payload?.batches ?? []) {
    rows.push({
      id: `batch-${batch.id}`,
      kind: "batch",
      date: batch.created_at,
      title: `Bulk import (${batch.total} item${batch.total === 1 ? "" : "s"})`,
      detail: `${batch.completed} succeeded · ${batch.failed} failed · ${actionLabel(batch.action)} · ${batch.warehouse_country ?? "CN"}`,
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
              <th>Date</th>
              <th>Activity</th>
              <th>Details</th>
              <th>Status</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td className="upload-history-panel__empty" colSpan={4}>
                  No upload history yet. Import products to see activity here.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
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
    </div>
  );
}

export default UploadHistoryPanel;
