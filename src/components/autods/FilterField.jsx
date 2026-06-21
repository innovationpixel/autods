import { LuChevronDown } from "react-icons/lu";

export function FilterSelect({ label, value, onChange, children, id }) {
  const fieldId = id ?? `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className="filter-field" htmlFor={fieldId}>
      <span className="filter-field__label">{label}</span>
      <div className="filter-field__control filter-field__control--select">
        <select
          id={fieldId}
          className="filter-field__input"
          value={value}
          onChange={onChange}
        >
          {children}
        </select>
        <LuChevronDown className="filter-field__chevron" aria-hidden="true" />
      </div>
    </label>
  );
}

export function FilterInput({ label, value, onChange, placeholder, id, type = "text" }) {
  const fieldId = id ?? `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className="filter-field" htmlFor={fieldId}>
      <span className="filter-field__label">{label}</span>
      <div className="filter-field__control">
        <input
          id={fieldId}
          className="filter-field__input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

export function FilterCheckbox({ label, checked, onChange, id }) {
  const fieldId = id ?? `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label className="filter-field filter-field--checkbox" htmlFor={fieldId}>
      <input
        id={fieldId}
        className="filter-field__checkbox"
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="filter-field__checkbox-label">{label}</span>
    </label>
  );
}
