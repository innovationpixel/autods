import { useEffect } from "react";

const BRAND_PATTERN = /\bAuto\s*DS\b/gi;
const BRAND_NAME = "AutoDrop Prime";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);

function replaceBrandText(value) {
  return typeof value === "string" ? value.replace(BRAND_PATTERN, BRAND_NAME) : value;
}

function normalizeTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const parentTag = node.parentElement?.tagName;
  if (parentTag && SKIP_TAGS.has(parentTag)) return;

  const nextValue = replaceBrandText(node.nodeValue);
  if (nextValue !== node.nodeValue) {
    node.nodeValue = nextValue;
  }
}

function normalizeElement(root) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    normalizeTextNode(root);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has(root.tagName)) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    normalizeTextNode(current);
    current = walker.nextNode();
  }
}

export default function BrandTextNormalizer() {
  useEffect(() => {
    const normalizeDocumentTitle = () => {
      const nextTitle = replaceBrandText(document.title);
      if (nextTitle !== document.title) {
        document.title = nextTitle;
      }
    };

    normalizeElement(document.body);
    normalizeDocumentTitle();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          normalizeTextNode(mutation.target);
          return;
        }

        mutation.addedNodes.forEach((node) => normalizeElement(node));
      });
      normalizeDocumentTitle();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
