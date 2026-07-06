import { LuLoader, LuSlidersHorizontal, LuStore } from "react-icons/lu";
import CarouselSection from "../CarouselSection";
import ProductCard from "../ProductCard";

function mapAliItemToCard(item) {
  return {
    id: item.id,
    vendor: item.seller ?? "AliExpress",
    title: item.title,
    price: `$${Number(item.price ?? 0).toFixed(2)}`,
    shipping:
      item.sold_count > 0
        ? `${Number(item.sold_count).toLocaleString()} sold`
        : "Ships internationally",
    shippingDays: 10,
    image_url: item.image_url,
    images: item.images,
    shippingTag: "AliExpress",
    listingUrl: item.listing_url,
    marketplace: "aliexpress",
  };
}

function MarketplaceSections({
  aliLoading = false,
  aliError = null,
  aliPlatformUnavailable = false,
  aliConnectionLoading = false,
  aliCredentialsMissing = false,
  aliCredentialsConfigured = true,
  aliItems = [],
  expandedProductsTitle = "",
  visibleProducts = [],
  visibleSections = [],
  keywordSearch = "",
  onSeeMore,
  onResetView,
}) {
  const hasKeywordSearch = Boolean(keywordSearch.trim());
  const aliCards = aliItems.map(mapAliItemToCard);

  if (hasKeywordSearch && aliConnectionLoading) {
    return (
      <div className="marketplace-products__empty">
        <LuLoader className="spin-icon" style={{ fontSize: 28 }} />
        <p>Checking AliExpress availability…</p>
      </div>
    );
  }

  if (hasKeywordSearch && aliPlatformUnavailable) {
    return (
      <div className="marketplace-products__empty">
        <LuStore style={{ fontSize: 28 }} />
        <p>
          Platform AliExpress is not connected yet. Ask your super admin to connect it from Admin → Settings.
        </p>
      </div>
    );
  }

  if (aliLoading && hasKeywordSearch) {
    return (
      <div className="marketplace-products__empty">
        <LuLoader className="spin-icon" style={{ fontSize: 28 }} />
        <p>Searching marketplace…</p>
      </div>
    );
  }

  if (expandedProductsTitle) {
    return (
      <section className="marketplace-expanded-products">
        <div className="marketplace-expanded-products__head">
          <h2 className="marketplace-section__title">{expandedProductsTitle}</h2>
          <button type="button" className="marketplace-section__see-more" onClick={onResetView}>
            Back to all categories
          </button>
        </div>
        {visibleProducts.length ? (
          <div className="marketplace-expanded-products__grid">
            {visibleProducts.map((item) => (
              <ProductCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="marketplace-products__empty">
            <LuSlidersHorizontal />
            <p>No products match the current filters.</p>
          </div>
        )}
      </section>
    );
  }

  if (hasKeywordSearch && aliCards.length) {
    return (
      <section className="marketplace-expanded-products">
        <div className="marketplace-expanded-products__head">
          <h2 className="marketplace-section__title">
            Search results — {aliCards.length} product{aliCards.length !== 1 ? "s" : ""} for &ldquo;
            {keywordSearch.trim()}&rdquo;
          </h2>
          <button type="button" className="marketplace-section__see-more" onClick={onResetView}>
            Back to all categories
          </button>
        </div>
        <div className="marketplace-expanded-products__grid">
          {aliCards.map((item) => (
            <ProductCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {aliCredentialsMissing || !aliCredentialsConfigured ? (
        <div className="marketplace-inline-notice marketplace-inline-notice--info">
          <LuStore />
          <p>AliExpress API credentials are not configured on the server.</p>
        </div>
      ) : null}

      {aliPlatformUnavailable ? (
        <div className="marketplace-inline-notice">
          <LuStore />
          <div className="marketplace-inline-notice__copy">
            <strong>Platform AliExpress not available</strong>
            <p>AliExpress is connected once by your super admin for all users. Ask them to connect it from Admin → Settings.</p>
          </div>
        </div>
      ) : null}

      {aliError && !aliPlatformUnavailable ? (
        <div className="marketplace-inline-notice marketplace-inline-notice--error">
          <p>{aliError}</p>
        </div>
      ) : null}

      {visibleSections.length ? (
        visibleSections.map((section) => (
          <CarouselSection key={section.key} onSeeMore={onSeeMore} section={section} />
        ))
      ) : (
        <div className="marketplace-products__empty">
          <LuSlidersHorizontal />
          <p>No products match the current filters.</p>
        </div>
      )}
    </>
  );
}

export default MarketplaceSections;
