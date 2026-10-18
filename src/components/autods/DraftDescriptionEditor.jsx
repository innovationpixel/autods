import { useEffect, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { LuLayoutTemplate, LuSparkles, LuUndo2 } from "react-icons/lu";
import {
  allTemplates,
  applyTemplateToProduct,
  builtInTemplates,
  templateById,
} from "./settings/settingsTemplates";
import { getAccountSettings } from "../../services/SettingsService";

function DraftDescriptionEditor({
  editorKey,
  value,
  onChange,
  item = {},
  form = {},
  onTemplateChange,
}) {
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    form.template_id || form.templateId || item.raw_source_data?.draft_editor?.template_id || ""
  );
  const [originalDescription, setOriginalDescription] = useState(value || "");

  useEffect(() => {
    let mounted = true;
    getAccountSettings()
      .then((res) => {
        if (!mounted) return;
        const templatesCfg = res.data?.settings?.templates;
        if (templatesCfg?.custom && Array.isArray(templatesCfg.custom)) {
          setCustomTemplates(templatesCfg.custom);
        }
        if (!selectedTemplateId && templatesCfg?.default_id) {
          setSelectedTemplateId(templatesCfg.default_id);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const templatesList = allTemplates(customTemplates);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    onTemplateChange?.(templateId);

    if (!templateId) {
      if (originalDescription) {
        onChange(originalDescription);
      }
      return;
    }

    const tpl = templateById(templateId, customTemplates);
    if (!tpl) return;

    if (!originalDescription && value) {
      setOriginalDescription(value);
    }

    const mergedProduct = {
      ...item,
      ...form,
      title: form.title || item.title || "",
      cleanDescription: originalDescription || form.description || item.description || "",
      description: originalDescription || form.description || item.description || "",
      image_url: form.images?.find((img) => img.selected)?.url || item.image_url || "",
    };

    const templatedHtml = applyTemplateToProduct(tpl.html, mergedProduct);
    onChange(templatedHtml);
  };

  return (
    <div className="draft-editor__ckeditor-container" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Template Selector Toolbar */}
      <div
        className="draft-editor__template-toolbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "10px 14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LuLayoutTemplate style={{ color: "#6366f1", fontSize: 18 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
            Listing Description Template:
          </span>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#1e293b",
              cursor: "pointer",
              minWidth: 200,
            }}
          >
            <option value="">No Template (Standard Raw Description)</option>
            <optgroup label="Built-in Templates">
              {builtInTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </optgroup>
            {customTemplates.length > 0 && (
              <optgroup label="Your Custom Templates">
                {customTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {selectedTemplateId && (
          <button
            type="button"
            onClick={() => handleSelectTemplate(selectedTemplateId)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#e0e7ff",
              color: "#4338ca",
              border: "1px solid #c7d2fe",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Re-populate template with current title & images"
          >
            <LuSparkles /> Re-apply Template
          </button>
        )}
      </div>

      <div className="draft-editor__ckeditor">
        <CKEditor
          key={`${editorKey}-${selectedTemplateId || "default"}`}
          editor={ClassicEditor}
          data={value ?? ""}
          onChange={(_event, editor) => onChange(editor.getData())}
          config={{
            toolbar: [
              "heading",
              "|",
              "bold",
              "italic",
              "link",
              "bulletedList",
              "numberedList",
              "blockQuote",
              "|",
              "undo",
              "redo",
            ],
          }}
        />
      </div>
    </div>
  );
}

export default DraftDescriptionEditor;
