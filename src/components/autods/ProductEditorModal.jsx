import { LuLoader, LuPencil, LuX } from "react-icons/lu";
import DraftEditorPanel from "./DraftEditorPanel";
import { getListingImageUrl } from "./helpers";

function ProductEditorModal({
  open,
  product,
  form,
  activeTab,
  saving = false,
  onTabChange,
  onChange,
  onSave,
  onClose,
}) {
  if (!open || !product || !form) {
    return null;
  }

  const imageUrl = getListingImageUrl(product);

  return (
    <div className="product-editor-modal-layer" role="presentation">
      <button
        type="button"
        className="product-editor-modal-layer__backdrop"
        aria-label="Close product editor"
        onClick={onClose}
      />

      <section className="product-editor-modal" role="dialog" aria-modal="true" aria-label="Edit product">
        <header className="product-editor-modal__head">
          <div className="product-editor-modal__title">
            <span className="product-editor-modal__icon" aria-hidden="true">
              <LuPencil />
            </span>
            <div>
              <h2>Edit Product</h2>
              <p>Update listing details. Changes sync to eBay when the product is live.</p>
            </div>
          </div>
          <button type="button" className="product-editor-modal__close" aria-label="Close" onClick={onClose}>
            <LuX />
          </button>
        </header>

        <div className="product-editor-modal__summary">
          {imageUrl ? <img src={imageUrl} alt="" referrerPolicy="no-referrer" /> : null}
          <div>
            <strong>{product.title}</strong>
            <span>{product.storeName ?? product.connection?.ebay_username ?? "Store"}</span>
          </div>
        </div>

        <div className="product-editor-modal__body">
          <DraftEditorPanel
            item={product}
            form={form}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onChange={onChange}
            onSave={onSave}
          />
        </div>

        <footer className="product-editor-modal__actions">
          <button type="button" className="product-editor-modal__btn product-editor-modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="product-editor-modal__btn product-editor-modal__btn--primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save &amp; Sync</span>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ProductEditorModal;
