import { useState } from "react";
import {
  LuCheck,
  LuImage,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { getListingImageUrl } from "./helpers";
import { uid, normalizeVariantPricing } from "../../utils/draftEditorState";
import DraftDescriptionEditor from "./DraftDescriptionEditor";
import DraftCategorySelect from "./DraftCategorySelect";

const EDITOR_TABS = [
  { id: "general", label: "General" },
  { id: "description", label: "Description" },
  { id: "variants", label: "Variants" },
  { id: "images", label: "Images" },
  { id: "specifics", label: "Item Specifics" },
  { id: "monitoring", label: "Monitoring" },
];

const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
  { value: "REFURBISHED", label: "Refurbished" },
];

function Toggle({ active, onClick, label }) {
  return (
    <button type="button" className="draft-editor__toggle-row draft-editor__toggle-row--button" onClick={onClick}>
      <span className={`draft-editor__toggle ${active ? "draft-editor__toggle--active" : ""}`} aria-hidden="true" />
      <span>{label}</span>
      <strong title="Help">?</strong>
    </button>
  );
}

function DraftEditorPanel({
  item,
  form,
  activeTab,
  onTabChange,
  onChange,
  onSave,
}) {
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editingSpecificId, setEditingSpecificId] = useState(null);

  const imageUrl = getListingImageUrl(item);
  const selectedImageCount = form.images.filter((image) => image.selected).length;

  const patch = (partial) => onChange({ ...form, ...partial });

  const updateVariant = (variantId, partial) => {
    patch({
      variants: form.variants.map((variant) =>
        variant.id === variantId ? normalizeVariantPricing({ ...variant, ...partial }) : variant,
      ),
    });
  };

  const updateVariantPricing = (variantId, field, value) => {
    const variant = form.variants.find((entry) => entry.id === variantId);
    if (!variant) {
      return;
    }

    const current = normalizeVariantPricing(variant, form.monitoring);
    const partial = { [field]: value };

    if (field === "buyPrice") {
      partial.listingPrice = Number(value) + Number(current.profit);
    } else if (field === "listingPrice") {
      partial.profit = Number(value) - Number(current.buyPrice);
    } else if (field === "profit") {
      partial.listingPrice = Number(current.buyPrice) + Number(value);
    }

    updateVariant(variantId, partial);
  };

  const formatMoney = (value) => `$${Number(value ?? 0).toFixed(2)}`;

  const removeVariant = (variantId) => {
    if (form.variants.length <= 1) {
      return;
    }
    patch({ variants: form.variants.filter((variant) => variant.id !== variantId) });
    if (editingVariantId === variantId) {
      setEditingVariantId(null);
    }
  };

  const addVariant = () => {
    const buyPrice = Number(form.monitoring.buyPrice ?? 0);
    const profit = Number(form.monitoring.profit ?? 0);
    const next = normalizeVariantPricing(
      {
        id: uid("variant"),
        label: `Variant ${form.variants.length + 1}`,
        buyPrice,
        profit,
        quantity: 1,
        image: form.images.find((image) => image.selected)?.url ?? null,
        selected: true,
      },
      form.monitoring,
    );
    patch({ variants: [...form.variants, next] });
    setEditingVariantId(next.id);
  };

  const toggleImageSelected = (imageId, selected) => {
    patch({
      images: form.images.map((image) =>
        image.id === imageId ? { ...image, selected } : image,
      ),
    });
  };

  const removeImage = (imageId) => {
    patch({ images: form.images.filter((image) => image.id !== imageId) });
  };

  const updateSpecific = (specificId, partial) => {
    patch({
      specifics: form.specifics.map((row) =>
        row.id === specificId ? { ...row, ...partial } : row,
      ),
    });
  };

  const removeSpecific = (specificId) => {
    patch({ specifics: form.specifics.filter((row) => row.id !== specificId) });
    if (editingSpecificId === specificId) {
      setEditingSpecificId(null);
    }
  };

  const addSpecific = () => {
    const next = { id: uid("specific"), name: "", value: "" };
    patch({ specifics: [...form.specifics, next] });
    setEditingSpecificId(next.id);
  };

  const patchMonitoring = (partial) => {
    const monitoring = { ...form.monitoring, ...partial };
    const buyPrice = Number(monitoring.buyPrice) || 0;
    const profit = Number(monitoring.profit) || 0;
    patch({
      monitoring,
      price: Math.round((buyPrice + profit) * 100) / 100,
    });
  };

  const selectedImagesOrdered = form.images.filter((image) => image.selected);

  return (
    <div className="draft-editor">
      <div className="draft-editor__shell">
        <div className="draft-editor__rail" aria-hidden="true">
          <span />
          <span />
        </div>

        <div className="draft-editor__main">
          <div className="draft-editor__header">
            <div className="draft-editor__heading">
              {imageUrl ? (
                <img src={imageUrl} alt={item.title} referrerPolicy="no-referrer" />
              ) : (
                <div className="drafts-row__thumb">
                  <LuImage />
                </div>
              )}
              <div>
                <h4>{form.title || item.title}</h4>
                <div className="drafts-row__meta">
                  <span>Warehouse: {item.warehouse_country ?? "CN"}</span>
                  <i aria-hidden="true" />
                  <span>Source: {item.source_platform ?? "aliexpress"}</span>
                  {item.source_product_id ? (
                    <>
                      <i aria-hidden="true" />
                      <span>Buy Item Id: {item.source_product_id}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="draft-editor__actions">
              <button type="button" className="draft-editor__save" onClick={onSave}>
                <LuCheck />
                <span>Save</span>
              </button>
            </div>
          </div>

          <div className="draft-editor__tabs" role="tablist" aria-label="Draft editor sections">
            {EDITOR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`draft-editor__tab ${activeTab === tab.id ? "draft-editor__tab--active" : ""}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="draft-editor__panel">
            {activeTab === "general" ? (
              <div className="draft-editor__form">
                <div className="draft-editor__title-row">
                  <label>
                    <span>
                      Title <em>({String(form.title ?? "").length}/80)</em>
                    </span>
                    <input
                      type="text"
                      value={form.title ?? ""}
                      maxLength={80}
                      onChange={(event) => patch({ title: event.target.value })}
                    />
                  </label>
                </div>

                <div className="draft-editor__grid">
                  <label>
                    <span>Category</span>
                    <DraftCategorySelect
                      listingId={item.id}
                      categoryId={form.categoryId ?? ""}
                      categoryName={form.categoryName ?? ""}
                      searchSeed={form.title ?? item.title ?? ""}
                      onChange={({ categoryId, categoryName }) =>
                        patch({ categoryId, categoryName })
                      }
                    />
                  </label>
                  <label>
                    <span>Condition</span>
                    <select
                      className="draft-editor__native-select"
                      value={form.condition ?? "NEW"}
                      onChange={(event) => patch({ condition: event.target.value })}
                    >
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="draft-editor__grid">
                  <label>
                    <span>Price</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price ?? ""}
                      onChange={(event) => patch({ price: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity ?? ""}
                      onChange={(event) => patch({ quantity: event.target.value })}
                    />
                  </label>
                </div>

                <div className="draft-editor__grid">
                  <label>
                    <span>Brand</span>
                    <input
                      type="text"
                      value={form.brand ?? ""}
                      onChange={(event) => patch({ brand: event.target.value })}
                    />
                  </label>
                  <label>
                    <span>MPN</span>
                    <input
                      type="text"
                      value={form.mpn ?? ""}
                      onChange={(event) => patch({ mpn: event.target.value })}
                    />
                  </label>
                </div>

                <label>
                  <span>Item location</span>
                  <div className="draft-editor__zipcode-row">
                    <input
                      type="text"
                      value={form.zipCode ?? ""}
                      placeholder="Zip code"
                      onChange={(event) => patch({ zipCode: event.target.value })}
                    />
                    <button type="button" aria-label="Locate zip code">
                      <LuMapPin />
                    </button>
                    <div className="draft-editor__location-chip">
                      <LuMapPin />
                      <span>{item.warehouse_country ?? "CN"} Warehouse</span>
                    </div>
                  </div>
                </label>

                <Toggle
                  active={form.allowBestOffer}
                  label="Allow Best Offer"
                  onClick={() => patch({ allowBestOffer: !form.allowBestOffer })}
                />
              </div>
            ) : null}

            {activeTab === "description" ? (
              <div className="draft-editor__description-card">
                <div className="draft-editor__description-head">
                  <h5>Description</h5>
                  <span className="draft-editor__description-hint">
                    Full supplier description — edit and save to keep your changes.
                  </span>
                </div>
                <DraftDescriptionEditor
                  editorKey={`draft-description-${item.id}`}
                  value={form.description ?? ""}
                  onChange={(description) => patch({ description })}
                />
              </div>
            ) : null}

            {activeTab === "variants" ? (
              <div className="draft-editor__variants">
                <div className="draft-editor__variants-head">
                  <strong>{form.variants.length} variant{form.variants.length !== 1 ? "s" : ""}</strong>
                  <button type="button" onClick={addVariant}>
                    <LuPlus />
                    <span>Add variant</span>
                  </button>
                </div>
                <div className="draft-editor__variant-list">
                  {form.variants.map((variant) => {
                    const isEditing = editingVariantId === variant.id;
                    const pricing = normalizeVariantPricing(variant, form.monitoring);

                    return (
                      <div
                        className={`draft-editor__variant-row ${isEditing ? "draft-editor__variant-row--editing" : ""}`}
                        key={variant.id}
                      >
                        <label className="draft-editor__variant-check">
                          <input
                            type="checkbox"
                            checked={variant.selected !== false}
                            onChange={(event) =>
                              updateVariant(variant.id, { selected: event.target.checked })
                            }
                          />
                        </label>
                        {variant.image ? (
                          <img src={variant.image} alt={variant.label} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="drafts-row__thumb">
                            <LuImage />
                          </div>
                        )}
                        <div className="draft-editor__variant-body">
                          {isEditing ? (
                            <div className="draft-editor__variant-edit-grid">
                              <label className="draft-editor__variant-edit-grid__name">
                                <span>Variant name</span>
                                <input
                                  type="text"
                                  value={pricing.label}
                                  onChange={(event) =>
                                    updateVariant(variant.id, { label: event.target.value })
                                  }
                                />
                              </label>
                              <label>
                                <span>Buy price</span>
                                <div className="draft-editor__money-input">
                                  <span>$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pricing.buyPrice}
                                    onChange={(event) =>
                                      updateVariantPricing(variant.id, "buyPrice", event.target.value)
                                    }
                                  />
                                </div>
                              </label>
                              <label>
                                <span>Listing price</span>
                                <div className="draft-editor__money-input">
                                  <span>$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={pricing.listingPrice}
                                    onChange={(event) =>
                                      updateVariantPricing(variant.id, "listingPrice", event.target.value)
                                    }
                                  />
                                </div>
                              </label>
                              <label>
                                <span>Profit</span>
                                <div className="draft-editor__money-input">
                                  <span>$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pricing.profit}
                                    onChange={(event) =>
                                      updateVariantPricing(variant.id, "profit", event.target.value)
                                    }
                                  />
                                </div>
                              </label>
                              <label>
                                <span>Qty</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={pricing.quantity}
                                  onChange={(event) =>
                                    updateVariant(variant.id, { quantity: event.target.value })
                                  }
                                />
                              </label>
                            </div>
                          ) : (
                            <>
                              <strong>{pricing.label}</strong>
                              <div className="draft-editor__variant-stats">
                                <div>
                                  <span>Buy price</span>
                                  <span>{formatMoney(pricing.buyPrice)}</span>
                                </div>
                                <div>
                                  <span>Listing price</span>
                                  <span>{formatMoney(pricing.listingPrice)}</span>
                                </div>
                                <div>
                                  <span>Profit</span>
                                  <span className="draft-editor__variant-profit">{formatMoney(pricing.profit)}</span>
                                </div>
                                <div>
                                  <span>Qty</span>
                                  <span>{pricing.quantity ?? 1}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="draft-editor__variant-actions">
                          {isEditing ? (
                            <button
                              type="button"
                              className="draft-editor__edit-btn"
                              onClick={() => setEditingVariantId(null)}
                            >
                              <LuCheck />
                              <span>Done</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="draft-editor__edit-btn"
                              onClick={() => setEditingVariantId(variant.id)}
                            >
                              <LuPencil />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="draft-editor__icon-btn draft-editor__icon-btn--danger"
                            aria-label={`Delete ${variant.label}`}
                            disabled={form.variants.length <= 1}
                            onClick={() => removeVariant(variant.id)}
                          >
                            <LuTrash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTab === "images" ? (
              <div className="draft-editor__images">
                <div className="draft-editor__images-head">
                  <div className="draft-editor__images-copy">
                    <h5>Product images</h5>
                    <p>Select images to include in your listing. The first selected image is used as the main image.</p>
                  </div>
                  <div>
                    <span>Selected</span>
                    <strong>{selectedImageCount}/12</strong>
                  </div>
                </div>
                <div className="draft-editor__image-grid">
                  {form.images.length ? (
                    form.images.slice(0, 12).map((image, index) => {
                      const isPrimary =
                        image.selected &&
                        selectedImagesOrdered[0]?.id === image.id;

                      return (
                        <div
                          key={image.id}
                          className={`draft-editor__image ${isPrimary ? "draft-editor__image--primary" : ""} ${image.selected ? "" : "draft-editor__image--unchecked"}`}
                        >
                          <label className="draft-editor__image-check">
                            <input
                              type="checkbox"
                              checked={image.selected !== false}
                              onChange={(event) =>
                                toggleImageSelected(image.id, event.target.checked)
                              }
                            />
                          </label>
                          <img src={image.url} alt="" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            className="draft-editor__image-delete"
                            aria-label="Remove image"
                            onClick={() => removeImage(image.id)}
                          >
                            <LuX />
                          </button>
                          {isPrimary ? <span className="draft-editor__image-main">Main</span> : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="drafts-empty">
                      <LuImage />
                      <span>No images available for this draft.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === "specifics" ? (
              <div className="draft-editor__specifics">
                <div className="draft-editor__specifics-toolbar">
                  <button type="button" className="draft-editor__add-inline" onClick={addSpecific}>
                    <LuPlus />
                    <span>Add custom specific</span>
                  </button>
                </div>
                <div className="draft-editor__specifics-table">
                  {form.specifics.map((row) => {
                    const isEditing = editingSpecificId === row.id;

                    return (
                      <div className="draft-editor__specifics-row" key={row.id}>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              className="draft-editor__specifics-input"
                              placeholder="Name"
                              value={row.name}
                              onChange={(event) =>
                                updateSpecific(row.id, { name: event.target.value })
                              }
                            />
                            <input
                              type="text"
                              className="draft-editor__specifics-input"
                              placeholder="Value"
                              value={row.value}
                              onChange={(event) =>
                                updateSpecific(row.id, { value: event.target.value })
                              }
                            />
                          </>
                        ) : (
                          <>
                            <span>{row.name || "—"}</span>
                            <div>{row.value || "—"}</div>
                          </>
                        )}
                        <button
                          type="button"
                          aria-label={`Edit ${row.name}`}
                          onClick={() => setEditingSpecificId(isEditing ? null : row.id)}
                        >
                          {isEditing ? <LuCheck /> : <LuPencil />}
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${row.name}`}
                          onClick={() => removeSpecific(row.id)}
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTab === "monitoring" ? (
              <div className="draft-editor__monitoring">
                <span className="draft-editor__monitoring-title">Price &amp; stock monitoring</span>
                <Toggle
                  active={form.monitoring.dynamicPricing}
                  label="Dynamic pricing"
                  onClick={() =>
                    patchMonitoring({ dynamicPricing: !form.monitoring.dynamicPricing })
                  }
                />
                <Toggle
                  active={form.monitoring.outOfStockMonitoring}
                  label="Out-of-stock monitoring"
                  onClick={() =>
                    patchMonitoring({
                      outOfStockMonitoring: !form.monitoring.outOfStockMonitoring,
                    })
                  }
                />
                <div className="draft-editor__grid draft-editor__grid--monitoring">
                  <label>
                    <span>Buy price</span>
                    <div className="draft-editor__money-input">
                      <span>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.monitoring.buyPrice}
                        onChange={(event) =>
                          patchMonitoring({ buyPrice: event.target.value })
                        }
                      />
                    </div>
                  </label>
                  <label>
                    <span>Profit</span>
                    <div className="draft-editor__money-input">
                      <span>$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={form.monitoring.profit}
                        onChange={(event) =>
                          patchMonitoring({ profit: event.target.value })
                        }
                      />
                    </div>
                  </label>
                </div>
                <p className="draft-editor__monitoring-note">
                  List price: ${(Number(form.monitoring.buyPrice) + Number(form.monitoring.profit)).toFixed(2)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DraftEditorPanel;
