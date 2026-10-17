import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuArrowLeft,
  LuEye,
  LuImage,
  LuLoader,
  LuPencil,
  LuPlus,
  LuSparkles,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import ConfirmModal from "../ConfirmModal";
import {
  createAdminAiTemplate,
  deleteAdminAiTemplate,
  getAdminAiTemplates,
  updateAdminAiTemplate,
} from "../../../services/AiTemplateService";
import { MAX_PROMPTS, TEMPLATE_BADGES } from "./aiStudioConstants";
import { newAssetId } from "./aiStudioUtils";
import ImageTemplateSections from "./ImageTemplateSections";
import AiTemplatePreviewModal from "./AiTemplatePreviewModal";
import { useImageTemplateForm } from "./useImageTemplateForm";

function toEditorAssets(items = []) {
  return items.map((item) => ({ id: `remote-${item.id}`, remoteId: item.id, file: null, preview: item.url }));
}

function TemplateEditor({ template, onBack, onSaved }) {
  const inputImages = toEditorAssets(template?.input_images);
  const form = useImageTemplateForm({
    inputImages,
    logoPreview: template?.logo_url ?? null,
    logoPosition: template?.logo_position,
    logoSizePercent: template?.logo_size_percent,
    aspectRatio: template?.aspect_ratio,
    outputWidth: template?.width,
    outputHeight: template?.height,
    outputFormat: template?.format ? template.format.toUpperCase() : undefined,
    prompts: template?.prompts?.map((item) => item.prompt ?? ""),
    referenceImageIds: template?.prompts?.map((item) => inputImages[item.reference_index]?.id ?? null),
  });

  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "");
  const [badge, setBadge] = useState(template?.badge ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [exampleImages, setExampleImages] = useState(toEditorAssets(template?.example_images));
  const [saving, setSaving] = useState(false);

  const addExampleImages = (event) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    const remaining = MAX_PROMPTS - exampleImages.length;
    if (remaining <= 0) {
      toast.warn(`You can add up to ${MAX_PROMPTS} example images.`);
      return;
    }
    setExampleImages((prev) => [
      ...prev,
      ...files.slice(0, remaining).map((file) => ({ id: newAssetId(), file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removeExampleImage = (id) => {
    setExampleImages((prev) => prev.filter((image) => image.id !== id));
  };

  const saveTemplate = async () => {
    if (!name.trim()) {
      toast.warn("Enter a template name.");
      return;
    }
    if (form.prompts.some((prompt) => !prompt.trim())) {
      toast.warn("Fill in every prompt before saving.");
      return;
    }
    if (exampleImages.length === 0) {
      toast.warn("Add at least one example output image.");
      return;
    }

    const keptInputs = form.inputImages.filter((image) => image.remoteId != null);
    const newInputs = form.inputImages.filter((image) => image.remoteId == null && image.file);
    const orderedInputs = [...keptInputs, ...newInputs];

    const data = new FormData();
    data.append("name", name.trim());
    data.append("category", category.trim());
    data.append("badge", badge);
    data.append("is_active", isActive ? "1" : "0");
    data.append("aspect_ratio", form.aspectRatio);
    data.append("width", form.outputWidth);
    data.append("height", form.outputHeight);
    data.append("format", form.outputFormat.toLowerCase());
    data.append("logo_position", form.logoPosition);
    data.append("logo_size_percent", form.logoSizePercent);

    form.prompts.forEach((prompt, index) => {
      const referenceIndex = orderedInputs.findIndex((image) => image.id === form.referenceImageIds[index]);
      data.append(`prompts[${index}][prompt]`, prompt.trim());
      data.append(`prompts[${index}][reference_index]`, referenceIndex >= 0 ? referenceIndex : "");
    });

    keptInputs.forEach((image) => data.append("keep_input_image_ids[]", image.remoteId));
    newInputs.forEach((image) => data.append("input_images[]", image.file));

    if (form.logoFile) data.append("logo", form.logoFile);
    else if (template?.logo_url && !form.logoPreview) data.append("remove_logo", "1");

    exampleImages
      .filter((image) => image.remoteId != null)
      .forEach((image) => data.append("keep_example_image_ids[]", image.remoteId));
    exampleImages
      .filter((image) => image.remoteId == null && image.file)
      .forEach((image) => data.append("example_images[]", image.file));

    setSaving(true);
    try {
      if (template) {
        await updateAdminAiTemplate(template.id, data);
        toast.success("Template updated.");
      } else {
        await createAdminAiTemplate(data);
        toast.success("Template created.");
      }
      onSaved();
    } catch (err) {
      const message = err.response?.data?.message
        ?? Object.values(err.response?.data?.errors ?? {})[0]?.[0]
        ?? "Failed to save template.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const previewCard = (
    <article className="ai-gen-hub__result">
      <div className="ai-gen-hub__section-head">
        <span className="ai-gen-hub__section-badge">5</span>
        <div>
          <h3>Preview (Example Output)</h3>
          <p>Upload example images users will see for this template. The first one is the cover.</p>
        </div>
      </div>

      <div className="ai-gen-hub__image-grid ai-gen-hub__image-grid--large">
        {exampleImages.map((image, index) => (
          <div className="ai-gen-hub__image-thumb" key={image.id}>
            <span className="ai-gen-hub__preview-badge">{index + 1}</span>
            <img src={image.preview} alt={`Example ${index + 1}`} />
            <button type="button" onClick={() => removeExampleImage(image.id)}>
              <LuX />
            </button>
          </div>
        ))}
        {exampleImages.length < MAX_PROMPTS && (
          <label className="ai-gen-hub__image-add-tile">
            <LuPlus />
            <span>Add Example</span>
            <input type="file" accept="image/*" multiple onChange={addExampleImages} />
          </label>
        )}
      </div>
    </article>
  );

  const footer = (
    <div className="ai-gen-hub__action-bar">
      <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={onBack} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="ai-gen-hub__btn ai-gen-hub__btn--primary" disabled={saving} onClick={saveTemplate}>
        {saving ? <LuLoader className="spin-icon" /> : <LuSparkles />}
        <span>{saving ? "Saving…" : template ? "Save Changes" : "Create Template"}</span>
      </button>
    </div>
  );

  return (
    <section className="ai-gen-hub card-wrapper">
      <div className="ai-gen-hub__generator-top">
        <div>
          <h2>{template ? "Edit E-commerce Image Template" : "Create E-commerce Image Template"}</h2>
          <p>Set up the template, upload images, add a logo, choose settings and write prompts for each output image.</p>
        </div>
        <button type="button" className="ai-gen-hub__back-btn" onClick={onBack} disabled={saving}>
          <LuArrowLeft /> Back to Templates
        </button>
      </div>

      <article className="ai-gen-hub__card ai-gen-hub__details">
        <label className="ai-gen-hub__field">
          <span className="ai-gen-hub__field-label">Template name</span>
          <input type="text" placeholder="e.g. Product Showcase Pack" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="ai-gen-hub__field">
          <span className="ai-gen-hub__field-label">Category</span>
          <input type="text" placeholder="e.g. Amazon Style" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="ai-gen-hub__field">
          <span className="ai-gen-hub__field-label">Badge</span>
          <select value={badge} onChange={(e) => setBadge(e.target.value)}>
            <option value="">None</option>
            {TEMPLATE_BADGES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="ai-gen-hub__toggle-row">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Published (visible to users)</span>
        </label>
      </article>

      <ImageTemplateSections
        form={form}
        inputDescription="Upload sample product images (used as reference options for prompts)."
        logoDescription="Default logo placement for users of this template."
        previewCard={previewCard}
        footer={footer}
      />
    </section>
  );
}

function AdminAiTemplatesPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") navigate("/");
  }, [role, navigate]);

  const loadTemplates = () => {
    getAdminAiTemplates()
      .then((res) => setTemplates(res.data?.templates ?? []))
      .catch(() => toast.error("Failed to load templates."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (role === "super_admin") loadTemplates();
  }, [role]);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteAdminAiTemplate(deleteConfirm.id);
      toast.success("Template deleted.");
      setDeleteConfirm(null);
      loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (role !== "super_admin") return null;

  if (editor) {
    return (
      <TemplateEditor
        key={editor.template?.id ?? "new"}
        template={editor.template}
        onBack={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          loadTemplates();
        }}
      />
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuImage /> AI Templates</span>
          <h1>Manage Image Templates</h1>
          <p>Templates you publish here are what users pick from before generating product images.</p>
        </div>
        <button type="button" className="admin-page__btn admin-page__btn--primary" onClick={() => setEditor({ template: null })}>
          <LuPlus />
          <span>Create Template</span>
        </button>
      </header>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading templates…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Category</th>
                <th>Badge</th>
                <th>Images</th>
                <th>Status</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {templates.length ? templates.map((template) => (
                <tr key={template.id}>
                  <td>
                    <div className="ai-gen-hub__admin-name">
                      {template.example_images?.[0]
                        ? <img src={template.example_images[0].url} alt="" />
                        : <span className="ai-gen-hub__admin-name-empty"><LuImage /></span>}
                      <strong>{template.name}</strong>
                    </div>
                  </td>
                  <td>{template.category || "—"}</td>
                  <td>{template.badge || "—"}</td>
                  <td>{template.prompts?.length ?? 0}</td>
                  <td>
                    <span className={template.is_active ? "admin-badge admin-badge--success" : "admin-badge admin-badge--muted"}>
                      {template.is_active ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td>{template.created_at ? new Date(template.created_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <div className="admin-clients-page__actions">
                      <button type="button" className="orders-icon-btn" onClick={() => setPreviewTemplate(template)} aria-label="View template">
                        <LuEye />
                      </button>
                      <button type="button" className="orders-icon-btn" onClick={() => setEditor({ template })} aria-label="Edit template">
                        <LuPencil />
                      </button>
                      <button type="button" className="orders-icon-btn" onClick={() => setDeleteConfirm(template)} aria-label="Delete template">
                        <LuTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="admin-table__empty">No templates yet. Create your first one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AiTemplatePreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title={`Delete ${deleteConfirm?.name ?? "this template"}?`}
        description="Users will no longer be able to select this template."
        confirmLabel="Delete"
        saving={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm(null)}
      />
    </section>
  );
}

export default AdminAiTemplatesPage;
