import { useEffect, useRef, useState } from "react";
import { LuChevronDown } from "react-icons/lu";

function ImportMetaDropdown({
  label,
  value,
  options,
  onChange,
  renderTriggerExtra,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find((option) => option.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;

    const close = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <span className="add-product-modal__meta-control" ref={wrapRef}>
      {label}
      <button
        type="button"
        className="add-product-modal__meta-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {renderTriggerExtra?.(selected)}
        <span>{selected?.label ?? "Select"}</span>
        <LuChevronDown />
      </button>
      {open ? (
        <div className="add-product-modal__meta-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={`add-product-modal__meta-option ${option.id === value ? "add-product-modal__meta-option--active" : ""} ${option.enabled === false ? "add-product-modal__meta-option--disabled" : ""}`}
              onClick={() => {
                if (option.enabled === false) return;
                onChange(option.id);
                setOpen(false);
              }}
            >
              {renderTriggerExtra?.(option)}
              <span>{option.label}</span>
              {option.enabled === false ? <em>Coming soon</em> : null}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  );
}

export default ImportMetaDropdown;
