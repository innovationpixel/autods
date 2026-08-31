import { useRef, useState } from "react";
import {
  LuDownload,
  LuFilm,
  LuImage,
  LuLoader,
  LuMic,
  LuSparkles,
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

function AiVideoGenerationContent() {
  const [mode, setMode] = useState("image");

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [imageRatio, setImageRatio] = useState("1:1");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const productImageInputRef = useRef(null);

  // Video generation state
  const [videoScript, setVideoScript] = useState("");
  const [videoImage, setVideoImage] = useState(null);
  const [videoImagePreview, setVideoImagePreview] = useState(null);
  const [videoRatio, setVideoRatio] = useState("9:16");
  const [videoVoice, setVideoVoice] = useState("female");
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const videoImageInputRef = useRef(null);

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

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.warn("Describe what you want the image to look like.");
      return;
    }
    if (!productImage) {
      toast.warn("Upload a product image first.");
      return;
    }

    setImageGenerating(true);
    setGeneratedImageUrl(null);
    try {
      const formData = new FormData();
      formData.append("prompt", imagePrompt.trim());
      formData.append("ratio", imageRatio);
      formData.append("image", productImage);

      const res = await generateAiImage(formData);
      const url = extractMediaUrl(res.data);
      if (url) {
        setGeneratedImageUrl(url);
        toast.success("Image generated!");
      } else {
        toast.success(res.data?.message ?? "Image generated, but no preview was returned.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to generate image.");
    } finally {
      setImageGenerating(false);
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
            <label className="ai-gen-hub__field">
              <span className="ai-gen-hub__field-label">Prompt</span>
              <textarea
                rows={4}
                placeholder="e.g. Place this product on a marble kitchen countertop with soft morning light"
                value={imagePrompt}
                onChange={(event) => setImagePrompt(event.target.value)}
              />
            </label>

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

            <button
              type="button"
              className="ai-gen-hub__btn ai-gen-hub__btn--primary"
              disabled={imageGenerating}
              onClick={handleGenerateImage}
            >
              {imageGenerating ? <LuLoader className="spin-icon" /> : <LuSparkles />}
              <span>{imageGenerating ? "Generating…" : "Generate image"}</span>
            </button>
          </article>

          <article className="ai-gen-hub__result">
            {imageGenerating ? (
              <div className="ai-gen-hub__result-loading">
                <LuLoader className="spin-icon" />
                <span>Generating your image…</span>
              </div>
            ) : generatedImageUrl ? (
              <div className="ai-gen-hub__result-media">
                <img src={generatedImageUrl} alt="Generated result" />
                <a
                  className="ai-gen-hub__btn ai-gen-hub__btn--ghost"
                  href={generatedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  <LuDownload /> <span>Download</span>
                </a>
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
