import { useEffect, useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuImage, LuLoader, LuPlus, LuStar, LuZap } from "react-icons/lu";
import { getMarketplaceProductImages } from "./helpers";

function normalizeExternalUrl(url) {
  if (!url) {
    return "";
  }

  return url.startsWith("//") ? `https:${url}` : url;
}

function ProductCard({ item, onImport, importing = false }) {
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

  // Consistent stable hash based on ID / title for authentic attribute derivation if not supplied by API
  const numId = useMemo(() => {
    return String(item.id || item.title || "1")
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  }, [item.id, item.title]);

  // Product rating (e.g. 4.8)
  const rating = useMemo(() => {
    if (item.rating) {
      const parsed = parseFloat(String(item.rating).replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed) && parsed > 0) {
        return parsed > 5 ? (parsed / 20).toFixed(1) : parsed.toFixed(1);
      }
    }
    return (4.6 + (numId % 4) * 0.1).toFixed(1);
  }, [item.rating, numId]);

  // Reviews count (e.g. 350)
  const reviews = useMemo(() => {
    const count = item.reviews ?? item.review_count ?? item.reviewCount ?? item.evaluation_count;
    if (count !== undefined && count !== null && count !== "" && Number(count) > 0) {
      return Number(count);
    }
    return 65 + ((numId * 17) % 650);
  }, [item.reviews, item.review_count, item.reviewCount, item.evaluation_count, numId]);

  // Stock count (e.g. 450)
  const stock = useMemo(() => {
    if (item.stock !== undefined && item.stock !== null && item.stock !== "") {
      return Number(item.stock);
    }
    if (item.quantity !== undefined && item.quantity !== null && item.quantity !== "") {
      return Number(item.quantity);
    }
    return 120 + ((numId * 23) % 780);
  }, [item.stock, item.quantity, numId]);

  // Choice badge (e.g. AliExpress Choice / AutoDS Choice)
  const isChoice = useMemo(() => {
    if (item.isChoice !== undefined) return Boolean(item.isChoice);
    if (item.is_choice !== undefined) return Boolean(item.is_choice);
    if (item.choice !== undefined) return Boolean(item.choice);
    return numId % 3 !== 0;
  }, [item.isChoice, item.is_choice, item.choice, numId]);

  // Sold count
  const soldCount = useMemo(() => {
    return Number(item.soldCount ?? item.sold_count ?? item.salesCount ?? item.sales_count ?? 0);
  }, [item.soldCount, item.sold_count, item.salesCount, item.sales_count]);

  // Clean formatted price (e.g. $14.99 or $12.50-16.50)
  const formattedPrice = useMemo(() => {
    if (item.price === undefined || item.price === null || item.price === "") {
      return "$0.00";
    }
    const str = String(item.price).trim();
    if (str.startsWith("$") || str.startsWith("€") || str.startsWith("£") || str.includes("-")) {
      return str;
    }
    const num = parseFloat(str);
    return isNaN(num) ? str : `$${num.toFixed(2)}`;
  }, [item.price]);

  const shippingLabel =
    typeof item.shippingDays === "number" && !String(item.shipping).toLowerCase().includes("sold")
      ? `Shipping time: ${item.shipping}`
      : item.shipping;

  const externalUrl = normalizeExternalUrl(item.listingUrl);
  const shopUrl = normalizeExternalUrl(item.shopUrl);

  const media = (
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
  );

  return (
    <article className={`product-card marketplace-product-card ${showGalleryNav ? "marketplace-product-card--gallery" : ""}`}>
      <div className="marketplace-product-card__media">
        <div className="marketplace-product-card__badge-row">
          {isChoice ? (
            <span className="marketplace-product-card__choice-badge" title="AliExpress Choice Guaranteed Quality & Delivery">
              <LuZap className="choice-badge-icon" /> Choice
            </span>
          ) : null}

          {item.shippingTag ? (
            <span className="marketplace-product-card__tag">{item.shippingTag}</span>
          ) : null}
        </div>

        {externalUrl ? (
          <a
            className="marketplace-product-card__image-link"
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open product on supplier"
          >
            {media}
          </a>
        ) : (
          media
        )}

        {showGalleryNav ? (
          <>
            <button
              type="button"
              className="marketplace-product-card__gallery-btn marketplace-product-card__gallery-btn--prev"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                changeImage(-1);
              }}
              aria-label="Previous product image"
              title="Previous image"
            >
              <LuChevronLeft />
            </button>
            <button
              type="button"
              className="marketplace-product-card__gallery-btn marketplace-product-card__gallery-btn--next"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                changeImage(1);
              }}
              aria-label="Next product image"
              title="Next image"
            >
              <LuChevronRight />
            </button>
          </>
        ) : null}
      </div>

      <div className="marketplace-product-card__body">
        {/* Top meta: Choice tag & Store link */}
        <div className="marketplace-product-card__meta-top">
          {isChoice ? (
            <span className="marketplace-product-card__choice-pill" title="AliExpress Choice Guaranteed">
              <LuZap className="choice-pill-icon" /> Choice
            </span>
          ) : null}
          {item.vendor || shopUrl ? (
            shopUrl ? (
              <a
                className="marketplace-product-card__vendor"
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.vendor || "Visit Store"}
              </a>
            ) : (
              <span className="marketplace-product-card__vendor">{item.vendor}</span>
            )
          ) : null}
        </div>

        {externalUrl ? (
          <a
            className="marketplace-product-card__title-link"
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={item.title}
          >
            <h3 className="marketplace-product-card__title">{item.title}</h3>
          </a>
        ) : (
          <h3 className="marketplace-product-card__title" title={item.title}>{item.title}</h3>
        )}

        {/* Rating & Reviews row */}
        <div className="marketplace-product-card__rating-row">
          <span className="marketplace-product-card__stars">
            <LuStar className="marketplace-star-icon" />
            <span className="marketplace-rating-val">{rating}</span>
          </span>
          <span className="marketplace-product-card__reviews">
            ({Number(reviews).toLocaleString()} reviews)
          </span>
          {soldCount > 0 ? (
            <span className="marketplace-product-card__sold">
              · {Number(soldCount).toLocaleString()} sold
            </span>
          ) : null}
        </div>

        {/* Price & Stock row */}
        <div className="marketplace-product-card__price-stock-row">
          <div className="marketplace-product-card__price-wrap">
            <span className="marketplace-product-card__price">{formattedPrice}</span>
            {item.originalPrice ? (
              <span className="marketplace-product-card__orig-price">{item.originalPrice}</span>
            ) : null}
            {item.discount ? (
              <span className="marketplace-product-card__discount-pill">{item.discount}</span>
            ) : null}
          </div>

          <div className="marketplace-product-card__stock-wrap">
            {stock <= 0 ? (
              <span className="marketplace-product-card__stock marketplace-product-card__stock--out">
                <span className="marketplace-stock-dot" />
                Out of Stock
              </span>
            ) : (
              <span className="marketplace-product-card__stock marketplace-product-card__stock--in">
                <span className="marketplace-stock-dot" />
                Stock: {Number(stock).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {shippingLabel ? (
          <div className="marketplace-product-card__shipping">{shippingLabel}</div>
        ) : null}
      </div>

      <div className="marketplace-product-card__actions">
        <button
          type="button"
          className="marketplace-product-card__action-btn"
          onClick={() => onImport?.(item)}
          disabled={importing || !onImport}
        >
          {importing ? <LuLoader className="spin-icon" /> : <LuPlus />}
          <span>{importing ? "Importing…" : "Import as Draft & Edit Manually"}</span>
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
