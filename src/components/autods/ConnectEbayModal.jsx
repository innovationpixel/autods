import { LuChevronDown, LuLoader, LuX } from "react-icons/lu";

const EBAY_MARKETPLACES = [
  { value: "EBAY_US", label: "United States — ebay.com" },
  { value: "EBAY_GB", label: "United Kingdom — ebay.co.uk" },
  { value: "EBAY_AU", label: "Australia — ebay.com.au" },
  { value: "EBAY_CA", label: "Canada — ebay.ca" },
  { value: "EBAY_DE", label: "Germany — ebay.de" },
  { value: "EBAY_FR", label: "France — ebay.fr" },
  { value: "EBAY_IT", label: "Italy — ebay.it" },
  { value: "EBAY_ES", label: "Spain — ebay.es" },
];

function ConnectEbayModal({
  open,
  onClose,
  onConnect,
  connecting = false,
  siteId = "EBAY_US",
  onSiteChange,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="connect-ebay-modal-layer" role="presentation">
      <button
        type="button"
        className="connect-ebay-modal-layer__backdrop"
        aria-label="Close connect eBay dialog"
        onClick={onClose}
      />

      <section
        className="connect-ebay-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Connect eBay"
      >
        <button type="button" className="connect-ebay-modal__close" aria-label="Close" onClick={onClose}>
          <LuX />
        </button>

        <div className="connect-ebay-modal__logo" aria-hidden="true">
          <span className="connect-ebay-modal__logo-e">e</span>
          <span className="connect-ebay-modal__logo-b">b</span>
          <span className="connect-ebay-modal__logo-a">a</span>
          <span className="connect-ebay-modal__logo-y">y</span>
        </div>

        <h2 className="connect-ebay-modal__title">Connect eBay</h2>
        <p className="connect-ebay-modal__copy">
          Add your eBay seller account to import products, sync listings, and automate orders.
        </p>

        <label className="connect-ebay-modal__field">
          <span className="connect-ebay-modal__label">eBay marketplace</span>
          <div className="connect-ebay-modal__select-wrap">
            <select
              value={siteId}
              onChange={(event) => onSiteChange?.(event.target.value)}
              disabled={connecting}
            >
              {EBAY_MARKETPLACES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <LuChevronDown />
          </div>
        </label>

        <button
          type="button"
          className="connect-ebay-modal__submit"
          onClick={onConnect}
          disabled={connecting}
        >
          {connecting ? (
            <>
              <LuLoader className="spin-icon" />
              <span>Opening eBay…</span>
            </>
          ) : (
            <span>Finish</span>
          )}
        </button>

        <p className="connect-ebay-modal__footnote">
          You&apos;ll be redirected to eBay to sign in and approve Auto DS access.
        </p>
      </section>
    </div>
  );
}

export default ConnectEbayModal;
