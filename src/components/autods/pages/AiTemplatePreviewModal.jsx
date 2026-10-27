import { LuCircleAlert, LuPlus, LuX, LuZap } from "react-icons/lu";

function AiTemplatePreviewModal({ template, creditsPerImage = 1, userCredits = 0, onBuyCredits, onClose, onUse }) {
  if (!template) return null;

  const imageCount = template.prompts?.length || 1;
  const totalCost = imageCount * (creditsPerImage || 1);
  const isInsufficient = userCredits < totalCost;

  return (
    <div className="orders-modal">
      <div className="orders-modal__backdrop" onClick={onClose} />
      <div className="orders-modal__card admin-modal ai-gen-hub__tpl-modal">
        <div className="ai-gen-hub__tpl-modal-head">
          <div>
            <h3>{template.name}</h3>
            {template.category && <span style={{ fontSize: 12, color: "#64748b" }}>{template.category}</span>}
          </div>
          <button type="button" className="orders-icon-btn" aria-label="Close preview" onClick={onClose}>
            <LuX />
          </button>
        </div>

        {/* Cost and Balance Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
              Generation Cost
            </span>
            <strong style={{ fontSize: 15, color: "#4f46e5", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <LuZap style={{ color: "#f59e0b" }} />
              {totalCost} AI {totalCost === 1 ? "Credit" : "Credits"}
              <small style={{ color: "#64748b", fontWeight: 400, fontSize: 12 }}>
                ({creditsPerImage} credit{creditsPerImage > 1 ? "s" : ""}/img × {imageCount} img{imageCount > 1 ? "s" : ""})
              </small>
            </strong>
          </div>

          <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
                Your Balance
              </span>
              <strong style={{ fontSize: 14, color: isInsufficient ? "#ef4444" : "#10b981" }}>
                {userCredits.toLocaleString()} Credits
              </strong>
            </div>
            {onBuyCredits && (
              <button
                type="button"
                onClick={onBuyCredits}
                style={{
                  background: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 14,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <LuPlus style={{ fontSize: 12 }} /> Buy Credits
              </button>
            )}
          </div>
        </div>

        {isInsufficient && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              borderRadius: 8,
              border: "1px solid #fee2e2",
              marginBottom: 16,
              fontSize: 13,
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LuCircleAlert style={{ fontSize: 16, flexShrink: 0 }} />
              <span>
                You need <strong>{totalCost - userCredits} more credit(s)</strong> to generate all images with this template.
              </span>
            </div>
            {onBuyCredits && (
              <button
                type="button"
                onClick={onBuyCredits}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Top up now
              </button>
            )}
          </div>
        )}

        <div className="ai-gen-hub__preview-grid">
          {(template.example_images ?? []).map((image, index) => (
            <div className="ai-gen-hub__preview-item" key={image.id ?? image.url}>
              <span className="ai-gen-hub__preview-badge">{index + 1}</span>
              <img src={image.url} alt={`Example ${index + 1}`} />
            </div>
          ))}
        </div>

        <ol className="ai-gen-hub__tpl-prompts">
          {(template.prompts ?? []).map((item, index) => (
            <li key={index}>{item.prompt}</li>
          ))}
        </ol>

        <div className="admin-modal__footer">
          <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={onClose}>
            Close
          </button>
          {onUse && (
            <button
              type="button"
              className="admin-page__btn admin-page__btn--primary"
              onClick={() => onUse(template)}
            >
              Use Template ({totalCost}⚡)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiTemplatePreviewModal;

