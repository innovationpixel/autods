import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuChevronRight,
  LuEllipsisVertical,
  LuEye,
  LuPrinter,
  LuSettings2,
  LuX,
} from "react-icons/lu";
import { getOrders } from "../../services/OrderService";
import { openPrintableDocument } from "./printDocuments";
import "../../assets/css/dashboard-order-actions.css";

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function cleanLabel(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replace(/_/g, " ");
}

function joinAddress(shipTo = {}) {
  return [
    shipTo.addressLine1,
    shipTo.addressLine2,
    shipTo.city,
    shipTo.stateOrProvince,
    shipTo.postalCode,
    shipTo.countryCode,
  ].filter(Boolean).join(", ") || "—";
}

function mapOrder(apiOrder, summaryOrder = {}, dashboardStore = {}) {
  const raw = apiOrder?.raw_data ?? {};
  const lineItems = Array.isArray(raw.lineItems) ? raw.lineItems : [];
  const firstItem = lineItems[0] ?? {};
  const buyer = raw.buyer ?? {};
  const payment = raw.paymentSummary?.payments?.[0] ?? {};
  const fulfillment = raw.fulfillmentStartInstructions?.[0] ?? {};
  const shippingStep = fulfillment.shippingStep ?? {};
  const shipTo = shippingStep.shipTo ?? buyer.buyerRegistrationAddress ?? {};
  const pricing = raw.pricingSummary ?? {};
  const delivery = raw.deliveryCost ?? {};
  const currency = apiOrder?.currency ?? pricing.total?.currency ?? "USD";
  const sellValue = apiOrder?.sell_price ?? pricing.total?.value ?? firstItem.lineItemCost?.value ?? summaryOrder.amount ?? 0;
  const totalQuantity = lineItems.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0) || 1;
  const profitValue = apiOrder?.profit ?? (apiOrder?.buy_price != null ? Number(sellValue) - Number(apiOrder.buy_price) : null);
  const orderId = apiOrder?.ebay_order_id ?? raw.orderId ?? summaryOrder.orderId ?? summaryOrder.id ?? "—";
  const orderDate = typeof apiOrder?.order_date === "string"
    ? apiOrder.order_date.slice(0, 10)
    : (apiOrder?.order_date ?? summaryOrder.date ?? "—");
  const trackingNumber = apiOrder?.tracking_number
    ?? shippingStep.shipmentTrackingNumber
    ?? apiOrder?.buy_tracking_number
    ?? raw.buy_tracking_number
    ?? raw.source_tracking_number
    ?? "—";
  const carrier = apiOrder?.carrier
    ?? shippingStep.shippingCarrierCode
    ?? apiOrder?.buy_carrier
    ?? raw.buy_carrier
    ?? "—";
  const buyerName = shipTo.fullName
    ?? buyer.buyerRegistrationAddress?.fullName
    ?? apiOrder?.buyer_name
    ?? summaryOrder.buyer
    ?? "—";

  return {
    id: String(apiOrder?.id ?? summaryOrder.id ?? ""),
    orderId: String(orderId),
    title: apiOrder?.item_title ?? firstItem.title ?? summaryOrder.product ?? "Order item",
    image: apiOrder?.image_url ?? apiOrder?.listing_image_url ?? firstItem.image?.imageUrl ?? summaryOrder.image ?? null,
    sku: firstItem.sku ?? "—",
    totalQuantity,
    total: formatMoney(sellValue, currency),
    sellPrice: formatMoney(sellValue, currency),
    buyPrice: apiOrder?.buy_price != null ? formatMoney(apiOrder.buy_price, currency) : "—",
    profit: profitValue != null ? formatMoney(profitValue, currency) : "—",
    currency,
    status: cleanLabel(apiOrder?.status ?? summaryOrder.status),
    orderDate,
    date: orderDate,
    paidDate: payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "—",
    buyerName,
    username: buyer.username ?? apiOrder?.buyer_name ?? summaryOrder.buyer ?? "—",
    email: apiOrder?.buyer_email ?? buyer.buyerRegistrationAddress?.email ?? "—",
    phone: buyer.primaryPhone?.phoneNumber ?? shipTo.primaryPhone?.phoneNumber ?? "—",
    shippingAddress: joinAddress(shipTo),
    paymentStatus: cleanLabel(raw.orderPaymentStatus),
    shippingStatus: cleanLabel(raw.orderFulfillmentStatus),
    shippingService: shippingStep.shippingServiceCode ?? "—",
    shippingCost: delivery.shippingCost?.value != null
      ? formatMoney(delivery.shippingCost.value, delivery.shippingCost.currency ?? currency)
      : (delivery.amount?.value != null ? formatMoney(delivery.amount.value, delivery.amount.currency ?? currency) : "—"),
    carrier: cleanLabel(carrier),
    trackingNumber: cleanLabel(trackingNumber),
    shipBy: firstItem.lineItemFulfillmentInstructions?.shipByDate
      ? String(firstItem.lineItemFulfillmentInstructions.shipByDate).slice(0, 10)
      : "—",
    estimatedDelivery: cleanLabel(raw.estimatedDeliveryDate ?? raw.deliveryWindow?.maxEstimatedDeliveryDate),
    itemSell: apiOrder?.item_sell_id ?? firstItem.legacyItemId ?? "—",
    itemBuy: apiOrder?.source_product_id ?? apiOrder?.item_buy_id ?? "—",
    sourcePlatform: cleanLabel(apiOrder?.source_platform ?? "aliexpress"),
    sourceSkuId: apiOrder?.source_sku_id ?? "—",
    sourceUrl: apiOrder?.source_url ?? "—",
    aliexpressOrderId: apiOrder?.aliexpress_order_id ?? raw.aliexpress_order_id ?? raw.source_order_id ?? "—",
    aliexpressStatus: cleanLabel(apiOrder?.aliexpress_status ?? raw.aliexpress_status),
    buyTrackingNumber: apiOrder?.buy_tracking_number ?? raw.buy_tracking_number ?? "—",
    buyCarrier: cleanLabel(apiOrder?.buy_carrier ?? raw.buy_carrier),
    transactionId: firstItem.lineItemId ?? raw.salesRecordReference ?? "—",
    storeName: apiOrder?.connection?.store_name
      ?? apiOrder?.connection?.ebay_username
      ?? dashboardStore.username
      ?? "—",
    siteId: apiOrder?.connection?.site_id ?? "—",
  };
}

