import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  LuArrowLeft,
  LuDownload,
  LuExternalLink,
  LuEye,
  LuImage,
  LuLoader,
  LuPlus,
  LuSparkles,
  LuX,
  LuZap,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { generateAiImage, getAiConfig } from "../../../services/AiGenerationService";
import aiBackgroundQueue from "../../../services/AiBackgroundQueue";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import { composeImageWithBranding, extractMediaUrl } from "./aiStudioUtils";
import ImageTemplateSections from "./ImageTemplateSections";
import { useImageTemplateForm } from "./useImageTemplateForm";
import BuyAiCreditsModal from "./BuyAiCreditsModal";
import SelectReferenceImagesModal from "./SelectReferenceImagesModal";

function AiImageGenerator({ template, onBack, onViewMyImages }) {
  const authUser = useSelector(selectUser);
  const form = useImageTemplateForm({
    aspectRatio: template.aspect_ratio,
    outputWidth: template.width,
    outputHeight: template.height,
    outputFormat: template.format ? template.format.toUpperCase() : undefined,
    logoPosition: template.logo_position,
    logoSizePercent: template.logo_size_percent,
    prompts: (template.prompts ?? []).map((item) => item.prompt ?? ""),
  });

  const {
    inputImages,
    logoPreview,
    logoSizePercent,
    logoPosition,
    watermarkEnabled,
    watermarkText,
    watermarkSize,
    watermarkPosition,
    aspectRatio,
    outputWidth,
    outputHeight,
    outputFormat,
    prompts,
    referenceImageIds,
    setReferenceImageIds,
  } = form;

  const [queueState, setQueueState] = useState(aiBackgroundQueue.getState());
  const [outputs, setOutputs] = useState([]);
  const [composedOutputs, setComposedOutputs] = useState([]);
  const [composeFailed, setComposeFailed] = useState(false);
  const [creditsPerImage, setCreditsPerImage] = useState(1);
  const [userCredits, setUserCredits] = useState(authUser?.ai_credits ?? 0);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [missingRefIndices, setMissingRefIndices] = useState([]);
  const [refModalOpen, setRefModalOpen] = useState(false);

  useEffect(() => {
    return aiBackgroundQueue.subscribe(setQueueState);
  }, []);

  const handleDownloadImage = async (url, filename = "ai-generated-image.png") => {
    if (!url) return;
    try {
      if (url.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadAll = async () => {
    const validOutputs = composedOutputs.length > 0 ? composedOutputs : outputs;
    const items = validOutputs.filter((item) => item?.finalUrl || item?.url);
    if (items.length === 0) {
      toast.warn("No generated images to download yet.");
      return;
    }
    toast.info(`Downloading ${items.length} image${items.length > 1 ? "s" : ""}…`);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const url = item.finalUrl || item.url;
      await handleDownloadImage(url, `ai-generated-image-${item.index || i + 1}.png`);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  useEffect(() => {
    getAiConfig()
      .then((res) => {
        if (res.data?.credits_per_image) setCreditsPerImage(res.data.credits_per_image);
        if (res.data?.ai_credits !== undefined) setUserCredits(res.data.ai_credits);
      })
      .catch(() => {});
  }, []);

  const isGenerating = queueState.isGenerating;
  const currentTask = queueState.activeTask;
  const generatingIndex = currentTask?.current || 0;

  useEffect(() => {
    if (currentTask?.completedImages) {
      setOutputs(
        prompts.map((p, idx) => {
          const img = currentTask.completedImages[idx];
          return {
            index: idx + 1,
            prompt: img?.prompt || p,
            url: img?.image_url || null,
            error: img?.error || false,
          };
        })
      );
    }
  }, [currentTask?.completedImages, prompts]);

  const totalCost = prompts.length * creditsPerImage;

  const executeGeneration = async (finalRefIds = referenceImageIds) => {
    if (userCredits < totalCost && authUser?.role !== "super_admin") {
      toast.error(
        `Insufficient AI Credits: Generating ${prompts.length} images requires ${totalCost} credits, but you have ${userCredits}. Please purchase more credits.`
      );
      setBuyModalOpen(true);
      return;
    }

    setOutputs([]);
    const ratioValue = aspectRatio === "custom" ? `${outputWidth}:${outputHeight}` : aspectRatio;

    await aiBackgroundQueue.startGeneration({
      template,
      prompts: prompts.map((p) => p.trim()),
      inputImages,
      referenceImageIds: finalRefIds,
      ratio: ratioValue,
      outputWidth,
      outputHeight,
      outputFormat,
      watermark: watermarkEnabled && watermarkText.trim() ? {
        enabled: true,
        text: watermarkText.trim(),
        size: watermarkSize,
        position: watermarkPosition,
      } : null,
      logo: logoPreview ? {
        preview: logoPreview,
        sizePercent: logoSizePercent,
        position: logoPosition,
      } : null,
      navigateToMyImages: onViewMyImages,
    });
  };

  const handleGenerateAllImages = async () => {
    const trimmedPrompts = prompts.map((prompt) => prompt.trim());
    if (trimmedPrompts.some((prompt) => !prompt)) {
      toast.warn(`Fill in all ${prompts.length} prompt${prompts.length > 1 ? "s" : ""} before generating.`);
      return;
    }
    if (inputImages.length === 0) {
      toast.warn("Upload at least one input image in Step 1 first.");
      document.getElementById("ai-section-input-images")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const missingRefs = prompts
      .map((_, index) => {
        const refId = referenceImageIds[index];
        const isValid = refId && inputImages.some((img) => img.id === refId);
        return isValid ? null : index + 1;
      })
      .filter(Boolean);

    if (missingRefs.length > 0) {
      setMissingRefIndices(missingRefs);
      setRefModalOpen(true);
      return;
    }

    setMissingRefIndices([]);
    await executeGeneration(referenceImageIds);
  };

  const handleConfirmReferenceImages = async (newRefIds) => {
    setReferenceImageIds(newRefIds);
    setMissingRefIndices([]);
    setRefModalOpen(false);
    await executeGeneration(newRefIds);
  };

  const handleCloseRefModal = () => {
    setRefModalOpen(false);
    document.getElementById("ai-section-prompts")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (outputs.length === 0) {
      setComposedOutputs([]);
      setComposeFailed(false);
      return undefined;
    }

    const hasWatermark = watermarkEnabled && watermarkText.trim().length > 0;
    const hasLogo = Boolean(logoPreview);

    if (!hasWatermark && !hasLogo) {
      setComposedOutputs(outputs.map((output) => ({ ...output, finalUrl: output.url })));
      setComposeFailed(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      let anyFailed = false;
      const results = await Promise.all(
        outputs.map(async (output) => {
          if (!output.url) return { ...output, finalUrl: null };
          try {
            const dataUrl = await composeImageWithBranding({
              baseUrl: output.url,
              watermark: hasWatermark
                ? { text: watermarkText.trim(), sizePercent: watermarkSize, position: watermarkPosition }
                : null,
              logo: hasLogo ? { src: logoPreview, sizePercent: logoSizePercent, position: logoPosition } : null,
            });
            return { ...output, finalUrl: dataUrl };
          } catch {
            anyFailed = true;
            return { ...output, finalUrl: output.url };
          }
        }),
      );
      if (!cancelled) {
        setComposedOutputs(results);
        setComposeFailed(anyFailed);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [outputs, watermarkEnabled, watermarkText, watermarkSize, watermarkPosition, logoPreview, logoSizePercent, logoPosition]);

  useEffect(() => {
    if (composeFailed) {
      toast.warn("Couldn't overlay the watermark/logo on some previews — the image host blocks in-browser edits. Downloads will use the plain generated images.");
    }
  }, [composeFailed]);

  const hasGeneratedOutputs =
    composedOutputs.some((o) => o?.finalUrl || o?.url) || outputs.some((o) => o?.url);

  const previewCard = (
    <article className="ai-gen-hub__result">
      <div
        className="ai-gen-hub__section-head"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="ai-gen-hub__section-badge">5</span>
          <div>
            <h3>Preview</h3>
            <p>Your generated output images will appear here.</p>
          </div>
        </div>
        {hasGeneratedOutputs && (
          <button
            type="button"
            onClick={handleDownloadAll}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              fontSize: 12,
              fontWeight: 650,
              color: "#334155",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <LuDownload /> Download All
          </button>
        )}
      </div>

      {composedOutputs.length === 0 && !isGenerating ? (
        <div className="ai-gen-hub__empty">
          <LuImage />
          <strong>No images yet</strong>
          <span>Generate to see your output images here.</span>
        </div>
      ) : (
        <div className="ai-gen-hub__preview-grid">
          {prompts.map((_, index) => {
            const result = composedOutputs[index] ?? outputs[index];
            const url = result?.finalUrl ?? result?.url;
            const isCurrentlyGenerating = isGenerating && generatingIndex === index + 1;
            return (
              <div className="ai-gen-hub__preview-item" key={index}>
                <span className="ai-gen-hub__preview-badge">{index + 1}</span>
                {isCurrentlyGenerating ? (
                  <div className="ai-gen-hub__preview-loading">
                    <LuLoader className="spin-icon" />
                  </div>
                ) : url ? (
                  <>
                    <img
                      src={url}
                      alt={`Output ${index + 1}`}
                      onClick={() =>
                        setViewingImage({
                          url,
                          index: index + 1,
                          prompt: result?.prompt || prompts[index],
                        })
                      }
                      style={{ cursor: "pointer", width: "100%", height: "100%", objectFit: "cover" }}
                      title="Click to view full image"
                    />
                    <div className="ai-gen-hub__preview-actions">
                      <button
                        type="button"
                        className="ai-gen-hub__preview-btn ai-gen-hub__preview-btn--view"
                        onClick={() =>
                          setViewingImage({
                            url,
                            index: index + 1,
                            prompt: result?.prompt || prompts[index],
                          })
                        }
                        title="View full generated image"
                      >
                        <LuEye /> View
                      </button>
                      <button
                        type="button"
                        className="ai-gen-hub__preview-btn ai-gen-hub__preview-btn--download"
                        onClick={() => handleDownloadImage(url, `ai-output-${index + 1}.png`)}
                        title="Download generated image"
                      >
                        <LuDownload /> Download
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="ai-gen-hub__preview-placeholder">
                    <LuImage />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </article>
  );

  const footer = (
    <div className="ai-gen-hub__action-bar">
      <button
        type="button"
        className="ai-gen-hub__btn ai-gen-hub__btn--primary"
        disabled={isGenerating}
        onClick={handleGenerateAllImages}
      >
        {isGenerating ? <LuLoader className="spin-icon" /> : <LuSparkles />}
        <span>
          {isGenerating
            ? `Generating image ${generatingIndex || 1} of ${prompts.length} in background…`
            : `Generate All ${prompts.length} Image${prompts.length > 1 ? "s" : ""} (${totalCost} AI Credits)`}
        </span>
      </button>
    </div>
  );

  return (
    <div className="ai-gen-hub__generator">
      <div className="ai-gen-hub__generator-top">
        <div>
          <h2>{template.name}</h2>
          <p>Upload your product images and logo, then generate your images from this template.</p>
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

          <button type="button" className="ai-gen-hub__back-btn" onClick={onBack}>
            <LuArrowLeft /> Back to Templates
          </button>
        </div>
      </div>

      <ImageTemplateSections
        form={form}
        showWatermark
        previewCard={previewCard}
        footer={footer}
        allowAddDeletePrompts={false}
        allowAddPrompt={false}
        missingRefIndices={missingRefIndices}
        onClearMissingRef={(idx) =>
          setMissingRefIndices((prev) => prev.filter((item) => item !== idx + 1))
        }
      />

      <SelectReferenceImagesModal
        open={refModalOpen}
        onClose={handleCloseRefModal}
        prompts={prompts}
        inputImages={inputImages}
        currentReferenceIds={referenceImageIds}
        onConfirm={handleConfirmReferenceImages}
        totalCost={totalCost}
      />

      <BuyAiCreditsModal
        open={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        currentCredits={userCredits}
        requiredCredits={totalCost}
        onSuccess={(data) => {
          if (data.ai_credits !== undefined) {
            setUserCredits(data.ai_credits);
          }
        }}
      />

      {viewingImage && (
        <div className="orders-modal" style={{ zIndex: 1200 }}>
          <div className="orders-modal__backdrop" onClick={() => setViewingImage(null)} />
          <div
            className="orders-modal__card"
            style={{
              maxWidth: 760,
              width: "95%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              borderRadius: 16,
              backgroundColor: "#ffffff",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                  Generated Image #{viewingImage.index}
                </h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {template.name} ({outputFormat})
                </span>
              </div>
              <button
                type="button"
                className="orders-icon-btn"
                onClick={() => setViewingImage(null)}
                aria-label="Close"
              >
                <LuX />
              </button>
            </div>

            {/* Full Image Display */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#0f172a",
                borderRadius: 12,
                overflow: "hidden",
                maxHeight: "560px",
                position: "relative",
              }}
            >
              <img
                src={viewingImage.url}
                alt={`Generated output ${viewingImage.index}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "560px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {/* Prompt display */}
            {viewingImage.prompt && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                <strong style={{ color: "#0f172a", display: "block", marginBottom: 2 }}>Prompt:</strong>
                {viewingImage.prompt}
              </div>
            )}

            {/* Modal Footer with Download, Open in Full Size and Close buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <a
                href={viewingImage.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  color: "#4f46e5",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                <LuExternalLink /> Open in full size
              </a>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--ghost"
                  onClick={() => setViewingImage(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="admin-page__btn admin-page__btn--primary"
                  onClick={() =>
                    handleDownloadImage(viewingImage.url, `ai-generated-image-${viewingImage.index}.png`)
                  }
                >
                  <LuDownload /> Download Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiImageGenerator;
