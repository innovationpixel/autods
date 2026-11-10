import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuArrowLeft, LuFileText, LuLoader, LuShieldCheck } from "react-icons/lu";
import { getLegalDocuments } from "../../services/LegalService";
import { getStoredToken } from "../../services/AuthService";
import { formatLegalDate, renderLegalContent } from "../../utils/legalFormat";
import "../../assets/css/legal-documents.css";

function LegalDocumentPage({ type = "terms" }) {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState({
    terms_and_conditions: null,
    privacy_policy: null,
  });
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(getStoredToken());

  useEffect(() => {
    let active = true;
    setLoading(true);
    getLegalDocuments()
      .then((res) => {
        if (!active) return;
        setDocs({
          terms_and_conditions: res.data?.terms_and_conditions ?? null,
          privacy_policy: res.data?.privacy_policy ?? null,
        });
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load legal agreement from server. Please refresh and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isPrivacy = type === "privacy";
  const currentDoc = isPrivacy ? docs.privacy_policy : docs.terms_and_conditions;
  const fallbackTitle = isPrivacy ? "Privacy Policy" : "Terms & Conditions";

  return (
    <div className="legal-doc-page">
      <div className="legal-doc-page__container">
        <header className="legal-doc-page__topbar">
          <Link to="/" className="legal-doc-page__logo">
            <img src="/autoprime-logo.png" alt="AutoDropshipPrime" />
          </Link>

          <nav className="legal-doc-page__nav">
            {isLoggedIn ? (
              <Link to="/" className="legal-doc-page__nav-btn legal-doc-page__nav-btn--primary">
                <LuArrowLeft />
                <span>Back to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link to="/user/login" className="legal-doc-page__nav-btn">
                  Sign In
                </Link>
                <Link to="/user/register" className="legal-doc-page__nav-btn legal-doc-page__nav-btn--primary">
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </header>

        <div className="legal-doc-page__tabs" role="navigation" aria-label="Legal Documents">
          <Link
            to="/terms-and-conditions"
            className={`legal-doc-page__tab ${!isPrivacy ? "legal-doc-page__tab--active" : ""}`}
          >
            <LuFileText />
            <span>Terms &amp; Conditions</span>
          </Link>
          <Link
            to="/privacy-policy"
            className={`legal-doc-page__tab ${isPrivacy ? "legal-doc-page__tab--active" : ""}`}
          >
            <LuShieldCheck />
            <span>Privacy Policy</span>
          </Link>
        </div>

        <article className="legal-doc-page__card">
          <div className="legal-doc-page__hero">
            <span className="legal-doc-page__eyebrow">
              {isPrivacy ? <LuShieldCheck /> : <LuFileText />}
              <span>Legal Agreement</span>
            </span>
            <h1>{currentDoc?.title || fallbackTitle}</h1>
            <p className="legal-doc-page__meta">
              Last updated: {formatLegalDate(currentDoc?.updated_at)}
            </p>
          </div>

          <div className="legal-doc-page__content">
            {loading ? (
              <div className="legal-modal__loading">
                <LuLoader className="spin-icon" />
                <span>Loading {fallbackTitle}…</span>
              </div>
            ) : error ? (
              <p className="text-danger">{error}</p>
            ) : (
              renderLegalContent(currentDoc?.content)
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default LegalDocumentPage;

