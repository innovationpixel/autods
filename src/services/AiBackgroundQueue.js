import { toast } from "../utils/toast";
import { generateAiImage, getMyGeneratedImages, markImageAsViewed } from "./AiGenerationService";
import { composeImageWithBranding, extractMediaUrl } from "../components/autods/pages/aiStudioUtils";

class AiBackgroundQueueManager {
  constructor() {
    this.activeTask = null;
    this.listeners = new Set();
    this.unviewedCount = 0;
    this.init();
  }

  async init() {
    try {
      const res = await getMyGeneratedImages({ limit: 1 });
      if (res.data?.unviewed_count !== undefined) {
        this.unviewedCount = res.data.unviewed_count;
        this.notifyListeners();
      }
    } catch {
      // Ignored if not yet authenticated
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("AiBackgroundQueue listener error:", err);
      }
    });
  }

  getState() {
    return {
      isGenerating: Boolean(this.activeTask),
      activeTask: this.activeTask,
      unviewedCount: this.unviewedCount,
    };
  }

  setUnviewedCount(count) {
    this.unviewedCount = Math.max(0, count);
    this.notifyListeners();
  }

  decrementUnviewedCount() {
    this.unviewedCount = Math.max(0, this.unviewedCount - 1);
    this.notifyListeners();
  }

  /**
   * Start image generation in the background.
   */
  async startGeneration({
    template = {},
    prompts = [],
    inputImages = [],
    referenceImageIds = {},
    ratio = "1:1",
    outputWidth = 1024,
    outputHeight = 1024,
    outputFormat = "png",
    watermark = null,
    logo = null,
    navigateToMyImages = null,
  }) {
    if (this.activeTask) {
      toast.warn("Another AI generation is already running in the background. Please wait for it to finish.");
      return false;
    }

    const trimmedPrompts = prompts.map((p) => (typeof p === "string" ? p.trim() : "")).filter(Boolean);
    if (!trimmedPrompts.length) {
      toast.warn("No prompts provided for generation.");
      return false;
    }
    if (!inputImages.length) {
      toast.warn("Upload at least one input image first.");
      return false;
    }

    const taskId = `ai-task-${Date.now()}`;
    this.activeTask = {
      id: taskId,
      templateTitle: template.title || "Custom Template",
      total: trimmedPrompts.length,
      current: 0,
      completedImages: [],
      failedCount: 0,
    };
    this.notifyListeners();

    toast.info(
      `🚀 Started generating ${trimmedPrompts.length} image${trimmedPrompts.length > 1 ? "s" : ""} in the background. You can continue browsing AutoDS freely!`,
      { autoClose: 5000 }
    );

    // Run async in background without blocking caller
    (async () => {
      const generatedImages = [];
      let failed = 0;

      for (let i = 0; i < trimmedPrompts.length; i++) {
        if (!this.activeTask) break; // cancelled
        this.activeTask.current = i + 1;
        this.notifyListeners();

        const promptText = trimmedPrompts[i];
        const chosenImage = referenceImageIds[i]
          ? inputImages.find((img) => img.id === referenceImageIds[i])
          : null;
        const templateSlot = template.prompts?.[i]?.reference_index;
        const referencedImage = chosenImage ?? (templateSlot != null ? inputImages[templateSlot] : null);

        const formData = new FormData();
        formData.append("prompt", promptText);
        formData.append("ratio", ratio);
        formData.append("width", outputWidth);
        formData.append("height", outputHeight);
        formData.append("format", (outputFormat || "png").toLowerCase());
        if (template.id && !template.is_sample) {
          formData.append("template_id", template.id);
        }
        inputImages.forEach(({ file }) => formData.append("images", file));
        formData.append("image", (referencedImage ?? inputImages[0]).file);

        try {
          const res = await generateAiImage(formData);
          const rawUrl = extractMediaUrl(res.data);
          let finalUrl = rawUrl;

          // Optional client-side watermark / logo overlay if specified
          if (rawUrl && (watermark || logo)) {
            try {
              finalUrl = await composeImageWithBranding({
                baseUrl: rawUrl,
                watermark: watermark?.enabled && watermark?.text
                  ? { text: watermark.text, sizePercent: watermark.size, position: watermark.position }
                  : null,
                logo: logo?.preview
                  ? { src: logo.preview, sizePercent: logo.sizePercent, position: logo.position }
                  : null,
              });
            } catch {
              finalUrl = rawUrl;
            }
          }

          const imageRecord = res.data?.image ?? {
            id: Date.now() + i,
            image_url: finalUrl,
            prompt: promptText,
            template_name: template.title || null,
            created_at: new Date().toISOString(),
            is_viewed: false,
          };

          if (finalUrl) {
            imageRecord.image_url = finalUrl;
          }

          generatedImages.push(imageRecord);
          this.unviewedCount += 1;
          this.activeTask.completedImages = [...generatedImages];
          this.notifyListeners();
        } catch (err) {
          failed++;
          this.activeTask.failedCount = failed;
          this.notifyListeners();
          console.error("Background AI image generation prompt error:", err);
        }
      }

      const totalSuccess = generatedImages.length;
      this.activeTask = null;
      this.notifyListeners();

      if (totalSuccess > 0) {
        toast.success(
          `✨ Your ${totalSuccess} AI image${totalSuccess > 1 ? "s are" : " is"} ready! View ${totalSuccess > 1 ? "them" : "it"} in My Images.`,
          {
            autoClose: 8000,
            onClick: () => {
              if (typeof navigateToMyImages === "function") {
                navigateToMyImages();
              } else if (window.location.hash || window.location.pathname) {
                window.location.href = "#/ai-video-generation?tab=my-images";
              }
            },
          }
        );

        // Dispatch a global DOM event so any open gallery can refresh
        window.dispatchEvent(
          new CustomEvent("autods:ai-images-updated", {
            detail: { count: totalSuccess, images: generatedImages },
          })
        );
      } else if (failed > 0) {
        toast.error(`AI image generation failed for ${failed} prompt(s). Please check your AI credits.`);
      }
    })();

    return true;
  }
}

export const aiBackgroundQueue = new AiBackgroundQueueManager();
export default aiBackgroundQueue;
