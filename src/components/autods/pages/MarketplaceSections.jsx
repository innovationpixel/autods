import { LuChevronLeft, LuChevronRight, LuLoader, LuSlidersHorizontal, LuStore } from "react-icons/lu";
import ProductCard from "../ProductCard";
import { buildPaginationItems, mapAliItemToCard } from "../helpers";

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
  activeCategory = "All Categories",
  keywordSearch = "",
  onResetView,
  onImport,
  importingId,
}) {
  const hasKeywordSearch = Boolean(keywordSearch.trim());
  const aliCards = aliItems.map(mapAliItemToCard);

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

  // Connection check state
  if (aliConnectionLoading && !aliCards.length) {
    return (
      <div className="marketplace-products__empty">
        <LuLoader className="spin-icon" style={{ fontSize: 28 }} />
        <p>Connecting to AliExpress in real-time…</p>
      </div>
    );
  }

  // Not connected notices
  if (aliPlatformUnavailable) {
    return (
      <div className="marketplace-inline-notice">
        <LuStore />
        <div className="marketplace-inline-notice__copy">
          <strong>Platform AliExpress Not Connected</strong>
          <p>AliExpress is connected once by your super admin for all users. Ask them to connect it from Admin → Settings.</p>
        </div>
      </div>
    );
  }

  if (aliCredentialsMissing || !aliCredentialsConfigured) {
    return (
      <div className="marketplace-inline-notice marketplace-inline-notice--info">
        <LuStore />
        <p>AliExpress API credentials are not configured on the server. Please add them in the server configuration.</p>
      </div>
    );
  }

  // Determine section heading
  let sectionTitle = "Real-Time AliExpress Products";
  if (hasKeywordSearch) {
    sectionTitle = `Search results for "${keywordSearch.trim()}"`;
  } else if (expandedProductsTitle) {
    sectionTitle = expandedProductsTitle;
  } else if (activeCategory && activeCategory !== "All Categories") {
    sectionTitle = activeCategory;
  }

  return (
    <section className="marketplace-expanded-products">
      {aliError && (
        <div className="marketplace-inline-notice marketplace-inline-notice--error">
          <p>{aliError}</p>
        </div>
      )}

      <div className="marketplace-expanded-products__head">
        <h2 className="marketplace-section__title">
          {sectionTitle}
          {aliCards.length ? ` (${aliCards.length})` : ""}
          {aliLoading ? <LuLoader className="spin-icon" style={{ marginLeft: 8 }} /> : null}
        </h2>
        {(hasKeywordSearch || expandedProductsTitle || (activeCategory && activeCategory !== "All Categories")) && (
          <button type="button" className="marketplace-section__see-more" onClick={onResetView}>
            Back to all categories
          </button>
        )}
      </div>

      {aliLoading && !aliCards.length ? (
        <div className="marketplace-products__empty">
          <LuLoader className="spin-icon" style={{ fontSize: 28 }} />
          <p>Loading real-time products from AliExpress…</p>
        </div>
      ) : aliCards.length ? (
        <>
          <div className="marketplace-expanded-products__grid">
            {aliCards.map((item) => (
              <ProductCard
                item={item}
                key={item.id}
                onImport={onImport}
                importing={importingId === item.id}
              />
            ))}
          </div>
          {renderPagination()}
        </>
      ) : (
        <div className="marketplace-products__empty">
          <LuSlidersHorizontal />
          <p>No products found from AliExpress matching the current filters.</p>
        </div>
      )}
    </section>
  );
}

export default MarketplaceSections;
