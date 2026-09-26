import React from "react";
import { LuChevronDown } from "react-icons/lu";

export default function GridSortHeader({
  columnId,
  label,
  sortBy,
  sortDirection,
  onSort,
  children,
  className = "",
  style = {},
}) {
  const isActive = sortBy === columnId;

  return (
    <button
      type="button"
      className={`orders-sort-btn ${isActive ? "orders-sort-btn--active" : ""} ${className}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        onSort(columnId);
      }}
      title={`Sort by ${typeof label === "string" ? label : columnId} (${
        isActive ? (sortDirection === "asc" ? "descending" : "ascending") : "ascending"
      })`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "inherit",
        gap: "4px",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "inherit",
        fontWeight: isActive ? 700 : "inherit",
        width: "100%",
        textAlign: "inherit",
        ...style,
      }}
    >
      <span>{children ?? label}</span>
      <LuChevronDown
        className={`orders-sort-btn__icon ${
          isActive && sortDirection === "asc" ? "orders-sort-btn__icon--asc" : ""
        } ${isActive ? "orders-sort-btn__icon--active" : ""}`.trim()}
        style={{
          flexShrink: 0,
          transition: "transform 0.15s ease, color 0.15s ease",
          transform: isActive && sortDirection === "asc" ? "rotate(180deg)" : "rotate(0deg)",
          color: isActive ? "#2563eb" : "#94a3b8",
          fontSize: "13px",
        }}
      />
    </button>
  );
}
