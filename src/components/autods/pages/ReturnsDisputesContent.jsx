import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuDownload,
  LuExternalLink,
  LuEye,
  LuFileText,
  LuPackage,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuShieldAlert,
  LuStore,
  LuTrash2,
  LuTriangleAlert,
  LuUndo2,
  LuUpload,
  LuUser,
  LuX,
} from "react-icons/lu";
import { selectEbayConnections } from "../../../store/selectors/EbaySelectors";
import {
  getReturnsDisputes,
  respondReturnDispute,
  syncReturnsDisputes,
} from "../../../services/ReturnDisputeService";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import "../../../assets/css/returns-disputes.css";

const PAGE_SIZE_OPTIONS = [20, 40, 60, 120, 240];

function formatCurrency(amount, currency = "USD") {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

function getCountdown(deadlineStr) {
  if (!deadlineStr) return null;
  const deadline = new Date(deadlineStr);
  if (Number.isNaN(deadline.getTime())) return null;

  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  if (diffHours <= 0) {
    return { text: "Overdue", type: "urgent" };
  }
  if (diffDays <= 2) {
    return { text: `${diffDays}d left`, type: "urgent" };
  }
  if (diffDays <= 5) {
    return { text: `${diffDays}d left`, type: "warning" };
  }
  return { text: `${diffDays}d left`, type: "normal" };
}

function normalizeReason(reason) {
  if (!reason) return "Not specified";
  return reason
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeStatus(status) {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function _getEbayResolutionUrl(item) {
  if (!item) return "https://www.ebay.com/sh/ovw";
  if (item.type === "return" && item.external_id) {
    return `https://www.ebay.com/sh/ord/returns/detail?returnId=${encodeURIComponent(item.external_id)}`;
  }
  if (item.type === "dispute") {
    return "https://www.ebay.com/sh/fin/disputes";
  }
  return "https://www.ebay.com/sh/ord";
}

export default function ReturnsDisputesContent({ searchQuery = "" }) {
  const ebayConnections = useSelector(selectEbayConnections) || [];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [counts, setCounts] = useState({
    total: 0,
    returns: 0,
    disputes: 0,
    action_needed: 0,
    closed: 0,
  });

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'returns' | 'disputes' | 'action_needed' | 'closed'
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  const [activeResolveItem, setActiveResolveItem] = useState(null);
  const [resolveAction, setResolveAction] = useState("accept_return");
  const [resolveAmount, setResolveAmount] = useState("");
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolveShippingLabel, setResolveShippingLabel] = useState(null);
  const [labelDragOver, setLabelDragOver] = useState(false);
  const [resolving, setResolving] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleLabelFileChange = (file) => {
    if (!file) return;
    const validExtensions = /\.(pdf|png|jpe?g|webp)$/i;
    const validMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validMimes.includes(file.type) && !validExtensions.test(file.name)) {
      toast.warn("Please upload a PDF or image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.warn("Shipping label file must be smaller than 15MB.");
      return;
    }
    setResolveShippingLabel(file);
  };

  const handleOpenResolve = (item) => {
    setActiveResolveItem(item);
    setResolveAction(item.type === "return" ? "accept_return" : "contest_dispute");
    setResolveAmount(item.amount ? String(item.amount) : "");
    setResolveMessage("");
    setResolveShippingLabel(null);
    setLabelDragOver(false);
  };

  const handleSubmitResolve = async (e) => {
    if (e) e.preventDefault();
    if (!activeResolveItem) return;

    if (resolveAction === "provide_label" && !resolveShippingLabel) {
      toast.warn("Please upload a shipping label file.");
      return;
    }

    setResolving(true);
    try {
      const formData = new FormData();
      formData.append("action", resolveAction);
      if (resolveMessage) {
        formData.append("message", resolveMessage);
      }
      if (resolveAction === "issue_refund" && resolveAmount) {
        formData.append("amount", resolveAmount);
      }
      if (resolveAction === "provide_label" && resolveShippingLabel) {
        formData.append("shipping_label", resolveShippingLabel);
      }

      const res = await respondReturnDispute(activeResolveItem.id, formData);
      const updated = res.data?.return_dispute;

      if (updated) {
        setItems((current) =>
          current.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
        );
        if (selectedDetailItem?.id === updated.id) {
          setSelectedDetailItem(updated);
        }
      }

      toast.success(res.data?.message ?? "Resolution submitted successfully.");
      setActiveResolveItem(null);
      loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit resolution."));
    } finally {
      setResolving(false);
    }
  };

  const effectiveSearch = searchQuery || localSearch;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
      };

      if (effectiveSearch) params.q = effectiveSearch;
      if (selectedStoreId) params.store_id = selectedStoreId;

      if (activeTab === "returns") params.type = "return";
      else if (activeTab === "disputes") params.type = "dispute";
      else if (activeTab === "action_needed") params.status = "action_needed";
      else if (activeTab === "closed") params.status = "closed";

      const res = await getReturnsDisputes(params);
      const data = res.data;

      setItems(data.data || []);
      setTotalCount(data.total || 0);
      setLastPage(data.last_page || 1);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load returns and disputes."));
    } finally {
      setLoading(false);
    }
  }, [activeTab, effectiveSearch, page, perPage, selectedStoreId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncReturnsDisputes();
      toast.success(res.data?.message || "Returns and disputes synced from eBay successfully.");
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to sync returns and disputes from eBay."));
    } finally {
      setSyncing(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleStoreChange = (e) => {
    setSelectedStoreId(e.target.value);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setPage(1);
  };

  const startRecord = (page - 1) * perPage + 1;
  const endRecord = Math.min(page * perPage, totalCount);

  return (
    <div className="returns-disputes-page">
      {/* Header */}
      <div className="rd-header">
        <div className="rd-header__titles">
          <h1>
            <LuRotateCcw style={{ color: "#3b82f6" }} />
            <span>Returns &amp; Disputes</span>
          </h1>
          <p>Monitor, track, and resolve buyer return requests and payment disputes from eBay.</p>
        </div>

        <div className="rd-header__actions">
          <button
            type="button"
            className="rd-btn-sync"
            onClick={handleSync}
            disabled={syncing || loading}
          >
            <LuRefreshCw className={syncing ? "rd-spin" : ""} />
            <span>{syncing ? "Syncing from eBay…" : "Sync from eBay"}</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="rd-stat-cards">
        <div
          className={`rd-stat-card rd-stat-card--all ${activeTab === "all" ? "rd-stat-card--active" : ""}`}
          onClick={() => handleTabChange("all")}
          role="button"
          tabIndex={0}
        >
          <div className="rd-stat-card__icon">
            <LuRotateCcw />
          </div>
          <div className="rd-stat-card__info">
            <span className="rd-stat-card__label">Total Requests</span>
            <span className="rd-stat-card__value">{counts.total || 0}</span>
          </div>
        </div>

        <div
          className={`rd-stat-card rd-stat-card--returns ${activeTab === "returns" ? "rd-stat-card--active" : ""}`}
          onClick={() => handleTabChange("returns")}
          role="button"
          tabIndex={0}
        >
          <div className="rd-stat-card__icon">
            <LuUndo2 />
          </div>
          <div className="rd-stat-card__info">
            <span className="rd-stat-card__label">Return Requests</span>
            <span className="rd-stat-card__value">{counts.returns || 0}</span>
          </div>
        </div>

        <div
          className={`rd-stat-card rd-stat-card--disputes ${activeTab === "disputes" ? "rd-stat-card--active" : ""}`}
          onClick={() => handleTabChange("disputes")}
          role="button"
          tabIndex={0}
        >
          <div className="rd-stat-card__icon">
            <LuShieldAlert />
          </div>
          <div className="rd-stat-card__info">
            <span className="rd-stat-card__label">Payment Disputes</span>
            <span className="rd-stat-card__value">{counts.disputes || 0}</span>
          </div>
        </div>

        <div
          className={`rd-stat-card rd-stat-card--urgent ${activeTab === "action_needed" ? "rd-stat-card--active" : ""}`}
          onClick={() => handleTabChange("action_needed")}
          role="button"
          tabIndex={0}
        >
          <div className="rd-stat-card__icon">
            <LuTriangleAlert />
          </div>
          <div className="rd-stat-card__info">
            <span className="rd-stat-card__label">Action Needed</span>
            <span className="rd-stat-card__value">{counts.action_needed || 0}</span>
          </div>
        </div>

        <div
          className={`rd-stat-card rd-stat-card--closed ${activeTab === "closed" ? "rd-stat-card--active" : ""}`}
          onClick={() => handleTabChange("closed")}
          role="button"
          tabIndex={0}
        >
          <div className="rd-stat-card__icon">
            <LuCircleCheck />
          </div>
          <div className="rd-stat-card__info">
            <span className="rd-stat-card__label">Closed / Resolved</span>
            <span className="rd-stat-card__value">{counts.closed || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rd-toolbar">
        <div className="rd-toolbar__left">
          {/* Tabs */}
          <div className="rd-tabs">
            <button
              type="button"
              className={`rd-tab-btn ${activeTab === "all" ? "rd-tab-btn--active" : ""}`}
              onClick={() => handleTabChange("all")}
            >
              <span>All</span>
              <span className="rd-tab-badge">{counts.total || 0}</span>
            </button>
            <button
              type="button"
              className={`rd-tab-btn ${activeTab === "returns" ? "rd-tab-btn--active" : ""}`}
              onClick={() => handleTabChange("returns")}
            >
              <span>Returns</span>
              <span className="rd-tab-badge">{counts.returns || 0}</span>
            </button>
            <button
              type="button"
              className={`rd-tab-btn ${activeTab === "disputes" ? "rd-tab-btn--active" : ""}`}
              onClick={() => handleTabChange("disputes")}
            >
              <span>Disputes</span>
              <span className="rd-tab-badge">{counts.disputes || 0}</span>
            </button>
            <button
              type="button"
              className={`rd-tab-btn ${activeTab === "action_needed" ? "rd-tab-btn--active" : ""}`}
              onClick={() => handleTabChange("action_needed")}
            >
              <span>Action Needed</span>
              <span className="rd-tab-badge">{counts.action_needed || 0}</span>
            </button>
            <button
              type="button"
              className={`rd-tab-btn ${activeTab === "closed" ? "rd-tab-btn--active" : ""}`}
              onClick={() => handleTabChange("closed")}
            >
              <span>Closed</span>
              <span className="rd-tab-badge">{counts.closed || 0}</span>
            </button>
          </div>

          {/* Store select */}
          {ebayConnections.length > 0 && (
            <select
              className="rd-filter-select"
              value={selectedStoreId}
              onChange={handleStoreChange}
              aria-label="Filter by eBay Store"
            >
              <option value="">All Stores ({ebayConnections.length})</option>
              {ebayConnections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.ebay_username || `Store #${conn.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="rd-toolbar__right">
          {/* Search box */}
          <form className="rd-search-box" onSubmit={handleSearchSubmit}>
            <LuSearch />
            <input
              type="text"
              placeholder="Search title, buyer, order ID…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
            {localSearch && (
              <button
                type="button"
                className="rd-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <LuX />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rd-table-card">
        <div className="rd-table-wrapper">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product &amp; Order</th>
                <th>Store</th>
                <th>Buyer &amp; Reason</th>
                <th>Amount</th>
                <th>Respond By</th>
                <th>Status</th>
                <th>Date Opened</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
                      <LuRefreshCw className="rd-spin" />
                      <span>Loading returns and disputes…</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="rd-empty-state">
                      <LuUndo2 className="rd-empty-icon" />
                      <h3>No returns or disputes found</h3>
                      <p>
                        {effectiveSearch || selectedStoreId || activeTab !== "all"
                          ? "No matching records found with current filters. Try resetting search or selecting another tab."
                          : "There are no active returns or disputes on your connected eBay stores."}
                      </p>
                      <button
                        type="button"
                        className="rd-btn-sync"
                        onClick={handleSync}
                        disabled={syncing}
                      >
                        <LuRefreshCw className={syncing ? "rd-spin" : ""} />
                        <span>Sync Now</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const countdown = getCountdown(item.respond_by_date);
                  const isReturn = item.type === "return";
                  const statusNormalized = (item.status || "").toLowerCase();
                  const isActionNeeded =
                    statusNormalized.includes("action_needed") ||
                    statusNormalized.includes("waiting") ||
                    statusNormalized.includes("open");
                  const isClosed =
                    statusNormalized.includes("closed") ||
                    statusNormalized.includes("resolved") ||
                    statusNormalized.includes("decided");

                  return (
                    <tr key={item.id}>
                      {/* Type */}
                      <td>
                        <span
                          className={`rd-type-badge ${
                            isReturn ? "rd-type-badge--return" : "rd-type-badge--dispute"
                          }`}
                        >
                          {isReturn ? <LuUndo2 /> : <LuShieldAlert />}
                          <span>{item.type}</span>
                        </span>
                      </td>

                      {/* Product & Order */}
                      <td>
                        <div className="rd-item-cell">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="rd-item-thumb"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="rd-item-thumb"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#94a3b8",
                              }}
                            >
                              <LuPackage size={20} />
                            </div>
                          )}

                          <div className="rd-item-details">
                            <span
                              className="rd-item-title"
                              title={item.title || "eBay Listing Item"}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedDetailItem(item)}
                            >
                              {item.title || "eBay Listing Item"}
                            </span>

                            <div className="rd-item-submeta">
                              {item.item_id && (
                                <a
                                  href={`https://www.ebay.com/itm/${item.item_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rd-link-pill"
                                  title="View Item on eBay"
                                >
                                  <span>Item: {item.item_id}</span>
                                  <LuExternalLink size={11} />
                                </a>
                              )}
                              {item.order_id && (
                                <a
                                  href={`https://www.ebay.com/mesh/ord/details?orderid=${item.order_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rd-link-pill"
                                  title="View Order on eBay"
                                >
                                  <span>Order: {item.order_id}</span>
                                  <LuExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <LuStore size={14} color="#64748b" />
                          <span style={{ fontWeight: 500, fontSize: "12.5px" }}>
                            {item.connection?.ebay_username || `Store #${item.ebay_connection_id}`}
                          </span>
                        </div>
                      </td>

                      {/* Buyer & Reason */}
                      <td>
                        <div className="rd-buyer-cell">
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <LuUser size={13} color="#64748b" />
                            <span className="rd-buyer-name">{item.buyer_username || "eBay Buyer"}</span>
                          </div>
                          {item.reason && (
                            <span className="rd-reason-badge" title={normalizeReason(item.reason)}>
                              {normalizeReason(item.reason)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td>
                        <div className="rd-amount-cell">
                          <span className="rd-amount-val">
                            {formatCurrency(item.amount, item.currency)}
                          </span>
                          {item.quantity && item.quantity > 1 && (
                            <span className="rd-amount-qty">Qty: {item.quantity}</span>
                          )}
                        </div>
                      </td>

                      {/* Respond By Deadline */}
                      <td>
                        {item.respond_by_date ? (
                          <div className="rd-deadline-cell">
                            <span className="rd-deadline-date">
                              {formatDate(item.respond_by_date)}
                            </span>
                            {countdown && !isClosed && (
                              <span
                                className={`rd-countdown-pill rd-countdown-pill--${countdown.type}`}
                              >
                                <LuClock size={11} />
                                <span>{countdown.text}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`rd-status-badge ${
                            isActionNeeded
                              ? "rd-status-badge--action_needed"
                              : isClosed
                              ? "rd-status-badge--closed"
                              : "rd-status-badge--open"
                          }`}
                        >
                          {isActionNeeded && <LuCircleAlert size={12} />}
                          <span>{normalizeStatus(item.status)}</span>
                        </span>
                      </td>

                      {/* Date Opened */}
                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {formatDate(item.opened_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="rd-actions-cell" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="rd-btn-action"
                            title="View details"
                            onClick={() => setSelectedDetailItem(item)}
                          >
                            <LuEye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="rd-btn-action rd-btn-action--primary"
                            title="Resolve case in app"
                            onClick={() => handleOpenResolve(item)}
                          >
                            <span>Resolve</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="rd-table-footer">
          <div className="rd-footer-info">
            <span>
              Showing {totalCount > 0 ? startRecord : 0} to {endRecord} of {totalCount} records
            </span>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Show</span>
              <select
                className="rd-per-page-select"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>per page</span>
            </label>
          </div>

          {lastPage > 1 && (
            <div className="rd-pagination">
              <button
                type="button"
                className="rd-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                let pNum = i + 1;
                if (lastPage > 5 && page > 3) {
                  pNum = page - 2 + i;
                  if (pNum > lastPage) pNum = lastPage - (4 - i);
                }
                return (
                  <button
                    key={pNum}
                    type="button"
                    className={`rd-page-btn ${page === pNum ? "rd-page-btn--active" : ""}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="rd-page-btn"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedDetailItem && (
        <div
          className="rd-modal-backdrop"
          onClick={() => setSelectedDetailItem(null)}
          role="presentation"
        >
          <div className="rd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rd-modal-header">
              <div className="rd-modal-title">
                <span
                  className={`rd-type-badge ${
                    selectedDetailItem.type === "return"
                      ? "rd-type-badge--return"
                      : "rd-type-badge--dispute"
                  }`}
                >
                  {selectedDetailItem.type}
                </span>
                <h2>Case #{selectedDetailItem.external_id || selectedDetailItem.id}</h2>
              </div>
              <button
                type="button"
                className="rd-modal-close-btn"
                onClick={() => setSelectedDetailItem(null)}
                aria-label="Close details"
              >
                <LuX />
              </button>
            </div>

            <div className="rd-modal-body">
              {/* Product Banner */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {selectedDetailItem.image_url ? (
                  <img
                    src={selectedDetailItem.image_url}
                    alt=""
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "8px",
                      background: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#64748b",
                    }}
                  >
                    <LuPackage size={28} />
                  </div>
                )}
                <div>
                  <h3
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {selectedDetailItem.title || "eBay Item"}
                  </h3>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12.5px" }}>
                    {selectedDetailItem.item_id && (
                      <a
                        href={`https://www.ebay.com/itm/${selectedDetailItem.item_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rd-link-pill"
                      >
                        Item ID: {selectedDetailItem.item_id}
                        <LuExternalLink size={12} />
                      </a>
                    )}
                    {selectedDetailItem.order_id && (
                      <a
                        href={`https://www.ebay.com/mesh/ord/details?orderid=${selectedDetailItem.order_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rd-link-pill"
                      >
                        Order ID: {selectedDetailItem.order_id}
                        <LuExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid Information */}
              <div className="rd-detail-grid">
                <div className="rd-detail-card">
                  <span className="rd-detail-label">Status</span>
                  <span className="rd-detail-value" style={{ fontWeight: 600 }}>
                    {normalizeStatus(selectedDetailItem.status)}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Claimed Amount</span>
                  <span
                    className="rd-detail-value"
                    style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}
                  >
                    {formatCurrency(selectedDetailItem.amount, selectedDetailItem.currency)}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Buyer</span>
                  <span className="rd-detail-value">
                    {selectedDetailItem.buyer_username || "eBay Buyer"}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Store</span>
                  <span className="rd-detail-value">
                    {selectedDetailItem.connection?.ebay_username || `Store #${selectedDetailItem.ebay_connection_id}`}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Reason</span>
                  <span className="rd-detail-value">
                    {normalizeReason(selectedDetailItem.reason)}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Respond By Deadline</span>
                  <span
                    className="rd-detail-value"
                    style={{
                      color: selectedDetailItem.respond_by_date ? "#dc2626" : "inherit",
                      fontWeight: 600,
                    }}
                  >
                    {selectedDetailItem.respond_by_date
                      ? formatDate(selectedDetailItem.respond_by_date)
                      : "No deadline specified"}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Opened At</span>
                  <span className="rd-detail-value">
                    {formatDate(selectedDetailItem.opened_at)}
                  </span>
                </div>

                <div className="rd-detail-card">
                  <span className="rd-detail-label">Closed At</span>
                  <span className="rd-detail-value">
                    {selectedDetailItem.closed_at
                      ? formatDate(selectedDetailItem.closed_at)
                      : "Still Open"}
                  </span>
                </div>
              </div>

              {/* Payload Notes / Details if any */}
              {selectedDetailItem.details?.buyerComments && (
                <div className="rd-detail-card">
                  <span className="rd-detail-label">Buyer Comments</span>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#334155" }}>
                    {selectedDetailItem.details.buyerComments}
                  </p>
                </div>
              )}

              {(selectedDetailItem.shipping_label_url || selectedDetailItem.details?.shipping_label_url) && (
                <div className="rd-detail-card">
                  <span className="rd-detail-label">Return Shipping Label</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <LuFileText size={22} color="#2563eb" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {selectedDetailItem.shipping_label_name || selectedDetailItem.details?.shipping_label_name || "Return_Shipping_Label"}
                        </div>
                        <span style={{ fontSize: "11.5px", color: "#64748b" }}>Uploaded seller shipping label for buyer return</span>
                      </div>
                    </div>
                    <a
                      href={selectedDetailItem.shipping_label_url || selectedDetailItem.details?.shipping_label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rd-btn-action rd-btn-action--primary"
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: "12.5px", flexShrink: 0 }}
                    >
                      <LuDownload size={14} />
                      <span>Download Label</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="rd-modal-footer">
              <button
                type="button"
                className="rd-btn-action"
                onClick={() => setSelectedDetailItem(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="rd-btn-action rd-btn-action--primary"
                onClick={() => handleOpenResolve(selectedDetailItem)}
              >
                <span>Resolve in App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Return / Dispute Resolution Modal */}
      {activeResolveItem && (
        <div
          className="rd-modal-backdrop"
          onClick={() => setActiveResolveItem(null)}
          role="presentation"
        >
          <div className="rd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="rd-modal-header">
              <div className="rd-modal-title">
                <span
                  className={`rd-type-badge ${
                    activeResolveItem.type === "return"
                      ? "rd-type-badge--return"
                      : "rd-type-badge--dispute"
                  }`}
                >
                  {activeResolveItem.type}
                </span>
                <h2>Resolve Case #{activeResolveItem.external_id || activeResolveItem.id}</h2>
              </div>
              <button
                type="button"
                className="rd-modal-close-btn"
                onClick={() => setActiveResolveItem(null)}
                aria-label="Close"
              >
                <LuX />
              </button>
            </div>

            <form onSubmit={handleSubmitResolve} className="rd-modal-body" style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <span className="rd-form-label" style={{ display: "block", marginBottom: 8 }}>
                  Select Resolution Action
                </span>
                <div className="rd-resolve-options">
                  {activeResolveItem.type === "return" ? (
                    <>
                      <div
                        className={`rd-resolve-card ${resolveAction === "accept_return" ? "rd-resolve-card--active" : ""}`}
                        onClick={() => setResolveAction("accept_return")}
                      >
                        <span className="rd-resolve-card__title">Accept Return</span>
                        <span className="rd-resolve-card__desc">Approve buyer request and authorize return.</span>
                      </div>

                      <div
                        className={`rd-resolve-card ${resolveAction === "issue_refund" ? "rd-resolve-card--active" : ""}`}
                        onClick={() => setResolveAction("issue_refund")}
                      >
                        <span className="rd-resolve-card__title">Issue Refund</span>
                        <span className="rd-resolve-card__desc">Refund the buyer directly without return.</span>
                      </div>

                      <div
                        className={`rd-resolve-card ${resolveAction === "provide_label" ? "rd-resolve-card--active" : ""}`}
                        onClick={() => setResolveAction("provide_label")}
                      >
                        <span className="rd-resolve-card__title">Provide Shipping Label</span>
                        <span className="rd-resolve-card__desc">Upload return shipping label (PDF or image).</span>
                      </div>

                      <div
                        className={`rd-resolve-card ${resolveAction === "contest_dispute" ? "rd-resolve-card--active" : ""}`}
                        onClick={() => setResolveAction("contest_dispute")}
                      >
                        <span className="rd-resolve-card__title">Send Message / Contest</span>
                        <span className="rd-resolve-card__desc">Provide seller response or contest the return.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`rd-resolve-card ${resolveAction === "contest_dispute" ? "rd-resolve-card--active" : ""}`}
                        onClick={() => setResolveAction("contest_dispute")}
                      >
                        <span className="rd-resolve-card__title">Challenge / Contest</span>
                        <span className="rd-resolve-card__desc">Submit proof of delivery or dispute response.</span>
                      </div>

                      <div
                        className={`rd-resolve-card ${resolveAction === "issue_refund" ? "rd-resolve-card--active" : ""}`}
                        onClick={() => setResolveAction("issue_refund")}
                      >
                        <span className="rd-resolve-card__title">Accept & Full Refund</span>
                        <span className="rd-resolve-card__desc">Accept dispute claim and issue full refund.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {resolveAction === "issue_refund" && (
                <div className="rd-form-group">
                  <label className="rd-form-label">Refund Amount ({activeResolveItem.currency || "USD"})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rd-form-input"
                    value={resolveAmount}
                    onChange={(e) => setResolveAmount(e.target.value)}
                    placeholder="e.g. 29.99"
                    required
                  />
                </div>
              )}

              {resolveAction === "provide_label" && (
                <div className="rd-form-group">
                  <label className="rd-form-label">Return Shipping Label (PDF, PNG, JPG, or WEBP)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleLabelFileChange(e.target.files[0]);
                    }}
                  />

                  {!resolveShippingLabel ? (
                    <div
                      className={`rd-upload-zone ${labelDragOver ? "rd-upload-zone--active" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setLabelDragOver(true);
                      }}
                      onDragLeave={() => setLabelDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setLabelDragOver(false);
                        if (e.dataTransfer.files?.[0]) {
                          handleLabelFileChange(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="rd-upload-zone__icon">
                        <LuUpload size={24} />
                      </div>
                      <div className="rd-upload-zone__title">Click to upload or drag & drop</div>
                      <div className="rd-upload-zone__hint">Supports PDF, PNG, JPG, WEBP (up to 15MB)</div>
                    </div>
                  ) : (
                    <div className="rd-file-preview-card">
                      <div className="rd-file-preview-card__main">
                        <div className="rd-file-preview-card__icon">
                          <LuFileText size={22} />
                        </div>
                        <div className="rd-file-preview-card__meta">
                          <span className="rd-file-preview-card__name" title={resolveShippingLabel.name}>
                            {resolveShippingLabel.name}
                          </span>
                          <span className="rd-file-preview-card__size">
                            {formatFileSize(resolveShippingLabel.size)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rd-file-preview-card__remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResolveShippingLabel(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <LuTrash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="rd-form-group">
                <label className="rd-form-label">
                  Message / Comments {resolveAction === "contest_dispute" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  className="rd-form-textarea"
                  rows={3}
                  value={resolveMessage}
                  onChange={(e) => setResolveMessage(e.target.value)}
                  placeholder="Provide resolution details or instructions for the buyer..."
                  required={resolveAction === "contest_dispute"}
                />
              </div>

              <div className="rd-modal-footer" style={{ margin: "16px -24px -24px -24px" }}>
                <button
                  type="button"
                  className="rd-btn-action"
                  onClick={() => setActiveResolveItem(null)}
                  disabled={resolving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rd-btn-action rd-btn-action--primary"
                  disabled={resolving}
                >
                  {resolving && <LuRefreshCw className="rd-spin" size={13} style={{ marginRight: 6 }} />}
                  <span>{resolving ? "Submitting…" : "Confirm Resolution"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
