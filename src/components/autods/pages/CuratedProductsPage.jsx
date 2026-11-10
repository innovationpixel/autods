import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuArrowUpRight,
  LuBadgeCheck,
  LuChartLine,
  LuChevronLeft,
  LuChevronRight,
  LuLoader,
  LuLock,
  LuSlidersHorizontal,
} from "react-icons/lu";
import ProductCard from "../ProductCard";
import { buildPaginationItems } from "../helpers";
import { getCuratedProducts, getMarketplaceCategories } from "../../../services/CuratedProductService";
import { selectUser } from "../../../store/selectors/AuthSelectors";
import AddonPurchaseModal from "./AddonPurchaseModal";
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
  const navigate = useNavigate();
  const authUser = useSelector(selectUser);
  const isVaUser = authUser?.role === "va" || Boolean(authUser?.parent_id);

  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lockState, setLockState] = useState(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const isLockedRef = useRef(false);

  useEffect(() => {
    isLockedRef.current = Boolean(lockState);
  }, [lockState]);

  useEffect(() => {
    getMarketplaceCategories()
      .then((res) => setCategories(res.data?.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [type, activeCategoryId]);

  useEffect(() => {
    setLockState(null);
    setPurchaseModalOpen(false);
  }, [type]);

  useEffect(() => {
    const triggerRefresh = () => setRefreshTick((n) => n + 1);
    const handleFocus = () => {
      if (isLockedRef.current) {
        triggerRefresh();
      }
    };
    const handleStorage = (event) => {
      if (event.key === "autods_addon_updated_at") {
        triggerRefresh();
      }
    };
    window.addEventListener("autods_refresh_addons", triggerRefresh);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("autods_refresh_addons", triggerRefresh);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCuratedProducts({
      type,
      category_id: activeCategoryId || undefined,
      page,
      limit: 20,
    })
      .then((res) => {
        if (!active) return;
        setLockState(null);
        setProducts(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch((err) => {
        if (!active) return;
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        if (status === 403 && (code === "addon_required" || code === "addon_disabled")) {
          setProducts([]);
          setMeta({ current_page: 1, last_page: 1, total: 0 });
          setLockState({
            code,
            message: err.response.data?.message || err.response.data?.error || `${title} is locked.`,
            addon: err.response.data?.addon ?? null,
          });
          return;
        }
        toast.error("Failed to load products.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type, activeCategoryId, page, refreshTick, title]);

  const cards = useMemo(() => products.map(mapCuratedItemToCard), [products]);
  const paginationItems = buildPaginationItems(meta.current_page, meta.last_page);

  const isTrending = type === "trending";
  const addonInfo = lockState?.addon;
  const addonPrice = Math.max(0, Number(addonInfo?.price ?? 0));
  const addonBilling = addonInfo?.billing_mode === "one_time" ? "one_time" : "monthly";
  const addonDisabled = lockState?.code === "addon_disabled" || addonInfo?.enabled === false;

  return (
    <section className="marketplace-expanded-products">
      <div className="marketplace-expanded-products__head">
        <h2 className="marketplace-section__title">
          {lockState ? title : `${title} (${meta.total})`}
          {loading ? <LuLoader className="spin-icon" style={{ marginLeft: 8 }} /> : null}
        </h2>
        <button type="button" className="marketplace-section__see-more" onClick={onBack}>
          Back to all categories
        </button>
      </div>

      {!loading && lockState ? (
        <div
          className="card-wrapper"
          style={{
            maxWidth: 640,
            margin: "24px auto",
            padding: "32px 28px",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            textAlign: "center",
            boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              margin: "0 auto 16px",
              background: isTrending
                ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                : "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              boxShadow: isTrending
                ? "0 8px 18px rgba(234, 88, 12, 0.25)"
                : "0 8px 18px rgba(79, 70, 229, 0.25)",
            }}
          >
            {isTrending ? <LuChartLine /> : <LuBadgeCheck />}
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 700,
              background: addonDisabled ? "#f1f5f9" : isTrending ? "#ffedd5" : "#e0e7ff",
              color: addonDisabled ? "#64748b" : isTrending ? "#c2410c" : "#4338ca",
              marginBottom: 12,
            }}
          >
            <LuLock />
            <span>{addonDisabled ? "Currently Unavailable" : "Paid Add-on Feature"}</span>
          </span>

          <h3 style={{ margin: "0 0 8px 0", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
            {addonInfo?.title || title}
          </h3>

          <p style={{ margin: "0 auto 20px", maxWidth: 480, fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
            {addonInfo?.description || lockState.message}
          </p>

          {!addonDisabled && addonInfo ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                marginBottom: 22,
              }}
            >
              <strong style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                ${addonPrice.toFixed(2)}
              </strong>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>
                {addonBilling === "monthly" ? "/ month" : "one-time unlock"}
              </span>
            </div>
          ) : null}

          {addonDisabled ? (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className="plans-settings__ghost-btn"
                onClick={onBack}
                style={{ padding: "10px 18px", fontSize: 13.5 }}
              >
                Back to Marketplace
              </button>
              <button
                type="button"
                className="plans-settings__btn plans-settings__btn--primary"
                onClick={() => navigate("/settings?tab=plans")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 13.5 }}
              >
                <span>View Plans &amp; Add-ons</span>
                <LuArrowUpRight />
              </button>
            </div>
          ) : isVaUser ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#64748b" }}>
                Only the store owner can purchase or manage add-ons under Settings → Plans &amp; Add-ons.
              </p>
              <button
                type="button"
                className="plans-settings__ghost-btn"
                onClick={onBack}
                style={{ padding: "9px 18px", fontSize: 13 }}
              >
                Back to Marketplace
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className="plans-settings__ghost-btn"
                onClick={() => navigate("/settings?tab=plans")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 13.5 }}
              >
                <span>Manage in Plans &amp; Add-ons</span>
                <LuArrowUpRight />
              </button>
              {addonInfo ? (
                <button
                  type="button"
                  className="plans-settings__btn plans-settings__btn--primary"
                  onClick={() => setPurchaseModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13.5 }}
                >
                  <LuLock />
                  <span>Unlock Now (${addonPrice.toFixed(2)})</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}

      <AddonPurchaseModal
        open={purchaseModalOpen}
        addon={addonInfo}
        onClose={() => setPurchaseModalOpen(false)}
        onSuccess={() => {
          setLockState(null);
          setRefreshTick((n) => n + 1);
        }}
      />
    </section>
  );
}

export default CuratedProductsPage;
