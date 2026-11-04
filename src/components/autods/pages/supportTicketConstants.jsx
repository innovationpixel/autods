import React from "react";

export const TICKET_TYPES = [
  { value: "sales", label: "Sales", desc: "Plan upgrades, sales inquiries, features" },
  { value: "billing", label: "Billing", desc: "Invoices, payments, wallet & refunds" },
  { value: "technical_support", label: "Technical Support", desc: "Bugs, eBay sync, order processing, account issues" },
];

export const TICKET_TYPE_LABELS = {
  sales: "Sales",
  billing: "Billing",
  technical_support: "Technical Support",
};

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low", desc: "General inquiry, no immediate urgency" },
  { value: "medium", label: "Medium", desc: "Standard priority issue" },
  { value: "high", label: "High", desc: "Important workflow or store issue" },
  { value: "urgent", label: "Urgent", desc: "Critical business blocker or failure" },
];

export const TICKET_PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TICKET_STATUS_LABELS = {
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

export function TicketTypeBadge({ type = "technical_support" }) {
  const label = TICKET_TYPE_LABELS[type] || type || "Technical Support";
  return (
    <span className={`support-type-badge support-type-badge--${type}`}>
      {label}
    </span>
  );
}

export function TicketPriorityBadge({ priority = "medium" }) {
  const label = TICKET_PRIORITY_LABELS[priority] || priority || "Medium";
  return (
    <span className={`support-priority-badge support-priority-badge--${priority}`}>
      <span className={`support-priority-dot support-priority-dot--${priority}`} />
      {label}
    </span>
  );
}

export function TicketStatusBadge({ status = "open" }) {
  const label = TICKET_STATUS_LABELS[status] || status || "Open";
  return (
    <span className={`support-status-badge support-status-badge--${status}`}>
      {label}
    </span>
  );
}

