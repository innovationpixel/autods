/**
 * Client-side HTML sanitizer using the browser's native DOMParser to block XSS
 * while keeping safe formatting/layout HTML for eBay descriptions & templates.
 */

const BLOCKED_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "applet",
  "base",
  "meta",
  "link",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "svg",
  "math",
  "noscript",
  "template",
]);

const URL_ATTRS = new Set(["href", "src", "action", "formaction", "xlink:href", "poster"]);

function isUnsafeUrl(raw) {
  if (typeof raw !== "string") return false;
  // eslint-disable-next-line no-control-regex
  const normalized = raw.replace(/[\s\u0000-\u0020]+/g, "").toLowerCase();
  return (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:text/html") ||
    normalized.startsWith("data:application/xhtml")
  );
}

function sanitizeStyleValue(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/expression\s*\(|javascript\s*:|vbscript\s*:|@import\b|behavior\s*:/gi, "");
}

function walkAndClean(node) {
  const children = Array.from(node.childNodes || []);
  for (const child of children) {
    if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase();
      if (BLOCKED_TAGS.has(tag)) {
        child.remove();
        continue;
      }

      const attrs = Array.from(child.attributes || []);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        const value = attr.value || "";

        // Strip all inline event handlers (onclick, onerror, onload, etc.)
        if (name.startsWith("on")) {
          child.removeAttribute(attr.name);
          continue;
        }

        if (URL_ATTRS.has(name) && isUnsafeUrl(value)) {
          child.setAttribute(attr.name, "#");
          continue;
        }

        if (name === "style") {
          child.setAttribute("style", sanitizeStyleValue(value));
          continue;
        }

        if (name === "target" && value.toLowerCase() === "_blank") {
          const rel = (child.getAttribute("rel") || "").toLowerCase();
          if (!rel.includes("noopener")) {
            child.setAttribute("rel", "noopener noreferrer");
          }
        }
      }

      walkAndClean(child);
    }
  }
}

export function sanitizeHtml(html) {
  if (typeof html !== "string" || !html) {
    return "";
  }

  if (typeof DOMParser === "undefined") {
    return html
      .replace(/<(script|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    walkAndClean(doc.body);
    return doc.body.innerHTML;
  } catch {
    return "";
  }
}

export default sanitizeHtml;

