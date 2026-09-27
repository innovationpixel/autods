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
  LuChevronDown,
  LuCircleDot,
  LuCloudUpload,
  LuDownload,
  LuFilm,
  LuImage,
  LuLink,
  LuLoader,
  LuMic,
  LuMinus,
  LuPlus,
  LuSparkles,
  LuTrash2,
  LuType,
  LuUpload,
  LuVideo,
  LuX,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { generateAiImage, generateAiVideo } from "../../../services/AiGenerationService";

const MAX_INPUT_IMAGES = 20;
const MAX_PROMPTS = 6;

const VIDEO_RATIOS = ["9:16", "16:9", "1:1"];
const VIDEO_VOICES = [
  { value: "female", label: "Female voice" },
  { value: "male", label: "Male voice" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1", sub: "Square" },
  { value: "16:9", label: "16:9", sub: "Landscape" },
  { value: "9:16", label: "9:16", sub: "Portrait" },
  { value: "4:3", label: "4:3", sub: "Landscape" },
  { value: "3:4", label: "3:4", sub: "Portrait" },
  { value: "custom", label: "Custom", sub: "" },
];

const OUTPUT_FORMATS = ["PNG", "JPG", "WEBP"];

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

const POSITION_META = {
  "top-left": { icon: LuArrowUpLeft, label: "Top Left" },
  "top-center": { icon: LuArrowUp, label: "Top Center" },
  "top-right": { icon: LuArrowUpRight, label: "Top Right" },
  "middle-left": { icon: LuArrowLeft, label: "Middle Left" },
  center: { icon: LuCircleDot, label: "Center" },
  "middle-right": { icon: LuArrowRight, label: "Middle Right" },
  "bottom-left": { icon: LuArrowDownLeft, label: "Bottom Left" },
  "bottom-center": { icon: LuArrowDown, label: "Bottom Center" },
  "bottom-right": { icon: LuArrowDownRight, label: "Bottom Right" },
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
        const { icon: Icon, label } = POSITION_META[position];
        return (
          <button
            type="button"
            key={position}
            className={`ai-gen-hub__position-cell ${value === position ? "ai-gen-hub__position-cell--active" : ""}`}
            onClick={() => onChange(position)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ReferenceImagePicker({ images, valueId, isOpen, onToggle, onChange }) {
  const selected = images.find((image) => image.id === valueId) ?? null;

  return (
    <div className="ai-gen-hub__ref-picker">
      <button
        type="button"
        className="ai-gen-hub__ref-trigger"
        title="Reference input image (optional)"
        onClick={onToggle}
      >
        {selected ? <img src={selected.preview} alt="Reference" /> : <LuImage />}
        <LuChevronDown />
      </button>

      {isOpen && (
        <div className="ai-gen-hub__ref-menu">
          <button
            type="button"
            className={`ai-gen-hub__ref-option ${!valueId ? "ai-gen-hub__ref-option--active" : ""}`}
            onClick={() => onChange(null)}
          >
            <span className="ai-gen-hub__ref-option-none">
              <LuX />
            </span>
            <span>No reference</span>
          </button>
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              className={`ai-gen-hub__ref-option ${valueId === image.id ? "ai-gen-hub__ref-option--active" : ""}`}
              onClick={() => onChange(image.id)}
            >
              <img src={image.preview} alt={`Input ${index + 1}`} />
              <span>Image {index + 1}</span>
            </button>
          ))}
        </div>
      )}
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

function Stepper({ value, min, max, onChange }) {
  return (
    <div className="ai-gen-hub__stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <LuMinus />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <LuPlus />
      </button>
    </div>
  );
}

function AiVideoGenerationContent() {
  const [mode, setMode] = useState("image");

  // Section 1: input images (up to MAX_INPUT_IMAGES)
  const [inputImages, setInputImages] = useState([]);
  const inputImagesRef = useRef(null);

  // Section 2: logo + position (+ optional text watermark)
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoSizePercent, setLogoSizePercent] = useState(18);
  const [logoPosition, setLogoPosition] = useState("bottom-right");
  const logoInputRef = useRef(null);

  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkSize, setWatermarkSize] = useState(36);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-left");

  // Section 3: output settings
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [outputWidth, setOutputWidth] = useState(1024);
  const [outputHeight, setOutputHeight] = useState(1024);
  const [sizeLinked, setSizeLinked] = useState(true);
  const [outputFormat, setOutputFormat] = useState("PNG");

  // Section 4: one prompt per output image, each with an optional reference image
  const [prompts, setPrompts] = useState([""]);
  const [referenceImageIds, setReferenceImageIds] = useState([null]);
  const [openRefPicker, setOpenRefPicker] = useState(null);

  // Section 5: generation + preview
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(0);
  const [outputs, setOutputs] = useState([]);
  const [composedOutputs, setComposedOutputs] = useState([]);
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

  const addInputImages = (fileList) => {
    const files = Array.from(fileList ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;

    const remaining = MAX_INPUT_IMAGES - inputImages.length;
    if (remaining <= 0) {
      toast.warn(`You can upload up to ${MAX_INPUT_IMAGES} images.`);
      return;
    }

    const accepted = files.slice(0, remaining);
    if (files.length > accepted.length) {
      toast.warn(`Only ${remaining} more image${remaining > 1 ? "s" : ""} could be added (max ${MAX_INPUT_IMAGES}).`);
    }

    setInputImages((prev) => [
      ...prev,
      ...accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleInputImagesChange = (event) => {
    addInputImages(event.target.files);
    event.target.value = "";
  };

  const handleInputImagesDrop = (event) => {
    event.preventDefault();
    addInputImages(event.dataTransfer.files);
  };

  const removeInputImage = (id) => {
    setInputImages((prev) => prev.filter((image) => image.id !== id));
    setReferenceImageIds((prev) => prev.map((refId) => (refId === id ? null : refId)));
  };

  const handlePromptChange = (index, value) => {
    setPrompts((prev) => prev.map((prompt, i) => (i === index ? value : prompt)));
  };

  const handleReferenceImageChange = (index, imageId) => {
    setReferenceImageIds((prev) => prev.map((refId, i) => (i === index ? imageId : refId)));
    setOpenRefPicker(null);
  };

  const addPromptRow = () => {
    if (prompts.length >= MAX_PROMPTS) return;
    setPrompts((prev) => [...prev, ""]);
    setReferenceImageIds((prev) => [...prev, null]);
  };

  const removePromptRow = (index) => {
    if (prompts.length <= 1) return;
    setPrompts((prev) => prev.filter((_, i) => i !== index));
    setReferenceImageIds((prev) => prev.filter((_, i) => i !== index));
  };

  const setPromptCount = (count) => {
    setPrompts((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
    setReferenceImageIds((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push(null);
      return next;
    });
  };

  const handleVideoImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setVideoImage(file);
    setVideoImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const clearVideoImage = () => {
    setVideoImage(null);
    setVideoImagePreview(null);
    if (videoImageInputRef.current) videoImageInputRef.current.value = "";
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearLogo = () => {
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const applyAspectRatio = (value) => {
    setAspectRatio(value);
    if (value === "custom") return;
    const [w, h] = value.split(":").map(Number);
    const scale = 1024 / Math.max(w, h);
    setOutputWidth(Math.round(w * scale));
    setOutputHeight(Math.round(h * scale));
  };

  const handleWidthChange = (value) => {
    const width = Math.max(1, Number(value) || 0);
    setOutputWidth(width);
    if (sizeLinked && outputWidth > 0) {
      const ratio = outputHeight / outputWidth;
      setOutputHeight(Math.round(width * ratio));
    }
  };

  const handleHeightChange = (value) => {
    const height = Math.max(1, Number(value) || 0);
    setOutputHeight(height);
    if (sizeLinked && outputHeight > 0) {
      const ratio = outputWidth / outputHeight;
      setOutputWidth(Math.round(height * ratio));
    }
  };

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

      const referencedImage = referenceImageIds[i]
        ? inputImages.find((image) => image.id === referenceImageIds[i])
        : null;

      const formData = new FormData();
      formData.append("prompt", trimmedPrompts[i]);
      formData.append("ratio", ratioValue);
      formData.append("width", outputWidth);
      formData.append("height", outputHeight);
      formData.append("format", outputFormat.toLowerCase());
      inputImages.forEach(({ file }) => formData.append("images", file));
      formData.append("image", referencedImage ? referencedImage.file : inputImages[0].file);

      try {
        const res = await generateAiImage(formData);
        const url = extractMediaUrl(res.data);
        if (url) {
          setOutputs((prev) => [...prev, { index: i + 1, prompt: trimmedPrompts[i], url }]);
        } else {
          setOutputs((prev) => [...prev, { index: i + 1, prompt: trimmedPrompts[i], url: null }]);
          toast.error(`Prompt ${i + 1} didn't return an image.`);
        }
      } catch (err) {
        setOutputs((prev) => [...prev, { index: i + 1, prompt: trimmedPrompts[i], url: null }]);
        toast.error(err.response?.data?.message ?? `Prompt ${i + 1} failed to generate.`);
      }
    }

    setImageGenerating(false);
    setGeneratingIndex(0);
    toast.success("Finished generating your images!");
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
        })
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

  return (
    <section className="ai-gen-hub card-wrapper">
      <header className="ai-gen-hub__hero">
        <div className="ai-gen-hub__hero-copy">
          <span className="ai-gen-hub__eyebrow"><LuSparkles /> AI Studio</span>
          <h1>Generate product images &amp; videos</h1>
          <p>
            Upload your product photos, add your logo, and write a prompt for each output image
            you want — or bring your product to life with a talking video.
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
        <div className="ai-gen-hub__template">
          <div className="ai-gen-hub__template-row">
            <article className="ai-gen-hub__card">
              <div className="ai-gen-hub__section-head">
                <span className="ai-gen-hub__section-badge">1</span>
                <div>
                  <h3>Upload Input Images</h3>
                  <p>Upload product images to be used for generating output images. Max {MAX_INPUT_IMAGES}.</p>
                </div>
              </div>

              <div
                className="ai-gen-hub__dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleInputImagesDrop}
              >
                <LuCloudUpload />
                <span>Drag &amp; drop images here or click to upload</span>
                <label className="ai-gen-hub__btn ai-gen-hub__btn--ghost ai-gen-hub__choose-files">
                  Choose Files
                  <input
                    ref={inputImagesRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleInputImagesChange}
                  />
                </label>
                <small>Supported formats: JPG, PNG, WebP</small>
              </div>

              {inputImages.length > 0 && (
                <div className="ai-gen-hub__image-grid">
                  {inputImages.map((image) => (
                    <div className="ai-gen-hub__image-thumb" key={image.id}>
                      <img src={image.preview} alt="Input" />
                      <button type="button" onClick={() => removeInputImage(image.id)}>
                        <LuX />
                      </button>
                    </div>
                  ))}
                  {inputImages.length < MAX_INPUT_IMAGES && (
                    <label className="ai-gen-hub__image-add-tile">
                      <LuPlus />
                      <span>Add More</span>
                      <input type="file" accept="image/*" multiple onChange={handleInputImagesChange} />
                    </label>
                  )}
                </div>
              )}
            </article>

            <article className="ai-gen-hub__card">
              <div className="ai-gen-hub__section-head">
                <span className="ai-gen-hub__section-badge">2</span>
                <div>
                  <h3>Upload Logo &amp; Position</h3>
                  <p>Upload your brand logo and choose its position.</p>
                </div>
              </div>

              <UploadField
                label="Logo"
                hint="Click to upload your logo"
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
                    <span className="ai-gen-hub__field-label">Logo Position (on all output images)</span>
                    <PositionPicker value={logoPosition} onChange={setLogoPosition} />
                  </div>
                </>
              )}

              <label className="ai-gen-hub__toggle-row">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(event) => setWatermarkEnabled(event.target.checked)}
                />
                <span><LuType /> Also add a text watermark</span>
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
                    <span className="ai-gen-hub__field-label">Watermark Position</span>
                    <PositionPicker value={watermarkPosition} onChange={setWatermarkPosition} />
                  </div>
                </>
              )}
            </article>

            <article className="ai-gen-hub__card">
              <div className="ai-gen-hub__section-head">
                <span className="ai-gen-hub__section-badge">3</span>
                <div>
                  <h3>Output Settings</h3>
                  <p>Configure output image settings.</p>
                </div>
              </div>

              <div className="ai-gen-hub__field">
                <span className="ai-gen-hub__field-label">Aspect Ratio</span>
                <div className="ai-gen-hub__aspect-grid">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      type="button"
                      key={ratio.value}
                      className={`ai-gen-hub__aspect-chip ${aspectRatio === ratio.value ? "ai-gen-hub__aspect-chip--active" : ""}`}
                      onClick={() => applyAspectRatio(ratio.value)}
                    >
                      <span
                        className={`ai-gen-hub__aspect-swatch ai-gen-hub__aspect-swatch--${ratio.value === "custom" ? "custom" : ratio.value.replace(":", "-")}`}
                      >
                        {ratio.value === "custom" && <LuPlus />}
                      </span>
                      <strong>{ratio.label}</strong>
                      {ratio.sub && <small>{ratio.sub}</small>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-gen-hub__field">
                <span className="ai-gen-hub__field-label">Output Size (px)</span>
                <div className="ai-gen-hub__size-row">
                  <label>
                    <span>Width</span>
                    <input
                      type="number"
                      min={1}
                      value={outputWidth}
                      onChange={(event) => handleWidthChange(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className={`ai-gen-hub__link-btn ${sizeLinked ? "ai-gen-hub__link-btn--active" : ""}`}
                    title={sizeLinked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                    onClick={() => setSizeLinked((prev) => !prev)}
                  >
                    <LuLink />
                  </button>
                  <label>
                    <span>Height</span>
                    <input
                      type="number"
                      min={1}
                      value={outputHeight}
                      onChange={(event) => handleHeightChange(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="ai-gen-hub__field">
                <span className="ai-gen-hub__field-label">Output Format</span>
                <RatioPicker options={OUTPUT_FORMATS} value={outputFormat} onChange={setOutputFormat} />
              </div>

              <div className="ai-gen-hub__field">
                <span className="ai-gen-hub__field-label">Number of Output Images</span>
                <Stepper value={prompts.length} min={1} max={MAX_PROMPTS} onChange={setPromptCount} />
                <span className="ai-gen-hub__hint">
                  We will generate {prompts.length} image{prompts.length > 1 ? "s" : ""} using your input images and prompts below.
                </span>
              </div>
            </article>
          </div>

          <div className="ai-gen-hub__template-row ai-gen-hub__template-row--split">
            <article className="ai-gen-hub__card">
              <div className="ai-gen-hub__section-head">
                <span className="ai-gen-hub__section-badge">4</span>
                <div>
                  <h3>Prompts for Each Output Image</h3>
                  <p>Write a custom prompt for each image. Each prompt will generate one output image.</p>
                </div>
              </div>

              {openRefPicker !== null && (
                <div className="ai-gen-hub__ref-backdrop" onClick={() => setOpenRefPicker(null)} />
              )}

              <div className="ai-gen-hub__prompt-table">
                {prompts.map((prompt, index) => (
                  <div className="ai-gen-hub__prompt-row" key={index}>
                    <span className="ai-gen-hub__prompt-number">{index + 1}</span>
                    <textarea
                      rows={2}
                      placeholder={`e.g. ${
                        index === 0
                          ? "Main product image with clean white background, premium look."
                          : "Describe output image " + (index + 1) + "..."
                      }`}
                      value={prompt}
                      onChange={(event) => handlePromptChange(index, event.target.value)}
                    />
                    <ReferenceImagePicker
                      images={inputImages}
                      valueId={referenceImageIds[index]}
                      isOpen={openRefPicker === index}
                      onToggle={() => setOpenRefPicker((prev) => (prev === index ? null : index))}
                      onChange={(imageId) => handleReferenceImageChange(index, imageId)}
                    />
                    <button
                      type="button"
                      className="ai-gen-hub__prompt-delete"
                      disabled={prompts.length <= 1}
                      onClick={() => removePromptRow(index)}
                    >
                      <LuTrash2 />
                    </button>
                  </div>
                ))}
              </div>
              <span className="ai-gen-hub__hint">
                Optionally pick which uploaded input image a prompt should use as its reference.
              </span>

              <button
                type="button"
                className="ai-gen-hub__add-prompt-btn"
                disabled={prompts.length >= MAX_PROMPTS}
                onClick={addPromptRow}
              >
                <LuPlus /> Add Another Prompt
              </button>
            </article>

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
                    const isCurrentlyGenerating = imageGenerating && generatingIndex === index + 1;
                    return (
                      <div className="ai-gen-hub__preview-item" key={index}>
                        <span className="ai-gen-hub__preview-badge">{index + 1}</span>
                        {isCurrentlyGenerating ? (
                          <div className="ai-gen-hub__preview-loading">
                            <LuLoader className="spin-icon" />
                          </div>
                        ) : result?.finalUrl ?? result?.url ? (
                          <>
                            <img src={result.finalUrl ?? result.url} alt={`Output ${index + 1}`} />
                            <a
                              className="ai-gen-hub__preview-download"
                              href={result.finalUrl ?? result.url}
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
          </div>

          <div className="ai-gen-hub__action-bar">
            <button
              type="button"
              className="ai-gen-hub__btn ai-gen-hub__btn--primary"
              disabled={imageGenerating}
              onClick={handleGenerateAllImages}
            >
              {imageGenerating ? <LuLoader className="spin-icon" /> : <LuSparkles />}
              <span>
                {imageGenerating
                  ? `Generating image ${generatingIndex} of ${prompts.length}…`
                  : "Generate All Images"}
              </span>
            </button>
          </div>
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
