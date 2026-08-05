import { LuChevronLeft, LuChevronRight, LuLoader, LuSlidersHorizontal, LuStore } from "react-icons/lu";
import CarouselSection from "../CarouselSection";
import ProductCard from "../ProductCard";
import { buildPaginationItems } from "../helpers";

function mapAliItemToCard(item) {
  return {
    id: item.id,
    vendor: item.seller || null,
    shopUrl: item.shop_url || null,
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
  aliPlatformReady = false,
  aliCurrentPage = 1,
  aliTotalPages = 1,
  onAliPageChange,
  expandedProductsTitle = "",
  visibleProducts = [],
  visibleSections = [],
  keywordSearch = "",
  onSeeMore,
  onResetView,
  onImport,
  importingId,
}) {
  const hasKeywordSearch = Boolean(keywordSearch.trim());
  const aliCards = aliItems.map(mapAliItemToCard);
  const hasLiveData = aliPlatformReady && !aliCredentialsMissing && !aliPlatformUnavailable;

  const renderPagination = () => {
    if (aliTotalPages <= 1) {
      return null;
    }

    const items = buildPaginationItems(aliCurrentPage, aliTotalPages);

    return (
      <div className="orders-pagination marketplace-pagination">
        <button
          type="button"
          className="orders-pagination__arrow"
          onClick={() => onAliPageChange?.(Math.max(1, aliCurrentPage - 1))}
          disabled={aliCurrentPage <= 1}
          aria-label="Previous page"
        >
          <LuChevronLeft />
        </button>

        {items.map((page, index) =>
          page === "..." ? (
            <span className="products-pagination__ellipsis" key={`ellipsis-${index}`}>
              ...
            </span>
          ) : (
            <button
              type="button"
              key={page}
              className={page === aliCurrentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
              onClick={() => onAliPageChange?.(page)}
            >
              {page}
            </button>
          ),
        )}

        <button
          type="button"
          className="orders-pagination__arrow"
          onClick={() => onAliPageChange?.(Math.min(aliTotalPages, aliCurrentPage + 1))}
          disabled={aliCurrentPage >= aliTotalPages}
          aria-label="Next page"
        >
          <LuChevronRight />
        </button>
      </div>
    );
  };

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
    const items = hasLiveData ? aliCards : visibleProducts;

    return (
      <section className="marketplace-expanded-products">
        <div className="marketplace-expanded-products__head">
          <h2 className="marketplace-section__title">
            {expandedProductsTitle}
            {hasLiveData && aliLoading ? <LuLoader className="spin-icon" style={{ marginLeft: 8 }} /> : null}
          </h2>
          <button type="button" className="marketplace-section__see-more" onClick={onResetView}>
            Back to all categories
          </button>
        </div>
        {items.length ? (
          <>
            <div className="marketplace-expanded-products__grid">
              {items.map((item) => (
                <ProductCard item={item} key={item.id} onImport={onImport} importing={importingId === item.id} />
              ))}
            </div>
            {hasLiveData ? renderPagination() : null}
          </>
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
            <ProductCard item={item} key={item.id} onImport={onImport} importing={importingId === item.id} />
          ))}
        </div>
        {renderPagination()}
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
          <CarouselSection
            key={section.key}
            onSeeMore={onSeeMore}
            section={section}
            onImport={onImport}
            importingId={importingId}
          />
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
