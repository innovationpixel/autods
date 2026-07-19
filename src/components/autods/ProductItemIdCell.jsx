export default function ProductItemIdCell({ itemId, sku, url }) {
  const normalizedItemId = String(itemId ?? "").trim();
  const normalizedSku = String(sku ?? "").trim();
  const hasItemId = normalizedItemId && normalizedItemId !== "—";
  const hasSku = normalizedSku && normalizedSku !== "—";

  if (!hasItemId && !hasSku) {
    return "—";
  }

  const content = (
    <div className="products-item-id">
      {hasItemId ? <span className="products-item-id__primary">{normalizedItemId}</span> : null}
      {hasSku ? <span className="products-item-id__sku">SKU: {normalizedSku}</span> : null}
    </div>
  );

  if (!url) {
    return content;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="products-item-id-link" title="Open listing">
      {content}
    </a>
  );
}
