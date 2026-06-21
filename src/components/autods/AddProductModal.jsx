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
            </div>
          </div>
        </div>

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
                  <span>
                    Supplier Url or Product ID (Buy)
                    <em> (For multiple products, click &lt;enter&gt; to separate them)</em>
                    <button type="button" className="add-products-modal__info" aria-label="Multiple product instructions">
                      ?
                    </button>
                  </span>
                  <textarea
                    value={multipleProductsUrls}
                    onChange={(event) => onMultipleProductsUrlsChange(event.target.value)}
                    placeholder={supplierHint}
                  />
                </label>
              </div>
            ) : null}

            {multipleProductsTab === "csv" ? (
              <div className="add-products-modal__panel add-products-modal__panel--csv">
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(event) => onCsvFileChange(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="add-products-modal__dropzone"
                  onClick={() => csvFileInputRef.current?.click()}
                >
                  <span className="add-products-modal__dropzone-icon">
                    <LuUpload />
                  </span>
                  <strong>{multipleProductsCsvFile || "Drop CSV file"}</strong>
                  <span>
                    {multipleProductsCsvFile
                      ? "Ready to import into your selected store."
                      : "Or select file from your computer"}
                  </span>
                </button>

                <div className="add-products-modal__csv-card">
                  <strong>CSV format</strong>
                  <p>The file must be a CSV file with the following fields as column titles:</p>
                  <ul>
                    <li>BuyId (Required)</li>
                    <li>Title (Optional)</li>
                    <li>Price (Optional)</li>
                  </ul>
                  <button type="button">Download Example File</button>
                </div>
              </div>
            ) : null}

            {multipleProductsTab === "finder" ? (
              <div className="add-products-modal__panel add-products-modal__panel--finder">
                <div className="add-products-modal__finder-head">
                  <strong>Let us find the perfect products for your store</strong>
                  <span>
                    Your Credits: 400 <button type="button">Buy more</button>
                  </span>
                </div>

                <div className="add-products-modal__finder-grid">
                  {finderPlans.map((plan) => {
                    const PlanIcon = plan.icon;
                    const quantity = finderSelections[plan.id] || 0;

                    return (
                      <article className="add-products-modal__finder-card" key={plan.id}>
                        <span className="add-products-modal__finder-label">{plan.label}</span>
                        <span className={`add-products-modal__finder-icon add-products-modal__finder-icon--${plan.id}`}>
                          <PlanIcon />
                        </span>
                        <strong>{plan.sales}</strong>
                        <span>{plan.credits} Credits per product</span>

                        <div className="add-products-modal__finder-counter">
                          <div>Select amount</div>
                          <div className="add-products-modal__finder-counter-row">
                            <button type="button" onClick={() => onAdjustFinderSelection(plan.id, -1)}>
                              -
                            </button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => onAdjustFinderSelection(plan.id, 1)}>
                              +
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="add-products-modal__meta-footer">
              <div className="add-product-modal__meta-row">
                <ImportMetaDropdown
                  label="Supplier Source:"
                  value={importSupplier}
                  options={importSuppliers}
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
                    disabled={multipleProductsActionDisabled || !supplierEnabled}
                    onClick={onBulkImport}
                  >
                    {importSubmitting ? "Importing…" : "Add As draft"}
                  </button>
                  <button
                    type="button"
                    className="add-products-modal__submit-toggle"
                    disabled={multipleProductsActionDisabled || !supplierEnabled}
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
                options={importSuppliers}
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
                disabled={!addProductUrl.trim() || importSubmitting || !supplierEnabled}
                onClick={() => onSingleImport("publish")}
              >
                {importSubmitting ? "Working…" : "Publish to Store"}
              </button>
              <button
                type="button"
                disabled={!addProductUrl.trim() || importSubmitting || !supplierEnabled}
                onClick={() => onSingleImport("draft")}
              >
                {importSubmitting ? "Working…" : "Add as Draft (Simple page)"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AddProductModal;
