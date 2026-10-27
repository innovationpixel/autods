import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { LuEye, LuImage, LuLoader, LuPlus, LuSearch, LuZap } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { getAiTemplates, getAiConfig } from "../../../services/AiTemplateService";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import aiBackgroundQueue from "../../../services/AiBackgroundQueue";
import AiTemplatePreviewModal from "./AiTemplatePreviewModal";
import BuyAiCreditsModal from "./BuyAiCreditsModal";
import { SAMPLE_TEMPLATE } from "./aiTemplateSample";

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A-Z)" },
];

function TemplateCover({ template, creditsPerImage }) {
  const [cover, ...rest] = template.example_images ?? [];
  const thumbs = rest.slice(0, 3);
  const cost = (template.prompts?.length || 1) * (creditsPerImage || 1);

  return (
    <div className="ai-gen-hub__tpl-cover">
      {cover ? <img className="ai-gen-hub__tpl-cover-main" src={cover.url} alt={template.name} /> : (
        <div className="ai-gen-hub__tpl-cover-main ai-gen-hub__tpl-cover-empty"><LuImage /></div>
      )}
      {thumbs.length > 0 && (
        <div className="ai-gen-hub__tpl-cover-thumbs">
          {thumbs.map((thumb) => <img key={thumb.id ?? thumb.url} src={thumb.url} alt="" />)}
        </div>
      )}
      {template.badge && (
        <span className={`ai-gen-hub__tpl-badge ai-gen-hub__tpl-badge--${template.badge.toLowerCase()}`}>
          {template.badge}
        </span>
      )}
      <span
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          color: "#ffffff",
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 8px",
          borderRadius: 6,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          zIndex: 2,
        }}
      >
        <LuZap style={{ color: "#fbbf24", fontSize: 12 }} />
        {cost} {cost === 1 ? "Credit" : "Credits"}
      </span>
    </div>
  );
}

