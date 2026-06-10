import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "../../../utils/toast";
import {
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuClock3,
  LuEllipsisVertical,
  LuExternalLink,
  LuInbox,
  LuLink,
  LuLoader,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuSparkles,
  LuTrash2,
} from "react-icons/lu";
import {
  selectEbayConnected,
  selectEbayDrafts,
  selectEbayDraftsLoading,
  selectEbayDraftsError,
  selectEbayDraftsMeta,
} from "../../../store/selectors/EbaySelectors";
import { fetchEbayDrafts } from "../../../store/actions/EbayActions";
import {
  publishProduct,
  retryProductImport,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
} from "../../../services/ProductService";
import { getListingImageUrl } from "../helpers";

function DraftsContent({ searchQuery }) {
  const dispatch = useDispatch();
  const connected = useSelector(selectEbayConnected);
  const drafts    = useSelector(selectEbayDrafts);
  const meta      = useSelector(selectEbayDraftsMeta);
  const loading   = useSelector(selectEbayDraftsLoading);
  const error     = useSelector(selectEbayDraftsError);

  const [activeTab, setActiveTab]         = useState("drafts");
  const [showFilters, setShowFilters]     = useState(false);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [expandedIds, setExpandedIds]     = useState([]);
  const [retryingIds, setRetryingIds]     = useState([]);
  const [openMenuId, setOpenMenuId]       = useState("");
  const [editForms, setEditForms]         = useState({});

  const loadDrafts = () => {
    const params = { q: searchQuery };
    if (activeTab === "scheduled") params.tab = "scheduled";
    if (activeTab === "failed") params.tab = "failed";
    dispatch(fetchEbayDrafts(params));
  };

  useEffect(() => {
    if (connected) {
      loadDrafts();
    }
  }, [dispatch, connected, searchQuery, activeTab]);

  const visibleDrafts = drafts;
  const scheduledCount = activeTab === "scheduled" ? (meta?.total ?? drafts.length) : 0;
  const failedCount = drafts.filter((d) => d.import_status === "failed").length;

  const allVisibleSelected = visibleDrafts.length > 0 && visibleDrafts.every((item) => selectedIds.includes(item.id));
  const allExpanded = visibleDrafts.length > 0 && visibleDrafts.every((item) => expandedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((cur) => cur.filter((id) => !visibleDrafts.some((item) => item.id === id)));
      return;
    }
    setSelectedIds((cur) => [...new Set([...cur, ...visibleDrafts.map((item) => item.id)])]);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const toggleExpanded = (id) => {
    setExpandedIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const toggleExpandAll = () => {
    setExpandedIds(allExpanded ? [] : visibleDrafts.map((item) => item.id));
  };

  const getEditForm = (item) => ({
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    ...editForms[item.id],
  });

  const setEditField = (id, field, value, item) => {
    setEditForms((cur) => ({
      ...cur,
      [id]: { ...getEditForm(item), [field]: value },
    }));
  };

  const saveDraft = async (item) => {
    const form = getEditForm(item);
    try {
      await updateProduct(item.id, form);
      toast.success("Draft saved.");
      loadDrafts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to save draft.");
    }
  };

  const runBulkAction = async (action) => {
    if (!selectedIds.length) { toast.warn("Select at least one draft."); return; }

    if (action === "remove") {
      try {
        await bulkDeleteProducts(selectedIds);
        toast.success(`${selectedIds.length} draft(s) removed.`);
        setSelectedIds([]);
        loadDrafts();
      } catch (err) {
        toast.error(err.response?.data?.error ?? "Bulk delete failed.");
      }
      return;
    }

    if (action === "import") {
      for (const id of selectedIds) {
        try {
          await publishProduct(id);
        } catch {
          // continue
        }
      }
      toast.success("Publish queued for selected drafts.");
      loadDrafts();
      return;
    }

    toast.info(action === "edit" ? "Bulk edit opened" : "Action applied.");
  };

  const retryDraft = async (id) => {
    setRetryingIds((cur) => [...new Set([...cur, id])]);
    try {
      await retryProductImport(id);
      toast.success("Draft retry completed.");
      loadDrafts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Retry failed.");
    } finally {
      setRetryingIds((cur) => cur.filter((x) => x !== id));
    }
  };

  const publishDraft = async (id) => {
    try {
      await publishProduct(id);
      toast.success("Published to eBay.");
      loadDrafts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Publish failed.");
    }
  };

  const handleDraftMenu = async (id, action) => {
    if (action === "delete") {
      try {
        await deleteProduct(id);
        toast.success("Draft deleted.");
        loadDrafts();
      } catch (err) {
        toast.error(err.response?.data?.error ?? "Delete failed.");
      }
    }
    if (action === "schedule") toast.info("Schedule Listing panel opened.");
    if (action === "viral") toast.info("Go Viral with TikTok Ads is ready for this draft.");
    setOpenMenuId("");
  };

  if (!connected) {
    return (
      <section className="drafts-page-content">
        <div className="drafts-not-connected card-wrapper" style={{ padding: 40, textAlign: "center" }}>
          <LuLink size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
          <h3>No eBay account connected</h3>
          <p>Go to <strong>Settings → Store Settings</strong> to connect your eBay seller account.</p>
        </div>
      </section>
    );
  }

  const emptyMessage = activeTab === "scheduled"
    ? "No scheduled uploads yet."
    : activeTab === "failed"
      ? "No failed uploads."
      : "No draft listings found. Import products from Add Products.";

  return (
    <section className="drafts-page-content">
      <nav className="drafts-tabs" aria-label="Upload sections">
        {[
          ["drafts", `Drafts (${meta?.total ?? drafts.length})`],
          ["scheduled", `Scheduled (${scheduledCount})`],
          ["failed", `Failed (${failedCount})`],
        ].map(([key, label]) => (
          <button key={key} type="button" className={`drafts-tab ${activeTab === key ? "drafts-tab--active" : ""}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="drafts-toolbar">
        <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((c) => !c)}>
          <LuSlidersHorizontal /><span>Add Filter</span>
        </button>
        <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={() => { loadDrafts(); toast.success("Draft listings refreshed."); }}>
          <LuRefreshCcw /><span>Refresh</span>
        </button>
      </div>

      {error ? (
        <div className="orders-inline-note" style={{ color: "#991b1b", background: "#fee2e2" }}>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="drafts-selection-row">
        <div className="drafts-selection-row__left">
          <label className="orders-select-all drafts-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            <span>{selectedIds.length} Results Selected</span>
          </label>
          <div className={`drafts-bulk-actions ${selectedIds.length ? "" : "drafts-bulk-actions--disabled"}`}>
            <button type="button" onClick={() => runBulkAction("edit")}><LuPencil /><span>Bulk Edit</span></button>
            <button type="button" onClick={() => runBulkAction("remove")}><LuTrash2 /><span>Remove from list</span></button>
            <button type="button" onClick={() => runBulkAction("import")}><LuPlus /><span>Publish All</span></button>
            <button type="button" onClick={() => runBulkAction("rewrite")}><LuSparkles /><span>Bulk AI Rewrite</span></button>
            <button type="button" onClick={() => runBulkAction("schedule")}><LuClock3 /><span>Schedule Listings</span></button>
          </div>
        </div>
        <div className="drafts-selection-row__right">
          <button type="button" onClick={() => toast.info("History panel ready.")}>View History</button>
          <span aria-hidden="true" />
          <button type="button" onClick={toggleExpandAll}>{allExpanded ? "Collapse all" : "Expand all"}</button>
        </div>
      </div>

      <div className="drafts-list card-wrapper">
        {loading ? (
          <div className="drafts-empty">
            <LuLoader style={{ animation: "spin 1s linear infinite" }} />
            <span>Loading drafts…</span>
          </div>
        ) : visibleDrafts.length ? (
          visibleDrafts.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isExpanded = expandedIds.includes(item.id);
            const isRetrying = retryingIds.includes(item.id);
            const form = getEditForm(item);
            const hasError = item.import_status === "failed";
            const imageUrl = getListingImageUrl(item);

            return (
              <div className="drafts-entry" key={item.id}>
                <article className={`drafts-row ${index === 0 ? "drafts-row--featured" : ""} ${isSelected ? "drafts-row--selected" : ""} ${isExpanded ? "drafts-row--expanded" : ""}`}>
                  <label className="drafts-row__check">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(item.id)} aria-label={`Select ${item.title}`} />
                  </label>

                  <button
                    type="button"
                    className={`drafts-row__expand ${isExpanded ? "drafts-row__expand--open" : ""}`}
                    onClick={() => toggleExpanded(item.id)}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <LuChevronRight />
                  </button>

                  <div className="drafts-row__thumb">
                    {imageUrl ? <img src={imageUrl} alt={item.title} referrerPolicy="no-referrer" /> : <div style={{ width: 48, height: 48, background: "#f0f0f0", borderRadius: 6 }} />}
                  </div>

                  <div className="drafts-row__body">
                    <h3>
                      {hasError ? <span className="drafts-row__error">!</span> : null}
                      <span>{item.title}</span>
                    </h3>
                    <div className="drafts-row__meta">
                      <span>Status: {item.import_status ?? item.status}</span>
                      <i aria-hidden="true" />
                      <span>Buy: ${Number(item.buy_price ?? 0).toFixed(2)}</span>
                      <i aria-hidden="true" />
                      <span>Profit: ${Number(item.profit ?? 0).toFixed(2)}</span>
                      <i aria-hidden="true" />
                      <span>Price: ${Number(item.price ?? 0).toFixed(2)}</span>
                      {item.source_product_id ? (
                        <>
                          <i aria-hidden="true" />
                          <span>AE: {item.source_product_id}</span>
                        </>
                      ) : null}
                    </div>
                    {item.import_error ? (
                      <div className="drafts-row__meta" style={{ color: "#991b1b" }}>{item.import_error}</div>
                    ) : null}
                  </div>

                  <div className="drafts-row__actions">
                    {item.source_url ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="orders-row-actions__icon" aria-label="View source">
                        <LuExternalLink />
                      </a>
                    ) : null}
                    <button type="button" className="drafts-retry-btn" onClick={() => publishDraft(item.id)}>
                      <LuCheck /><span>Publish</span>
                    </button>
                    <div className="drafts-row__menu-wrap">
                      <button type="button" className="orders-row-actions__icon" aria-label="Open draft menu" onClick={() => setOpenMenuId((c) => c === item.id ? "" : item.id)}>
                        <LuEllipsisVertical />
                      </button>
                      {openMenuId === item.id ? (
                        <div className="drafts-row__menu">
                          <button type="button" onClick={() => handleDraftMenu(item.id, "schedule")}><LuClock3 /><span>Schedule Listing</span></button>
                          <button type="button" onClick={() => handleDraftMenu(item.id, "delete")}><LuTrash2 /><span>Delete Draft</span></button>
                        </div>
                      ) : null}
                    </div>
                    <button type="button" className={`drafts-retry-btn ${isRetrying ? "drafts-retry-btn--active" : ""}`} onClick={() => retryDraft(item.id)}>
                      <LuRefreshCcw /><span>{isRetrying ? "Queued" : "Retry"}</span>
                    </button>
                  </div>
                </article>

                {isExpanded ? (
                  <div className="draft-editor">
                    <div className="draft-editor__shell">
                      <div className="draft-editor__main">
                        <div className="draft-editor__header">
                          <div className="draft-editor__heading">
                            {imageUrl ? <img src={imageUrl} alt={item.title} referrerPolicy="no-referrer" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} /> : null}
                            <div>
                              <h4>{item.title}</h4>
                              <div className="drafts-row__meta">
                                <span>Warehouse: {item.warehouse_country ?? "CN"}</span>
                                <i aria-hidden="true" />
                                <span>Source: {item.source_platform ?? "aliexpress"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="draft-editor__actions">
                            <button type="button" className="draft-editor__save" onClick={() => saveDraft(item)}><LuCheck /><span>Save</span></button>
                            <button type="button" className="draft-editor__retry" onClick={() => { saveDraft(item).then(() => retryDraft(item.id)); }}><LuRefreshCcw /><span>Save & Retry</span></button>
                          </div>
                        </div>
                        <div className="draft-editor__panel" style={{ padding: "20px 24px" }}>
                          <div className="draft-editor__grid">
                            <label><span>Title</span><input type="text" className="marketplace-settings__control" value={form.title} onChange={(e) => setEditField(item.id, "title", e.target.value, item)} /></label>
                            <label><span>Price</span><input type="number" className="marketplace-settings__control" value={form.price} onChange={(e) => setEditField(item.id, "price", e.target.value, item)} /></label>
                          </div>
                          <div className="draft-editor__grid">
                            <label><span>Quantity</span><input type="number" className="marketplace-settings__control" value={form.quantity} onChange={(e) => setEditField(item.id, "quantity", e.target.value, item)} /></label>
                            <label><span>Condition</span><input type="text" className="marketplace-settings__control" defaultValue={item.condition ?? "New"} readOnly /></label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="drafts-empty">
            <LuInbox /><span>{emptyMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default DraftsContent;
