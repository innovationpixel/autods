import { useEffect, useMemo, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {
  LuCheck,
  LuCode,
  LuCopy,
  LuEye,
  LuLayoutTemplate,
  LuPencil,
  LuRefreshCw,
  LuSparkles,
  LuUndo2,
  LuX,
} from "react-icons/lu";
import {
  allTemplates,
  applyTemplateToProduct,
  builtInTemplates,
  cleanSupplierDescription,
  extractCleanDescription,
  extractTemplateId,
  isTemplatedDescription,
  templateById,
  templateLibraryCategories,
} from "./settings/settingsTemplates";
import { getAccountSettings } from "../../services/SettingsService";
import { toast } from "../../utils/toast";

function DraftDescriptionEditor({
  editorKey,
  value = "",
  onChange,
  item = {},
  form = {},
  onTemplateChange,
}) {
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    form.template_id || form.templateId || item.raw_source_data?.draft_editor?.template_id || ""
  );

  // Raw description text (inner content without template wrapper)
  const [rawText, setRawText] = useState(() => {
    return extractCleanDescription(value) || cleanSupplierDescription(item.description || form.description || "") || "";
  });

  // Editor mode: "preview" (Visual Template) | "text" (Edit Description Text) | "html" (HTML Code)
  const [activeMode, setActiveMode] = useState("preview");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalCategory, setModalCategory] = useState("all");
  const [modalSelectedId, setModalSelectedId] = useState(selectedTemplateId || builtInTemplates[0].id);
  const [modalPreviewMode, setModalPreviewMode] = useState("visual"); // "visual" | "html"

  const autoAppliedRef = useRef(false);

  const getMergedProduct = (textOverride = null) => {
    const rawImages = form.images?.length
      ? form.images
      : Array.isArray(item.images)
      ? item.images
      : [];

    const innerDesc = textOverride !== null ? textOverride : (rawText || extractCleanDescription(value) || item.description || form.description || "");

    return {
      ...item,
      ...form,
      title: form.title || item.title || "",
      cleanDescription: innerDesc,
      description: innerDesc,
      images: rawImages,
      image_url:
        form.images?.find((img) => img?.selected)?.url ||
        item.image_url ||
        item.imageUrl ||
        "",
      specifications: form.specifications || item.specifications || [],
      dimensions: form.dimensions || item.dimensions || "",
    };
  };

  // Load account settings and AUTO-APPLY default template if not templated yet
  useEffect(() => {
    let mounted = true;

    getAccountSettings()
      .then((res) => {
        if (!mounted) return;
        const templatesCfg = res.data?.settings?.templates;
        const customList = Array.isArray(templatesCfg?.custom) ? templatesCfg.custom : [];
        setCustomTemplates(customList);

        const defaultId = templatesCfg?.default_id || builtInTemplates[0].id;

        // Check if value is already templated
        const isTemplated = isTemplatedDescription(value);

        if (isTemplated) {
          const detectedId = extractTemplateId(value) || selectedTemplateId || defaultId;
          setSelectedTemplateId(detectedId);
          setModalSelectedId(detectedId);
          const innerContent = extractCleanDescription(value);
          if (innerContent) setRawText(innerContent);
        } else if (!autoAppliedRef.current) {
          // AUTO-APPLY DEFAULT TEMPLATE!
          autoAppliedRef.current = true;
          const targetTpl = templateById(defaultId, customList) || builtInTemplates[0];
          if (targetTpl) {
            const initialRaw = cleanSupplierDescription(value || item.description || form.description || "");
            setRawText(initialRaw);
            const merged = {
              ...item,
              ...form,
              title: form.title || item.title || "",
              cleanDescription: initialRaw,
              description: initialRaw,
              images: form.images?.length ? form.images : (item.images || []),
              image_url: form.images?.find((img) => img?.selected)?.url || item.image_url || "",
              specifications: form.specifications || item.specifications || [],
              dimensions: form.dimensions || item.dimensions || "",
            };

            const compiledHtml = applyTemplateToProduct(targetTpl.html, merged, targetTpl.id);
            setSelectedTemplateId(targetTpl.id);
            setModalSelectedId(targetTpl.id);
            onTemplateChange?.(targetTpl.id);
            onChange(compiledHtml);
          }
        }
      })
      .catch(() => {
        // Fallback default auto-apply
        if (!isTemplatedDescription(value) && !autoAppliedRef.current) {
          autoAppliedRef.current = true;
          const targetTpl = builtInTemplates[0];
          const initialRaw = cleanSupplierDescription(value || item.description || form.description || "");
          setRawText(initialRaw);
          const merged = getMergedProduct(initialRaw);
          const compiledHtml = applyTemplateToProduct(targetTpl.html, merged, targetTpl.id);
          setSelectedTemplateId(targetTpl.id);
          setModalSelectedId(targetTpl.id);
          onTemplateChange?.(targetTpl.id);
          onChange(compiledHtml);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const allAvailableTemplates = useMemo(() => {
    return allTemplates(customTemplates);
  }, [customTemplates]);

  const currentActiveTemplate = useMemo(() => {
    return templateById(selectedTemplateId, customTemplates);
  }, [selectedTemplateId, customTemplates]);

  const modalActiveTemplate = useMemo(() => {
    return templateById(modalSelectedId, customTemplates) || builtInTemplates[0];
  }, [modalSelectedId, customTemplates]);

  const filteredModalTemplates = useMemo(() => {
    if (modalCategory === "all") return allAvailableTemplates;
    if (modalCategory === "custom") return customTemplates;
    return allAvailableTemplates.filter((tpl) => tpl.category === modalCategory);
  }, [allAvailableTemplates, customTemplates, modalCategory]);

  // Apply a specific template
  const handleApplyTemplate = (templateId) => {
    if (!templateId) {
      // Revert to raw description (no template)
      const plain = rawText || cleanSupplierDescription(value || item.description || form.description || "");
      setSelectedTemplateId("");
      onTemplateChange?.("");
      onChange(plain);
      setActiveMode("text");
      setShowModal(false);
      toast.info("Applied standard raw description without template.");
      return;
    }

    const tpl = templateById(templateId, customTemplates);
    if (!tpl) return;

    const currentText = rawText || extractCleanDescription(value) || cleanSupplierDescription(item.description || form.description || "");
    const merged = getMergedProduct(currentText);
    const compiledHtml = applyTemplateToProduct(tpl.html, merged, tpl.id);

    setSelectedTemplateId(templateId);
    onTemplateChange?.(templateId);
    onChange(compiledHtml);
    setActiveMode("preview");
    setShowModal(false);
    toast.success(`Applied "${tpl.name}" template with product images and description.`);
  };

  // Re-apply current template with updated photos / title
  const handleReapply = () => {
    if (!selectedTemplateId) return;
    const tpl = templateById(selectedTemplateId, customTemplates);
    if (!tpl) return;

    const currentText = rawText || extractCleanDescription(value) || cleanSupplierDescription(item.description || form.description || "");
    const merged = getMergedProduct(currentText);
    const compiledHtml = applyTemplateToProduct(tpl.html, merged, tpl.id);

    onChange(compiledHtml);
    toast.success(`Refreshed template with current draft photos & title.`);
  };

  // Revert back to plain supplier text
  const handleResetToRaw = () => {
    const raw = rawText || cleanSupplierDescription(item.description || form.description || "") || "";
    setSelectedTemplateId("");
    onTemplateChange?.("");
    onChange(raw);
    setActiveMode("text");
    toast.info("Description reset to plain supplier text (no template).");
  };

  // When user edits the inner description text in CKEditor
  const handleInnerContentChange = (newText) => {
    setRawText(newText);
    if (selectedTemplateId) {
      const tpl = templateById(selectedTemplateId, customTemplates);
      if (tpl) {
        const merged = getMergedProduct(newText);
        const compiledHtml = applyTemplateToProduct(tpl.html, merged, tpl.id);
        onChange(compiledHtml);
        return;
      }
    }
    onChange(newText);
  };

  // Live preview HTML for the modal
  const modalPreviewHtml = useMemo(() => {
    if (!modalActiveTemplate) return "";
    const merged = getMergedProduct();
    return applyTemplateToProduct(modalActiveTemplate.html, merged, modalActiveTemplate.id);
  }, [modalActiveTemplate, form, item, rawText, value]);

  const copyHtmlToClipboard = () => {
    navigator.clipboard.writeText(value ?? "");
    toast.success("HTML copied to clipboard.");
  };

  const isTemplated = Boolean(selectedTemplateId && currentActiveTemplate);

  return (
    <div className="draft-editor__ckeditor-container" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Primary Toolbar: Select & Apply Template Button */}
      <div
        className="draft-editor__template-toolbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 16px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Main "Select & Apply Template" Button */}
          <button
            type="button"
            onClick={() => {
              setModalSelectedId(selectedTemplateId || builtInTemplates[0].id);
              setShowModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.28)",
            }}
            title="Browse and apply professional eCommerce description templates"
          >
            <LuLayoutTemplate size={16} />
            <span>Select & Apply Template</span>
          </button>

          {/* Quick Dropdown Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>Quick select:</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              style={{
                padding: "6px 12px",
                fontSize: 12.5,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#1e293b",
                cursor: "pointer",
                maxWidth: 220,
              }}
            >
              <option value="">No Template (Plain Raw Text)</option>
              <optgroup label="Professional Built-in Templates">
                {builtInTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
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

          {/* Active Template Badge */}
          {isTemplated ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <LuCheck size={13} /> Active: {currentActiveTemplate.name}
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                background: "#f1f5f9",
                color: "#64748b",
                borderRadius: 6,
                fontSize: 11.5,
              }}
            >
              Plain description (No template)
            </span>
          )}
        </div>

        {/* Action Controls: View Modes & Re-apply / Reset */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Mode Switcher Tabs */}
          {isTemplated && (
            <div style={{ display: "inline-flex", background: "#f1f5f9", padding: 3, borderRadius: 8, gap: 3 }}>
              <button
                type="button"
                onClick={() => setActiveMode("preview")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 0,
                  background: activeMode === "preview" ? "#ffffff" : "transparent",
                  color: activeMode === "preview" ? "#4f46e5" : "#64748b",
                  boxShadow: activeMode === "preview" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                }}
              >
                <LuEye size={13} /> Visual Template
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("text")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 0,
                  background: activeMode === "text" ? "#ffffff" : "transparent",
                  color: activeMode === "text" ? "#4f46e5" : "#64748b",
                  boxShadow: activeMode === "text" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                }}
              >
                <LuPencil size={13} /> Edit Content
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("html")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: 0,
                  background: activeMode === "html" ? "#ffffff" : "transparent",
                  color: activeMode === "html" ? "#4f46e5" : "#64748b",
                  boxShadow: activeMode === "html" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                }}
              >
                <LuCode size={13} /> HTML
              </button>
            </div>
          )}

          {isTemplated ? (
            <button
              type="button"
              onClick={handleReapply}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#eef2ff",
                color: "#4338ca",
                border: "1px solid #c7d2fe",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Refresh template with current draft photos & title"
            >
              <LuRefreshCw size={13} /> Refresh Photos
            </button>
          ) : null}

          {isTemplated && (
            <button
              type="button"
              onClick={handleResetToRaw}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#f8fafc",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
              }}
              title="Revert back to the unformatted plain supplier text"
            >
              <LuUndo2 size={13} /> Reset to Raw
            </button>
          )}
        </div>
      </div>

      {/* Surface Area: View Mode switching */}

      {/* Mode 1: Visual Template Preview (Full styled listing) */}
      {isTemplated && activeMode === "preview" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12.5,
              color: "#475569",
            }}
          >
            <span>✨ <strong>Live Listing Preview:</strong> This is the exact formatted layout that will be published to eBay.</span>
            <button
              type="button"
              onClick={() => setActiveMode("text")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 5,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <LuPencil size={12} /> Edit Text Content
            </button>
          </div>

          <div
            style={{
              padding: "24px 20px",
              background: "#fafafb",
              maxHeight: "720px",
              overflowY: "auto",
            }}
          >
            <div
              style={{ margin: "0 auto", maxWidth: 940 }}
              dangerouslySetInnerHTML={{ __html: value || "<p>No description content.</p>" }}
            />
          </div>
        </div>
      )}

      {/* Mode 2: Edit Description Text (CKEditor editing ONLY the inner description body) */}
      {(!isTemplated || activeMode === "text") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isTemplated && (
            <div
              style={{
                padding: "8px 14px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                fontSize: 12.5,
                color: "#1e40af",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                ✍️ <strong>Editing Description Content:</strong> Your active template (<strong>{currentActiveTemplate?.name}</strong>) automatically wraps this text with the hero photo, gallery grid, and store policies.
              </span>
              <button
                type="button"
                onClick={() => setActiveMode("preview")}
                style={{
                  background: "#ffffff",
                  border: "1px solid #93c5fd",
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#1d4ed8",
                  cursor: "pointer",
                }}
              >
                Back to Visual Preview
              </button>
            </div>
          )}

          <div className="draft-editor__ckeditor" style={{ minHeight: 380 }}>
            <CKEditor
              key={`${editorKey}-${selectedTemplateId || "raw"}-editor`}
              editor={ClassicEditor}
              data={isTemplated ? rawText : (value ?? "")}
              onChange={(_event, editor) => handleInnerContentChange(editor.getData())}
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
      )}

      {/* Mode 3: HTML Code Editor */}
      {isTemplated && activeMode === "html" && (
        <div
          style={{
            background: "#0f172a",
            borderRadius: 10,
            border: "1px solid #334155",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#1e293b",
              borderBottom: "1px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#94a3b8",
              fontSize: 12.5,
            }}
          >
            <span>Raw HTML Code (eBay Compatible)</span>
            <button
              type="button"
              onClick={copyHtmlToClipboard}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#334155",
                color: "#f8fafc",
                border: 0,
                borderRadius: 5,
                padding: "4px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <LuCopy size={12} /> Copy HTML
            </button>
          </div>

          <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={18}
            style={{
              width: "100%",
              background: "#0f172a",
              color: "#e2e8f0",
              border: 0,
              padding: 16,
              fontFamily: "monospace",
              fontSize: 12.5,
              lineHeight: 1.55,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Professional Template Selection Modal */}
      {showModal && (
        <div
          className="quick-edit-modal-layer"
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <button
            type="button"
            className="quick-edit-modal-layer__backdrop"
            style={{ position: "absolute", inset: 0, background: "transparent", border: 0 }}
            onClick={() => setShowModal(false)}
            aria-label="Close template selector"
          />

          <div
            className="card-wrapper"
            style={{
              position: "relative",
              zIndex: 1,
              maxWidth: 1060,
              width: "100%",
              height: "min(88vh, 820px)",
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.35)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <header
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "#e0e7ff",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <LuLayoutTemplate size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                    Select & Apply Product Description Template
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
                    Choose a professional layout. Your product's photos, title, specifications, and details will be formatted automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 6,
                  color: "#64748b",
                  cursor: "pointer",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close dialog"
              >
                <LuX size={20} />
              </button>
            </header>

            {/* Category Filter Pills */}
            <div
              style={{
                padding: "10px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 8,
                overflowX: "auto",
                background: "#ffffff",
              }}
            >
              {templateLibraryCategories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setModalCategory(cat.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor: modalCategory === cat.id ? "#4f46e5" : "#e2e8f0",
                    background: modalCategory === cat.id ? "#e0e7ff" : "#ffffff",
                    color: modalCategory === cat.id ? "#4338ca" : "#64748b",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.label}
                </button>
              ))}
              {customTemplates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalCategory("custom")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor: modalCategory === "custom" ? "#4f46e5" : "#e2e8f0",
                    background: modalCategory === "custom" ? "#e0e7ff" : "#ffffff",
                    color: modalCategory === "custom" ? "#4338ca" : "#64748b",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  My Custom ({customTemplates.length})
                </button>
              )}
            </div>

            {/* Modal Body: Split Selector List & Live Preview */}
            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", flex: 1, overflow: "hidden" }}>
              {/* Left Column: Template Cards */}
              <div
                style={{
                  borderRight: "1px solid #e2e8f0",
                  overflowY: "auto",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 2 }}>
                  Available Templates ({filteredModalTemplates.length})
                </div>

                {filteredModalTemplates.map((tpl) => {
                  const isSelected = modalSelectedId === tpl.id;
                  const isCurrentlyActive = selectedTemplateId === tpl.id;

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setModalSelectedId(tpl.id)}
                      style={{
                        padding: 14,
                        borderRadius: 10,
                        border: isSelected ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                        background: isSelected ? "#f5f3ff" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        position: "relative",
                        boxShadow: isSelected ? "0 4px 12px rgba(79, 70, 229, 0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: `${tpl.accent || "#4f46e5"}18`,
                            color: tpl.accent || "#4f46e5",
                            textTransform: "uppercase",
                          }}
                        >
                          {tpl.category}
                        </span>
                        {isCurrentlyActive && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                            Current Active
                          </span>
                        )}
                      </div>

                      <strong style={{ display: "block", fontSize: 14, color: "#0f172a", marginBottom: 4 }}>
                        {tpl.name}
                      </strong>
                      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.45 }}>
                        {tpl.description || "Formatted product listing template with images & features."}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Live Product Preview in Selected Template */}
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffff" }}>
                {/* Preview Toolbar */}
                <div
                  style={{
                    padding: "10px 18px",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                      Previewing with:
                    </span>
                    <strong style={{ fontSize: 13, color: "#0f172a" }}>
                      {form.title ? form.title.slice(0, 45) + (form.title.length > 45 ? "…" : "") : "Current Product Draft"}
                    </strong>
                  </div>

                  {/* Toggle Visual / Code */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 6 }}>
                    <button
                      type="button"
                      onClick={() => setModalPreviewMode("visual")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        border: 0,
                        borderRadius: 4,
                        background: modalPreviewMode === "visual" ? "#ffffff" : "transparent",
                        color: modalPreviewMode === "visual" ? "#0f172a" : "#64748b",
                        boxShadow: modalPreviewMode === "visual" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      <LuEye size={13} /> Visual Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalPreviewMode("html")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        border: 0,
                        borderRadius: 4,
                        background: modalPreviewMode === "html" ? "#ffffff" : "transparent",
                        color: modalPreviewMode === "html" ? "#0f172a" : "#64748b",
                        boxShadow: modalPreviewMode === "html" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      <LuCode size={13} /> HTML Code
                    </button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "#f8fafc" }}>
                  {modalPreviewMode === "visual" ? (
                    <div
                      style={{
                        background: "#ffffff",
                        padding: 18,
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                      }}
                      dangerouslySetInnerHTML={{ __html: modalPreviewHtml }}
                    />
                  ) : (
                    <pre
                      style={{
                        background: "#0f172a",
                        color: "#f8fafc",
                        padding: 16,
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                      }}
                    >
                      {modalPreviewHtml}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <footer
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
              }}
            >
              <div style={{ fontSize: 12.5, color: "#64748b" }}>
                <span>✨ Will automatically embed product title, main photo, gallery angles, and policies.</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyTemplate(modalSelectedId)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 20px",
                    borderRadius: 6,
                    border: 0,
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  <LuSparkles size={15} />
                  <span>Apply Template to Description</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default DraftDescriptionEditor;
