import { useEffect, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { toast } from "../../../utils/toast";
import {
  LuCheck,
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
  LuTrash2,
} from "react-icons/lu";
import DraftEditorPanel from "../DraftEditorPanel";
import UploadHistoryPanel from "../UploadHistoryPanel";
import PageFilterPanel from "../PageFilterPanel";
import ScheduleListingModal from "../ScheduleListingModal";
import BulkEditDraftsModal, { applyBulkEditToForm } from "../BulkEditDraftsModal";
import { FilterSelect } from "../FilterField";
import {
  selectEbayConnected,
  selectEbayConnections,
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
  scheduleProducts,
} from "../../../services/ProductService";
import { formatDisplayDateTime, getListingImageUrl } from "../helpers";
import {
  buildDraftFormState,
  serializeDraftFormForApi,
} from "../../../utils/draftEditorState";

function DraftsContent({ searchQuery }) {
  const dispatch = useDispatch();
  const store = useStore();
  const connected = useSelector(selectEbayConnected);
  const connections = useSelector(selectEbayConnections);
  const drafts = useSelector(selectEbayDrafts);
  const meta = useSelector(selectEbayDraftsMeta);
  const loading = useSelector(selectEbayDraftsLoading);
  const error = useSelector(selectEbayDraftsError);

  const [activeTab, setActiveTab] = useState("drafts");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [editorTabs, setEditorTabs] = useState({});
  const [retryingIds, setRetryingIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState("");
  const [editForms, setEditForms] = useState({});
  const [historyVisible, setHistoryVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [scheduleTargets, setScheduleTargets] = useState([]);
  const [scheduling, setScheduling] = useState(false);
  const [bulkEditTargets, setBulkEditTargets] = useState([]);
  const [bulkEditing, setBulkEditing] = useState(false);

  const loadDrafts = () => {
    const params = { q: searchQuery };
    if (activeTab === "scheduled") params.tab = "scheduled";
    if (activeTab === "failed") params.tab = "failed";
    if (filterStatus) params.import_status = filterStatus;
    if (filterStore) params.connection_id = filterStore;
    return dispatch(fetchEbayDrafts(params));
  };

  const clearDraftFilters = () => {
    setFilterStatus("");
    setFilterSource("");
    setFilterStore("");
  };

  const hasDraftFilters = Boolean(filterStatus || filterSource || filterStore);

  useEffect(() => {
    if (connected) {
      loadDrafts();
    }
  }, [dispatch, connected, searchQuery, activeTab, filterStatus, filterStore]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId("");
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const visibleDrafts = drafts.filter((item) => {
    if (filterSource && item.source_platform !== filterSource) {
      return false;
    }
    return true;
  });
  const scheduledCount = activeTab === "scheduled" ? (meta?.total ?? drafts.length) : 0;
  const failedCount = drafts.filter((d) => d.import_status === "failed").length;

  const allVisibleSelected =
    visibleDrafts.length > 0 && visibleDrafts.every((item) => selectedIds.includes(item.id));
  const allExpanded =
    visibleDrafts.length > 0 && visibleDrafts.every((item) => expandedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((cur) => cur.filter((id) => !visibleDrafts.some((item) => item.id === id)));
      return;
    }
    setSelectedIds((cur) => [...new Set([...cur, ...visibleDrafts.map((item) => item.id)])]);
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const toggleExpanded = (id) => {
    const item = visibleDrafts.find((draft) => draft.id === id);
    setExpandedIds((cur) => {
      const opening = !cur.includes(id);
      const next = opening ? [...cur, id] : cur.filter((x) => x !== id);
      if (opening) {
        const latest = visibleDrafts.find((draft) => draft.id === id) ?? item;
        setEditForms((forms) => ({
          ...forms,
          [id]: forms[id] ?? buildDraftFormState(latest),
        }));
        if (!editorTabs[id]) {
          setEditorTabs((tabs) => ({ ...tabs, [id]: "general" }));
        }
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds([]);
      return;
    }
    const ids = visibleDrafts.map((item) => item.id);
    setExpandedIds(ids);
    setEditForms((forms) => {
      const next = { ...forms };
      visibleDrafts.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = buildDraftFormState(item);
        }
      });
      return next;
    });
    setEditorTabs((tabs) => {
      const next = { ...tabs };
      ids.forEach((id) => {
        if (!next[id]) next[id] = "general";
      });
      return next;
    });
  };

  const getEditForm = (item) => editForms[item.id] ?? buildDraftFormState(item);

  const setEditForm = (id, item, nextForm) => {
    setEditForms((cur) => ({
      ...cur,
      [id]: typeof nextForm === "function" ? nextForm(getEditForm(item)) : nextForm,
    }));
  };

  const saveDraft = async (item) => {
    const form = getEditForm(item);
    try {
      const res = await updateProduct(item.id, serializeDraftFormForApi(form));
      const savedListing = res.data?.listing;

      await loadDrafts();

      const sourceListing =
        savedListing ??
        store.getState().ebay.drafts.data.find((draft) => draft.id === item.id);

      if (sourceListing) {
        setEditForms((cur) => ({
          ...cur,
          [item.id]: buildDraftFormState(sourceListing),
        }));
      }

      toast.success("Draft saved.");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to save draft.");
      return false;
    }
  };

  const saveDraftIfDirty = async (item) => {
    if (!editForms[item.id]) {
      return true;
    }

    return saveDraft(item);
  };

  const runBulkAction = async (action) => {
    if (!selectedIds.length) {
      toast.warn("Select at least one draft.");
      return;
    }

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
          const item = drafts.find((draft) => draft.id === id);
          if (item) {
            await saveDraftIfDirty(item);
          }
          await publishProduct(id);
        } catch {
          // continue
        }
      }
      toast.success("Publish queued for selected drafts.");
      loadDrafts();
      return;
    }

    if (action === "schedule") {
      await openScheduleModal(selectedIds);
      return;
    }

    if (action === "edit") {
      const items = visibleDrafts.filter((draft) => selectedIds.includes(draft.id));
      if (!items.length) {
        toast.warn("Select at least one draft to edit.");
        return;
      }
      setBulkEditTargets(items);
      return;
    }

    toast.info("Action applied.");
  };

  const confirmBulkEdit = async (changes) => {
    if (!bulkEditTargets.length) {
      return;
    }

    setBulkEditing(true);
    let updated = 0;
    let failed = 0;

    for (const item of bulkEditTargets) {
      try {
        const baseForm = editForms[item.id] ?? buildDraftFormState(item);
        const nextForm = applyBulkEditToForm(baseForm, changes);
        await updateProduct(item.id, serializeDraftFormForApi(nextForm));
        setEditForms((cur) => ({
          ...cur,
          [item.id]: nextForm,
        }));
        updated += 1;
      } catch {
        failed += 1;
      }
    }

    setBulkEditing(false);
    setBulkEditTargets([]);
    await loadDrafts();

    if (updated) {
      toast.success(`Bulk edit applied to ${updated} draft${updated === 1 ? "" : "s"}.`);
    }
    if (failed) {
      toast.error(`${failed} draft${failed === 1 ? "" : "s"} could not be updated.`);
    }
  };

  const openScheduleModal = async (ids) => {
    const items = visibleDrafts.filter((draft) => ids.includes(draft.id));
    if (!items.length) {
      toast.warn("Select at least one draft to schedule.");
      return;
    }

    for (const item of items) {
      await saveDraftIfDirty(item);
    }

    setScheduleTargets(items);
  };

  const confirmSchedule = async (scheduledAt) => {
    if (!scheduleTargets.length) {
      return;
    }

    setScheduling(true);
    try {
      const res = await scheduleProducts({
        ids: scheduleTargets.map((draft) => draft.id),
        scheduled_at: scheduledAt,
      });
      toast.success(res.data?.message ?? "Listing(s) scheduled.");
      setScheduleTargets([]);
      loadDrafts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to schedule listing(s).");
    } finally {
      setScheduling(false);
    }
  };

  const clearSchedule = async () => {
    if (!scheduleTargets.length) {
      return;
    }

    setScheduling(true);
    try {
      const res = await scheduleProducts({
        ids: scheduleTargets.map((draft) => draft.id),
        scheduled_at: null,
      });
      toast.success(res.data?.message ?? "Schedule removed.");
      setScheduleTargets([]);
      loadDrafts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to remove schedule.");
    } finally {
      setScheduling(false);
    }
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

  const publishDraft = async (item) => {
    try {
      const saved = await saveDraftIfDirty(item);
      if (!saved) return;

      await publishProduct(item.id);
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
    if (action === "schedule") {
      await openScheduleModal([id]);
    }
    setOpenMenuId("");
  };

  if (!connected) {
    return (
      <section className="drafts-page-content">
        <div className="drafts-not-connected card-wrapper" style={{ padding: 40, textAlign: "center" }}>
          <LuLink size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
          <h3>No eBay account connected</h3>
          <p>
            Go to <strong>Settings → Store Settings</strong> to connect your eBay seller account.
          </p>
        </div>
      </section>
    );
  }

  const emptyMessage =
    activeTab === "scheduled"
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
          <button
            key={key}
            type="button"
            className={`drafts-tab ${activeTab === key ? "drafts-tab--active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
            {key === "scheduled" ? <span className="drafts-help">?</span> : null}
          </button>
        ))}
      </nav>

      <div className="drafts-toolbar">
        <button
          type="button"
          className={`orders-filter-toggle ${showFilters ? "orders-filter-toggle--active" : ""}`}
          onClick={() => setShowFilters((c) => !c)}
        >
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>
        <button
          type="button"
          className="dashboard-secondary-btn dashboard-secondary-btn--orders"
          onClick={() => {
            loadDrafts();
            toast.success("Draft listings refreshed.");
          }}
        >
          <LuRefreshCcw />
          <span>Refresh</span>
        </button>
      </div>

      {showFilters ? (
        <PageFilterPanel layout="drafts" onClear={hasDraftFilters ? clearDraftFilters : undefined}>
          <FilterSelect label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="ready">Ready</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </FilterSelect>
          <FilterSelect label="Source" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="">All suppliers</option>
            <option value="aliexpress">AliExpress</option>
            <option value="amazon">Amazon</option>
            <option value="walmart">Walmart</option>
            <option value="etsy">Etsy</option>
            <option value="ebay">eBay</option>
          </FilterSelect>
          <FilterSelect label="Store" value={filterStore} onChange={(e) => setFilterStore(e.target.value)}>
            <option value="">All stores</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.ebay_username ?? `Store #${conn.id}`}
              </option>
            ))}
          </FilterSelect>
        </PageFilterPanel>
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
            <button type="button" onClick={() => runBulkAction("edit")}>
              <LuPencil />
              <span>Bulk Edit</span>
            </button>
            <button type="button" onClick={() => runBulkAction("remove")}>
              <LuTrash2 />
              <span>Remove from list</span>
            </button>
            <button type="button" onClick={() => runBulkAction("import")}>
              <LuPlus />
              <span>Publish All</span>
            </button>
            <button type="button" onClick={() => runBulkAction("schedule")}>
              <LuClock3 />
              <span>Schedule Listings</span>
            </button>
          </div>
        </div>
        <div className="drafts-selection-row__right">
          <button
            type="button"
            className={historyVisible ? "drafts-history-btn drafts-history-btn--active" : "drafts-history-btn"}
            onClick={() => setHistoryVisible((current) => !current)}
          >
            View History
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={toggleExpandAll}>
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      <UploadHistoryPanel visible={historyVisible} onClose={() => setHistoryVisible(false)} />

      <div className="drafts-list card-wrapper">
        {loading ? (
          <div className="drafts-empty">
            <LuLoader className="spin-icon" />
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
            const statusLabel = hasError ? "Failed" : item.status === "draft" ? "Draft" : item.status ?? "Draft";

            return (
              <div className="drafts-entry" key={item.id}>
                <article
                  className={`drafts-row ${index === 0 ? "drafts-row--featured" : ""} ${isSelected ? "drafts-row--selected" : ""} ${isExpanded ? "drafts-row--expanded" : ""}`}
                >
                  <label className="drafts-row__check">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(item.id)}
                      aria-label={`Select ${item.title}`}
                    />
                  </label>

                  <button
                    type="button"
                    className={`drafts-row__expand ${isExpanded ? "drafts-row__expand--open" : ""}`}
                    onClick={() => toggleExpanded(item.id)}
                    aria-label={isExpanded ? "Collapse draft" : "Expand draft"}
                    aria-expanded={isExpanded}
                  >
                    <LuChevronRight />
                  </button>

                  <div className="drafts-row__thumb">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.title} referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{ width: 46, height: 46, background: "#f0f0f0" }} />
                    )}
                  </div>

                  <div className="drafts-row__body">
                    <h3>
                      {hasError ? <span className="drafts-row__error">!</span> : null}
                      <span>{item.title}</span>
                    </h3>
                    <div className="drafts-row__meta">
                      {item.source_product_id ? <span>Buy Item Id: {item.source_product_id}</span> : null}
                      {item.source_product_id ? <i aria-hidden="true" /> : null}
                      <span>Profit: ${Number(item.profit ?? 0).toFixed(2)}</span>
                      <i aria-hidden="true" />
                      <span>Price: ${Number(item.price ?? 0).toFixed(2)}</span>
                      <i aria-hidden="true" />
                      <span>Status: {statusLabel}</span>
                      {item.scheduled_at ? (
                        <>
                          <i aria-hidden="true" />
                          <span className="drafts-row__scheduled">
                            Scheduled: {formatDisplayDateTime(item.scheduled_at)}
                          </span>
                        </>
                      ) : null}
                    </div>
                    {hasError || item.import_error ? (
                      <div className="drafts-row__details">
                        <strong>!</strong>
                        <span>
                          {item.import_error ??
                            "This draft could not be imported. Open the editor below and click Save & Retry."}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="drafts-row__actions">
                    {item.source_url ? (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="orders-row-actions__icon"
                        aria-label="View source product"
                      >
                        <LuExternalLink />
                      </a>
                    ) : null}
                    <button type="button" className="drafts-retry-btn" onClick={() => publishDraft(item)}>
                      <LuCheck />
                      <span>Publish to Store</span>
                    </button>
                    <div className="drafts-row__menu-wrap" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="orders-row-actions__icon"
                        aria-label="Open draft menu"
                        onClick={() => setOpenMenuId((c) => (c === item.id ? "" : item.id))}
                      >
                        <LuEllipsisVertical />
                      </button>
                      {openMenuId === item.id ? (
                        <div className="drafts-row__menu">
                          <button type="button" onClick={() => handleDraftMenu(item.id, "schedule")}>
                            <LuClock3 />
                            <span>Schedule Listing</span>
                          </button>
                          <button type="button" onClick={() => handleDraftMenu(item.id, "delete")}>
                            <LuTrash2 />
                            <span>Delete Draft</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={`drafts-retry-btn ${isRetrying ? "drafts-retry-btn--active" : ""}`}
                      onClick={() => retryDraft(item.id)}
                    >
                      <LuRefreshCcw />
                      <span>{isRetrying ? "Queued" : "Retry"}</span>
                    </button>
                  </div>
                </article>

                {isExpanded ? (
                  <DraftEditorPanel
                    item={item}
                    form={form}
                    activeTab={editorTabs[item.id] ?? "general"}
                    onTabChange={(tabId) => setEditorTabs((cur) => ({ ...cur, [item.id]: tabId }))}
                    onChange={(nextForm) => setEditForm(item.id, item, nextForm)}
                    onSave={() => saveDraft(item)}
                    onSaveAndRetry={() => saveDraft(item).then((saved) => saved && retryDraft(item.id))}
                    onPublish={() => publishDraft(item)}
                  />
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="drafts-empty">
            <LuInbox />
            <span>{emptyMessage}</span>
          </div>
        )}
      </div>

      <ScheduleListingModal
        open={scheduleTargets.length > 0}
        drafts={scheduleTargets}
        saving={scheduling}
        onClose={() => setScheduleTargets([])}
        onSchedule={confirmSchedule}
        onClearSchedule={clearSchedule}
      />

      <BulkEditDraftsModal
        open={bulkEditTargets.length > 0}
        drafts={bulkEditTargets}
        saving={bulkEditing}
        onClose={() => setBulkEditTargets([])}
        onApply={confirmBulkEdit}
      />
    </section>
  );
}

export default DraftsContent;
