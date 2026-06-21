import { LuChevronDown } from "react-icons/lu";
import { dashboardDateOptions } from "./constants";
import { formatDisplayDate } from "./helpers";

function CompactDateRange({ from, to, onFromChange, onToChange, label = "Date range" }) {
  return (
    <div className="filter-field filter-field--date-range">
      <span className="filter-field__label">{label}</span>
      <div className="compact-date-range">
        <div className="compact-date-range__field">
          <select value={from} onChange={(event) => onFromChange(event.target.value)} aria-label="From date">
            {dashboardDateOptions.map((option) => (
              <option key={option} value={option}>
                {formatDisplayDate(option)}
              </option>
            ))}
          </select>
          <span className="compact-date-range__dash" aria-hidden="true">
            –
          </span>
          <select value={to} onChange={(event) => onToChange(event.target.value)} aria-label="To date">
            {dashboardDateOptions.map((option) => (
              <option key={option} value={option}>
                {formatDisplayDate(option)}
              </option>
            ))}
          </select>
          <LuChevronDown className="compact-date-range__icon" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export default CompactDateRange;
