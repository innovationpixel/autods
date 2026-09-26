import { useEffect, useRef, useState } from "react";
import {
  LuArrowDown,
  LuArrowDownLeft,
  LuArrowDownRight,
  LuArrowLeft,
  LuArrowRight,
  LuArrowUp,
  LuArrowUpLeft,
  LuArrowUpRight,
  LuCircleDot,
  LuDownload,
  LuFilm,
  LuImage,
  LuLoader,
  LuMic,
  LuSparkles,
  LuStamp,
  LuType,
  LuUpload,
  LuVideo,
  LuX,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { generateAiImage, generateAiVideo } from "../../../services/AiGenerationService";

const IMAGE_RATIOS = ["1:1", "4:5", "16:9", "9:16"];
const VIDEO_RATIOS = ["9:16", "16:9", "1:1"];
const VIDEO_VOICES = [
  { value: "female", label: "Female voice" },
  { value: "male", label: "Male voice" },
];
const PROMPT_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const POSITION_ICONS = {
  "top-left": LuArrowUpLeft,
  "top-center": LuArrowUp,
  "top-right": LuArrowUpRight,
  "middle-left": LuArrowLeft,
  center: LuCircleDot,
  "middle-right": LuArrowRight,
  "bottom-left": LuArrowDownLeft,
  "bottom-center": LuArrowDown,
  "bottom-right": LuArrowDownRight,
};

function extractMediaUrl(data) {
  if (!data) return null;
  const candidates = [
    data.url,
    data.image_url,
    data.video_url,
    data.output_url,
    data.result_url,
    data.data?.url,
    data.data?.image_url,
    data.data?.video_url,
    Array.isArray(data.output) ? data.output[0] : null,
  ];
  return candidates.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function getAnchoredPosition(position, canvasW, canvasH, elW, elH, paddingX, paddingY) {
  let x;
  let y;

  if (position.includes("left")) x = paddingX;
  else if (position.includes("right")) x = canvasW - elW - paddingX;
  else x = (canvasW - elW) / 2;

  if (position.startsWith("top")) y = paddingY;
  else if (position.startsWith("bottom")) y = canvasH - elH - paddingY;
  else y = (canvasH - elH) / 2;

  return { x, y };
}

async function composeImageWithBranding({ baseUrl, watermark, logo }) {
  const baseImg = await loadImage(baseUrl, "anonymous");

  const canvas = document.createElement("canvas");
  canvas.width = baseImg.naturalWidth;
  canvas.height = baseImg.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(baseImg, 0, 0);

  const paddingX = canvas.width * 0.035;
  const paddingY = canvas.height * 0.035;

  if (logo) {
    const logoImg = await loadImage(logo.src, "anonymous");
    const logoW = canvas.width * (logo.sizePercent / 100);
    const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth);
    const { x, y } = getAnchoredPosition(logo.position, canvas.width, canvas.height, logoW, logoH, paddingX, paddingY);
    ctx.drawImage(logoImg, x, y, logoW, logoH);
  }

  if (watermark) {
    const fontSize = Math.max(12, watermark.sizePercent * (canvas.width / 1000));
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    const textW = ctx.measureText(watermark.text).width;
    const { x, y } = getAnchoredPosition(watermark.position, canvas.width, canvas.height, textW, fontSize, paddingX, paddingY);
    ctx.lineWidth = Math.max(1, fontSize * 0.06);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    ctx.strokeText(watermark.text, x, y);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(watermark.text, x, y);
  }

  return canvas.toDataURL("image/png");
}

function UploadField({ label, hint, preview, onChange, onClear, inputRef }) {
  return (
    <label className="ai-gen-hub__upload">
      <span className="ai-gen-hub__field-label">{label}</span>
      {preview ? (
        <div className="ai-gen-hub__upload-preview">
          <img src={preview} alt="Selected upload" />
          <button
            type="button"
            className="ai-gen-hub__upload-remove"
            onClick={(event) => {
              event.preventDefault();
              onClear();
            }}
          >
            <LuX />
          </button>
        </div>
      ) : (
        <div className="ai-gen-hub__upload-drop">
          <LuUpload />
          <span>{hint}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} />
    </label>
  );
}

function RatioPicker({ options, value, onChange }) {
  return (
    <div className="ai-gen-hub__ratio-grid">
      {options.map((ratio) => (
        <button
          type="button"
          key={ratio}
          className={`ai-gen-hub__ratio-chip ${value === ratio ? "ai-gen-hub__ratio-chip--active" : ""}`}
          onClick={() => onChange(ratio)}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
}

function PositionPicker({ value, onChange }) {
  return (
    <div className="ai-gen-hub__position-grid">
      {POSITIONS.map((position) => {
        const Icon = POSITION_ICONS[position];
        return (
          <button
            type="button"
            key={position}
            title={position.replace("-", " ")}
            className={`ai-gen-hub__position-cell ${value === position ? "ai-gen-hub__position-cell--active" : ""}`}
            onClick={() => onChange(position)}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function SliderField({ label, value, min, max, step = 1, unit = "", onChange }) {
  return (
    <div className="ai-gen-hub__field">
      <span className="ai-gen-hub__field-label">
        {label} <em>{value}{unit}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function AiVideoGenerationContent() {
  const [mode, setMode] = useState("image");

  // Image generation state
  const [promptCount, setPromptCount] = useState(1);
  const [prompts, setPrompts] = useState([""]);
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [imageRatio, setImageRatio] = useState("1:1");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [stepResults, setStepResults] = useState([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const productImageInputRef = useRef(null);

  // Branding: watermark
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkSize, setWatermarkSize] = useState(36);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-right");

  // Branding: logo
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoSizePercent, setLogoSizePercent] = useState(18);
  const [logoPosition, setLogoPosition] = useState("bottom-left");
  const logoInputRef = useRef(null);

  // Composed preview (branding baked onto the generated image)
  const [composedImageUrl, setComposedImageUrl] = useState(null);
  const [composeFailed, setComposeFailed] = useState(false);

  // Video generation state
  const [videoScript, setVideoScript] = useState("");
  const [videoImage, setVideoImage] = useState(null);
  const [videoImagePreview, setVideoImagePreview] = useState(null);
  const [videoRatio, setVideoRatio] = useState("9:16");
  const [videoVoice, setVideoVoice] = useState("female");
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const videoImageInputRef = useRef(null);

  const handlePromptCountChange = (count) => {
    setPromptCount(count);
    setPrompts((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
  };

  const handlePromptChange = (index, value) => {
    setPrompts((prev) => prev.map((prompt, i) => (i === index ? value : prompt)));
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setProductImage(file);
    setProductImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleVideoImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setVideoImage(file);
    setVideoImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearProductImage = () => {
    setProductImage(null);
    setProductImagePreview(null);
    if (productImageInputRef.current) productImageInputRef.current.value = "";
  };

  const clearVideoImage = () => {
    setVideoImage(null);
    setVideoImagePreview(null);
    if (videoImageInputRef.current) videoImageInputRef.current.value = "";
  };

  const clearLogo = () => {
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleGenerateImage = async () => {
    const trimmedPrompts = prompts.slice(0, promptCount).map((prompt) => prompt.trim());
    if (trimmedPrompts.some((prompt) => !prompt)) {
      toast.warn(`Fill in all ${promptCount} prompt${promptCount > 1 ? "s" : ""} before generating.`);
      return;
    }
    if (!productImage) {
      toast.warn("Upload a product image first.");
      return;
    }

    setImageGenerating(true);
    setGeneratedImageUrl(null);
    setStepResults([]);

    let currentImageFile = productImage;
    let lastUrl = null;

    try {
      for (let i = 0; i < trimmedPrompts.length; i += 1) {
        setGeneratingStep(i + 1);

        const formData = new FormData();
        formData.append("prompt", trimmedPrompts[i]);
        formData.append("ratio", imageRatio);
        formData.append("image", currentImageFile);

        const res = await generateAiImage(formData);
        const url = extractMediaUrl(res.data);
        if (!url) {
          toast.error(`Prompt ${i + 1} didn't return an image. Stopping here.`);
          break;
        }

        lastUrl = url;
        setStepResults((prev) => [...prev, { step: i + 1, prompt: trimmedPrompts[i], url }]);

        const isLastPrompt = i === trimmedPrompts.length - 1;
        if (!isLastPrompt) {
          try {
            const blob = await fetch(url).then((response) => response.blob());
            currentImageFile = new File([blob], `step-${i + 1}.png`, { type: blob.type || "image/png" });
          } catch {
            toast.warn(`Couldn't chain into prompt ${i + 2} — using prompt ${i + 1}'s result as the final image.`);
            break;
          }
        }
      }

      if (lastUrl) {
        setGeneratedImageUrl(lastUrl);
        toast.success("Image generated!");
      } else {
        toast.error("Failed to generate image.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to generate image.");
    } finally {
      setImageGenerating(false);
      setGeneratingStep(0);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoScript.trim()) {
      toast.warn("Write what the video should say.");
      return;
    }
    if (!videoImage) {
      toast.warn("Upload an image to animate.");
      return;
    }

    setVideoGenerating(true);
    setGeneratedVideoUrl(null);
    try {
      const formData = new FormData();
      formData.append("script", videoScript.trim());
      formData.append("ratio", videoRatio);
      formData.append("voice", videoVoice);
      formData.append("image", videoImage);

      const res = await generateAiVideo(formData);
      const url = extractMediaUrl(res.data);
      if (url) {
        setGeneratedVideoUrl(url);
        toast.success("Video generated!");
      } else {
        toast.success(res.data?.message ?? "Video generated, but no preview was returned.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to generate video.");
    } finally {
      setVideoGenerating(false);
    }
  };

  useEffect(() => {
    if (!generatedImageUrl) {
      setComposedImageUrl(null);
      setComposeFailed(false);
      return undefined;
    }

    const hasWatermark = watermarkEnabled && watermarkText.trim().length > 0;
    if (!hasWatermark && !logoPreview) {
      setComposedImageUrl(generatedImageUrl);
      setComposeFailed(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const dataUrl = await composeImageWithBranding({
          baseUrl: generatedImageUrl,
          watermark: hasWatermark
            ? { text: watermarkText.trim(), sizePercent: watermarkSize, position: watermarkPosition }
            : null,
          logo: logoPreview ? { src: logoPreview, sizePercent: logoSizePercent, position: logoPosition } : null,
        });
        if (!cancelled) {
          setComposedImageUrl(dataUrl);
          setComposeFailed(false);
        }
      } catch {
        if (!cancelled) {
          setComposedImageUrl(generatedImageUrl);
          setComposeFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    generatedImageUrl,
    watermarkEnabled,
    watermarkText,
    watermarkSize,
    watermarkPosition,
    logoPreview,
    logoSizePercent,
    logoPosition,
  ]);

  useEffect(() => {
    if (composeFailed) {
      toast.warn("Couldn't overlay the watermark/logo on this preview — the image host blocks in-browser edits. Download will use the plain generated image.");
    }
  }, [composeFailed]);

  const finalImageUrl = composedImageUrl ?? generatedImageUrl;
  const finalImageIsComposed = Boolean(composedImageUrl) && composedImageUrl !== generatedImageUrl;

  return (
    <section className="ai-gen-hub card-wrapper">
      <header className="ai-gen-hub__hero">
        <div className="ai-gen-hub__hero-copy">
          <span className="ai-gen-hub__eyebrow"><LuSparkles /> AI Studio</span>
          <h1>Generate product images &amp; videos</h1>
          <p>
            Turn a prompt and a product photo into a polished image, or bring your product to
            life with a talking video.
          </p>
        </div>
      </header>

      <div className="ai-gen-hub__tabs">
        <button
          type="button"
          className={`ai-gen-hub__tab ${mode === "image" ? "ai-gen-hub__tab--active" : ""}`}
          onClick={() => setMode("image")}
        >
          <LuImage /> Generate Image
        </button>
        <button
          type="button"
          className={`ai-gen-hub__tab ${mode === "video" ? "ai-gen-hub__tab--active" : ""}`}
          onClick={() => setMode("video")}
        >
          <LuVideo /> Generate Video
        </button>
      </div>

      {mode === "image" ? (
        <div className="ai-gen-hub__layout">
          <article className="ai-gen-hub__card">
            <div className="ai-gen-hub__field">
              <span className="ai-gen-hub__field-label">Number of prompts (1-6)</span>
              <RatioPicker options={PROMPT_COUNT_OPTIONS} value={promptCount} onChange={handlePromptCountChange} />
              {promptCount > 1 && (
                <span className="ai-gen-hub__hint">
                  Applied in order — prompt 2 edits the result of prompt 1, and so on.
                </span>
              )}
            </div>

            {prompts.slice(0, promptCount).map((prompt, index) => (
              <label className="ai-gen-hub__field" key={index}>
                <span className="ai-gen-hub__field-label">
                  Prompt {index + 1}
                  {index === 0 ? " (applied first)" : ""}
                </span>
                <textarea
                  rows={3}
                  placeholder={
                    index === 0
                      ? "e.g. Place this product on a marble kitchen countertop with soft morning light"
                      : `e.g. Now adjust the result of prompt ${index}...`
                  }
                  value={prompt}
                  onChange={(event) => handlePromptChange(index, event.target.value)}
                />
              </label>
            ))}

            <UploadField
              label="Product image"
              hint="Click to upload a product photo"
              preview={productImagePreview}
              onChange={handleProductImageChange}
              onClear={clearProductImage}
              inputRef={productImageInputRef}
            />

            <div className="ai-gen-hub__field">
              <span className="ai-gen-hub__field-label">Aspect ratio</span>
              <RatioPicker options={IMAGE_RATIOS} value={imageRatio} onChange={setImageRatio} />
            </div>

            <div className="ai-gen-hub__section-title">Branding (optional)</div>

            <label className="ai-gen-hub__toggle-row">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(event) => setWatermarkEnabled(event.target.checked)}
              />
              <span><LuType /> Add text watermark</span>
            </label>

            {watermarkEnabled && (
              <>
                <label className="ai-gen-hub__field">
                  <span className="ai-gen-hub__field-label">Watermark text</span>
                  <textarea
                    rows={1}
                    placeholder="e.g. @yourbrand"
                    value={watermarkText}
                    onChange={(event) => setWatermarkText(event.target.value)}
                  />
                </label>
                <SliderField
                  label="Watermark size"
                  value={watermarkSize}
                  min={16}
                  max={96}
                  onChange={setWatermarkSize}
                />
                <div className="ai-gen-hub__field">
                  <span className="ai-gen-hub__field-label">Watermark position</span>
                  <PositionPicker value={watermarkPosition} onChange={setWatermarkPosition} />
                </div>
              </>
            )}

            <UploadField
              label={<span><LuStamp /> Logo (optional)</span>}
              hint="Click to upload a logo to stamp on the image"
              preview={logoPreview}
              onChange={handleLogoChange}
              onClear={clearLogo}
              inputRef={logoInputRef}
            />

            {logoPreview && (
              <>
                <SliderField
                  label="Logo size"
                  value={logoSizePercent}
                  min={5}
                  max={50}
                  unit="%"
                  onChange={setLogoSizePercent}
                />
                <div className="ai-gen-hub__field">
                  <span className="ai-gen-hub__field-label">Logo position</span>
                  <PositionPicker value={logoPosition} onChange={setLogoPosition} />
                </div>
              </>
            )}

            <button
              type="button"
              className="ai-gen-hub__btn ai-gen-hub__btn--primary"
              disabled={imageGenerating}
              onClick={handleGenerateImage}
            >
              {imageGenerating ? <LuLoader className="spin-icon" /> : <LuSparkles />}
              <span>
                {imageGenerating
                  ? `Applying prompt ${generatingStep} of ${promptCount}…`
                  : promptCount > 1
                  ? `Generate with ${promptCount} prompts`
                  : "Generate image"}
              </span>
            </button>
          </article>

          <article className="ai-gen-hub__result">
            {imageGenerating ? (
              <div className="ai-gen-hub__result-loading">
                <LuLoader className="spin-icon" />
                <span>Applying prompt {generatingStep} of {promptCount}…</span>
              </div>
            ) : finalImageUrl ? (
              <div className="ai-gen-hub__result-media">
                <img src={finalImageUrl} alt="Generated result" />
                <a
                  className="ai-gen-hub__btn ai-gen-hub__btn--ghost"
                  href={finalImageUrl}
                  target={finalImageIsComposed ? undefined : "_blank"}
                  rel="noreferrer"
                  download="ai-generated-image.png"
                >
                  <LuDownload /> <span>Download</span>
                </a>

                {stepResults.length > 1 && (
                  <div className="ai-gen-hub__step-strip">
                    {stepResults.map((step) => (
                      <div key={step.step} className="ai-gen-hub__step-thumb" title={step.prompt}>
                        <img src={step.url} alt={`Step ${step.step} result`} />
                        <span>Step {step.step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-gen-hub__empty">
                <LuImage />
                <strong>No image yet</strong>
                <span>Your generated image will appear here.</span>
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="ai-gen-hub__layout">
          <article className="ai-gen-hub__card">
            <label className="ai-gen-hub__field">
              <span className="ai-gen-hub__field-label">What should it say?</span>
              <textarea
                rows={4}
                placeholder="Write the script your product will speak in the video"
                value={videoScript}
                onChange={(event) => setVideoScript(event.target.value)}
              />
            </label>

            <UploadField
              label="Image to animate"
              hint="Click to upload an image that will speak"
              preview={videoImagePreview}
              onChange={handleVideoImageChange}
              onClear={clearVideoImage}
              inputRef={videoImageInputRef}
            />

            <div className="ai-gen-hub__field-row">
              <div className="ai-gen-hub__field">
                <span className="ai-gen-hub__field-label">Aspect ratio</span>
                <RatioPicker options={VIDEO_RATIOS} value={videoRatio} onChange={setVideoRatio} />
              </div>

              <label className="ai-gen-hub__field">
                <span className="ai-gen-hub__field-label"><LuMic /> Voice</span>
                <select value={videoVoice} onChange={(event) => setVideoVoice(event.target.value)}>
                  {VIDEO_VOICES.map((voice) => (
                    <option key={voice.value} value={voice.value}>
                      {voice.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              className="ai-gen-hub__btn ai-gen-hub__btn--primary"
              disabled={videoGenerating}
              onClick={handleGenerateVideo}
            >
              {videoGenerating ? <LuLoader className="spin-icon" /> : <LuSparkles />}
              <span>{videoGenerating ? "Generating…" : "Generate video"}</span>
            </button>
          </article>

          <article className="ai-gen-hub__result">
            {videoGenerating ? (
              <div className="ai-gen-hub__result-loading">
                <LuLoader className="spin-icon" />
                <span>Generating your video…</span>
              </div>
            ) : generatedVideoUrl ? (
              <div className="ai-gen-hub__result-media">
                <video src={generatedVideoUrl} controls />
                <a
                  className="ai-gen-hub__btn ai-gen-hub__btn--ghost"
                  href={generatedVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  <LuDownload /> <span>Download</span>
                </a>
              </div>
            ) : (
              <div className="ai-gen-hub__empty">
                <LuFilm />
                <strong>No video yet</strong>
                <span>Your generated video will appear here.</span>
              </div>
            )}
          </article>
        </div>
      )}
    </section>
  );
}

export default AiVideoGenerationContent;
