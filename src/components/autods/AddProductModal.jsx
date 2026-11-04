import { useRef } from "react";
import {
  LuBox,
  LuChevronDown,
  LuPencil,
  LuUpload,
  LuX,
} from "react-icons/lu";
import ImportMetaDropdown from "./ImportMetaDropdown";
import {
  finderPlans,
  importSuppliers,
  importWarehouses,
  multipleProductsTabs,
} from "./constants";
import { importSupplierHint } from "../../utils/detectImportSupplier";

// "App in-build marketplace" is auto-tagged when a product is imported from the
// in-app browse grid — it isn't something a user pastes a URL against manually.
const manualImportSuppliers = importSuppliers.filter((supplier) => supplier.id !== "appmarketplace");

function supplierDot(supplier) {
  if (!supplier?.color) return null;
  return (
    <span
      className="add-product-modal__meta-dot"
      style={{ background: supplier.color }}
      aria-hidden="true"
    />
  );
}

function AddProductModal({
  open,
  mode,
  onClose,
  selectedStoreLabel,
  onEditStores,
  addProductUrl,
  onAddProductUrlChange,
  multipleProductsTab,
  onMultipleProductsTabChange,
  multipleProductsUrls,
  onMultipleProductsUrlsChange,
  multipleProductsCsvFile,
  csvFileObject,
  onCsvFileChange,
  finderSelections,
  onAdjustFinderSelection,
  importSupplier,
  onImportSupplierChange,
  importWarehouse,
  onImportWarehouseChange,
  importSubmitting,
  importBatchProgress,
  finderTotalCredits,
  multipleProductsActionDisabled,
  onSingleImport,
  onBulkImport,
  supplierEnabled,
  quotaBreached = false,
  quotaUsed = 0,
  quotaLimit = 200,
  onUpgradePlan,
}) {
  const csvFileInputRef = useRef(null);

  if (!open) return null;

  const supplierHint = importSupplierHint(importSupplier);

  return (
    <div className="add-product-modal-layer" role="presentation">
      <button
        type="button"
        className="add-product-modal-layer__backdrop"
        aria-label="Close add product modal"
        onClick={onClose}
      />

      <section
        className={mode === "multiple" ? "add-product-modal add-product-modal--multiple" : "add-product-modal"}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "multiple" ? "Add Products" : "Add Product"}
      >
        <button type="button" className="balance-modal__close" aria-label="Close add product modal" onClick={onClose}>
          <LuX />
        </button>

        <div className="add-product-modal__head">
          <div className="add-product-modal__title-icon" aria-hidden="true">
            <LuBox />
            <span>+</span>
          </div>
          <div className="add-product-modal__title-copy">
            <h2>{mode === "multiple" ? "Add Products" : "Add Product"}</h2>
            <div className="add-product-modal__publish-row">
              <span>
                Publish to: <strong>{selectedStoreLabel}</strong>
              </span>
              <button type="button" aria-label="Edit publish store" onClick={onEditStores}>
                <LuPencil />
              </button>
              {quotaLimit > 0 ? (
                <span
                  className={`add-product-modal__quota-badge ${
                    quotaBreached
                      ? "add-product-modal__quota-badge--breached"
                      : quotaUsed / quotaLimit >= 0.8
                      ? "add-product-modal__quota-badge--warning"
                      : ""
                  }`}
                  title="Includes all product variations"
                >
                  Quota: {quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {quotaBreached ? (
          <div className="add-product-modal__quota-alert">
            <div className="add-product-modal__quota-alert-icon">⚠️</div>
            <div className="add-product-modal__quota-alert-content">
              <strong>Product Listing Limit Reached ({quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()})</strong>
              <p>
                Your current plan allows up to {quotaLimit.toLocaleString()} products (each variation counts as 1 product towards your quota).
                You have reached your limit and cannot list or import new products until you upgrade your plan.
              </p>
              <button
                type="button"
                className="add-product-modal__upgrade-btn"
                onClick={onUpgradePlan}
              >
                Upgrade Subscription Plan
              </button>
            </div>
          </div>
        ) : null}

        {mode === "multiple" ? (
          <>
            <div className="add-products-modal__tabs" role="tablist" aria-label="Add products methods">
              {multipleProductsTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  role="tab"
                  aria-selected={multipleProductsTab === tab.id}
                  className={multipleProductsTab === tab.id ? "add-products-modal__tab add-products-modal__tab--active" : "add-products-modal__tab"}
                  onClick={() => onMultipleProductsTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {multipleProductsTab === "urls" ? (
              <div className="add-products-modal__panel">
                <label className="add-product-modal__field">
                  <span>Enter product URLs or product IDs (one per line)</span>
                  <textarea
                    rows={6}
                    value={multipleProductsUrls}
                    onChange={(event) => onMultipleProductsUrlsChange(event.target.value)}
                    placeholder={supplierHint}
                  />
                </label>
              </div>
            ) : null}

            {multipleProductsTab === "csv" ? (
              <div className="add-products-modal__panel">
                <div className="add-products-modal__csv-box">
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    style={{ display: "none" }}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      onCsvFileChange(file);
                    }}
                  />
                  <LuUpload />
                  <p>
                    {multipleProductsCsvFile
                      ? multipleProductsCsvFile
                      : "Drag & drop a CSV file with product URLs / IDs, or click to browse"}
                  </p>
                  <button type="button" onClick={() => csvFileInputRef.current?.click()}>
                    Browse file
                  </button>
                </div>
              </div>
            ) : null}

            {multipleProductsTab === "finder" ? (
              <div className="add-products-modal__panel">
                <div className="add-products-modal__finder-list">
                  {finderPlans.map((plan) => (
                    <article key={plan.id} className="add-products-modal__finder-card">
                      <div>
                        <h3>{plan.title}</h3>
                        <p>{plan.subtitle}</p>
                      </div>
                      <div className="add-products-modal__finder-stepper">
                        <button
                          type="button"
                          onClick={() => onAdjustFinderSelection(plan.id, -1)}
                          disabled={(finderSelections[plan.id] ?? 0) <= 0}
                        >
                          -
                        </button>
                        <span>{finderSelections[plan.id] ?? 0}</span>
                        <button type="button" onClick={() => onAdjustFinderSelection(plan.id, 1)}>
                          +
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="add-products-modal__footer">
              <div className="add-product-modal__meta-row">
                <ImportMetaDropdown
                  label="Supplier Source:"
                  value={importSupplier}
                  options={manualImportSuppliers}
                  onChange={onImportSupplierChange}
                  renderTriggerExtra={supplierDot}
                />
                <i aria-hidden="true" />
                <ImportMetaDropdown
                  label="Ship From Warehouse:"
                  value={importWarehouse}
                  options={importWarehouses}
                  onChange={onImportWarehouseChange}
                />
                <button type="button" className="add-product-modal__hint" aria-label="Warehouse info">
                  ?
                </button>
              </div>

              <div className="add-products-modal__footer-row">
                <span className="add-products-modal__credits">
                  {importBatchProgress
                    ? `Progress: ${importBatchProgress.completed + importBatchProgress.failed}/${importBatchProgress.total}`
                    : multipleProductsTab === "finder"
                      ? `Total cost: ${finderTotalCredits} credits`
                      : ""}
                </span>
                <div className="add-products-modal__submit-wrap">
                  <button
                    type="button"
                    className="add-products-modal__submit-main"
                    disabled={quotaBreached || multipleProductsActionDisabled || !supplierEnabled}
                    onClick={quotaBreached ? onUpgradePlan : onBulkImport}
                  >
                    {quotaBreached ? "Quota Limit Reached (Upgrade Plan)" : importSubmitting ? "Importing…" : "Add As draft"}
                  </button>
                  <button
                    type="button"
                    className="add-products-modal__submit-toggle"
                    disabled={quotaBreached || multipleProductsActionDisabled || !supplierEnabled}
                    aria-label="More add product actions"
                  >
                    <LuChevronDown />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <label className="add-product-modal__field">
              <span>Supplier Url or Product ID (Buy)</span>
              <input
                type="text"
                value={addProductUrl}
                onChange={(event) => onAddProductUrlChange(event.target.value)}
                placeholder={supplierHint}
              />
            </label>

            <div className="add-product-modal__meta-row">
              <ImportMetaDropdown
                label="Supplier Source:"
                value={importSupplier}
                options={manualImportSuppliers}
                onChange={onImportSupplierChange}
                renderTriggerExtra={supplierDot}
              />
              <i aria-hidden="true" />
              <ImportMetaDropdown
                label="Ship From Warehouse:"
                value={importWarehouse}
                options={importWarehouses}
                onChange={onImportWarehouseChange}
              />
              <button type="button" className="add-product-modal__hint" aria-label="Warehouse info">
                ?
              </button>
            </div>

            {!supplierEnabled ? (
              <p className="add-product-modal__notice">
                <strong>{importSuppliers.find((s) => s.id === importSupplier)?.label ?? "This supplier"}</strong>{" "}
                import is not available yet.
              </p>
            ) : null}

            <div className="add-product-modal__actions">
              <button
                type="button"
                disabled={quotaBreached || !addProductUrl.trim() || importSubmitting || !supplierEnabled}
                onClick={() => onSingleImport("publish")}
              >
                {quotaBreached ? "Quota Limit Reached" : importSubmitting ? "Working…" : "Publish to Store"}
              </button>
              <button
                type="button"
                disabled={quotaBreached || !addProductUrl.trim() || importSubmitting || !supplierEnabled}
                onClick={() => (quotaBreached ? onUpgradePlan?.() : onSingleImport("draft"))}
              >
                {quotaBreached ? "Upgrade Plan to Import" : importSubmitting ? "Working…" : "Add as Draft (Simple page)"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AddProductModal;
