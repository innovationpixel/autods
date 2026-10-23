import { useRef, useState } from "react";
import { LuDownload, LuFilm, LuImage, LuLoader, LuMic, LuSparkles, LuVideo } from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { generateAiVideo } from "../../../services/AiGenerationService";
import { extractMediaUrl } from "./aiStudioUtils";
import { RatioPicker, UploadField } from "./AiStudioControls";
import AiImageGenerator from "./AiImageGenerator";
import AiTemplateGallery from "./AiTemplateGallery";

const VIDEO_RATIOS = ["9:16", "16:9", "1:1"];
const VIDEO_VOICES = [
  { value: "female", label: "Female voice" },
  { value: "male", label: "Male voice" },
];

function AiVideoGenerationContent() {
  const [mode, setMode] = useState("image");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

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
            images — or bring your product to life with a talking video.
          </p>
        </div>
      </header>

      {/* <div className="ai-gen-hub__tabs">
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
      </div> */}

      {mode === "image" ? (
        selectedTemplate ? (
          <AiImageGenerator
            key={selectedTemplate.id}
            template={selectedTemplate}
            onBack={() => setSelectedTemplate(null)}
          />
        ) : (
          <AiTemplateGallery onUseTemplate={setSelectedTemplate} />
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
