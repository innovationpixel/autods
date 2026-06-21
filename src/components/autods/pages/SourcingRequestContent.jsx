import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuClock3,
  LuExternalLink,
  LuImage,
  LuInbox,
  LuLink,
  LuLoader,
  LuPackageSearch,
  LuPlus,
  LuRefreshCcw,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { buildPaginationItems, normalizeImageUrl } from "../helpers";
import { selectEbayConnections } from "../../../store/selectors/EbaySelectors";
import {
  cancelSourcingRequest,
  createSourcingRequest,
  getSourcingRequests,
  linkSourcingQuote,
  refreshSourcingRequest,
} from "../../../services/SourcingService";
import "../../../assets/css/sourcing-request.css";

const statusFilters = ["All", "Processing", "Quoted", "Linked", "Cancelled"];

function statusBadgeClass(status) {
  return `sourcing-badge sourcing-badge--${status}`;
}

function SourcingRequestContent({ searchQuery = "" }) {
  const ebayConnections = useSelector(selectEbayConnections);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quotesModalRow, setQuotesModalRow] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [form, setForm] = useState({
    product_url: "",
    product_title: "",
    ebay_connection_id: "",
    notes: "",
  });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSourcingRequests({
        q: searchQuery,
        status: statusFilter,
        page: currentPage,
        limit: pageSize,
      });
      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? {});
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to load sourcing requests.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  useEffect(() => {
    if (!showCreateModal) {
      return;
    }

    const primary = ebayConnections.find((c) => c.is_primary) ?? ebayConnections[0];
    setForm((current) => ({
      ...current,
      ebay_connection_id: primary ? String(primary.id) : "",
    }));
  }, [showCreateModal, ebayConnections]);

  const totalPages = meta?.last_page ?? 1;
  const totalCount = meta?.total ?? rows.length;
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const emptyMessage = useMemo(() => {
    if (searchQuery || statusFilter !== "All") {
      return "No sourcing requests match your filters.";
    }
    return "No sourcing requests yet. Submit a product URL to find better suppliers.";
  }, [searchQuery, statusFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.product_url.trim() && !form.product_title.trim()) {
      toast.warn("Enter a product URL or title.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createSourcingRequest({
        product_url: form.product_url.trim(),
        product_title: form.product_title.trim(),
        ebay_connection_id: form.ebay_connection_id ? Number(form.ebay_connection_id) : undefined,
        notes: form.notes.trim() || undefined,
        source_type: "manual",
      });
      toast.success(res.data?.message ?? "Sourcing request created.");
      setShowCreateModal(false);
      setForm({ product_url: "", product_title: "", ebay_connection_id: "", notes: "" });
      await loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to create sourcing request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshRow = async (row) => {
    setActionId(`refresh-${row.id}`);
    try {
      const res = await refreshSourcingRequest(row.id);
      toast.success(res.data?.message ?? "Quotes refreshed.");
      const updated = res.data?.request;
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
      if (quotesModalRow?.id === row.id) {
        setQuotesModalRow(updated);
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to refresh quotes.");
    } finally {
      setActionId(null);
    }
  };

  const handleLinkQuote = async (row, quoteIndex) => {
    setActionId(`link-${row.id}-${quoteIndex}`);
    try {
      const res = await linkSourcingQuote(row.id, quoteIndex);
      toast.success(res.data?.message ?? "Product linked.");
      const updated = res.data?.request;
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
      setQuotesModalRow(updated);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to link product.");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (row) => {
    setActionId(`cancel-${row.id}`);
    try {
      const res = await cancelSourcingRequest(row.id);
      toast.success(res.data?.message ?? "Request cancelled.");
      const updated = res.data?.request;
      setRows((current) => current.map((item) => (item.id === row.id ? updated : item)));
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to cancel request.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="sourcing-request-content">
      <section className="sourcing-hero">
        <div className="sourcing-hero__copy">
          <h2>Product Sourcing Requests</h2>
          <p>
            Request quotes for products from Chinese or unmonitored suppliers. Auto DS scans supported
            marketplaces and returns alternative options with pricing, shipping, and similarity scores.
          </p>
          <div className="sourcing-hero__steps">
            <span className="sourcing-hero__step"><LuSearch /> Submit product URL</span>
            <span className="sourcing-hero__step"><LuClock3 /> Processing (~48h max)</span>
            <span className="sourcing-hero__step"><LuPackageSearch /> Review quotes</span>
            <span className="sourcing-hero__step"><LuLink /> Link product</span>
          </div>
        </div>
        <button type="button" className="sourcing-hero__cta" onClick={() => setShowCreateModal(true)}>
          <LuPlus />
          <span>New Sourcing Request</span>
        </button>
      </section>

      <section className="sourcing-toolbar" aria-label="Sourcing request controls">
        <div className="sourcing-toolbar__left">
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              className={`sourcing-status-pill ${statusFilter === status ? "sourcing-status-pill--active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <button type="button" className="sourcing-refresh-btn" onClick={loadRequests} disabled={loading}>
          {loading ? <LuLoader className="spin-icon" /> : <LuRefreshCcw />}
          <span>{loading ? "Loading…" : "Refresh"}</span>
        </button>
      </section>

      <main className="sourcing-table-shell">
        <div className="sourcing-table-scroll">
          <table className="sourcing-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Store</th>
                <th>Status</th>
                <th>Quotes</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px 16px" }}>
                    <LuLoader className="spin-icon" style={{ marginRight: 8 }} />
                    Loading sourcing requests…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => {
                  const imageUrl = normalizeImageUrl(row.product_image_url);

                  return (
                    <tr key={row.id} className="sourcing-table__row">
                      <td>
                        <div className="sourcing-product">
                          {imageUrl ? (
                            <img
                              className="sourcing-product__image"
                              src={imageUrl}
                              alt={row.product_title}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="sourcing-product__placeholder"><LuImage /></span>
                          )}
                          <div>
                            <span className="sourcing-product__title">{row.product_title}</span>
                            {row.product_url ? (
                              <a
                                className="sourcing-product__url"
                                href={row.product_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View source <LuExternalLink />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>{row.store_name ?? "—"}</td>
                      <td>
                        <span className={statusBadgeClass(row.status)}>{row.status_label}</span>
                      </td>
                      <td>{row.quotes_count ?? 0}</td>
                      <td>{row.requested_label ?? "—"}</td>
                      <td>
                        <div className="sourcing-actions">
                          {row.status === "quoted" || row.status === "linked" ? (
                            <button
                              type="button"
                              className="sourcing-action-btn sourcing-action-btn--primary"
                              onClick={() => setQuotesModalRow(row)}
                            >
                              View quotes
                            </button>
                          ) : null}
                          {row.status === "processing" ? (
                            <button
                              type="button"
                              className="sourcing-action-btn"
                              disabled={actionId === `refresh-${row.id}`}
                              onClick={() => handleRefreshRow(row)}
                            >
                              {actionId === `refresh-${row.id}` ? "Checking…" : "Check quotes"}
                            </button>
                          ) : null}
                          {row.status !== "linked" && row.status !== "cancelled" ? (
                            <button
                              type="button"
                              className="sourcing-action-btn sourcing-action-btn--danger"
                              disabled={actionId === `cancel-${row.id}`}
                              onClick={() => handleCancel(row)}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="sourcing-empty">
                      <LuInbox />
                      <p>{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="sourcing-footer">
        <nav className="sourcing-pagination" aria-label="Sourcing request pages">
          <button
            type="button"
            className="sourcing-pagination__arrow"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <LuChevronLeft />
          </button>
          {paginationItems.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="sourcing-pagination__page">…</span>
            ) : (
              <button
                type="button"
                key={item}
                className={`sourcing-pagination__page ${item === currentPage ? "sourcing-pagination__page--active" : ""}`}
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="sourcing-pagination__arrow"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            <LuChevronRight />
          </button>
        </nav>

        <label>
          <span>Show </span>
          <select value={pageSize} aria-label="Requests per page" onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={20}>20</option>
            <option value={40}>40</option>
            <option value={60}>60</option>
          </select>
          <span> of {totalCount} requests</span>
        </label>
      </footer>

      {showCreateModal ? (
        <div className="sourcing-modal-layer" role="presentation">
          <button
            type="button"
            className="sourcing-modal-layer__backdrop"
            aria-label="Close new sourcing request dialog"
            onClick={() => setShowCreateModal(false)}
          />
          <section className="sourcing-modal" role="dialog" aria-modal="true" aria-label="New sourcing request">
            <div className="sourcing-modal__head">
              <div>
                <h3>New Sourcing Request</h3>
                <p>Paste a supplier product URL. We will search for alternative suppliers with better pricing or shipping.</p>
              </div>
              <button type="button" className="sourcing-modal__close" onClick={() => setShowCreateModal(false)}>
                <LuX />
              </button>
            </div>

            <form className="sourcing-form" onSubmit={handleCreate}>
              <label>
                <span>Product URL</span>
                <input
                  type="url"
                  placeholder="https://www.aliexpress.com/item/..."
                  value={form.product_url}
                  onChange={(e) => setForm((current) => ({ ...current, product_url: e.target.value }))}
                />
              </label>
              <label>
                <span>Product title (optional)</span>
                <input
                  type="text"
                  placeholder="Used if URL cannot be parsed"
                  value={form.product_title}
                  onChange={(e) => setForm((current) => ({ ...current, product_title: e.target.value }))}
                />
              </label>
              {ebayConnections.length ? (
                <label>
                  <span>Store</span>
                  <select
                    value={form.ebay_connection_id}
                    onChange={(e) => setForm((current) => ({ ...current, ebay_connection_id: e.target.value }))}
                  >
                    {ebayConnections.map((connection) => (
                      <option key={connection.id} value={connection.id}>
                        {connection.ebay_username ?? connection.ebay_user_id}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label>
                <span>Notes (optional)</span>
                <textarea
                  placeholder="Variant preferences, target shipping time, etc."
                  value={form.notes}
                  onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                />
              </label>
              <div className="sourcing-modal__foot">
                <button type="button" className="sourcing-action-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sourcing-hero__cta" disabled={submitting}>
                  {submitting ? <LuLoader className="spin-icon" /> : <LuPlus />}
                  <span>{submitting ? "Submitting…" : "Submit request"}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {quotesModalRow ? (
        <div className="sourcing-modal-layer" role="presentation">
          <button
            type="button"
            className="sourcing-modal-layer__backdrop"
            aria-label="Close quotes dialog"
            onClick={() => setQuotesModalRow(null)}
          />
          <section className="sourcing-modal sourcing-modal--wide" role="dialog" aria-modal="true" aria-label="Supplier quotes">
            <div className="sourcing-modal__head">
              <div>
                <h3>Supplier quotes</h3>
                <p>{quotesModalRow.product_title}</p>
              </div>
              <button type="button" className="sourcing-modal__close" onClick={() => setQuotesModalRow(null)}>
                <LuX />
              </button>
            </div>

            {quotesModalRow.quotes?.length ? (
              <div className="sourcing-quotes-grid">
                {quotesModalRow.quotes.map((quote, index) => {
                  const quoteImage = normalizeImageUrl(quote.image_url);
                  const isLinked = quotesModalRow.linked_quote_index === index;

                  return (
                    <article
                      key={`${quotesModalRow.id}-quote-${index}`}
                      className={`sourcing-quote-card ${isLinked ? "sourcing-quote-card--linked" : ""}`}
                    >
                      <div className="sourcing-quote-card__top">
                        {quoteImage ? (
                          <img
                            className="sourcing-quote-card__image"
                            src={quoteImage}
                            alt={quote.title}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="sourcing-quote-card__placeholder"><LuImage /></span>
                        )}
                        <div>
                          <h4 className="sourcing-quote-card__title">{quote.title}</h4>
                          <span className="sourcing-quote-card__supplier">{quote.supplier}</span>
                        </div>
                      </div>
                      <div className="sourcing-quote-card__meta">
                        <span>${Number(quote.price ?? 0).toFixed(2)}</span>
                        {quote.similarity ? <span>{quote.similarity}% match</span> : null}
                        {quote.shipping_days ? <span>{quote.shipping_days} days ship</span> : null}
                        {quote.sold_count ? <span>{Number(quote.sold_count).toLocaleString()} sold</span> : null}
                      </div>
                      <div className="sourcing-quote-card__meta">
                        {quote.product_url ? (
                          <a className="sourcing-product__url" href={quote.product_url} target="_blank" rel="noreferrer">
                            Open supplier <LuExternalLink />
                          </a>
                        ) : null}
                      </div>
                      {quotesModalRow.status !== "linked" ? (
                        <button
                          type="button"
                          className="sourcing-action-btn sourcing-action-btn--primary"
                          disabled={actionId === `link-${quotesModalRow.id}-${index}`}
                          onClick={() => handleLinkQuote(quotesModalRow, index)}
                        >
                          {actionId === `link-${quotesModalRow.id}-${index}` ? "Linking…" : "Link product"}
                        </button>
                      ) : isLinked ? (
                        <span className={statusBadgeClass("linked")}><LuCheck /> Linked supplier</span>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="sourcing-empty">
                <LuClock3 />
                <p>Quotes are still processing. Check back soon or refresh the request.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default SourcingRequestContent;
