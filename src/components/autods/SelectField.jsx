import { LuChevronDown } from "react-icons/lu";

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="marketplace-filter-field">
      <span className="muted-label">{label}</span>
      <span className="marketplace-select-wrap">
        <select className="select-control input-border-style" value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <LuChevronDown className="marketplace-select-wrap__icon" />
      </span>
    </label>
  );
}

export default SelectField;
