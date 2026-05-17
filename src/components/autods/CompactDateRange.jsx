import { LuChevronDown } from "react-icons/lu";
import { dashboardDateOptions } from "./constants";
import { formatDisplayDate } from "./helpers";

function CompactDateRange({ from, to, onFromChange, onToChange, label = "Time:" }) {
  return (
    <div className="compact-date-range">
      <span className="compact-date-range__label">{label}</span>
      <div className="compact-date-range__field">
        <select value={from} onChange={(event) => onFromChange(event.target.value)}>
          {dashboardDateOptions.map((option) => (
            <option key={option} value={option}>
              {formatDisplayDate(option)}
            </option>
          ))}
        </select>
        <span className="compact-date-range__dash" aria-hidden="true">
          -
        </span>
        <select value={to} onChange={(event) => onToChange(event.target.value)}>
          {dashboardDateOptions.map((option) => (
            <option key={option} value={option}>
              {formatDisplayDate(option)}
            </option>
          ))}
        </select>
        <LuChevronDown className="compact-date-range__icon" />
      </div>
    </div>
  );
}

export default CompactDateRange;