function detailSections(order) {
  return [
    {
      title: "Order",
      rows: [
        ["eBay Order ID", order.orderId],
        ["Internal ID", order.id || "—"],
        ["Status", order.status],
        ["Order date", order.orderDate],
        ["Paid date", order.paidDate],
        ["Store", order.storeName],
        ["Marketplace site", order.siteId],
      ],
    },
    {
      title: "Buyer",
      rows: [
        ["Name", order.buyerName],
        ["Username", order.username],
        ["Email", order.email],
        ["Phone", order.phone],
        ["Shipping address", order.shippingAddress],
      ],
    },
    {
      title: "Item & pricing",
      rows: [
        ["Product", order.title],
        ["SKU", order.sku],
        ["Quantity", order.totalQuantity],
        ["eBay item ID", order.itemSell],
        ["Source item ID", order.itemBuy],
        ["Sell price", order.sellPrice],
        ["Buy price", order.buyPrice],
        ["Profit", order.profit],
        ["Currency", order.currency],
      ],
    },
    {
      title: "Shipping & tracking",
      rows: [
        ["Fulfillment status", order.shippingStatus],
        ["Shipping service", order.shippingService],
        ["Shipping cost", order.shippingCost],
        ["Carrier", order.carrier],
        ["Tracking number", order.trackingNumber],
        ["Ship by", order.shipBy],
        ["Estimated delivery", order.estimatedDelivery],
      ],
    },
    {
      title: "Source & fulfillment",
      rows: [
        ["Source platform", order.sourcePlatform],
        ["Source SKU", order.sourceSkuId],
        ["Source URL", order.sourceUrl],
        ["AliExpress order ID", order.aliexpressOrderId],
        ["AliExpress status", order.aliexpressStatus],
        ["Source tracking", order.buyTrackingNumber],
        ["Source carrier", order.buyCarrier],
        ["Transaction ID", order.transactionId],
        ["Payment status", order.paymentStatus],
      ],
    },
  ];
}

