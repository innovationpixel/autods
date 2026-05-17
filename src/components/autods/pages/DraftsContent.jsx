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
  LuPlay,
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
} from "../../../store/selectors/EbaySelectors";
import { fetchEbayDrafts } from "../../../store/actions/EbayActions";

function DraftsContent({ searchQuery }) {
  const dispatch = useDispatch();
  const connected = useSelector(selectEbayConnected);
  const drafts    = useSelector(selectEbayDrafts);
  const loading   = useSelector(selectEbayDraftsLoading);
  const error     = useSelector(selectEbayDraftsError);

  const [activeTab, setActiveTab]         = useState("drafts");
  const [showFilters, setShowFilters]     = useState(false);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [expandedIds, setExpandedIds]     = useState([]);
  const [retryingIds, setRetryingIds]     = useState([]);
  const [openMenuId, setOpenMenuId]       = useState("");

  useEffect(() => {
    if (connected) {
      dispatch(fetchEbayDrafts({ q: searchQuery }));
    }
  }, [dispatch, connected, searchQuery]);

  const visibleDrafts = activeTab !== "drafts" ? [] : drafts;

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

  const runBulkAction = (action) => {
    if (!selectedIds.length) { toast.warn("Select at least one draft."); return; }
    const labels = {
      edit: "Bulk edit opened",
      import: "Import all started",
      rewrite: "Bulk AI rewrite queued",
      schedule: "Schedule listings opened",
      remove: `${selectedIds.length} draft${selectedIds.length === 1 ? "" : "s"} removed.`,
    };
    toast.info(labels[action] ?? "Action applied.");
    if (action === "remove") setSelectedIds([]);
  };

  const retryDraft = (id) => {
    setRetryingIds((cur) => [...new Set([...cur, id])]);
    toast.info("Draft retry queued.");
  };

  const handleDraftMenu = (id, action) => {
    if (action === "schedule") toast.info("Schedule Listing panel opened.");
    if (action === "delete") toast.info("Draft deleted from the upload list.");
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

  const emptyMessage = activeTab === "scheduled" ? "No scheduled uploads yet." : activeTab === "recurring" ? "No recurring uploads yet." : "No draft listings found on your eBay account.";

  return (
    <section className="drafts-page-content">
      <nav className="drafts-tabs" aria-label="Upload sections">
        {[
          ["drafts", `Drafts (${drafts.length})`],
          ["scheduled", "Scheduled (0)"],
          ["recurring", "Recurring (0)"],
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
        <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={() => { dispatch(fetchEbayDrafts()); toast.success("Draft listings refreshed from eBay."); }}>
          <LuRefreshCcw /><span>Refresh</span>
        </button>
        <button type="button" className="dashboard-secondary-btn dashboard-secondary-btn--orders" onClick={() => setShowTutorialNote((c) => !c)}>
          <LuPlay /><span>Watch Tutorial</span>
        </button>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Drafts are eBay listings that haven't been published yet. Review, edit and retry failed uploads.</span>
        </div>
      ) : null}

      {showFilters ? (
        <div className="drafts-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Status</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="Draft"><option>Draft</option><option>Failed</option><option>Ready</option></select>
              <LuChevronDown />
            </div>
          </label>
        </div>
      ) : null}

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
            <button type="button" onClick={() => runBulkAction("import")}><LuPlus /><span>Import All</span></button>
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
            <span>Loading drafts from eBay…</span>
          </div>
        ) : visibleDrafts.length ? (
          visibleDrafts.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isExpanded = expandedIds.includes(item.id);
            const isRetrying = retryingIds.includes(item.id);

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
                    {item.image_url ? <img src={item.image_url} alt={item.title} /> : <div style={{ width: 48, height: 48, background: "#f0f0f0", borderRadius: 6 }} />}
                  </div>

                  <div className="drafts-row__body">
                    <h3>
                      <span className="drafts-row__error">!</span>
                      <span>{item.title}</span>
                    </h3>
                    <div className="drafts-row__meta">
                      <span>Status:</span>
                      <span>{item.status}</span>
                      <i aria-hidden="true" />
                      <span>SKU: {item.sku ?? "—"}</span>
                      <i aria-hidden="true" />
                      <span>Price: ${Number(item.price ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="drafts-row__actions">
                    {item.listing_url ? (
                      <a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="orders-row-actions__icon" aria-label="View on eBay">
                        <LuExternalLink />
                      </a>
                    ) : (
                      <button type="button" className="orders-row-actions__icon" aria-label="No link"><LuExternalLink /></button>
                    )}
                    <div className="drafts-row__menu-wrap">
                      <button type="button" className="orders-row-actions__icon" aria-label="Open draft menu" onClick={() => setOpenMenuId((c) => c === item.id ? "" : item.id)}>
                        <LuEllipsisVertical />
                      </button>
                      {openMenuId === item.id ? (
                        <div className="drafts-row__menu">
                          <button type="button" onClick={() => handleDraftMenu(item.id, "schedule")}><LuClock3 /><span>Schedule Listing</span></button>
                          <button type="button" onClick={() => handleDraftMenu(item.id, "delete")}><LuTrash2 /><span>Delete Draft</span></button>
                          <button type="button" onClick={() => handleDraftMenu(item.id, "viral")}><LuSparkles /><span>Go Viral with TikTok Ads</span></button>
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
                            {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} /> : null}
                            <div>
                              <h4>{item.title}</h4>
                              <div className="drafts-row__meta">
                                <span>SKU: {item.sku ?? "—"}</span>
                                <i aria-hidden="true" />
                                <span>Category: {item.category_name ?? "—"}</span>
                                <i aria-hidden="true" />
                                <span>Price: ${Number(item.price ?? 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="draft-editor__actions">
                            <button type="button" className="draft-editor__save"><LuCheck /><span>Save</span></button>
                            <button type="button" className="draft-editor__retry"><LuRefreshCcw /><span>Save & Retry</span></button>
                          </div>
                        </div>
                        <div className="draft-editor__panel" style={{ padding: "20px 24px" }}>
                          <div className="draft-editor__grid">
                            <label><span>Title</span><input type="text" className="marketplace-settings__control" defaultValue={item.title} /></label>
                            <label><span>Price</span><input type="number" className="marketplace-settings__control" defaultValue={item.price} /></label>
                          </div>
                          <div className="draft-editor__grid">
                            <label><span>Quantity</span><input type="number" className="marketplace-settings__control" defaultValue={item.quantity} /></label>
                            <label><span>Condition</span><input type="text" className="marketplace-settings__control" defaultValue={item.condition ?? "New"} /></label>
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
