import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LuCheck, LuExternalLink, LuFileText, LuLoader, LuShieldCheck, LuX } from "react-icons/lu";
import { formatLegalDate, renderLegalContent } from "../../utils/legalFormat";
import "../../assets/css/legal-documents.css";

function LegalDocumentModal({
  open,
  type = "terms", // "terms" | "privacy"
  documentData,
  loading = false,
  onAgree,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPrivacy = type === "privacy";
  const defaultTitle = isPrivacy ? "Privacy Policy" : "Terms & Conditions";
  const title = documentData?.title || defaultTitle;
  const pageRoute = isPrivacy ? "/privacy-policy" : "/terms-and-conditions";

  return (
    <div className="legal-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="legal-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="legal-modal__head">
          <div className="legal-modal__title-wrap">
            <span className="legal-modal__icon" aria-hidden="true">
              {isPrivacy ? <LuShieldCheck /> : <LuFileText />}
            </span>
            <div>
              <h3>{title}</h3>
              <span className="legal-modal__updated">
                Last updated: {formatLegalDate(documentData?.updated_at)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="legal-modal__close"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            <LuX />
          </button>
        </header>

        <div className="legal-modal__body">
          {loading ? (
            <div className="legal-modal__loading">
              <LuLoader className="spin-icon" />
              <span>Loading {title}…</span>
            </div>
          ) : (
            renderLegalContent(documentData?.content)
          )}
        </div>

        <footer className="legal-modal__foot">
          <Link
            to={pageRoute}
            target="_blank"
            rel="noopener noreferrer"
            className="legal-modal__external"
          >
            <span>Open in new tab</span>
            <LuExternalLink />
          </Link>

          <div className="legal-modal__actions">
            <button
              type="button"
              className="legal-modal__btn legal-modal__btn--ghost"
              onClick={onClose}
            >
              Close
            </button>
            {typeof onAgree === "function" ? (
              <button
                type="button"
                className="legal-modal__btn legal-modal__btn--primary"
                onClick={() => {
                  onAgree();
                  onClose?.();
                }}
              >
                <LuCheck />
                <span>I Agree &amp; Close</span>
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </div>
  );
}

export default LegalDocumentModal;

