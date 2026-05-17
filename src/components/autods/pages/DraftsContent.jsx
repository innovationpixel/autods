import { useMemo, useState } from "react";
import {
  LuBadgeCheck,
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuClock3,
  LuEllipsisVertical,
  LuExternalLink,
  LuInbox,
  LuPencil,
  LuPlay,
  LuPlus,
  LuRefreshCcw,
  LuSlidersHorizontal,
  LuSparkles,
  LuStore,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { DRAFT_UPLOAD_COUNT, draftEditorTemplates, initialDrafts } from "../constants";

function DraftsContent({ searchQuery }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [activeTab, setActiveTab] = useState("drafts");
  const [showFilters, setShowFilters] = useState(false);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState(["draft-2"]);
  const [retryingIds, setRetryingIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [editorTabById, setEditorTabById] = useState({
    "draft-2": "product",
  });

  const visibleDrafts = useMemo(() => {
    if (activeTab !== "drafts") {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return drafts;
    }

    return drafts.filter((item) =>
      [item.title, item.store, item.supplier, item.issue].join(" ").toLowerCase().includes(query),
    );
  }, [activeTab, drafts, searchQuery]);

  const allVisibleSelected =
    visibleDrafts.length > 0 && visibleDrafts.every((item) => selectedIds.includes(item.id));
  const allExpanded =
    visibleDrafts.length > 0 && visibleDrafts.every((item) => expandedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleDrafts.some((item) => item.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleDrafts.map((item) => item.id)])]);
  };

  const toggleSelectOne = (draftId) => {
    setSelectedIds((current) =>
      current.includes(draftId) ? current.filter((id) => id !== draftId) : [...current, draftId],
    );
  };

  const toggleExpanded = (draftId) => {
    setExpandedIds((current) =>
      current.includes(draftId) ? current.filter((id) => id !== draftId) : [...current, draftId],
    );
  };

  const toggleExpandAll = () => {
    setExpandedIds(allExpanded ? [] : visibleDrafts.map((item) => item.id));
  };

  const setEditorTab = (draftId, nextTab) => {
    setEditorTabById((current) => ({
      ...current,
      [draftId]: nextTab,
    }));
  };

  const runBulkAction = (action) => {
    if (!selectedIds.length) {
      setNotice("Select at least one draft to use this action.");
      return;
    }

    if (action === "remove") {
      setDrafts((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setExpandedIds((current) => current.filter((id) => !selectedIds.includes(id)));
      setNotice(`${selectedIds.length} draft${selectedIds.length === 1 ? "" : "s"} removed from list.`);
      setSelectedIds([]);
      return;
    }

    const labels = {
      edit: "Bulk edit opened",
      import: "Import all started",
      rewrite: "Bulk AI rewrite queued",
      schedule: "Schedule listings opened",
    };

    setNotice(`${labels[action]} for ${selectedIds.length} selected draft${selectedIds.length === 1 ? "" : "s"}.`);
  };

  const retryDraft = (draftId) => {
    setRetryingIds((current) => [...new Set([...current, draftId])]);
    setNotice("Draft retry queued. The row will remain in drafts until upload completes.");
  };

  const handleDraftMenu = (draftId, action) => {
    if (action === "schedule") {
      setNotice("Schedule Listing panel opened for the selected draft.");
    }

    if (action === "delete") {
      setDrafts((current) => current.filter((item) => item.id !== draftId));
      setExpandedIds((current) => current.filter((id) => id !== draftId));
      setSelectedIds((current) => current.filter((id) => id !== draftId));
      setNotice("Draft deleted from the upload list.");
    }

    if (action === "viral") {
      setNotice("Go Viral with TikTok Ads is ready for this draft.");
    }

    setOpenMenuId("");
  };

  const renderDraftEditor = (item) => {
    const baseEditor = draftEditorTemplates[item.id] || draftEditorTemplates["draft-2"];
    const editor = {
      ...baseEditor,
      product: {
        ...baseEditor.product,
        title: item.title,
      },
      variants: baseEditor.variants.slice(0, Math.max(1, item.variants)),
    };

    const activeEditorTab = editorTabById[item.id] || "product";

    return (
      <div className="draft-editor">
        <div className="draft-editor__shell">
          <div className="draft-editor__rail">
            <span />
            <span />
          </div>

          <div className="draft-editor__main">
            <div className="draft-editor__header">
              <div className="draft-editor__heading">
                <img src={item.image} alt={item.title} />
                <div>
                  <h4>{item.title}</h4>
                  <div className="drafts-row__meta">
                    <span>Destination:</span>
                    <span>{item.store}</span>
                    <i aria-hidden="true" />
                    <span className="drafts-row__screen" aria-hidden="true" />
                    <i aria-hidden="true" />
                    <span>Supplier: {item.supplier}</span>
                    <i aria-hidden="true" />
                    <span>Variants: {item.variants}</span>
                    <i aria-hidden="true" />
                    <button type="button">View Source Product</button>
                  </div>
                </div>
              </div>

              <div className="draft-editor__actions">
                <button type="button" className="orders-row-actions__icon" aria-label="Open source product">
                  <LuExternalLink />
                </button>
                <button type="button" className="orders-row-actions__icon" aria-label="Open editor menu">
                  <LuEllipsisVertical />
                </button>
                <button type="button" className="draft-editor__save">
                  <LuCheck />
                  <span>Save</span>
                </button>
                <button type="button" className="draft-editor__retry">
                  <LuRefreshCcw />
                  <span>Save & Retry</span>
                </button>
              </div>
            </div>

            <nav className="draft-editor__tabs" aria-label="Draft editor sections">
              {[
                ["product", "Product"],
                ["description", "Description"],
                ["variants", `Variants (${item.variants})`],
                ["images", "Images"],
                ["specifics", "Item Specifications"],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={activeEditorTab === key ? "draft-editor__tab draft-editor__tab--active" : "draft-editor__tab"}
                  onClick={() => setEditorTab(item.id, key)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="draft-editor__panel">
              {activeEditorTab === "product" ? (
                <div className="draft-editor__form">
                  <div className="draft-editor__title-row">
                    <label>
                      <span>
                        Title <em>80/80</em> <button type="button">Optimize Your Title</button>
                      </span>
                      <input type="text" value={editor.product.title} readOnly />
                    </label>
                    <button type="button">Optimize Title With AI</button>
                  </div>

                  <div className="draft-editor__grid draft-editor__grid--single">
                    <label>
                      <span>Category</span>
                      <button type="button" className="draft-editor__select">
                        <span>{editor.product.category}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Tags</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>Enter Tag</span>
                        <LuChevronDown />
                      </button>
                    </label>
                    <label>
                      <span>Shipping Methods</span>
                      <button type="button" className="draft-editor__select">
                        <span>{editor.product.shippingMethod}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <label className="draft-editor__toggle-row">
                    <span className="draft-editor__toggle" />
                    <span>Use Dynamic Policies (Shipping, Payment, Returns)</span>
                    <strong>?</strong>
                  </label>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Payment Policy</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>{editor.product.paymentPolicy}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                    <label>
                      <span>Shipping Policy</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>{editor.product.shippingPolicy}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Return Policy</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>{editor.product.returnPolicy}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Country Location</span>
                      <button type="button" className="draft-editor__select">
                        <span>{editor.product.countryLocation}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                    <label>
                      <span>Default Zipcode</span>
                      <div className="draft-editor__zipcode-row">
                        <input type="text" value={editor.product.zipcode} readOnly />
                        <button type="button" aria-label="Refresh zipcode">
                          <LuRefreshCcw />
                        </button>
                        <button type="button" className="draft-editor__location-chip">
                          <LuStore />
                          <span>{editor.product.suburb}</span>
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="draft-editor__grid draft-editor__grid--single">
                    <label>
                      <span>Brand</span>
                      <input type="text" value={editor.product.brand} readOnly />
                    </label>
                  </div>

                  <div className="draft-editor__monitoring">
                    <span>Monitoring</span>
                    {editor.product.monitoring.map((label) => (
                      <label className="draft-editor__toggle-row" key={label}>
                        <span className="draft-editor__toggle draft-editor__toggle--active" />
                        <span>{label}</span>
                        <strong>?</strong>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "description" ? (
                <div className="draft-editor__description-card">
                  <div className="draft-editor__description-head">
                    <h5>Description</h5>
                    <button type="button">Optimize Description With AI</button>
                  </div>
                  <div className="draft-editor__toolbar">
                    {["B", "I", "U", "S", "x", "x", "T", "|", "=", "=", "=", "=", "|", "Font", "Size", "A", "A", "Source", "<", ">"].map((tool) => (
                      <span key={tool}>{tool}</span>
                    ))}
                  </div>
                  <div className="draft-editor__description-body">
                    {editor.description.split("\n").map((line, index) => (
                      <p key={`${line}-${index}`}>{line || " "}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "variants" ? (
                <div className="draft-editor__variants">
                  <div className="draft-editor__variants-head">
                    <span>0 Variant Selected</span>
                    <button type="button">
                      Edit Variations Options <span className="drafts-help">?</span>
                    </button>
                  </div>
                  <div className="draft-editor__variant-list">
                    {editor.variants.map((variant) => (
                      <div className="draft-editor__variant-row" key={variant.id}>
                        <label>
                          <input type="checkbox" />
                        </label>
                        <img src={variant.image} alt={variant.title} />
                        <div>
                          <strong>{variant.title}</strong>
                          <div>
                            <span>IN STOCK</span>
                            <em>Buy ID: {variant.sku}</em>
                            <em>Price: {variant.price}</em>
                          </div>
                        </div>
                        <button type="button" className="orders-row-actions__icon" aria-label="Delete variant">
                          <LuTrash2 />
                        </button>
                        <button type="button" className="draft-editor__edit-btn">
                          <LuPencil />
                          <span>Edit</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="draft-editor__add-inline">
                    <LuPlus />
                    <span>Add Variant</span>
                  </button>
                </div>
              ) : null}

              {activeEditorTab === "images" ? (
                <div className="draft-editor__images">
                  <div className="draft-editor__images-head">
                    <span>
                      <strong>?</strong> 0 Image Selected:
                    </span>
                  </div>
                  <div className="draft-editor__images-copy">
                    <h5>Product Images</h5>
                    <p>Upload an image in PNG, JPG, JPEG format. File size should be 5 MB max.</p>
                  </div>
                  <div className="draft-editor__image-grid">
                    {editor.images.map((image) => (
                      <label className={image.primary ? "draft-editor__image draft-editor__image--primary" : "draft-editor__image"} key={image.id}>
                        <input type="checkbox" />
                        <img src={image.src} alt="" />
                        {image.label ? <span className="draft-editor__image-tag">{image.label}</span> : null}
                        {image.primary ? <span className="draft-editor__image-main">Main image</span> : null}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "specifics" ? (
                <div className="draft-editor__specifics">
                  <div className="draft-editor__specifics-toolbar">
                    <div>
                      <button type="button">
                        <LuPlus />
                        <span>Add Item Specification</span>
                      </button>
                      <button type="button">
                        <LuPencil />
                        <span>Edit All Item Specifications</span>
                      </button>
                      <button type="button">
                        <LuExternalLink />
                        <span>Copy from URL</span>
                      </button>
                    </div>
                    <span>
                      3 Recommended Item specifics <span className="drafts-help">?</span>
                    </span>
                  </div>
                  <div className="draft-editor__specifics-table">
                    {editor.specifics.map((row) => (
                      <div className="draft-editor__specifics-row" key={row.label}>
                        <span>{row.label}</span>
                        <div>{row.value}</div>
                        <button type="button" className="orders-row-actions__icon" aria-label={`Edit ${row.label}`}>
                          <LuPencil />
                        </button>
                        <button type="button" className="orders-row-actions__icon" aria-label={`Delete ${row.label}`}>
                          <LuTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const emptyMessage =
    activeTab === "scheduled"
      ? "No scheduled uploads yet."
      : activeTab === "recurring"
        ? "No recurring uploads yet."
        : "No drafts match the current search.";

  return (
    <section className="drafts-page-content">
      <nav className="drafts-tabs" aria-label="Upload sections">
        <button
          type="button"
          className={`drafts-tab ${activeTab === "drafts" ? "drafts-tab--active" : ""}`}
          onClick={() => setActiveTab("drafts")}
        >
          Drafts ({DRAFT_UPLOAD_COUNT})
        </button>
        <button
          type="button"
          className={`drafts-tab ${activeTab === "scheduled" ? "drafts-tab--active" : ""}`}
          onClick={() => setActiveTab("scheduled")}
        >
          Scheduled (0) <span className="drafts-help">?</span>
        </button>
        <button
          type="button"
          className={`drafts-tab ${activeTab === "recurring" ? "drafts-tab--active" : ""}`}
          onClick={() => setActiveTab("recurring")}
        >
          Recurring (0) <span className="drafts-help">?</span>
        </button>
      </nav>

      <div className="drafts-toolbar">
        <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((current) => !current)}>
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>

        <button
          type="button"
          className="dashboard-secondary-btn dashboard-secondary-btn--orders"
          onClick={() => setShowTutorialNote((current) => !current)}
        >
          <LuPlay />
          <span>Watch Tutorial</span>
        </button>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Drafts tutorial is active: review failed upload details, retry rows, or schedule selected listings.</span>
        </div>
      ) : null}

      {showFilters ? (
        <div className="drafts-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Status</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="Failed">
                <option>Failed</option>
                <option>Ready</option>
                <option>Needs Review</option>
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>Supplier</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="eBay AU">
                <option>eBay AU</option>
                <option>Amazon AU</option>
                <option>CJ</option>
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>Store</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="nrf_enterprise_inc-llc-au">
                <option>nrf_enterprise_inc-llc-au</option>
                <option>sheikh002-au</option>
              </select>
              <LuChevronDown />
            </div>
          </label>
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
              <span>Import All</span>
              <span className="drafts-help">?</span>
            </button>
            <button type="button" onClick={() => runBulkAction("rewrite")}>
              <LuSparkles />
              <span>Bulk AI Rewrite</span>
            </button>
            <button type="button" onClick={() => runBulkAction("schedule")}>
              <LuClock3 />
              <span>Schedule Listings</span>
            </button>
          </div>
        </div>

        <div className="drafts-selection-row__right">
          <button type="button" onClick={() => setNotice("History panel is ready for the selected upload batch.")}>
            View History
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={toggleExpandAll}>
            {allExpanded ? "Collapse all" : "Expand all"} <span className="drafts-help">?</span>
          </button>
        </div>
      </div>

      {notice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss drafts note">
            <LuX />
          </button>
        </div>
      ) : null}

      <div className="drafts-list card-wrapper">
        {visibleDrafts.length ? (
          visibleDrafts.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isExpanded = expandedIds.includes(item.id);
            const isRetrying = retryingIds.includes(item.id);

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
                    aria-label={isExpanded ? "Collapse draft details" : "Expand draft details"}
                  >
                    <LuChevronRight />
                  </button>

                  <div className="drafts-row__thumb">
                    <img src={item.image} alt={item.title} />
                  </div>

                  <div className="drafts-row__body">
                    <h3>
                      <span className="drafts-row__error">!</span>
                      <span>{item.title}</span>
                    </h3>

                    <div className="drafts-row__meta">
                      <span>Destination:</span>
                      <span>{item.store}</span>
                      <i aria-hidden="true" />
                      <span className="drafts-row__screen" aria-hidden="true" />
                      <i aria-hidden="true" />
                      <span>Supplier: {item.supplier}</span>
                      <i aria-hidden="true" />
                      <span>Variants: {item.variants}</span>
                      <i aria-hidden="true" />
                      <button type="button">View Source Product</button>
                    </div>

                  </div>

                  <div className="drafts-row__actions">
                    <button type="button" className="orders-row-actions__icon" aria-label="Open source product">
                      <LuExternalLink />
                    </button>
                    <div className="drafts-row__menu-wrap">
                      <button
                        type="button"
                        className="orders-row-actions__icon"
                        aria-label="Open draft menu"
                        onClick={() => setOpenMenuId((current) => (current === item.id ? "" : item.id))}
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
                          <button type="button" onClick={() => handleDraftMenu(item.id, "viral")}>
                            <LuSparkles />
                            <span>Go Viral with TikTok Ads</span>
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

                {isExpanded ? renderDraftEditor(item) : null}
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
    </section>
  );
}

export default DraftsContent;
