import { LuCloudUpload, LuLink, LuPlus, LuTrash2, LuType, LuX } from "react-icons/lu";
import {
  ASPECT_RATIOS,
  MAX_INPUT_IMAGES,
  MAX_PROMPTS,
  OUTPUT_FORMATS,
} from "./aiStudioConstants";
import {
  PositionPicker,
  RatioPicker,
  ReferenceImagePicker,
  SliderField,
  Stepper,
  UploadField,
} from "./AiStudioControls";

/** Sections 1-4 of the image template layout, plus slots for section 5 and the footer. */
function ImageTemplateSections({
  form,
  showWatermark = false,
  inputDescription = "Upload product images to be used for generating output images.",
  logoDescription = "Upload your brand logo and choose its position.",
  previewCard,
  footer,
  allowAddDeletePrompts = true,
}) {
  const {
    inputImages,
    handleInputImagesChange,
    handleInputImagesDrop,
    removeInputImage,
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
    openRefPicker,
    setOpenRefPicker,
    handlePromptChange,
    handleReferenceImageChange,
    addPromptRow,
    removePromptRow,
    setPromptCount,
  } = form;

  return (
    <div className="ai-gen-hub__template">
      <div className="ai-gen-hub__template-row">
        <article className="ai-gen-hub__card">
          <div className="ai-gen-hub__section-head">
            <span className="ai-gen-hub__section-badge">1</span>
            <div>
              <h3>Upload Input Images</h3>
              <p>{inputDescription} Max {MAX_INPUT_IMAGES}.</p>
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
              <input type="file" accept="image/*" multiple onChange={handleInputImagesChange} />
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
              <p>{logoDescription}</p>
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
            <SliderField
              label="Logo size"
              value={logoSizePercent}
              min={5}
              max={50}
              unit="%"
              onChange={setLogoSizePercent}
            />
          )}

          <div className="ai-gen-hub__field">
            <span className="ai-gen-hub__field-label">Logo Position (on all output images)</span>
            <PositionPicker value={logoPosition} onChange={setLogoPosition} />
          </div>

          {showWatermark && (
            <>
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
              <div
                className={`ai-gen-hub__prompt-row ${!allowAddDeletePrompts ? "ai-gen-hub__prompt-row--no-delete" : ""}`}
                key={index}
                style={!allowAddDeletePrompts ? { gridTemplateColumns: "32px minmax(0, 1fr) auto" } : undefined}
              >
                <span className="ai-gen-hub__prompt-number">{index + 1}</span>
                <textarea
                  rows={2}
                  placeholder={
                    index === 0
                      ? "e.g. Main product image with clean white background, premium look."
                      : `e.g. Describe output image ${index + 1}...`
                  }
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
                {allowAddDeletePrompts && (
                  <button
                    type="button"
                    className="ai-gen-hub__prompt-delete"
                    disabled={prompts.length <= 1}
                    onClick={() => removePromptRow(index)}
                  >
                    <LuTrash2 />
                  </button>
                )}
              </div>
            ))}
          </div>
          <span className="ai-gen-hub__hint">
            Optionally pick which uploaded input image a prompt should use as its reference.
          </span>

          {allowAddDeletePrompts && (
            <button
              type="button"
              className="ai-gen-hub__add-prompt-btn"
              disabled={prompts.length >= MAX_PROMPTS}
              onClick={addPromptRow}
            >
              <LuPlus /> Add Another Prompt
            </button>
          )}
        </article>

        {previewCard}
      </div>

      {footer}
    </div>
  );
}

export default ImageTemplateSections;
