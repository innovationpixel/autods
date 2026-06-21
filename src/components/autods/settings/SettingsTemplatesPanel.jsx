import { useEffect, useMemo, useState } from "react";
import { LuCopy, LuEye, LuPencil, LuPlus, LuTrash2, LuX } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { updateAccountSettings } from "../../../services/SettingsService";
import {
  TEMPLATE_PLACEHOLDERS,
  builtInTemplates,
  createBlankTemplate,
  fillTemplatePreview,
  templateLibraryCategories,
} from "./settingsTemplates";

function SettingsTemplatesPanel({ initialCustomTemplates = [], initialDefaultId = "", onTemplatesChange }) {
  const [view, setView] = useState("library");
  const [category, setCategory] = useState("all");
  const [customTemplates, setCustomTemplates] = useState(initialCustomTemplates);
  const [defaultTemplateId, setDefaultTemplateId] = useState(initialDefaultId || builtInTemplates[0].id);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editorName, setEditorName] = useState("");
  const [editorHtml, setEditorHtml] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCustomTemplates(initialCustomTemplates);
  }, [initialCustomTemplates]);

  useEffect(() => {
    if (initialDefaultId) {
      setDefaultTemplateId(initialDefaultId);
    }
  }, [initialDefaultId]);

  const filteredLibrary = useMemo(() => {
    if (category === "all") return builtInTemplates;
    return builtInTemplates.filter((template) => template.category === category);
  }, [category]);

  const persistTemplates = async (nextCustom, nextDefaultId = defaultTemplateId) => {
    setSaving(true);
    try {
      await updateAccountSettings({
        templates: {
          default_id: nextDefaultId,
          custom: nextCustom,
        },
      });
      onTemplatesChange?.({ custom: nextCustom, default_id: nextDefaultId });
      toast.success("Templates saved.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to save templates.");
    } finally {
      setSaving(false);
    }
  };

  const openEditor = (template) => {
    setEditingTemplate(template);
    setEditorName(template.name);
    setEditorHtml(template.html);
  };

  const saveEditor = async () => {
    if (!editorName.trim()) {
      toast.warn("Enter a template name.");
      return;
    }

    const payload = {
      ...editingTemplate,
      name: editorName.trim(),
      html: editorHtml,
      custom: true,
      updated_at: new Date().toISOString(),
    };

    let nextCustom;
    if (customTemplates.some((item) => item.id === payload.id)) {
      nextCustom = customTemplates.map((item) => (item.id === payload.id ? payload : item));
    } else {
      nextCustom = [...customTemplates, { ...payload, created_at: new Date().toISOString() }];
    }

    setCustomTemplates(nextCustom);
    setEditingTemplate(null);
    await persistTemplates(nextCustom);
  };

  const duplicateTemplate = async (template) => {
    const copy = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      custom: true,
      created_at: new Date().toISOString(),
    };
    const nextCustom = [...customTemplates, copy];
    setCustomTemplates(nextCustom);
    await persistTemplates(nextCustom);
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this custom template?")) return;
    const nextCustom = customTemplates.filter((item) => item.id !== templateId);
    let nextDefault = defaultTemplateId;
    if (defaultTemplateId === templateId) {
      nextDefault = builtInTemplates[0].id;
      setDefaultTemplateId(nextDefault);
    }
    setCustomTemplates(nextCustom);
    await persistTemplates(nextCustom, nextDefault);
  };

  const setAsDefault = async (templateId) => {
    setDefaultTemplateId(templateId);
    await persistTemplates(customTemplates, templateId);
  };

  const addBlankTemplate = () => {
    const blank = createBlankTemplate();
    openEditor(blank);
    setView("mine");
  };

  const insertPlaceholder = (key) => {
    setEditorHtml((current) => `${current}${current.endsWith("\n") || current === "" ? "" : "\n"}${key}`);
  };

  const renderTemplateCard = (template) => {
    const isDefault = defaultTemplateId === template.id;

    return (
      <article className="templates-settings__card" key={template.id}>
        <div
          className="templates-settings__preview"
          style={{ background: `linear-gradient(135deg, ${template.accent}22, #ffffff)` }}
        >
          <span className="templates-settings__preview-badge" style={{ background: template.accent }}>
            {template.category ?? "custom"}
          </span>
          <strong>{template.name}</strong>
        </div>

        <div className="templates-settings__card-body">
          {isDefault ? <span className="templates-settings__default-tag">Default</span> : null}
          <div className="templates-settings__card-actions">
            <button type="button" onClick={() => setPreviewTemplate(template)}>
              <LuEye />
              Preview
            </button>
            {template.custom ? (
              <button type="button" onClick={() => openEditor(template)}>
                <LuPencil />
                Edit
              </button>
            ) : (
              <button type="button" onClick={() => duplicateTemplate(template)}>
                <LuCopy />
                Copy
              </button>
            )}
            {!isDefault ? (
              <button type="button" onClick={() => setAsDefault(template.id)}>
                Set default
              </button>
            ) : null}
            {template.custom ? (
              <button type="button" className="templates-settings__danger" onClick={() => deleteTemplate(template.id)}>
                <LuTrash2 />
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="templates-settings card-wrapper">
      <header className="templates-settings__head">
        <div>
          <h2>Templates</h2>
          <p>Create, preview, and manage eBay listing description templates. Use placeholders like TITLE_HERE and FEATURES_HERE.</p>
        </div>
        <button type="button" className="templates-settings__add-btn" onClick={addBlankTemplate}>
          <LuPlus />
          Add Blank Template
        </button>
      </header>

      <div className="templates-settings__tabs">
        <button
          type="button"
          className={view === "mine" ? "templates-settings__tab templates-settings__tab--active" : "templates-settings__tab"}
          onClick={() => setView("mine")}
        >
          My Templates ({customTemplates.length})
        </button>
        <button
          type="button"
          className={view === "library" ? "templates-settings__tab templates-settings__tab--active" : "templates-settings__tab"}
          onClick={() => setView("library")}
        >
          Template Library ({builtInTemplates.length})
        </button>
      </div>

      {view === "library" ? (
        <div className="templates-settings__categories">
          {templateLibraryCategories.map((item) => (
            <button
              type="button"
              key={item.id}
              className={category === item.id ? "templates-settings__category templates-settings__category--active" : "templates-settings__category"}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="templates-settings__grid">
        {view === "mine"
          ? (customTemplates.length ? customTemplates.map(renderTemplateCard) : (
              <div className="templates-settings__empty">
                <strong>No custom templates yet</strong>
                <span>Copy one from the library or add a blank template to get started.</span>
              </div>
            ))
          : filteredLibrary.map(renderTemplateCard)}
      </div>

      {previewTemplate ? (
        <div className="marketplace-settings__modal">
          <button type="button" className="marketplace-settings__modal-backdrop" onClick={() => setPreviewTemplate(null)} aria-label="Close preview" />
          <div className="templates-settings__preview-modal">
            <button type="button" className="marketplace-settings__modal-close" onClick={() => setPreviewTemplate(null)} aria-label="Close">
              <LuX />
            </button>
            <h3>{previewTemplate.name}</h3>
            <div
              className="templates-settings__preview-frame"
              dangerouslySetInnerHTML={{ __html: fillTemplatePreview(previewTemplate.html) }}
            />
          </div>
        </div>
      ) : null}

      {editingTemplate ? (
        <div className="marketplace-settings__modal">
          <button
            type="button"
            className="marketplace-settings__modal-backdrop"
            onClick={() => setEditingTemplate(null)}
            aria-label="Close editor"
          />
          <div className="templates-settings__editor-modal">
            <button type="button" className="marketplace-settings__modal-close" onClick={() => setEditingTemplate(null)} aria-label="Close">
              <LuX />
            </button>
            <h3>{customTemplates.some((item) => item.id === editingTemplate.id) ? "Edit Template" : "New Template"}</h3>

            <label className="templates-settings__field">
              <span>Template name</span>
              <input type="text" value={editorName} onChange={(event) => setEditorName(event.target.value)} />
            </label>

            <div className="templates-settings__placeholders">
              <span>Insert placeholder:</span>
              {TEMPLATE_PLACEHOLDERS.map((item) => (
                <button type="button" key={item.key} onClick={() => insertPlaceholder(item.key)}>
                  {item.key}
                </button>
              ))}
            </div>

            <label className="templates-settings__field">
              <span>HTML content</span>
              <textarea rows={14} value={editorHtml} onChange={(event) => setEditorHtml(event.target.value)} />
            </label>

            <div className="marketplace-settings__modal-actions">
              <button type="button" className="marketplace-settings__modal-btn marketplace-settings__modal-btn--secondary" onClick={() => setPreviewTemplate({ ...editingTemplate, name: editorName, html: editorHtml })}>
                Preview
              </button>
              <button type="button" className="marketplace-settings__save-btn" disabled={saving} onClick={saveEditor}>
                {saving ? "Saving…" : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default SettingsTemplatesPanel;
