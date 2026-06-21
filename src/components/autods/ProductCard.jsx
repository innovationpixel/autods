import { useEffect, useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuImage, LuPlus } from "react-icons/lu";
import { getMarketplaceProductImages } from "./helpers";

function ProductCard({ item }) {
  const gallery = useMemo(() => getMarketplaceProductImages(item), [item]);
  const [activeImage, setActiveImage] = useState(0);
  const [failedUrls, setFailedUrls] = useState({});

  useEffect(() => {
    setActiveImage(0);
    setFailedUrls({});
  }, [item.id]);

  const showGalleryNav = gallery.length > 1;
  const displayUrl = gallery[activeImage] && !failedUrls[gallery[activeImage]]
    ? gallery[activeImage]
    : null;

  const changeImage = (direction) => {
    setActiveImage((current) => {
      const nextIndex = current + direction;

      if (nextIndex < 0) {
        return gallery.length - 1;
      }

      if (nextIndex >= gallery.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  const handleImageError = () => {
    const url = gallery[activeImage];
    if (!url) {
      return;
    }

    setFailedUrls((current) => ({ ...current, [url]: true }));
  };

  const shippingLabel =
    typeof item.shippingDays === "number" && !String(item.shipping).toLowerCase().includes("sold")
      ? `Shipping time: ${item.shipping}`
      : item.shipping;

  return (
    <article className={`product-card marketplace-product-card ${showGalleryNav ? "marketplace-product-card--gallery" : ""}`}>
      <div className="marketplace-product-card__media">
        {item.shippingTag ? (
          <span className="marketplace-product-card__tag">{item.shippingTag}</span>
        ) : null}

        <div className="marketplace-product-card__image-wrap">
          {displayUrl ? (
            <img
              className="marketplace-product-card__image"
              src={displayUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="marketplace-product-card__image-placeholder" aria-hidden="true">
              <LuImage />
            </div>
          )}
        </div>

        {showGalleryNav ? (
          <>
            <button
              type="button"
              className="marketplace-product-card__gallery-btn marketplace-product-card__gallery-btn--prev"
              onClick={() => changeImage(-1)}
              aria-label="Previous product image"
            >
              <LuChevronLeft />
            </button>
            <button
              type="button"
              className="marketplace-product-card__gallery-btn marketplace-product-card__gallery-btn--next"
              onClick={() => changeImage(1)}
              aria-label="Next product image"
            >
              <LuChevronRight />
            </button>
          </>
        ) : null}
      </div>

      <div className="marketplace-product-card__body">
        <a className="marketplace-product-card__vendor" href="/" onClick={(event) => event.preventDefault()}>
          {item.vendor}
        </a>
        <h3 className="marketplace-product-card__title">{item.title}</h3>
        <div className="marketplace-product-card__price">{item.price}</div>
        <div className="marketplace-product-card__shipping">{shippingLabel}</div>
      </div>

      <div className="marketplace-product-card__actions">
        <button type="button" className="marketplace-product-card__action-btn">
          <LuPlus />
          <span>Import as Draft &amp; Edit Manually</span>
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
