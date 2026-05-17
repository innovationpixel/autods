import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus, LuStore } from "react-icons/lu";

function ProductCard({ item }) {
  const gallery = item.gallery?.length ? item.gallery : [item.image];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [item.id]);

  const showGalleryNav = gallery.length > 1;

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

  return (
    <article className={`product-card marketplace-product-card ${showGalleryNav ? "marketplace-product-card--gallery" : ""}`}>
      <div className="marketplace-product-card__media">
        <div className="marketplace-product-card__image-wrap">
          <img className="marketplace-product-card__image" src={gallery[activeImage]} alt={item.title} />
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
        <a className="marketplace-product-card__vendor" href="/">
          {item.vendor}
        </a>
        <h3 className="marketplace-product-card__title">{item.title}</h3>
        <div className="marketplace-product-card__price">{item.price}</div>
        <div className="marketplace-product-card__shipping">Shipping time: {item.shipping}</div>
      </div>

      <div className="marketplace-product-card__actions">
        <button type="button" className="marketplace-product-card__action-btn">
          <LuPlus />
          <span>Import as Draft &amp; Edit Manually</span>
        </button>
        <button type="button" className="marketplace-product-card__action-btn marketplace-product-card__action-btn--store">
          <LuStore />
          <span>Build a Shopify Store</span>
          <span className="marketplace-product-card__action-badge">NEW</span>
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
