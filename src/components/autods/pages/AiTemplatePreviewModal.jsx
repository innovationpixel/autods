import { LuX } from "react-icons/lu";

function AiTemplatePreviewModal({ template, onClose, onUse }) {
  if (!template) return null;

  return (
    <div className="orders-modal">
      <div className="orders-modal__backdrop" onClick={onClose} />
      <div className="orders-modal__card admin-modal ai-gen-hub__tpl-modal">
        <div className="ai-gen-hub__tpl-modal-head">
          <h3>{template.name}</h3>
          <button type="button" className="orders-icon-btn" aria-label="Close preview" onClick={onClose}>
            <LuX />
          </button>
        </div>

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
            <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={() => onUse(template)}>
              Use Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiTemplatePreviewModal;
