import { useEffect, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "../../../utils/toast";
import {
  LuCircleAlert,
  LuArrowLeft,
  LuCheck,
  LuChevronRight,
  LuClock3,
  LuEllipsisVertical,
  LuExternalLink,
  LuEye,
  LuInbox,
  LuLink,
  LuLoader,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuTrash2,
  LuUpload,
  LuX,
} from "react-icons/lu";
import DraftEditorPanel from "../DraftEditorPanel";
import UploadHistoryPanel from "../UploadHistoryPanel";
import PageFilterPanel from "../PageFilterPanel";
import ScheduleListingModal from "../ScheduleListingModal";
import BulkEditDraftsModal, { applyBulkEditToForm } from "../BulkEditDraftsModal";
import ConfirmModal from "../ConfirmModal";
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
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  scheduleProducts,
  getImportHistory,
} from "../../../services/ProductService";
import { formatDisplayDateTime, getListingImageUrl } from "../helpers";
import {
  buildDraftFormState,
  serializeDraftFormForApi,
} from "../../../utils/draftEditorState";
import ShipFromSetupNotice from "../ShipFromSetupNotice";
import { getAccountSettings } from "../../../services/SettingsService";
import { getApiErrorMessage } from "../../../utils/apiErrors";
import {
  getShipFromStatus,
  SHIP_FROM_CLIENT_MESSAGE,
  SHIP_FROM_SETTINGS_PATH,
} from "../../../utils/ebayShipFrom";

function buildScheduleBatchAlert(batch) {
  const total = Number(batch.total ?? 0);
  const completed = Number(batch.completed ?? 0);
  const failed = Number(batch.failed ?? 0);
  const isActive = batch.status === "pending" || batch.status === "processing";
  const productLabel = `${total} product${total === 1 ? "" : "s"}`;

  const message =
    batch.status === "pending"
      ? `Scheduling ${productLabel} — waiting for scheduled time`
      : isActive
        ? `Processing ${productLabel} — ${completed} completed, ${failed} failed`
        : `Scheduled batch finished — ${completed} completed, ${failed} failed`;

  return {
    id: `schedule-batch-${batch.id}`,
    batchId: batch.id,
    tone: !isActive && failed > 0 ? "danger" : "warning",
    message,
    isActive,
  };
}

