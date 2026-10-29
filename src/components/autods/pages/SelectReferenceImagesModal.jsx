import { useEffect, useState } from "react";
import { LuCheck, LuCircleAlert, LuImage, LuSparkles, LuX, LuZap } from "react-icons/lu";

function SelectReferenceImagesModal({
  open,
  onClose,
  prompts = [],
  inputImages = [],
  currentReferenceIds = [],
  onConfirm,
  totalCost = 0,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (open) {
      // Initialize with existing reference IDs, or default to null
      setSelectedIds(
        prompts.map((_, idx) => {
          const existing = currentReferenceIds[idx];
          const exists = existing && inputImages.some((img) => img.id === existing);
          return exists ? existing : null;
        })
      );
    }
  }, [open, prompts, currentReferenceIds, inputImages]);

  if (!open) return null;

  const handleSelect = (promptIdx, imageId) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[promptIdx] = imageId;
      return next;
    });
  };

  const handleSelectFirstForAll = () => {
    if (inputImages.length === 0) return;
    const firstId = inputImages[0].id;
    setSelectedIds(prompts.map(() => firstId));
  };

  const validCount = selectedIds.filter(
    (id) => id && inputImages.some((img) => img.id === id)
  ).length;
  const isAllSelected = validCount === prompts.length;

  const handleSubmit = () => {
    if (!isAllSelected) return;
    onConfirm(selectedIds);
  };

  return (
    <div className="orders-modal" style={{ zIndex: 1250 }}>
      <div className="orders-modal__backdrop" onClick={onClose} />
      <div
        className="orders-modal__card"
        style={{
          maxWidth: 680,
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#e0e7ff",
                  color: "#4338ca",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <LuImage />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                Select Reference Images
              </h3>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
              Please choose a reference image for each prompt so the AI knows which product image to transform.
            </p>
          </div>
          <button
            type="button"
            className="orders-icon-btn"
            onClick={onClose}
            aria-label="Close"
            style={{ marginTop: -4 }}
          >
            <LuX />
          </button>
        </div>

        {/* Toolbar */}
        {inputImages.length > 0 && (
          <div
            style={{
              padding: "10px 24px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "#475569" }}>
              {inputImages.length} uploaded image{inputImages.length > 1 ? "s" : ""} available
            </span>
            <button
              type="button"
              onClick={handleSelectFirstForAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <LuSparkles style={{ fontSize: 13 }} />
              Use Image #1 for all prompts
            </button>
          </div>
        )}

        {/* Body list */}
        <div
          style={{
            padding: "16px 24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {prompts.map((promptText, promptIdx) => {
            const currentSelectedId = selectedIds[promptIdx];
            const chosenImg = inputImages.find((img) => img.id === currentSelectedId);
            const chosenIdx = chosenImg
              ? inputImages.findIndex((img) => img.id === currentSelectedId)
              : -1;
            const isAssigned = Boolean(chosenImg);

            return (
              <div
                key={promptIdx}
                style={{
                  border: isAssigned ? "1px solid #e2e8f0" : "1.5px solid #fca5a5",
                  backgroundColor: isAssigned ? "#ffffff" : "#fffbfb",
                  borderRadius: 12,
                  padding: 14,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        backgroundColor: isAssigned ? "#4f46e5" : "#ef4444",
                        color: "#ffffff",
                        borderRadius: 12,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Prompt {promptIdx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1e293b",
                        maxWidth: 380,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={promptText}
                    >
                      {promptText ? `"${promptText}"` : "(No description)"}
                    </span>
                  </div>

                  {isAssigned ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 650,
                        color: "#15803d",
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        padding: "2px 8px",
                        borderRadius: 8,
                      }}
                    >
                      <LuCheck /> Image #{chosenIdx + 1} Selected
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 650,
                        color: "#b91c1c",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: "2px 8px",
                        borderRadius: 8,
                      }}
                    >
                      <LuCircleAlert /> Selection Required
                    </span>
                  )}
                </div>

                {/* Thumbnails row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                  {inputImages.map((img, imgIdx) => {
                    const isSelected = img.id === currentSelectedId;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => handleSelect(promptIdx, img.id)}
                        style={{
                          position: "relative",
                          width: 66,
                          height: 66,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: isSelected ? "2.5px solid #4f46e5" : "1.5px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                          padding: 0,
                          cursor: "pointer",
                          outline: "none",
                          boxShadow: isSelected ? "0 0 0 3px rgba(79, 70, 229, 0.25)" : "none",
                          transform: isSelected ? "scale(1.04)" : "none",
                          transition: "all 0.15s ease",
                        }}
                        title={`Select Image #${imgIdx + 1} for Prompt ${promptIdx + 1}`}
                      >
                        <img
                          src={img.preview}
                          alt={`Uploaded ${imgIdx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: 2,
                            left: 2,
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            color: "#ffffff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 4,
                          }}
                        >
                          #{imgIdx + 1}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              backgroundColor: "#4f46e5",
                              color: "#ffffff",
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                            }}
                          >
                            <LuCheck />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {isAllSelected ? (
              <span style={{ fontSize: 12, fontWeight: 650, color: "#15803d", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <LuCheck style={{ fontSize: 15 }} /> All {prompts.length} reference images selected
              </span>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#b91c1c", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <LuCircleAlert style={{ fontSize: 15 }} />
                {validCount} of {prompts.length} selected — please select remaining
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              className="admin-page__btn admin-page__btn--ghost"
              onClick={onClose}
              style={{ fontSize: 13, padding: "8px 16px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-page__btn admin-page__btn--primary"
              disabled={!isAllSelected}
              onClick={handleSubmit}
              style={{
                fontSize: 13,
                padding: "8px 18px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: isAllSelected ? 1 : 0.5,
                cursor: isAllSelected ? "pointer" : "not-allowed",
              }}
            >
              <LuZap />
              Confirm &amp; Generate ({totalCost}⚡)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectReferenceImagesModal;