function AiTemplateGallery({ onUseTemplate, onViewMyImages }) {
  const authUser = useSelector(selectUser);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [category, setCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [creditsPerImage, setCreditsPerImage] = useState(1);
  const [userCredits, setUserCredits] = useState(authUser?.ai_credits ?? 0);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [queueState, setQueueState] = useState(aiBackgroundQueue.getState());

  useEffect(() => {
    return aiBackgroundQueue.subscribe(setQueueState);
  }, []);

  useEffect(() => {
    getAiConfig()
      .then((res) => {
        if (res.data?.credits_per_image) setCreditsPerImage(res.data.credits_per_image);
        if (res.data?.ai_credits !== undefined) setUserCredits(res.data.ai_credits);
      })
      .catch(() => {});

    getAiTemplates()
      .then((res) => {
        const published = (res.data?.templates ?? []).filter((template) => template.is_active !== false);
        setTemplates([...published, SAMPLE_TEMPLATE]);
      })
      .catch(() => {
        setTemplates([SAMPLE_TEMPLATE]);
        toast.error("Failed to load templates.");
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const counts = new Map();
    templates.forEach((template) => {
      if (template.category) counts.set(template.category, (counts.get(template.category) ?? 0) + 1);
    });
    return [...counts.entries()];
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = templates.filter((template) => {
      if (category !== "all" && template.category !== category) return false;
      return !query || `${template.name} ${template.category ?? ""}`.toLowerCase().includes(query);
    });

    return filtered.sort((a, b) => {
      if (sort === "name") return (a.name ?? "").localeCompare(b.name ?? "");
      if (sort === "newest") return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
      return (b.uses_count ?? 0) - (a.uses_count ?? 0);
    });
  }, [templates, search, sort, category]);

  return (
    <div className="ai-gen-hub__gallery">
      <div className="ai-gen-hub__gallery-top">
        <div>
          <h2>E-commerce Image Templates</h2>
          <p>Choose from professional templates and generate your product images in seconds.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#f8fafc",
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: 13, color: "#475569", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <LuZap style={{ color: "#f59e0b" }} />
              <strong>{userCredits.toLocaleString()}</strong> AI Credits
            </span>
            <button
              type="button"
              onClick={() => setBuyModalOpen(true)}
              style={{
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: 14,
                padding: "3px 10px",
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
          </div>

          {typeof onViewMyImages === "function" && (
            <button
              type="button"
              onClick={onViewMyImages}
              className="ai-gen-hub__btn-my-images"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 650,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="View all your generated images"
            >
              <LuImage style={{ fontSize: 15 }} />
              <span>My Images</span>
              {queueState.unviewedCount > 0 && (
                <span
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 10,
                    letterSpacing: "0.03em",
                  }}
                >
                  {queueState.unviewedCount} NEW
                </span>
              )}
            </button>
          )}

          <div className="ai-gen-hub__gallery-tools">
            <label className="ai-gen-hub__gallery-search">
              <LuSearch />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ai-gen-hub__gallery-chips">
        <button
          type="button"
          className={`ai-gen-hub__gallery-chip ${category === "all" ? "ai-gen-hub__gallery-chip--active" : ""}`}
          onClick={() => setCategory("all")}
        >
          All Templates ({templates.length})
        </button>
        {categories.map(([name, count]) => (
          <button
            type="button"
            key={name}
            className={`ai-gen-hub__gallery-chip ${category === name ? "ai-gen-hub__gallery-chip--active" : ""}`}
            onClick={() => setCategory(name)}
          >
            {name} ({count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="ai-gen-hub__empty">
          <LuLoader className="spin-icon" />
          <span>Loading templates…</span>
        </div>
      ) : visibleTemplates.length === 0 ? (
        <div className="ai-gen-hub__empty">
          <LuImage />
          <strong>No templates found</strong>
          <span>{templates.length === 0 ? "No templates have been published yet." : "Try a different search or category."}</span>
        </div>
      ) : (
        <div className="ai-gen-hub__gallery-grid">
          {visibleTemplates.map((template) => {
            const templateCost = (template.prompts?.length || 1) * creditsPerImage;
            return (
              <article className="ai-gen-hub__tpl-card" key={template.id}>
                <TemplateCover template={template} creditsPerImage={creditsPerImage} />
                <div className="ai-gen-hub__tpl-meta">
                  <strong>{template.name}</strong>
                  <div className="ai-gen-hub__tpl-meta-row">
                    <span><LuImage /> {template.prompts?.length ?? 0} Images</span>
                    <span style={{ color: "#4f46e5", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <LuZap style={{ fontSize: 13 }} />
                      {templateCost} {templateCost === 1 ? "Credit" : "Credits"}
                    </span>
                    {template.category && <em>{template.category}</em>}
                  </div>
                </div>
                <div className="ai-gen-hub__tpl-actions">
                  <button
                    type="button"
                    className="ai-gen-hub__btn ai-gen-hub__btn--primary"
                    onClick={() => onUseTemplate(template)}
                  >
                    Use Template ({templateCost}⚡)
                  </button>
                  <button
                    type="button"
                    className="ai-gen-hub__btn ai-gen-hub__btn--ghost"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <LuEye /> Preview
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <AiTemplatePreviewModal
        template={previewTemplate}
        creditsPerImage={creditsPerImage}
        userCredits={userCredits}
        onBuyCredits={() => setBuyModalOpen(true)}
        onClose={() => setPreviewTemplate(null)}
        onUse={(template) => {
          setPreviewTemplate(null);
          onUseTemplate(template);
        }}
      />

      <BuyAiCreditsModal
        open={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        currentCredits={userCredits}
        onSuccess={(data) => {
          if (data.ai_credits !== undefined) {
            setUserCredits(data.ai_credits);
          }
        }}
      />
    </div>
  );
}

export default AiTemplateGallery;