function DraftsContent({
  searchQuery,
  importBatchProgress: propBatchProgress,
  onDismissImportBatch: propDismissBatch,
}) {
  const dispatch = useDispatch();
  const store = useStore();
  const navigate = useNavigate();
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [accountSettings, setAccountSettings] = useState(null);
  const [publishingIds, setPublishingIds] = useState([]);
  const [scheduleBatches, setScheduleBatches] = useState([]);
  const [dismissedScheduleBatchIds, setDismissedScheduleBatchIds] = useState([]);

  const [activeImportBatch, setActiveImportBatch] = useState(() => {
    if (propBatchProgress) return propBatchProgress;
    try {
      const saved = localStorage.getItem("autods_active_import_batch");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showFailuresModal, setShowFailuresModal] = useState(false);

  useEffect(() => {
    if (propBatchProgress) {
      setActiveImportBatch(propBatchProgress);
    }
  }, [propBatchProgress]);

  useEffect(() => {
    const handleBatchUpdate = (event) => {
      if (event.detail) {
        setActiveImportBatch(event.detail);
      }
    };
    const handleBatchDismiss = () => {
      setActiveImportBatch(null);
    };
    const handleRefreshDrafts = () => {
      loadDrafts();
    };

    window.addEventListener("autods_import_batch_update", handleBatchUpdate);
    window.addEventListener("autods_import_batch_dismiss", handleBatchDismiss);
    window.addEventListener("autods_refresh_drafts", handleRefreshDrafts);

    return () => {
      window.removeEventListener("autods_import_batch_update", handleBatchUpdate);
      window.removeEventListener("autods_import_batch_dismiss", handleBatchDismiss);
      window.removeEventListener("autods_refresh_drafts", handleRefreshDrafts);
    };
  }, []);

  const handleDismissActiveBatch = () => {
    setActiveImportBatch(null);
    try {
      localStorage.removeItem("autods_active_import_batch");
    } catch {}
    if (typeof propDismissBatch === "function") {
      propDismissBatch();
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const editParam = searchParams.get("edit");
  const [editingDraftId, setEditingDraftId] = useState(editParam || null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    const p = searchParams.get("edit");
    setEditingDraftId(p || null);
  }, [searchParams]);

  const handleOpenEditPage = (item) => {
    setEditingDraftId(String(item.id));
    setSearchParams({ edit: String(item.id) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDrafts = () => {
    setEditingDraftId(null);
    setSearchParams({});
  };

  const handleSaveSingle = async (item) => {
    setIsSavingDraft(true);
    try {
      await saveDraft(item);
      toast.success("Draft saved successfully.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save draft."));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublishSingle = async (item) => {
    if (!(await ensureShipFromReady())) return;
    setPublishingIds((cur) => [...cur, item.id]);
    try {
      await saveDraftIfDirty(item);
      await publishProduct(item.id);
      toast.success("Draft published successfully.");
      await loadDrafts();
      handleBackToDrafts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not publish draft."));
    } finally {
      setPublishingIds((cur) => cur.filter((x) => x !== item.id));
    }
  };

  const ensureShipFromReady = async () => {
    let settings = accountSettings;
    if (!settings) {
      try {
        const res = await getAccountSettings();
        settings = res.data?.settings ?? {};
        setAccountSettings(settings);
      } catch {
        toast.error("Could not load your settings. Try again.");
        return false;
      }
    }

    const { complete } = getShipFromStatus(settings);
    if (!complete) {
      toast.error(SHIP_FROM_CLIENT_MESSAGE);
      navigate(SHIP_FROM_SETTINGS_PATH);
      return false;
    }

    return true;
  };

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

  const loadScheduleBatches = () =>
    getImportHistory({ limit: 10 })
      .then((res) => {
        const batches = (res.data?.batches ?? []).filter(
          (batch) => batch.action === "schedule" && Number(batch.total ?? 0) > 0,
        );
        setScheduleBatches(batches);
      })
      .catch(() => {});

  useEffect(() => {
    if (connected) {
      loadDrafts();
      getAccountSettings()
        .then((res) => setAccountSettings(res.data?.settings ?? {}))
        .catch(() => {});
    }
  }, [dispatch, connected, searchQuery, activeTab, filterStatus, filterStore]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId("");
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    if (connected) {
      loadScheduleBatches();
    }
  }, [connected]);

  const hasActiveScheduleBatches = scheduleBatches.some(
    (batch) => batch.status === "pending" || batch.status === "processing",
  );

  useEffect(() => {
    if (!connected || !hasActiveScheduleBatches) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadScheduleBatches();
    }, 2000);

    return () => clearInterval(interval);
  }, [connected, hasActiveScheduleBatches]);

  const scheduleAlerts = scheduleBatches
    .filter((batch) => !dismissedScheduleBatchIds.includes(batch.id))
    .map(buildScheduleBatchAlert);

  const dismissScheduleAlert = (batchId) => {
    setDismissedScheduleBatchIds((current) => [...new Set([...current, batchId])]);
  };

  const viewScheduleDetails = () => {
    setHistoryVisible(true);
  };

  const visibleDrafts = drafts.filter((item) => {
    if (filterSource && item.source_platform !== filterSource) {
      return false;
    }
    return true;
  });
  const draftsCount = meta?.counts?.drafts ?? (activeTab === "drafts" ? (meta?.total ?? drafts.length) : 0);
  const scheduledCount = meta?.counts?.scheduled ?? (activeTab === "scheduled" ? (meta?.total ?? drafts.length) : 0);
  const failedCount = meta?.counts?.failed ?? (activeTab === "failed" ? (meta?.total ?? drafts.length) : 0);

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

      toast.success(res.data?.message ?? "Draft saved.");
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save draft."));
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
      setDeleteConfirm({ type: "bulk", ids: selectedIds });
      return;
    }

    if (action === "import") {
      if (!(await ensureShipFromReady())) return;

      let succeeded = 0;
      let failed = 0;

      for (const id of selectedIds) {
        setPublishingIds((cur) => [...cur, id]);
        try {
          const item = drafts.find((draft) => draft.id === id);
          if (item) {
            await saveDraftIfDirty(item);
          }
          await publishProduct(id);
          succeeded += 1;
        } catch {
          failed += 1;
        } finally {
          setPublishingIds((cur) => cur.filter((x) => x !== id));
        }
      }

      if (succeeded) {
        toast.success(`${succeeded} draft${succeeded === 1 ? "" : "s"} published.`);
      }
      if (failed) {
        toast.error(`${failed} draft${failed === 1 ? "" : "s"} could not be published.`);
      }
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
      loadScheduleBatches();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to schedule listing(s).");
    } finally {
      setScheduling(false);
    }
  };

  const confirmScheduleRandom = async (schedules) => {
    if (!schedules.length) {
      return;
    }

    setScheduling(true);
    try {
      const res = await scheduleProducts({ schedules });
      toast.success(res.data?.message ?? "Listings scheduled at staggered times.");
      setScheduleTargets([]);
      loadDrafts();
      loadScheduleBatches();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to schedule listings.");
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
      loadScheduleBatches();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to remove schedule.");
    } finally {
      setScheduling(false);
    }
  };

  const handleDraftMenu = async (id, action) => {
    if (action === "edit") {
      const item = drafts.find((d) => d.id === id);
      if (item) handleOpenEditPage(item);
    }
    if (action === "delete") {
      setDeleteConfirm({ type: "single", id });
    }
    if (action === "schedule") {
      await openScheduleModal([id]);
    }
    setOpenMenuId("");
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteConfirm.type === "bulk") {
        await bulkDeleteProducts(deleteConfirm.ids);
        toast.success(`${deleteConfirm.ids.length} draft(s) removed.`);
        setSelectedIds([]);
      } else {
        await deleteProduct(deleteConfirm.id);
        toast.success("Draft deleted.");
      }
      setDeleteConfirm(null);
      loadDrafts();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Delete failed.");
    } finally {
      setDeleting(false);
    }
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

  if (editingDraftId) {
    const editingItem = drafts.find((draft) => String(draft.id) === String(editingDraftId));

    if (loading && !editingItem) {
      return (
        <section className="drafts-page-content">
          <div className="draft-edit-view card-wrapper" style={{ minHeight: 320, display: "grid", placeItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#666", fontSize: 14 }}>
              <LuLoader className="spin-icon" />
              <span>Loading draft product details…</span>
            </div>
          </div>
        </section>
      );
    }

    if (!editingItem) {
      return (
        <section className="drafts-page-content">
          <div className="draft-edit-view card-wrapper" style={{ padding: "40px 24px", textAlign: "center" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#222" }}>Draft Not Found</h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
              The draft #{editingDraftId} could not be found. It may have been published or deleted.
            </p>
            <button
              type="button"
              className="draft-edit-view__back-btn"
              onClick={handleBackToDrafts}
              style={{ margin: "0 auto" }}
            >
              <LuArrowLeft />
              <span>Back to Drafts</span>
            </button>
          </div>
        </section>
      );
    }

    const form = getEditForm(editingItem);
    const hasError = editingItem.import_status === "failed";
    const statusLabel = hasError ? "Failed" : editingItem.status === "draft" ? "Draft" : editingItem.status ?? "Draft";
    const isPublishing = publishingIds.includes(editingItem.id);

    return (
      <section className="drafts-page-content">
        <div className="draft-edit-view card-wrapper">
          <div className="draft-edit-view__top-bar">
            <div className="draft-edit-view__top-left">
              <button
                type="button"
                className="draft-edit-view__back-btn"
                onClick={handleBackToDrafts}
              >
                <LuArrowLeft />
                <span>Back to Drafts</span>
              </button>

              <div className="draft-edit-view__breadcrumbs">
                <span
                  className="draft-edit-view__breadcrumb-link"
                  onClick={handleBackToDrafts}
                >
                  Drafts
                </span>
                <span className="draft-edit-view__breadcrumb-sep">/</span>
                <span className="draft-edit-view__breadcrumb-current">
                  Edit Product #{editingItem.id}
                </span>
              </div>

              <div className="draft-edit-view__badge-group">
                <span className={`drafts-row__status-badge ${hasError ? "drafts-row__status-badge--failed" : ""}`}>
                  {statusLabel}
                </span>
                {editingItem.source_platform ? (
                  <span className="draft-edit-view__platform-badge">
                    {editingItem.source_platform}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="draft-edit-view__top-actions">
              <button
                type="button"
                className="draft-edit-view__btn draft-edit-view__btn--cancel"
                onClick={handleBackToDrafts}
              >
                Cancel
              </button>
              <button
                type="button"
                className="draft-edit-view__btn draft-edit-view__btn--save"
                onClick={() => handleSaveSingle(editingItem)}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? <LuLoader className="spin-icon" /> : <LuCheck />}
                <span>Save</span>
              </button>
              <button
                type="button"
                className="draft-edit-view__btn draft-edit-view__btn--publish"
                onClick={() => handlePublishSingle(editingItem)}
                disabled={isPublishing}
              >
                {isPublishing ? <LuLoader className="spin-icon" /> : <LuUpload />}
                <span>Save & Publish</span>
              </button>
            </div>
          </div>

          <div className="draft-edit-view__body">
            <DraftEditorPanel
              item={editingItem}
              form={form}
              activeTab={editorTabs[editingItem.id] ?? "general"}
              onTabChange={(tabId) => setEditorTabs((cur) => ({ ...cur, [editingItem.id]: tabId }))}
              onChange={(nextForm) => setEditForm(editingItem.id, editingItem, nextForm)}
              onSave={() => handleSaveSingle(editingItem)}
            />
          </div>
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
      {activeImportBatch && Number(activeImportBatch.total) > 0 ? (
        <div
          className={`draft-import-banner ${
            activeImportBatch.status === "processing"
              ? "draft-import-banner--processing"
              : activeImportBatch.failed > 0
              ? "draft-import-banner--completed-with-errors"
              : "draft-import-banner--completed"
          }`}
          onClick={
            activeImportBatch.status !== "processing" && activeImportBatch.failed > 0
              ? () => setShowFailuresModal(true)
              : undefined
          }
          style={{
            cursor:
              activeImportBatch.status !== "processing" && activeImportBatch.failed > 0
                ? "pointer"
                : "default",
          }}
        >
          <div className="draft-import-banner__left">
            <div className="draft-import-banner__icon-wrap">
              {activeImportBatch.status === "processing" ? (
                <LuLoader className="spin-icon draft-import-banner__spinner" />
              ) : activeImportBatch.failed > 0 ? (
                <LuCircleAlert className="draft-import-banner__icon draft-import-banner__icon--warning" />
              ) : (
                <LuCheck className="draft-import-banner__icon draft-import-banner__icon--success" />
              )}
            </div>
            <div className="draft-import-banner__info">
              <div className="draft-import-banner__title">
                {activeImportBatch.status === "processing"
                  ? `Importing ${activeImportBatch.total} products in background...`
                  : activeImportBatch.failed > 0
                  ? `${activeImportBatch.completed} successfully imported and ${activeImportBatch.failed} failed.`
                  : `All ${activeImportBatch.completed} products successfully imported to drafts!`}
              </div>
              <div className="draft-import-banner__subtitle">
                {activeImportBatch.status === "processing" ? (
                  <>
                    <span>
                      {Number(activeImportBatch.completed || 0) + Number(activeImportBatch.failed || 0)} of{" "}
                      {activeImportBatch.total} processed
                    </span>
                    {Number(activeImportBatch.completed || 0) > 0 ? (
                      <span className="draft-import-banner__pill draft-import-banner__pill--success">
                        {activeImportBatch.completed} imported
                      </span>
                    ) : null}
                    {Number(activeImportBatch.failed || 0) > 0 ? (
                      <span className="draft-import-banner__pill draft-import-banner__pill--danger">
                        {activeImportBatch.failed} failed
                      </span>
                    ) : null}
                  </>
                ) : activeImportBatch.failed > 0 ? (
                  <span>Click to view why the {activeImportBatch.failed} failed.</span>
                ) : (
                  <span>Ready for review, editing, and publishing.</span>
                )}
              </div>
            </div>
          </div>

          <div className="draft-import-banner__right">
            {activeImportBatch.status === "processing" ? (
              <div className="draft-import-banner__progress-wrap">
                <div className="draft-import-banner__progress-bar">
                  <div
                    className="draft-import-banner__progress-fill draft-import-banner__progress-fill--success"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (Number(activeImportBatch.completed || 0) /
                            Math.max(1, Number(activeImportBatch.total || 1))) *
                            100
                        )
                      )}%`,
                    }}
                  />
                  <div
                    className="draft-import-banner__progress-fill draft-import-banner__progress-fill--danger"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (Number(activeImportBatch.failed || 0) /
                            Math.max(1, Number(activeImportBatch.total || 1))) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <span className="draft-import-banner__percent">
                  {Math.min(
                    100,
                    Math.round(
                      ((Number(activeImportBatch.completed || 0) + Number(activeImportBatch.failed || 0)) /
                        Math.max(1, Number(activeImportBatch.total || 1))) *
                        100
                    )
                  )}
                  %
                </span>
              </div>
            ) : (
              <div
                className="draft-import-banner__actions"
                onClick={(e) => e.stopPropagation()}
              >
                {activeImportBatch.failed > 0 ? (
                  <button
                    type="button"
                    className="draft-import-banner__view-failures-btn"
                    onClick={() => setShowFailuresModal(true)}
                  >
                    <LuEye />
                    <span>View why {activeImportBatch.failed} failed</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="draft-import-banner__close-btn"
                  aria-label="Dismiss banner"
                  onClick={handleDismissActiveBatch}
                >
                  <LuX />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <nav className="drafts-tabs" aria-label="Upload sections">
        {[
          ["drafts", `Drafts (${draftsCount})`],
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

      {connected ? (
        <ShipFromSetupNotice
          settings={accountSettings}
          className="drafts-ship-from-notice"
        />
      ) : null}

      {scheduleAlerts.length ? (
        <div className="products-alerts">
          {scheduleAlerts.map((alert) => (
            <div className="products-alert" key={alert.id}>
              <div className="products-alert__copy">
                <span className={`products-alert__dot products-alert__dot--${alert.tone === "danger" ? "danger" : "warning"}`} />
                <span>{alert.message}</span>
              </div>
              <div className="products-alert__actions">
                <button type="button" className="products-alert__link" onClick={viewScheduleDetails}>
                  View details
                </button>
                <button
                  type="button"
                  className="products-alert__dismiss"
                  aria-label="Dismiss alert"
                  onClick={() => dismissScheduleAlert(alert.batchId)}
                >
                  <LuX />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

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
            const form = getEditForm(item);
            const hasError = item.import_status === "failed";
            const imageUrl = getListingImageUrl(item);
            const statusLabel = hasError ? "Failed" : item.status === "draft" ? "Draft" : item.status ?? "Draft";
            const isPublishing = publishingIds.includes(item.id);

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
                    <h3
                      onClick={() => handleOpenEditPage(item)}
                      style={{ cursor: "pointer" }}
                      title="Click to edit product"
                    >
                      {hasError ? <span className="drafts-row__error">!</span> : null}
                      <span>{item.title}</span>
                    </h3>
                    {isPublishing ? (
                      <div className="drafts-row__processing" role="status">
                        <LuLoader className="spin-icon" />
                        <span>Publishing…</span>
                      </div>
                    ) : null}
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
                            "This draft could not be imported. Click Edit to review and fix details, then click Save."}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="drafts-row__actions">
                    <button
                      type="button"
                      className="drafts-row__edit-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenEditPage(item);
                      }}
                      title="Edit Product"
                      aria-label={`Edit ${item.title}`}
                    >
                      <LuPencil />
                      <span>Edit</span>
                    </button>
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
                          <button type="button" onClick={() => { setOpenMenuId(""); handleOpenEditPage(item); }}>
                            <LuPencil />
                            <span>Edit Product</span>
                          </button>
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
        onScheduleRandom={confirmScheduleRandom}
        onClearSchedule={clearSchedule}
      />

      <BulkEditDraftsModal
        open={bulkEditTargets.length > 0}
        drafts={bulkEditTargets}
        saving={bulkEditing}
        onClose={() => setBulkEditTargets([])}
        onApply={confirmBulkEdit}
      />

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={deleteConfirm?.type === "bulk" ? `Remove ${deleteConfirm.ids.length} draft(s)?` : "Remove this draft?"}
        description="This will permanently remove the draft. This cannot be undone."
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm(null)}
      />

      {showFailuresModal && activeImportBatch ? (
        <div className="import-failures-modal-layer" role="presentation">
          <button
            type="button"
            className="import-failures-modal-layer__backdrop"
            aria-label="Close failures dialog"
            onClick={() => setShowFailuresModal(false)}
          />
          <section
            className="import-failures-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Failed import details"
          >
            <button
              type="button"
              className="import-failures-modal__close"
              aria-label="Close failures dialog"
              onClick={() => setShowFailuresModal(false)}
            >
              <LuX />
            </button>

            <div className="import-failures-modal__head">
              <div className="import-failures-modal__icon">
                <LuCircleAlert />
              </div>
              <div>
                <h2>Failed Imports ({activeImportBatch.failed})</h2>
                <p>
                  The following {activeImportBatch.failed} product{activeImportBatch.failed === 1 ? "" : "s"} could not be imported to drafts:
                </p>
              </div>
            </div>

            <div className="import-failures-modal__list">
              {activeImportBatch.failures && activeImportBatch.failures.length > 0 ? (
                activeImportBatch.failures.map((f, idx) => (
                  <div className="import-failures-modal__item" key={idx}>
                    <div className="import-failures-modal__item-header">
                      <span className="import-failures-modal__item-num">#{idx + 1}</span>
                      <span className="import-failures-modal__item-target" title={f.item}>
                        {f.item}
                      </span>
                    </div>
                    <div className="import-failures-modal__item-reason">
                      <strong>Failure reason:</strong>
                      <span>{f.reason || "Product unavailable or details could not be retrieved."}</span>
                    </div>
                    {f.time ? (
                      <div className="import-failures-modal__item-time">
                        {new Date(f.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="import-failures-modal__empty">
                  <p>
                    {activeImportBatch.failed} product{activeImportBatch.failed === 1 ? "" : "s"} failed during import due to supplier validation or unavailability (e.g. invalid supplier URL/ID or out of stock).
                  </p>
                </div>
              )}
            </div>

            <div className="import-failures-modal__footer">
              <button
                type="button"
                className="import-failures-modal__btn"
                onClick={() => setShowFailuresModal(false)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default DraftsContent;
