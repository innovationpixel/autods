import { useEffect, useMemo, useState } from "react";
import {
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuDownload,
  LuEye,
  LuImage,
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
  const [activePopupIndex, setActivePopupIndex] = useState(null);
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

  const unviewedCount = useMemo(() => {
    return images.filter((img) => !img.is_viewed).length;
  }, [images]);

  const filteredImages = useMemo(() => {
    let result = images;
    if (filterUnviewedOnly) {
      result = result.filter((img) => !img.is_viewed);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (img) =>
          (img.prompt && img.prompt.toLowerCase().includes(q)) ||
          (img.template_name && img.template_name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [images, filterUnviewedOnly, search]);

  const handleDownloadImage = async (img, event) => {
    if (event) event.stopPropagation();
    if (!img?.image_url) return;

    const url = img.image_url;
    const filename = `autods-ai-${img.id || "image"}.${img.format || "png"}`;

    try {
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

  const handleViewImage = async (index) => {
    setActivePopupIndex(index);
    const target = filteredImages[index];
    if (target && !target.is_viewed) {
      // Optimistically update UI
      setImages((prev) =>
        prev.map((item) => (item.id === target.id ? { ...item, is_viewed: true } : item))
      );
      aiBackgroundQueue.decrementUnviewedCount();
      try {
        await markImageAsViewed(target.id);
      } catch {
        // Silently handled
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
      if (activePopupIndex !== null) {
        setActivePopupIndex(null);
      }
      toast.success("Image deleted.");
    } catch {
      toast.error("Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const currentPopupImage = activePopupIndex !== null ? filteredImages[activePopupIndex] : null;

  const handleNextPopup = (e) => {
    if (e) e.stopPropagation();
    if (activePopupIndex < filteredImages.length - 1) {
      handleViewImage(activePopupIndex + 1);
    }
  };

  const handlePrevPopup = (e) => {
    if (e) e.stopPropagation();
    if (activePopupIndex > 0) {
      handleViewImage(activePopupIndex - 1);
    }
  };

  return (
    <section className="ai-my-images-section">
      <div className="ai-my-images-header">
        <div className="ai-my-images-header__copy">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2>My Generated Images</h2>
            <span className="ai-my-images-count-pill">
              {images.length} {images.length === 1 ? "Image" : "Images"}
            </span>
            {unviewedCount > 0 && (
              <span className="ai-my-images-new-pill">
                <LuSparkles /> {unviewedCount} NEW
              </span>
            )}
          </div>
          <p>Browse, preview in popup, and download all your AI-generated product images.</p>
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
            All Images ({images.length})
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
      ) : filteredImages.length === 0 ? (
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
          {filteredImages.map((img, index) => {
            const isNew = !img.is_viewed;
            return (
              <article
                className={`ai-my-image-card ${isNew ? "ai-my-image-card--new" : ""}`}
                key={img.id}
                onClick={() => handleViewImage(index)}
              >
                <div className="ai-my-image-card__media">
                  <img
                    src={img.image_url}
                    alt={img.prompt || "AI generated image"}
                    loading="lazy"
                  />

                  {isNew && (
                    <span className="ai-my-image-badge-new" title="New image! Click to view.">
                      <LuSparkles /> NEW
                    </span>
                  )}

                  {img.template_name && (
                    <span className="ai-my-image-badge-template">
                      {img.template_name}
                    </span>
                  )}

                  <div className="ai-my-image-card__overlay">
                    <button
                      type="button"
                      className="ai-my-image-overlay-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewImage(index);
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
                      {img.created_at ? new Date(img.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Recent"}
                    </span>
                    <div className="ai-my-image-card__actions">
                      <button
                        type="button"
                        className="ai-my-image-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewImage(index);
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

      {/* View in Popup Modal */}
      {currentPopupImage && (
        <div
          className="ai-image-popup-backdrop"
          onClick={() => setActivePopupIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ai-image-popup-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ai-image-popup-close"
              onClick={() => setActivePopupIndex(null)}
              aria-label="Close image popup"
            >
              <LuX />
            </button>

            {activePopupIndex > 0 && (
              <button
                type="button"
                className="ai-image-popup-nav ai-image-popup-nav--prev"
                onClick={handlePrevPopup}
                aria-label="Previous image"
                title="Previous image"
              >
                <LuChevronLeft />
              </button>
            )}

            {activePopupIndex < filteredImages.length - 1 && (
              <button
                type="button"
                className="ai-image-popup-nav ai-image-popup-nav--next"
                onClick={handleNextPopup}
                aria-label="Next image"
                title="Next image"
              >
                <LuChevronRight />
              </button>
            )}

            <div className="ai-image-popup-content">
              <div className="ai-image-popup-media">
                <img
                  src={currentPopupImage.image_url}
                  alt={currentPopupImage.prompt}
                />
              </div>

              <div className="ai-image-popup-details">
                <div className="ai-image-popup-details__header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="ai-image-popup-tag">
                      <LuSparkles /> AI Generated
                    </span>
                    {currentPopupImage.template_name && (
                      <span className="ai-image-popup-tag ai-image-popup-tag--template">
                        {currentPopupImage.template_name}
                      </span>
                    )}
                    {currentPopupImage.ratio && (
                      <span className="ai-image-popup-meta-chip">
                        {currentPopupImage.ratio}
                      </span>
                    )}
                  </div>
                  <span className="ai-image-popup-date">
                    {currentPopupImage.created_at
                      ? new Date(currentPopupImage.created_at).toLocaleString()
                      : "Recently generated"}
                  </span>
                </div>

                <div className="ai-image-popup-section">
                  <h4>Prompt</h4>
                  <p className="ai-image-popup-prompt">{currentPopupImage.prompt}</p>
                </div>

                {currentPopupImage.revised_prompt && (
                  <div className="ai-image-popup-section">
                    <h4>Enhanced AI Prompt</h4>
                    <p className="ai-image-popup-revised">
                      {currentPopupImage.revised_prompt}
                    </p>
                  </div>
                )}

                <div className="ai-image-popup-meta-grid">
                  <div>
                    <span>Dimensions</span>
                    <strong>
                      {currentPopupImage.width && currentPopupImage.height
                        ? `${currentPopupImage.width} × ${currentPopupImage.height}px`
                        : "1024 × 1024px"}
                    </strong>
                  </div>
                  <div>
                    <span>Format</span>
                    <strong>{String(currentPopupImage.format || "PNG").toUpperCase()}</strong>
                  </div>
                  <div>
                    <span>Credits Used</span>
                    <strong>{currentPopupImage.credits_used ?? 1} Credit</strong>
                  </div>
                </div>

                <div className="ai-image-popup-actions">
                  <button
                    type="button"
                    className="ai-my-images-btn ai-my-images-btn--primary"
                    style={{ flex: 1, justifyContent: "center", height: 42 }}
                    onClick={(e) => handleDownloadImage(currentPopupImage, e)}
                  >
                    <LuDownload /> Download Image
                  </button>
                  <button
                    type="button"
                    className="ai-my-images-btn ai-my-images-btn--delete"
                    onClick={(e) => handleDeleteImage(currentPopupImage.id, e)}
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
