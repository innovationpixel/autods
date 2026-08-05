import { useEffect, useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuLoader, LuSlidersHorizontal } from "react-icons/lu";
import ProductCard from "../ProductCard";
import { buildPaginationItems } from "../helpers";
import { getCuratedProducts, getMarketplaceCategories } from "../../../services/CuratedProductService";
import { toast } from "../../../utils/toast";

function mapCuratedItemToCard(item) {
  return {
    id: item.id,
    vendor: item.seller || null,
    title: item.title,
    price: `$${Number(item.price ?? 0).toFixed(2)}`,
    shipping: "Ships internationally",
    shippingDays: 10,
    image_url: item.image_url,
    images: item.image_url ? [item.image_url] : [],
    shippingTag: "AliExpress",
    listingUrl: item.listing_url,
    marketplace: "aliexpress",
  };
}

function CuratedProductsPage({ type, title, onBack, onImport, importingId }) {
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketplaceCategories()
      .then((res) => setCategories(res.data?.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [type, activeCategoryId]);

  useEffect(() => {
    setLoading(true);
    getCuratedProducts({
      type,
      category_id: activeCategoryId || undefined,
      page,
      limit: 20,
    })
      .then((res) => {
        setProducts(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load products."))
      .finally(() => setLoading(false));
  }, [type, activeCategoryId, page]);

  const cards = useMemo(() => products.map(mapCuratedItemToCard), [products]);
  const paginationItems = buildPaginationItems(meta.current_page, meta.last_page);

  return (
    <section className="marketplace-expanded-products">
      <div className="marketplace-expanded-products__head">
        <h2 className="marketplace-section__title">
          {title} ({meta.total})
          {loading ? <LuLoader className="spin-icon" style={{ marginLeft: 8 }} /> : null}
        </h2>
        <button type="button" className="marketplace-section__see-more" onClick={onBack}>
          Back to all categories
        </button>
      </div>

      {categories.length ? (
        <div className="marketplace-subfilters">
          <div className="marketplace-subfilters__chips">
            <button
              type="button"
              className={`marketplace-subfilters__chip ${!activeCategoryId ? "marketplace-subfilters__chip--active" : ""}`}
              onClick={() => setActiveCategoryId("")}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`marketplace-subfilters__chip ${activeCategoryId === category.id ? "marketplace-subfilters__chip--active" : ""}`}
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && cards.length === 0 ? (
        <div className="marketplace-products__empty">
          <LuSlidersHorizontal />
          <p>No products in this feed yet for your marketplace.</p>
        </div>
      ) : (
        <div className="marketplace-expanded-products__grid">
          {cards.map((item) => (
            <ProductCard item={item} key={item.id} onImport={onImport} importing={importingId === item.id} />
          ))}
        </div>
      )}

      {meta.last_page > 1 ? (
        <div className="orders-pagination marketplace-pagination">
          <button
            type="button"
            className="orders-pagination__arrow"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={meta.current_page <= 1}
            aria-label="Previous page"
          >
            <LuChevronLeft />
          </button>

          {paginationItems.map((item, index) =>
            item === "..." ? (
              <span className="products-pagination__ellipsis" key={`ellipsis-${index}`}>
                ...
              </span>
            ) : (
              <button
                type="button"
                key={item}
                className={item === meta.current_page ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="orders-pagination__arrow"
            onClick={() => setPage((current) => Math.min(meta.last_page, current + 1))}
            disabled={meta.current_page >= meta.last_page}
            aria-label="Next page"
          >
            <LuChevronRight />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default CuratedProductsPage;
