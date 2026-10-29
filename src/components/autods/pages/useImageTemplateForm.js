import { useRef, useState } from "react";
import { toast } from "../../../utils/toast";
import { MAX_INPUT_IMAGES, MAX_PROMPTS } from "./aiStudioConstants";
import { newAssetId } from "./aiStudioUtils";

export function useImageTemplateForm(initial = {}) {
  const [inputImages, setInputImages] = useState(initial.inputImages ?? []);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(initial.logoPreview ?? null);
  const [logoSizePercent, setLogoSizePercent] = useState(initial.logoSizePercent ?? 18);
  const [logoPosition, setLogoPosition] = useState(initial.logoPosition ?? "bottom-right");
  const logoInputRef = useRef(null);

  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkSize, setWatermarkSize] = useState(36);
  const [watermarkPosition, setWatermarkPosition] = useState("bottom-left");

  const [aspectRatio, setAspectRatio] = useState(initial.aspectRatio ?? "1:1");
  const [outputWidth, setOutputWidth] = useState(initial.outputWidth ?? 1024);
  const [outputHeight, setOutputHeight] = useState(initial.outputHeight ?? 1024);
  const [sizeLinked, setSizeLinked] = useState(true);
  const [outputFormat, setOutputFormat] = useState(initial.outputFormat ?? "PNG");

  const [prompts, setPrompts] = useState(initial.prompts?.length ? initial.prompts : [""]);
  const [referenceImageIds, setReferenceImageIds] = useState(
    initial.prompts?.length ? initial.referenceImageIds ?? initial.prompts.map(() => null) : [null],
  );
  const [openRefPicker, setOpenRefPicker] = useState(null);

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
      ...accepted.map((file) => ({ id: newAssetId(), file, preview: URL.createObjectURL(file) })),
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

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearLogo = () => {
    setLogoFile(null);
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
      setOutputHeight(Math.round(width * (outputHeight / outputWidth)));
    }
  };

  const handleHeightChange = (value) => {
    const height = Math.max(1, Number(value) || 0);
    setOutputHeight(height);
    if (sizeLinked && outputHeight > 0) {
      setOutputWidth(Math.round(height * (outputWidth / outputHeight)));
    }
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

  return {
    inputImages,
    handleInputImagesChange,
    handleInputImagesDrop,
    removeInputImage,

    logoFile,
    logoPreview,
    logoSizePercent,
    setLogoSizePercent,
    logoPosition,
    setLogoPosition,
    logoInputRef,
    handleLogoChange,
    clearLogo,

    watermarkEnabled,
    setWatermarkEnabled,
    watermarkText,
    setWatermarkText,
    watermarkSize,
    setWatermarkSize,
    watermarkPosition,
    setWatermarkPosition,

    aspectRatio,
    applyAspectRatio,
    outputWidth,
    outputHeight,
    handleWidthChange,
    handleHeightChange,
    sizeLinked,
    setSizeLinked,
    outputFormat,
    setOutputFormat,

    prompts,
    referenceImageIds,
    setReferenceImageIds,
    openRefPicker,
    setOpenRefPicker,
    handlePromptChange,
    handleReferenceImageChange,
    addPromptRow,
    removePromptRow,
    setPromptCount,
  };
}
