import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuDownload,
  LuEye,
  LuFolderArchive,
  LuImage,
  LuLayers,
  LuLoader,
  LuRefreshCcw,
  LuSearch,
  LuSparkles,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import {
  deleteGeneratedImage,
  getBundleZipUrl,
  getMyGeneratedImages,
  markAllImagesAsViewed,
  markImageAsViewed,
} from "../../../services/AiGenerationService";
import aiBackgroundQueue from "../../../services/AiBackgroundQueue";

function AiMyImagesGallery({ onExploreTemplates }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterUnviewedOnly, setFilterUnviewedOnly] = useState(false);

  // Active popup for single full-size image inspection
  const [popupImage, setPopupImage] = useState(null);
  const [popupList, setPopupList] = useState([]);
  const [popupIndex, setPopupIndex] = useState(0);

  // Active bundle modal for viewing all images in a template bundle
  const [activeBundle, setActiveBundle] = useState(null);
  const [zippingBundleId, setZippingBundleId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await getMyGeneratedImages({ limit: 100 });
      const items = res.data?.data ?? [];
      setImages(items);
      if (res.data?.unviewed_count !== undefined) {
        aiBackgroundQueue.setUnviewedCount(res.data.unviewed_count);
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to load generated images.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();

    // Listen for background generation completion events
    const handleUpdated = () => {
      loadImages();
    };
    window.addEventListener("autods:ai-images-updated", handleUpdated);
    return () => window.removeEventListener("autods:ai-images-updated", handleUpdated);
  }, []);

  const totalImagesCount = useMemo(() => images.length, [images]);

  const unviewedCount = useMemo(() => {
    return images.filter((img) => !img.is_viewed).length;
  }, [images]);

  /**
   * Group images into gallery items:
   * - If an image was created from a template (has bundle_id, template_id, or template_name),
   *   group all images from that template generation together into a "bundle".
   * - Otherwise, display as a standalone "single" image.
   */
  const galleryItems = useMemo(() => {
    const bundlesMap = new Map();
    const items = [];

    images.forEach((img) => {
      const isTemplateImage = Boolean(img.bundle_id || img.template_id || img.template_name);

      if (isTemplateImage) {
        // Group key: prefer explicit bundle_id, fallback to template + hourly batch timestamp
        const timeKey = img.created_at ? img.created_at.slice(0, 13) : "batch";
        const bundleKey = img.bundle_id || `tpl_${img.template_id || img.template_name || "gen"}_${timeKey}`;

        if (!bundlesMap.has(bundleKey)) {
          const bundleObj = {
            type: "bundle",
            id: bundleKey,
            bundle_id: img.bundle_id || bundleKey,
            bundle_name: img.bundle_name || img.template_name || "Template Bundle",
            template_name: img.template_name || img.bundle_name || "Template",
            template_id: img.template_id,
            images: [img],
            created_at: img.created_at,
          };
          bundlesMap.set(bundleKey, bundleObj);
          items.push(bundleObj);
        } else {
          bundlesMap.get(bundleKey).images.push(img);
        }
      } else {
        items.push({
          type: "single",
          id: `single_${img.id}`,
          image: img,
          created_at: img.created_at,
        });
      }
    });

    // Compute status flags for each bundle
    bundlesMap.forEach((b) => {
      b.unviewedCount = b.images.filter((img) => !img.is_viewed).length;
      b.is_viewed = b.unviewedCount === 0;
    });

    return items;
  }, [images]);

  /**
   * Filter items by unviewed status and search query
   */
  const filteredItems = useMemo(() => {
    let result = galleryItems;

    if (filterUnviewedOnly) {
      result = result.filter((item) => {
        if (item.type === "bundle") return item.unviewedCount > 0;
        return !item.image?.is_viewed;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) => {
        if (item.type === "bundle") {
          const matchTitle =
            (item.bundle_name && item.bundle_name.toLowerCase().includes(q)) ||
            (item.template_name && item.template_name.toLowerCase().includes(q));
          const matchPrompts = item.images.some(
            (img) => img.prompt && img.prompt.toLowerCase().includes(q)
          );
          return matchTitle || matchPrompts;
        }
        const img = item.image;
        return (
          (img.prompt && img.prompt.toLowerCase().includes(q)) ||
          (img.template_name && img.template_name.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [galleryItems, filterUnviewedOnly, search]);

  /**
   * Download a single image
   */
  const handleDownloadImage = async (img, event) => {
    if (event) event.stopPropagation();
    if (!img?.image_url) return;

    const url = img.image_url;
    const format = (img.format || "png").toLowerCase();
    const filename = `autods-ai-${img.id || "image"}.${format}`;

    try {
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Image downloaded.");
        return;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success("Image downloaded.");
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  /**
   * Download all images in a bundle as a ZIP archive
   */
  const handleDownloadBundleZip = async (bundle, event) => {
    if (event) event.stopPropagation();
    if (!bundle || !bundle.images || bundle.images.length === 0) return;

    setZippingBundleId(bundle.id);
    const toastId = toast.info(`Packaging ${bundle.images.length} images into ZIP…`, { autoClose: 6000 });

    try {
      const zip = new JSZip();
      const rawName = bundle.bundle_name || bundle.template_name || "ai-template-bundle";
      const safeSlug = rawName
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "bundle";

      const folder = zip.folder(safeSlug) || zip;

      // Add each image to zip
      for (let i = 0; i < bundle.images.length; i++) {
        const img = bundle.images[i];
        const url = img.image_url;
        if (!url) continue;

        const format = (img.format || "png").toLowerCase();
        const fileName = `${safeSlug}-${String(i + 1).padStart(2, "0")}.${format}`;

        if (url.startsWith("data:")) {
          const parts = url.split(",");
          const base64Data = parts[1];
          if (base64Data) {
            folder.file(fileName, base64Data, { base64: true });
          }
        } else {
          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            folder.file(fileName, blob);
          } catch (fetchErr) {
            console.warn("Could not fetch image blob for zip, skipping:", url, fetchErr);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${safeSlug}-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      toast.dismiss(toastId);
      toast.success(`Bundle downloaded: ${safeSlug}-bundle.zip`);
    } catch (err) {
      console.error("ZIP creation error:", err);
      toast.dismiss(toastId);

      // Fallback: trigger backend zip download endpoint if bundle_id exists
      if (bundle.bundle_id && !bundle.bundle_id.startsWith("tpl_")) {
        try {
          const backendZipUrl = getBundleZipUrl(bundle.bundle_id);
          window.open(backendZipUrl, "_blank");
          toast.success("Downloading ZIP from server…");
          return;
        } catch {
          // fall through
        }
      }
      toast.error("Failed to generate zip file.");
    } finally {
      setZippingBundleId(null);
    }
  };

  /**
   * Open the Bundle Modal to view all images in this template bundle
   */
  const handleOpenBundle = (bundle) => {
    setActiveBundle(bundle);

    // Optimistically mark unviewed images in this bundle as viewed
    const unviewedInBundle = bundle.images.filter((img) => !img.is_viewed);
    if (unviewedInBundle.length > 0) {
      const idsToMark = new Set(unviewedInBundle.map((img) => img.id));
      setImages((prev) =>
        prev.map((item) => (idsToMark.has(item.id) ? { ...item, is_viewed: true } : item))
      );
      unviewedInBundle.forEach((img) => {
        aiBackgroundQueue.decrementUnviewedCount();
        markImageAsViewed(img.id).catch(() => {});
      });
    }
  };

  /**
   * Inspect a single image in full-screen/modal popup
   */
  const handleViewSingleImage = (img, list = [], index = 0) => {
    setPopupImage(img);
    setPopupList(list.length ? list : [img]);
    setPopupIndex(index >= 0 ? index : 0);

    if (img && !img.is_viewed) {
      setImages((prev) =>
        prev.map((item) => (item.id === img.id ? { ...item, is_viewed: true } : item))
      );
      aiBackgroundQueue.decrementUnviewedCount();
      markImageAsViewed(img.id).catch(() => {});
    }
  };

  const handlePopupPrev = () => {
    if (popupIndex > 0) {
      const nextIdx = popupIndex - 1;
      const target = popupList[nextIdx];
      setPopupIndex(nextIdx);
      setPopupImage(target);
      if (target && !target.is_viewed) {
        setImages((prev) =>
          prev.map((item) => (item.id === target.id ? { ...item, is_viewed: true } : item))
        );
        aiBackgroundQueue.decrementUnviewedCount();
        markImageAsViewed(target.id).catch(() => {});
      }
    }
  };

  const handlePopupNext = () => {
    if (popupIndex < popupList.length - 1) {
      const nextIdx = popupIndex + 1;
      const target = popupList[nextIdx];
      setPopupIndex(nextIdx);
      setPopupImage(target);
      if (target && !target.is_viewed) {
        setImages((prev) =>
          prev.map((item) => (item.id === target.id ? { ...item, is_viewed: true } : item))
        );
        aiBackgroundQueue.decrementUnviewedCount();
        markImageAsViewed(target.id).catch(() => {});
      }
    }
  };

  const handleMarkAllViewed = async () => {
    try {
      await markAllImagesAsViewed();
      setImages((prev) => prev.map((item) => ({ ...item, is_viewed: true })));
      aiBackgroundQueue.setUnviewedCount(0);
      toast.success("All images marked as viewed.");
    } catch {
      toast.error("Failed to mark all as viewed.");
    }
  };

  const handleDeleteImage = async (id, event) => {
    if (event) event.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this generated image?")) return;

    setDeletingId(id);
    try {
      await deleteGeneratedImage(id);
      setImages((prev) => prev.filter((item) => item.id !== id));
      if (popupImage?.id === id) {
        setPopupImage(null);
      }
      if (activeBundle) {
        const remaining = activeBundle.images.filter((img) => img.id !== id);
        if (remaining.length === 0) {
          setActiveBundle(null);
        } else {
          setActiveBundle({ ...activeBundle, images: remaining });
        }
      }
      toast.success("Image deleted.");
    } catch {
      toast.error("Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteBundle = async (bundle, event) => {
    if (event) event.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete all ${bundle.images.length} images in this bundle?`
      )
    )
      return;

    const idsToDelete = bundle.images.map((img) => img.id);
    setDeletingId(bundle.id);
    try {
      await Promise.all(idsToDelete.map((id) => deleteGeneratedImage(id).catch(() => {})));
      const idsSet = new Set(idsToDelete);
      setImages((prev) => prev.filter((item) => !idsSet.has(item.id)));
      if (activeBundle?.id === bundle.id) {
        setActiveBundle(null);
      }
      toast.success("Bundle deleted.");
    } catch {
      toast.error("Failed to delete bundle.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="ai-my-images-section">
      <div className="ai-my-images-header">
        <div className="ai-my-images-header__copy">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2>My Generated Images</h2>
            <span className="ai-my-images-count-pill">
              {totalImagesCount} {totalImagesCount === 1 ? "Image" : "Images"}
            </span>
            {unviewedCount > 0 && (
              <span className="ai-my-images-new-pill">
                <LuSparkles /> {unviewedCount} NEW
              </span>
            )}
          </div>
          <p>
            Images created from templates are organized in bundles. Click any bundle to open,
            download individual images, or download the full bundle in ZIP.
          </p>
        </div>

        <div className="ai-my-images-header__actions">
          {unviewedCount > 0 && (
            <button
              type="button"
              className="ai-my-images-btn ai-my-images-btn--secondary"
              onClick={handleMarkAllViewed}
              title="Mark all new images as viewed"
            >
              <LuCheck /> Mark all as viewed
            </button>
          )}

          {typeof onExploreTemplates === "function" && (
            <button
              type="button"
              className="ai-my-images-btn ai-my-images-btn--primary"
              onClick={onExploreTemplates}
            >
              <LuSparkles /> Explore Templates
            </button>
          )}

          <button
            type="button"
            className="orders-icon-btn"
            onClick={loadImages}
            title="Refresh images"
            aria-label="Refresh images"
          >
            <LuRefreshCcw className={loading ? "spin-icon" : ""} />
          </button>
        </div>
      </div>

      <div className="ai-my-images-toolbar">
        <div className="ai-my-images-search">
          <LuSearch />
          <input
            type="text"
            placeholder="Search by prompt or template name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <LuX />
            </button>
          )}
        </div>

        <div className="ai-my-images-filters">
          <button
            type="button"
            className={`ai-my-images-filter-pill ${!filterUnviewedOnly ? "ai-my-images-filter-pill--active" : ""}`}
            onClick={() => setFilterUnviewedOnly(false)}
          >
            All Items ({galleryItems.length})
          </button>
          <button
            type="button"
            className={`ai-my-images-filter-pill ${filterUnviewedOnly ? "ai-my-images-filter-pill--active" : ""}`}
            onClick={() => setFilterUnviewedOnly(true)}
          >
            New Only {unviewedCount > 0 ? `(${unviewedCount})` : ""}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ai-my-images-loading">
          <LuLoader className="spin-icon" style={{ fontSize: 28, color: "#6d28d9" }} />
          <span>Loading your AI images…</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="ai-my-images-empty">
          <div className="ai-my-images-empty__icon">
            <LuImage />
          </div>
          <h3>{search ? "No matching images found" : "No generated images yet"}</h3>
          <p>
            {search
              ? "Try adjusting your search query or clear the filter."
              : "Pick an e-commerce template, upload your product image, and generate high-converting product shots in the background."}
          </p>
          {typeof onExploreTemplates === "function" && !search && (
            <button
              type="button"
              className="ai-my-images-btn ai-my-images-btn--primary"
              onClick={onExploreTemplates}
              style={{ marginTop: 12 }}
            >
              <LuSparkles /> Choose a Template
            </button>
          )}
        </div>
      ) : (
        <div className="ai-my-images-grid">
          {filteredItems.map((item) => {
            // RENDER TEMPLATE BUNDLE CARD
            if (item.type === "bundle") {
              const bundle = item;
              const hasNew = bundle.unviewedCount > 0;
              const previewImages = bundle.images.slice(0, 4);
              const collageClass = `ai-bundle-collage ai-bundle-collage--${Math.min(previewImages.length, 4)}`;

              return (
                <article
                  className={`ai-my-image-card ai-my-image-card--bundle ${hasNew ? "ai-my-image-card--new" : ""}`}
                  key={bundle.id}
                  onClick={() => handleOpenBundle(bundle)}
                >
                  <div className="ai-my-image-card__media">
                    <div className={collageClass}>
                      {previewImages.map((img, idx) => (
                        <div className="ai-bundle-collage__item" key={img.id || idx}>
                          <img src={img.image_url} alt={img.prompt || "Bundle image"} loading="lazy" />
                        </div>
                      ))}
                    </div>

                    {hasNew && (
                      <span className="ai-my-image-badge-new" title="New bundle images! Click to view.">
                        <LuSparkles /> NEW ({bundle.unviewedCount})
                      </span>
                    )}

                    <span className="ai-my-image-badge-template" title="Created from template">
                      <LuLayers /> {bundle.bundle_name}
                    </span>

                    <span className="ai-bundle-count-pill" title="Total images in this bundle">
                      <LuImage /> {bundle.images.length} {bundle.images.length === 1 ? "Image" : "Images"}
                    </span>

                    <div className="ai-my-image-card__overlay">
                      <button
                        type="button"
                        className="ai-my-image-overlay-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBundle(bundle);
                        }}
                        title="Open bundle and view all images"
                      >
                        <LuEye /> Open Bundle
                      </button>
                      <button
                        type="button"
                        className="ai-my-image-overlay-btn"
                        onClick={(e) => handleDownloadBundleZip(bundle, e)}
                        title="Download entire bundle as ZIP"
                        disabled={zippingBundleId === bundle.id}
                      >
                        {zippingBundleId === bundle.id ? (
                          <LuLoader className="spin-icon" />
                        ) : (
                          <LuFolderArchive />
                        )}
                        <span>ZIP</span>
                      </button>
                    </div>
                  </div>

                  <div className="ai-my-image-card__info">
                    <p className="ai-my-image-card__prompt" title={bundle.bundle_name}>
                      <strong style={{ color: "#0f172a", display: "block" }}>{bundle.bundle_name}</strong>
                      {bundle.images[0]?.prompt || `${bundle.images.length} images created together`}
                    </p>
                    <div className="ai-my-image-card__footer">
                      <span className="ai-my-image-card__date">
                        {bundle.created_at
                          ? new Date(bundle.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : "Recent"}
                      </span>
                      <div className="ai-my-image-card__actions">
                        <button
                          type="button"
                          className="ai-my-image-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBundle(bundle);
                          }}
                          title="Open bundle"
                        >
                          <LuEye />
                        </button>
                        <button
                          type="button"
                          className="ai-my-image-action-btn"
                          onClick={(e) => handleDownloadBundleZip(bundle, e)}
                          title="Download all in ZIP"
                          disabled={zippingBundleId === bundle.id}
                        >
                          {zippingBundleId === bundle.id ? (
                            <LuLoader className="spin-icon" />
                          ) : (
                            <LuDownload />
                          )}
                        </button>
                        <button
                          type="button"
                          className="ai-my-image-action-btn ai-my-image-action-btn--delete"
                          onClick={(e) => handleDeleteBundle(bundle, e)}
                          disabled={deletingId === bundle.id}
                          title="Delete full bundle"
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            // RENDER SINGLE IMAGE CARD (not created from template)
            const img = item.image;
            const isNew = !img.is_viewed;

            return (
              <article
                className={`ai-my-image-card ${isNew ? "ai-my-image-card--new" : ""}`}
                key={img.id}
                onClick={() => handleViewSingleImage(img, [img], 0)}
              >
                <div className="ai-my-image-card__media">
                  <img src={img.image_url} alt={img.prompt || "AI generated image"} loading="lazy" />

                  {isNew && (
                    <span className="ai-my-image-badge-new" title="New image! Click to view.">
                      <LuSparkles /> NEW
                    </span>
                  )}

                  {img.template_name && (
                    <span className="ai-my-image-badge-template">{img.template_name}</span>
                  )}

                  <div className="ai-my-image-card__overlay">
                    <button
                      type="button"
                      className="ai-my-image-overlay-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSingleImage(img, [img], 0);
                      }}
                      title="View in Popup"
                    >
                      <LuEye /> View
                    </button>
                    <button
                      type="button"
                      className="ai-my-image-overlay-btn"
                      onClick={(e) => handleDownloadImage(img, e)}
                      title="Download image"
                    >
                      <LuDownload /> Download
                    </button>
                  </div>
                </div>

                <div className="ai-my-image-card__info">
                  <p className="ai-my-image-card__prompt" title={img.prompt}>
                    {img.prompt}
                  </p>
                  <div className="ai-my-image-card__footer">
                    <span className="ai-my-image-card__date">
                      {img.created_at
                        ? new Date(img.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent"}
                    </span>
                    <div className="ai-my-image-card__actions">
                      <button
                        type="button"
                        className="ai-my-image-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSingleImage(img, [img], 0);
                        }}
                        title="View image details in popup"
                      >
                        <LuEye />
                      </button>
                      <button
                        type="button"
                        className="ai-my-image-action-btn"
                        onClick={(e) => handleDownloadImage(img, e)}
                        title="Download image"
                      >
                        <LuDownload />
                      </button>
                      <button
                        type="button"
                        className="ai-my-image-action-btn ai-my-image-action-btn--delete"
                        onClick={(e) => handleDeleteImage(img.id, e)}
                        disabled={deletingId === img.id}
                        title="Delete image"
                      >
                        <LuTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ======================================================================
          BUNDLE MODAL: Displays all images in this template bundle together
          with "Download All (ZIP)" button and individual download buttons
         ====================================================================== */}
      {activeBundle && (
        <div
          className="ai-bundle-modal-backdrop"
          onClick={() => setActiveBundle(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="ai-bundle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-bundle-modal__header">
              <div className="ai-bundle-modal__title-group">
                <div className="ai-bundle-modal__title-row">
                  <span className="ai-bundle-tag">
                    <LuLayers /> Template Bundle
                  </span>
                  <h3>{activeBundle.bundle_name}</h3>
                </div>
                <p className="ai-bundle-modal__subtitle">
                  {activeBundle.images.length} {activeBundle.images.length === 1 ? "image" : "images"} generated
                  from this template •{" "}
                  {activeBundle.created_at
                    ? new Date(activeBundle.created_at).toLocaleString()
                    : "Recently generated"}
                </p>
              </div>

              <div className="ai-bundle-modal__actions">
                <button
                  type="button"
                  className="ai-bundle-modal__btn-zip"
                  onClick={(e) => handleDownloadBundleZip(activeBundle, e)}
                  disabled={zippingBundleId === activeBundle.id}
                  title="Download all bundle images in a ZIP file"
                >
                  {zippingBundleId === activeBundle.id ? (
                    <LuLoader className="spin-icon" />
                  ) : (
                    <LuFolderArchive />
                  )}
                  <span>
                    {zippingBundleId === activeBundle.id
                      ? "Creating ZIP…"
                      : `Download All (${activeBundle.images.length} in ZIP)`}
                  </span>
                </button>

                <button
                  type="button"
                  className="ai-bundle-modal__btn-close"
                  onClick={() => setActiveBundle(null)}
                  aria-label="Close bundle"
                  title="Close bundle"
                >
                  <LuX />
                </button>
              </div>
            </div>

            <div className="ai-bundle-modal__body">
              <div className="ai-bundle-images-grid">
                {activeBundle.images.map((img, idx) => (
                  <div className="ai-bundle-item-card" key={img.id || idx}>
                    <div
                      className="ai-bundle-item-card__media"
                      onClick={() => handleViewSingleImage(img, activeBundle.images, idx)}
                    >
                      <img src={img.image_url} alt={img.prompt || `Bundle image ${idx + 1}`} loading="lazy" />
                      <div className="ai-bundle-item-card__overlay">
                        <button
                          type="button"
                          className="ai-my-image-overlay-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSingleImage(img, activeBundle.images, idx);
                          }}
                        >
                          <LuEye /> View Full
                        </button>
                      </div>
                    </div>

                    <div className="ai-bundle-item-card__content">
                      <p className="ai-bundle-item-card__prompt" title={img.prompt}>
                        {img.prompt}
                      </p>
                      <div className="ai-bundle-item-card__meta-row">
                        <span>
                          {img.width && img.height ? `${img.width}×${img.height}px` : "1024×1024px"}
                        </span>
                        <span>•</span>
                        <span>{String(img.format || "PNG").toUpperCase()}</span>
                      </div>

                      <div className="ai-bundle-item-card__actions">
                        <button
                          type="button"
                          className="ai-bundle-item-card__btn-download"
                          onClick={(e) => handleDownloadImage(img, e)}
                          title="Download this image"
                        >
                          <LuDownload />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          className="ai-bundle-item-card__btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSingleImage(img, activeBundle.images, idx);
                          }}
                          title="View image details"
                        >
                          <LuEye />
                        </button>

                        <button
                          type="button"
                          className="ai-bundle-item-card__btn-icon ai-bundle-item-card__btn-icon--delete"
                          onClick={(e) => handleDeleteImage(img.id, e)}
                          disabled={deletingId === img.id}
                          title="Delete this image"
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SINGLE IMAGE POPUP MODAL: High-res inspection & details
         ====================================================================== */}
      {popupImage && (
        <div
          className="ai-image-popup-backdrop"
          onClick={() => setPopupImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="ai-image-popup-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ai-image-popup-close"
              onClick={() => setPopupImage(null)}
              aria-label="Close image popup"
            >
              <LuX />
            </button>

            {popupList.length > 1 && popupIndex > 0 && (
              <button
                type="button"
                className="ai-image-popup-nav ai-image-popup-nav--prev"
                onClick={handlePopupPrev}
                aria-label="Previous image"
                title="Previous image"
              >
                <LuChevronLeft />
              </button>
            )}

            {popupList.length > 1 && popupIndex < popupList.length - 1 && (
              <button
                type="button"
                className="ai-image-popup-nav ai-image-popup-nav--next"
                onClick={handlePopupNext}
                aria-label="Next image"
                title="Next image"
              >
                <LuChevronRight />
              </button>
            )}

            <div className="ai-image-popup-content">
              <div className="ai-image-popup-media">
                <img src={popupImage.image_url} alt={popupImage.prompt} />
              </div>

              <div className="ai-image-popup-details">
                <div className="ai-image-popup-details__header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="ai-image-popup-tag">
                      <LuSparkles /> AI Generated
                    </span>
                    {(popupImage.bundle_name || popupImage.template_name) && (
                      <span className="ai-image-popup-tag ai-image-popup-tag--template">
                        <LuLayers /> {popupImage.bundle_name || popupImage.template_name}
                      </span>
                    )}
                    {popupImage.ratio && (
                      <span className="ai-image-popup-meta-chip">{popupImage.ratio}</span>
                    )}
                  </div>
                  <span className="ai-image-popup-date">
                    {popupImage.created_at
                      ? new Date(popupImage.created_at).toLocaleString()
                      : "Recently generated"}
                  </span>
                </div>

                <div className="ai-image-popup-section">
                  <h4>Prompt</h4>
                  <p className="ai-image-popup-prompt">{popupImage.prompt}</p>
                </div>

                {popupImage.revised_prompt && (
                  <div className="ai-image-popup-section">
                    <h4>Enhanced AI Prompt</h4>
                    <p className="ai-image-popup-revised">{popupImage.revised_prompt}</p>
                  </div>
                )}

                <div className="ai-image-popup-meta-grid">
                  <div className="ai-image-popup-meta-item">
                    <span className="ai-image-popup-meta-label">Dimensions</span>
                    <strong className="ai-image-popup-meta-value">
                      {popupImage.width && popupImage.height
                        ? `${popupImage.width} × ${popupImage.height}px`
                        : "1024 × 1024px"}
                    </strong>
                  </div>
                  <div className="ai-image-popup-meta-item">
                    <span className="ai-image-popup-meta-label">Format</span>
                    <strong className="ai-image-popup-meta-value">
                      {String(popupImage.format || "PNG").toUpperCase()}
                    </strong>
                  </div>
                  <div className="ai-image-popup-meta-item">
                    <span className="ai-image-popup-meta-label">Credits Used</span>
                    <strong className="ai-image-popup-meta-value">
                      {popupImage.credits_used ?? 1}{" "}
                      {(popupImage.credits_used ?? 1) === 1 ? "Credit" : "Credits"}
                    </strong>
                  </div>
                </div>

                <div className="ai-image-popup-actions">
                  <button
                    type="button"
                    className="ai-my-images-btn ai-my-images-btn--primary"
                    style={{ flex: 1, justifyContent: "center", height: 42 }}
                    onClick={(e) => handleDownloadImage(popupImage, e)}
                  >
                    <LuDownload /> Download Image
                  </button>
                  <button
                    type="button"
                    className="ai-my-images-btn ai-my-images-btn--delete"
                    onClick={(e) => handleDeleteImage(popupImage.id, e)}
                    title="Delete image"
                  >
                    <LuTrash2 />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AiMyImagesGallery;
