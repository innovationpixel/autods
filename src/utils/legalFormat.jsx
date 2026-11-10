import React from "react";

/**
 * Render structured plain text legal agreements safely in JSX.
 * Recognizes numbered section headers (e.g. "1. Acceptance of Terms"),
 * markdown-style headings ("# ..."), bullet lines ("- ..."), and paragraphs.
 */
export function renderLegalContent(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return <p className="legal-doc__empty">No content has been configured yet.</p>;
  }

  const lines = normalized.split("\n");
  const blocks = [];
  let listBuffer = [];

  const flushList = (keyPrefix) => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`${keyPrefix}-list`} className="legal-doc__list">
          {listBuffer.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`line-${index}`);
      return;
    }

    if (/^[-*•]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*•]\s+/, ""));
      return;
    }

    flushList(`line-${index}`);

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(
        <h3 key={`h-${index}`} className="legal-doc__heading">
          {line.replace(/^#{1,3}\s+/, "")}
        </h3>
      );
      return;
    }

    if (/^\d+\.\s+[A-Z0-9].{2,100}$/.test(line) && !line.endsWith(".")) {
      blocks.push(
        <h3 key={`sec-${index}`} className="legal-doc__heading">
          {line}
        </h3>
      );
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="legal-doc__paragraph">
        {line}
      </p>
    );
  });

  flushList("end");

  return blocks;
}

export function formatLegalDate(isoString) {
  if (!isoString) return "Default template";
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(isoString);
  }
}

