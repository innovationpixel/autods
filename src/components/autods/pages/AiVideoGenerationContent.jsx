import { useEffect, useRef, useState } from "react";
import { LuDownload, LuFilm, LuImage, LuLoader, LuMic, LuSparkles, LuVideo } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { generateAiVideo } from "../../../services/AiGenerationService";
import aiBackgroundQueue from "../../../services/AiBackgroundQueue";
import { extractMediaUrl } from "./aiStudioUtils";
import { RatioPicker, UploadField } from "./AiStudioControls";
import AiImageGenerator from "./AiImageGenerator";
import AiTemplateGallery from "./AiTemplateGallery";
import AiMyImagesGallery from "./AiMyImagesGallery";

const VIDEO_RATIOS = ["9:16", "16:9", "1:1"];
const VIDEO_VOICES = [
  { value: "female", label: "Female voice" },
  { value: "male", label: "Male voice" },
];

function AiVideoGenerationContent() {
  const [mode, setMode] = useState("image");
  const [subTab, setSubTab] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || (hash.includes("?") ? `?${hash.split("?")[1]}` : "");
      const params = new URLSearchParams(search);
      if (params.get("tab") === "my-images") return "my-images";
    }
    return "templates";
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [queueState, setQueueState] = useState(aiBackgroundQueue.getState());

  useEffect(() => {
    return aiBackgroundQueue.subscribe(setQueueState);
  }, []);

  const [videoScript, setVideoScript] = useState("");
  const [videoImage, setVideoImage] = useState(null);
  const [videoImagePreview, setVideoImagePreview] = useState(null);
  const [videoRatio, setVideoRatio] = useState("9:16");
  const [videoVoice, setVideoVoice] = useState("female");
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const videoImageInputRef = useRef(null);

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
            Pick a template, upload your product photos and logo, and generate a full set of
            images in the background while you continue working across AutoDS.
          </p>
        </div>
      </header>

      {queueState.isGenerating && (
        <div className="ai-background-banner">
          <LuLoader className="spin-icon" style={{ fontSize: 18 }} />
          <div className="ai-background-banner__info">
            <strong>Generating in background:</strong> {queueState.activeTask?.templateTitle || "Image"} (
            {queueState.activeTask?.current} of {queueState.activeTask?.total}) — you can freely navigate anywhere in AutoDS!
          </div>
          {subTab !== "my-images" && (
            <button
              type="button"
              className="ai-background-banner__btn"
              onClick={() => {
                setSelectedTemplate(null);
                setSubTab("my-images");
              }}
            >
              View My Images &rarr;
            </button>
          )}
        </div>
      )}

      <div className="ai-gen-hub__tabs" style={{ width: "min(100%, 460px)", display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
        <button
          type="button"
          className={`ai-gen-hub__tab ${subTab === "templates" ? "ai-gen-hub__tab--active" : ""}`}
          onClick={() => {
            setSubTab("templates");
          }}
        >
          <LuSparkles /> Templates
        </button>
        <button
          type="button"
          className={`ai-gen-hub__tab ${subTab === "my-images" ? "ai-gen-hub__tab--active" : ""}`}
          onClick={() => {
            setSelectedTemplate(null);
            setSubTab("my-images");
          }}
          style={{ position: "relative" }}
        >
          <LuImage /> My Images
          {queueState.unviewedCount > 0 && (
            <span className="ai-my-images-badge-count">
              {queueState.unviewedCount} NEW
            </span>
          )}
        </button>
      </div>

      {mode === "image" ? (
        subTab === "my-images" ? (
          <AiMyImagesGallery
            onExploreTemplates={() => {
              setSubTab("templates");
              setSelectedTemplate(null);
            }}
          />
        ) : selectedTemplate ? (
          <AiImageGenerator
            key={selectedTemplate.id}
            template={selectedTemplate}
            onBack={() => setSelectedTemplate(null)}
            onViewMyImages={() => {
              setSelectedTemplate(null);
              setSubTab("my-images");
            }}
          />
        ) : (
          <AiTemplateGallery
            onUseTemplate={setSelectedTemplate}
            onViewMyImages={() => {
              setSubTab("my-images");
            }}
          />
        )
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