function DashboardOrderActions({ order, store = {}, onSettings }) {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [details, setDetails] = useState(() => mapOrder(null, order, store));
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const sections = useMemo(() => detailSections(details), [details]);

  useEffect(() => {
    setDetails(mapOrder(null, order, store));
    setDetailsLoaded(false);
    setDetailsError("");
    setMenuOpen(false);
    setPrintMenuOpen(false);
    setModalOpen(false);
  }, [order?.id, order?.orderId]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setMenuOpen(false);
        setPrintMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  const ensureDetails = async () => {
    if (detailsLoaded || detailsLoading) return;

    const lookup = order?.orderId ?? order?.id;
    if (lookup === null || lookup === undefined || lookup === "") {
      setDetailsLoaded(true);
      return;
    }

    setDetailsLoading(true);
    setDetailsError("");

    try {
      const res = await getOrders({ q: String(lookup), limit: 100, archived: 0 });
      const rows = res.data?.data ?? [];
      const orderIdText = String(order?.orderId ?? "");
      const internalIdText = String(order?.id ?? "");
      const matched = rows.find((row) =>
        String(row?.id ?? "") === internalIdText ||
        String(row?.ebay_order_id ?? row?.raw_data?.orderId ?? "") === orderIdText
      ) ?? rows[0] ?? null;

      if (matched) {
        setDetails(mapOrder(matched, order, store));
      } else {
        setDetailsError("Full order record was not found. Showing dashboard order data.");
      }
      setDetailsLoaded(true);
    } catch {
      setDetailsError("Full order details could not be refreshed. Showing dashboard order data.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const openActions = () => {
    setMenuOpen((current) => {
      const next = !current;
      if (next) void ensureDetails();
      return next;
    });
    setPrintMenuOpen(false);
  };

  const openView = () => {
    setMenuOpen(false);
    setPrintMenuOpen(false);
    setModalOpen(true);
    void ensureDetails();
  };

  const printDocument = (docType) => {
    setMenuOpen(false);
    setPrintMenuOpen(false);
    openPrintableDocument(docType, details);
  };

  const orderLabel = order?.orderId ?? order?.id ?? "order";

  return (
    <div className="dashboard-order-actions" ref={rootRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="ebay-more-button dashboard-order-actions__trigger"
        aria-label={`Actions for order ${orderLabel}`}
        aria-expanded={menuOpen}
        onClick={openActions}
      >
        <LuEllipsisVertical />
      </button>

      {menuOpen ? (
        <div className="dashboard-order-actions__menu" role="menu">
          <button type="button" role="menuitem" onClick={openView}>
            <LuEye />
            <span>View</span>
          </button>

          <div className="dashboard-order-actions__print-wrap">
            <button type="button" role="menuitem" onClick={() => setPrintMenuOpen((current) => !current)}>
              <LuPrinter />
              <span>Print</span>
              <LuChevronRight className="dashboard-order-actions__chevron" />
            </button>

            {printMenuOpen ? (
              <div className="dashboard-order-actions__submenu" role="menu" aria-label="Print order documents">
                <button type="button" onClick={() => printDocument("invoice")}>Invoice</button>
                <button type="button" onClick={() => printDocument("packing-slip")}>Packing Slip</button>
                <button type="button" onClick={() => printDocument("pick-list")}>Pick List</button>
                <button type="button" onClick={() => printDocument("barcode")}>Barcode</button>
                <button type="button" onClick={() => printDocument("shipping-label")}>Shipping Label</button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setPrintMenuOpen(false);
              onSettings?.();
            }}
          >
            <LuSettings2 />
            <span>Settings</span>
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="dashboard-order-modal-layer" role="presentation">
          <button
            type="button"
            className="dashboard-order-modal-backdrop"
            aria-label="Close order details"
            onClick={() => setModalOpen(false)}
          />

          <section className="dashboard-order-modal" role="dialog" aria-modal="true" aria-label={`Order ${details.orderId} details`}>
            <div className="dashboard-order-modal__head">
              <div className="dashboard-order-modal__identity">
                <div className="dashboard-order-modal__thumb">
                  {details.image ? <img src={details.image} alt={details.title} /> : <LuEye />}
                </div>
                <div>
                  <span>Order details</span>
                  <h2>#{details.orderId}</h2>
                  <p>{details.title}</p>
                </div>
              </div>

              <button type="button" className="dashboard-order-modal__close" aria-label="Close order details" onClick={() => setModalOpen(false)}>
                <LuX />
              </button>
            </div>

            <div className="dashboard-order-modal__actions">
              <button type="button" onClick={() => openPrintableDocument("invoice", details)}><LuPrinter /><span>Invoice</span></button>
              <button type="button" onClick={() => openPrintableDocument("packing-slip", details)}><LuPrinter /><span>Packing Slip</span></button>
              <button type="button" onClick={onSettings}><LuSettings2 /><span>Settings</span></button>
            </div>

            {detailsLoading ? (
              <div className="dashboard-order-modal__loading"><span className="dashboard-order-modal__spinner" /><span>Loading full order details…</span></div>
            ) : null}

            {detailsError ? <p className="dashboard-order-modal__warning">{detailsError}</p> : null}

            <div className="dashboard-order-modal__body">
              {sections.map((section) => (
                <section className="dashboard-order-detail-section" key={section.title}>
                  <h3>{section.title}</h3>
                  <div className="dashboard-order-detail-grid">
                    {section.rows.map(([label, value]) => (
                      <div className="dashboard-order-detail-item" key={`${section.title}-${label}`}>
                        <span>{label}</span>
                        <strong>{value || "—"}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default DashboardOrderActions;
