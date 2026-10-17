import { useEffect, useState } from "react";
import { LuArrowLeft, LuDownload, LuImage, LuLoader, LuSparkles } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { generateAiImage } from "../../../services/AiGenerationService";
import { composeImageWithBranding, extractMediaUrl } from "./aiStudioUtils";
import ImageTemplateSections from "./ImageTemplateSections";
import { useImageTemplateForm } from "./useImageTemplateForm";

function AiImageGenerator({ template, onBack }) {
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
  } = form;

  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(0);
  const [outputs, setOutputs] = useState([]);
  const [composedOutputs, setComposedOutputs] = useState([]);
  const [composeFailed, setComposeFailed] = useState(false);

  const handleGenerateAllImages = async () => {
    const trimmedPrompts = prompts.map((prompt) => prompt.trim());
    if (trimmedPrompts.some((prompt) => !prompt)) {
      toast.warn(`Fill in all ${prompts.length} prompt${prompts.length > 1 ? "s" : ""} before generating.`);
      return;
    }
    if (inputImages.length === 0) {
      toast.warn("Upload at least one input image first.");
      return;
    }

    setImageGenerating(true);
    setOutputs([]);

    const ratioValue = aspectRatio === "custom" ? `${outputWidth}:${outputHeight}` : aspectRatio;

    for (let i = 0; i < trimmedPrompts.length; i += 1) {
      setGeneratingIndex(i + 1);

      const chosenImage = referenceImageIds[i]
        ? inputImages.find((image) => image.id === referenceImageIds[i])
        : null;
      const templateSlot = template.prompts?.[i]?.reference_index;
      const referencedImage = chosenImage ?? (templateSlot != null ? inputImages[templateSlot] : null);

      const formData = new FormData();
      formData.append("prompt", trimmedPrompts[i]);
      formData.append("ratio", ratioValue);
      formData.append("width", outputWidth);
      formData.append("height", outputHeight);
      formData.append("format", outputFormat.toLowerCase());
      if (!template.is_sample) formData.append("template_id", template.id);
      inputImages.forEach(({ file }) => formData.append("images", file));
      formData.append("image", (referencedImage ?? inputImages[0]).file);

      try {
        const res = await generateAiImage(formData);
        const url = extractMediaUrl(res.data);
        setOutputs((prev) => [...prev, { index: i + 1, prompt: trimmedPrompts[i], url }]);
        if (!url) toast.error(`Prompt ${i + 1} didn't return an image.`);
      } catch (err) {
        setOutputs((prev) => [...prev, { index: i + 1, prompt: trimmedPrompts[i], url: null }]);
        toast.error(err.response?.data?.message ?? `Prompt ${i + 1} failed to generate.`);
      }
    }

    setImageGenerating(false);
    setGeneratingIndex(0);
    toast.success("Finished generating your images!");
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

  const previewCard = (
    <article className="ai-gen-hub__result">
      <div className="ai-gen-hub__section-head">
        <span className="ai-gen-hub__section-badge">5</span>
        <div>
          <h3>Preview</h3>
          <p>Your generated output images will appear here.</p>
        </div>
      </div>

      {composedOutputs.length === 0 && !imageGenerating ? (
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
            const isCurrentlyGenerating = imageGenerating && generatingIndex === index + 1;
            return (
              <div className="ai-gen-hub__preview-item" key={index}>
                <span className="ai-gen-hub__preview-badge">{index + 1}</span>
                {isCurrentlyGenerating ? (
                  <div className="ai-gen-hub__preview-loading">
                    <LuLoader className="spin-icon" />
                  </div>
                ) : url ? (
                  <>
                    <img src={url} alt={`Output ${index + 1}`} />
                    <a
                      className="ai-gen-hub__preview-download"
                      href={url}
                      target={result.finalUrl ? undefined : "_blank"}
                      rel="noreferrer"
                      download={`ai-output-${index + 1}.png`}
                    >
                      <LuDownload />
                    </a>
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
        disabled={imageGenerating}
        onClick={handleGenerateAllImages}
      >
        {imageGenerating ? <LuLoader className="spin-icon" /> : <LuSparkles />}
        <span>
          {imageGenerating ? `Generating image ${generatingIndex} of ${prompts.length}…` : "Generate All Images"}
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
        <button type="button" className="ai-gen-hub__back-btn" onClick={onBack} disabled={imageGenerating}>
          <LuArrowLeft /> Back to Templates
        </button>
      </div>

      <ImageTemplateSections form={form} showWatermark previewCard={previewCard} footer={footer} />
    </div>
  );
}

export default AiImageGenerator;
