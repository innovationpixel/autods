import { LuSlidersHorizontal } from "react-icons/lu";

function PageFilterPanel({ title = "Filters", onClear, layout = "auto", children }) {
  return (
    <div className="page-filter-panel card-wrapper">
      <div className="page-filter-panel__head">
        <div className="page-filter-panel__title">
          <LuSlidersHorizontal aria-hidden="true" />
          <span>{title}</span>
        </div>
        {onClear ? (
          <button type="button" className="page-filter-panel__clear" onClick={onClear}>
            Clear all
          </button>
        ) : null}
      </div>
      <div className={`page-filter-panel__grid page-filter-panel__grid--${layout}`}>{children}</div>
    </div>
  );
}

export default PageFilterPanel;
