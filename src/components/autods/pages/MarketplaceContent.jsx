import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LuChevronDown, LuLoader, LuSearch, LuSlidersHorizontal, LuSparkles } from "react-icons/lu";
import CarouselSection from "../CarouselSection";
import ProductCard from "../ProductCard";
import SelectField from "../SelectField";
import { categoryFilters, filterOptions, filterPills } from "../constants";
import { searchMarketplaceAction } from "../../../store/actions/EbayActions";
import { selectMarketplaceItems, selectMarketplaceLoading, selectMarketplaceError } from "../../../store/selectors/EbaySelectors";

function MarketplaceContent({
  keywordSearch,
  setKeywordSearch,
  shipsTo,
  setShipsTo,
  currency,
  setCurrency,
  shipsFrom,
  setShipsFrom,
  priceRange,
  setPriceRange,
  supplier,
  setSupplier,
  activeCategory,
  selectCategory,
  currentSubfilters,
  activeSubfilter,
  setActiveSubfilter,
  selectedPill,
  setSelectedPill,
  sortBy,
  setSortBy,
  expandedProductsTitle,
  visibleProducts,
  visibleSections,
  openProductsView,
  resetMarketplaceView,
}) {
  const dispatch     = useDispatch();
  const ebayItems    = useSelector(selectMarketplaceItems);
  const ebayLoading  = useSelector(selectMarketplaceLoading);
  const ebayError    = useSelector(selectMarketplaceError);
  const searchTimer  = useRef(null);

  // Debounced eBay search when keyword or filters change
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const params = {
        q: keywordSearch,
        ships_to: shipsTo !== "All" ? shipsTo : undefined,
        sort: sortBy === "Lowest Price" ? "price" : sortBy === "Newest" ? "-itemCreationDate" : undefined,
        limit: 20,
      };
      if (priceRange && priceRange !== "All") {
        const [min, max] = priceRange.replace("$", "").split(" - ");
        if (min) params.price_min = min;
        if (max) params.price_max = max;
      }
      dispatch(searchMarketplaceAction(params));
    }, 500);

    return () => clearTimeout(searchTimer.current);
  }, [dispatch, keywordSearch, shipsTo, priceRange, sortBy]);

  // Map eBay API items to ProductCard shape
  const ebayProductCards = ebayItems.map((item) => ({
    id: item.id,
    vendor: item.seller ?? "eBay",
    title: item.title,
    price: `$${Number(item.price ?? 0).toFixed(2)}`,
    shipping: item.shipping === "0" ? "Free Shipping" : `$${Number(item.shipping ?? 0).toFixed(2)} Shipping`,
    shippingDays: 5,
    category: item.category_name ?? "General",
    shipsFrom: "eBay",
    image: item.image_url ?? "https://via.placeholder.com/300x300?text=No+Image",
    shippingTag: "eBay Listing",
    listingUrl: item.listing_url,
    marketplace: "ebay",
  }));

  // When eBay results are present, show them instead of static catalog
  const showEbayResults = ebayItems.length > 0 || ebayLoading || (keywordSearch && keywordSearch.trim().length > 0);

  return (
    <>
      <section className="marketplace-search-panel card-wrapper">
        <div className="marketplace-search-panel__top-row">
          <div className="marketplace-main-search">
            <LuSearch />
            <input
              type="text"
              className="form-control-ui input-border-style"
              placeholder="Search by product title, supplier or product description..."
              value={keywordSearch}
              onChange={(event) => setKeywordSearch(event.target.value)}
            />
          </div>

          <button type="button" className="button-base button-primary marketplace-search-panel__submit">
            Search
          </button>

          <button type="button" className="marketplace-search-panel__ugc-btn">
            <LuSparkles />
            <span>Generate Sales Ready UGC Ads</span>
          </button>
        </div>

        <div className="marketplace-search-panel__filters">
          <SelectField
            label="Ships To"
            value={shipsTo}
            options={filterOptions.shipsTo}
            onChange={(event) => setShipsTo(event.target.value)}
          />
          <SelectField
            label="Currency"
            value={currency}
            options={filterOptions.currency}
            onChange={(event) => setCurrency(event.target.value)}
          />
          <SelectField
            label="Ships From"
            value={shipsFrom}
            options={filterOptions.shipsFrom}
            onChange={(event) => setShipsFrom(event.target.value)}
          />
          <SelectField
            label="Price Range"
            value={priceRange}
            options={filterOptions.priceRange}
            onChange={(event) => setPriceRange(event.target.value)}
          />
          <SelectField
            label="Supplier"
            value={supplier}
            options={filterOptions.supplier}
            onChange={(event) => setSupplier(event.target.value)}
          />
        </div>

        <div className="marketplace-category-row" aria-label="Category filters">
          {categoryFilters.map((category) => {
            const Icon = category.icon;
            const isActive =
              activeCategory === category.label ||
              (category.key === "all" && activeCategory === "All Categories");

            return (
              <button
                type="button"
                key={category.key}
                className={`marketplace-category-item ${isActive ? "marketplace-category-item--active" : ""}`}
                onClick={() => selectCategory(category)}
              >
                <span className="marketplace-category-item__icon">
                  <Icon />
                </span>
                <span className="marketplace-category-item__label">{category.label}</span>
              </button>
            );
          })}
        </div>

        {currentSubfilters.length ? (
          <div className="marketplace-subfilters">
            <div className="marketplace-subfilters__title">{activeCategory}</div>
            <div className="marketplace-subfilters__chips">
              {currentSubfilters.map((subfilter) => (
                <button
                  type="button"
                  key={subfilter}
                  className={`marketplace-subfilters__chip ${activeSubfilter === subfilter ? "marketplace-subfilters__chip--active" : ""}`}
                  onClick={() =>
                    setActiveSubfilter((current) => (current === subfilter ? "" : subfilter))
                  }
                >
                  {subfilter}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="marketplace-toolbar">
        <div className="marketplace-toolbar__left">
          {filterPills.map((item) => {
            const Icon = item.icon;
            const isActive = selectedPill === item.label;

            return (
              <button
                type="button"
                key={item.label}
                className={`filter-pill ${isActive ? "filter-pill--active" : ""}`}
                onClick={() =>
                  setSelectedPill((current) => (current === item.label ? "" : item.label))
                }
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="marketplace-toolbar__right">
          <span className="marketplace-toolbar__sort-label">Sort By:</span>
          <div className="marketplace-toolbar__sort-control">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {filterOptions.sortBy.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <LuChevronDown />
          </div>
        </div>
      </section>

      <div className="marketplace-sections">
        {ebayLoading ? (
          <div className="marketplace-products__empty">
            <LuLoader style={{ animation: "spin 1s linear infinite", fontSize: 28 }} />
            <p>Searching eBay marketplace…</p>
          </div>
        ) : ebayError ? (
          <div className="marketplace-products__empty">
            <LuSlidersHorizontal />
            <p style={{ color: "#991b1b" }}>{ebayError}</p>
          </div>
        ) : showEbayResults ? (
          <section className="marketplace-expanded-products">
            <div className="marketplace-expanded-products__head">
              <h2 className="marketplace-section__title">
                eBay Marketplace — {ebayProductCards.length} result{ebayProductCards.length !== 1 ? "s" : ""}
                {keywordSearch ? ` for "${keywordSearch}"` : ""}
              </h2>
            </div>
            {ebayProductCards.length ? (
              <div className="marketplace-expanded-products__grid">
                {ebayProductCards.map((item) => (
                  <ProductCard item={item} key={item.id} />
                ))}
              </div>
            ) : (
              <div className="marketplace-products__empty">
                <LuSlidersHorizontal />
                <p>No eBay results found. Try a different keyword or adjust your filters.</p>
              </div>
            )}
          </section>
        ) : expandedProductsTitle ? (
          <section className="marketplace-expanded-products">
            <div className="marketplace-expanded-products__head">
              <h2 className="marketplace-section__title">{expandedProductsTitle}</h2>
              <button type="button" className="marketplace-section__see-more" onClick={resetMarketplaceView}>
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
        ) : visibleSections.length ? (
          visibleSections.map((section) => (
            <CarouselSection key={section.key} onSeeMore={openProductsView} section={section} />
          ))
        ) : (
          <div className="marketplace-products__empty">
            <LuSlidersHorizontal />
            <p>No products match the current filters.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default MarketplaceContent;
