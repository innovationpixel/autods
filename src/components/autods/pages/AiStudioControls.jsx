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
  LuImage,
  LuMinus,
  LuPlus,
  LuUpload,
  LuX,
} from "react-icons/lu";
import { POSITIONS, POSITION_LABELS } from "./aiStudioConstants";

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

export function UploadField({ label, hint, preview, onChange, onClear, inputRef }) {
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

export function RatioPicker({ options, value, onChange }) {
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

export function PositionPicker({ value, onChange }) {
  return (
    <div className="ai-gen-hub__position-grid">
      {POSITIONS.map((position) => {
        const Icon = POSITION_ICONS[position];
        return (
          <button
            type="button"
            key={position}
            className={`ai-gen-hub__position-cell ${value === position ? "ai-gen-hub__position-cell--active" : ""}`}
            onClick={() => onChange(position)}
          >
            <Icon />
            <span>{POSITION_LABELS[position]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SliderField({ label, value, min, max, step = 1, unit = "", onChange }) {
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

export function Stepper({ value, min, max, onChange }) {
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

export function ReferenceImagePicker({ images, valueId, isOpen, onToggle, onChange }) {
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
