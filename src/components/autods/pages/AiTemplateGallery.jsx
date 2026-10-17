import { useEffect, useMemo, useState } from "react";
import { LuEye, LuImage, LuLoader, LuSearch } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { getAiTemplates } from "../../../services/AiTemplateService";
import AiTemplatePreviewModal from "./AiTemplatePreviewModal";
import { SAMPLE_TEMPLATE } from "./aiTemplateSample";

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A-Z)" },
];

function TemplateCover({ template }) {
  const [cover, ...rest] = template.example_images ?? [];
  const thumbs = rest.slice(0, 3);

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
    </div>
  );
}

function AiTemplateGallery({ onUseTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [category, setCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
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
          {visibleTemplates.map((template) => (
            <article className="ai-gen-hub__tpl-card" key={template.id}>
              <TemplateCover template={template} />
              <div className="ai-gen-hub__tpl-meta">
                <strong>{template.name}</strong>
                <div className="ai-gen-hub__tpl-meta-row">
                  <span><LuImage /> {template.prompts?.length ?? 0} Images</span>
                  {template.category && <em>{template.category}</em>}
                </div>
              </div>
              <div className="ai-gen-hub__tpl-actions">
                <button
                  type="button"
                  className="ai-gen-hub__btn ai-gen-hub__btn--primary"
                  onClick={() => onUseTemplate(template)}
                >
                  Use Template
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
          ))}
        </div>
      )}

      <AiTemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={(template) => {
          setPreviewTemplate(null);
          onUseTemplate(template);
        }}
      />
    </div>
  );
}

export default AiTemplateGallery;
