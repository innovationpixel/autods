import { useEffect, useMemo, useState } from "react";
import {
  LuArrowDownLeft,
  LuArrowDownToLine,
  LuClock3,
  LuCreditCard,
  LuLoader,
  LuPlus,
  LuSparkles,
  LuTrendingDown,
  LuWalletCards,
  LuX,
  LuZap,
} from "react-icons/lu";
import { orderProcessingFundAmounts } from "../constants";
import { toast } from "../../../utils/toast";
import { openPaymentCheckout } from "../../../utils/paymentCheckout";
import { depositWalletPayPal, depositWalletStripe, getWalletSummary } from "../../../services/WalletService";

const balanceMetrics = [
  { key: "total_deposited", label: "Deposits", icon: LuArrowDownLeft, tone: "emerald", hint: "Total funds loaded" },
  { key: "total_spent", label: "Spend", icon: LuTrendingDown, tone: "rose", hint: "Used on fulfillment" },
  { key: "total_pending", label: "Pending", icon: LuClock3, tone: "amber", hint: "Awaiting clearance" },
];

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function AddFundsModal({ isOpen, currentBalance, onClose, onDeposit }) {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [checkoutProvider, setCheckoutProvider] = useState("");

  const resolvedAmount = useMemo(() => {
    if (useCustomAmount) {
      const parsed = Number.parseFloat(customAmount);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    return selectedAmount;
  }, [customAmount, selectedAmount, useCustomAmount]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const selectPresetAmount = (amount) => {
    setUseCustomAmount(false);
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const selectCustomAmount = () => {
    setUseCustomAmount(true);
  };

  const handleDeposit = async (provider) => {
    if (resolvedAmount < 5) {
      toast.warn("Enter an amount of at least $5.");
      return;
    }

    setCheckoutProvider(provider);
    try {
      await onDeposit(provider, resolvedAmount);
    } finally {
      setCheckoutProvider("");
    }
  };

  return (
    <div className="balance-modal-layer order-processing-modal-layer" role="presentation">
      <button type="button" className="balance-modal-layer__backdrop" aria-label="Close add funds modal" onClick={onClose} />

      <section
        className="order-processing-funds-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add funds to order processing balance"
      >
        <div className="order-processing-funds-modal__accent" aria-hidden="true" />

        <button type="button" className="order-processing-funds-modal__close" aria-label="Close" onClick={onClose}>
          <LuX />
        </button>

        <div className="order-processing-funds-modal__head">
          <span className="order-processing-funds-modal__icon">
            <LuSparkles />
          </span>
          <div>
            <h2>Add funds</h2>
            <p>Top up your wallet and keep orders moving without delays.</p>
          </div>
        </div>

        <div className="order-processing-funds-modal__balance-card">
          <span>Current available balance</span>
          <strong>{formatUsd(currentBalance)}</strong>
        </div>

        <div className="order-processing-funds-modal__section">
          <div className="order-processing-funds-modal__section-head">
            <span className="order-processing-funds-modal__step">1</span>
            <label className="order-processing-funds-modal__label">Choose amount</label>
          </div>

          <div className="order-processing-funds-modal__amount-grid">
            {orderProcessingFundAmounts.map((amount) => (
              <button
                type="button"
                key={amount}
                className={
                  !useCustomAmount && selectedAmount === amount
                    ? "order-processing-funds-modal__amount order-processing-funds-modal__amount--active"
                    : "order-processing-funds-modal__amount"
                }
                onClick={() => selectPresetAmount(amount)}
              >
                <strong>${amount}</strong>
              </button>
            ))}

            <button
              type="button"
              className={
                useCustomAmount
                  ? "order-processing-funds-modal__amount order-processing-funds-modal__amount--active order-processing-funds-modal__amount--custom"
                  : "order-processing-funds-modal__amount order-processing-funds-modal__amount--custom"
              }
              onClick={selectCustomAmount}
            >
              <strong>Custom</strong>
              <span>Any amount</span>
            </button>
          </div>

          {useCustomAmount ? (
            <div className="order-processing-funds-modal__custom-field">
              <span>$</span>
              <input
                type="number"
                min="5"
                step="0.01"
                placeholder="Enter custom amount (min $5)"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <div className="order-processing-funds-modal__summary">
          <div className="order-processing-funds-modal__summary-row order-processing-funds-modal__summary-row--total">
            <span>You will deposit</span>
            <strong>{formatUsd(resolvedAmount)}</strong>
          </div>
        </div>

        <div className="order-processing-funds-modal__footer">
          <button type="button" className="order-processing-funds-modal__cancel" onClick={onClose} disabled={Boolean(checkoutProvider)}>
            Cancel
          </button>
          <button
            type="button"
            className="order-processing-funds-modal__confirm"
            disabled={resolvedAmount <= 0 || Boolean(checkoutProvider)}
            onClick={() => handleDeposit("paypal")}
          >
            {checkoutProvider === "paypal" ? <LuLoader className="spin-icon" /> : <LuZap />}
            <span>Pay with PayPal</span>
          </button>
          <button
            type="button"
            className="order-processing-funds-modal__confirm"
            disabled={resolvedAmount <= 0 || Boolean(checkoutProvider)}
            onClick={() => handleDeposit("stripe")}
          >
            {checkoutProvider === "stripe" ? <LuLoader className="spin-icon" /> : <LuCreditCard />}
            <span>Pay with Stripe</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function OrderProcessingContent() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState("total_deposited");
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const availableBalance = summary?.balance ?? 0;
  const activeMetricConfig = balanceMetrics.find((metric) => metric.key === activeMetric) ?? balanceMetrics[0];

  const loadWallet = async () => {
    try {
      const res = await getWalletSummary();
      setSummary(res.data);
    } catch {
      toast.error("Failed to load order processing balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    window.addEventListener("focus", loadWallet);
    return () => window.removeEventListener("focus", loadWallet);
  }, []);

  const handleDeposit = async (provider, amount) => {
    try {
      const res = provider === "stripe"
        ? await depositWalletStripe(amount)
        : await depositWalletPayPal(amount);

      if (res.data?.url) {
        setAddFundsOpen(false);
        openPaymentCheckout(res.data.url);
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Checkout failed.");
    }
  };

  if (loading) {
    return (
      <section className="order-processing-page">
        <div className="wallet-hub__loading">
          <LuLoader className="spin-icon" />
          <span>Loading order processing balance…</span>
        </div>
      </section>
    );
  }

  return (
    <section className="order-processing-page">
      {notice ? (
        <div className="order-processing-notice">
          <span className="order-processing-notice__icon">
            <LuWalletCards />
          </span>
          <span className="order-processing-notice__copy">{notice}</span>
          <button type="button" aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <LuX />
          </button>
        </div>
      ) : null}

      <section className="order-processing-hero">
        <div className="order-processing-hero__mesh" aria-hidden="true" />
        <div className="order-processing-hero__orb order-processing-hero__orb--one" aria-hidden="true" />
        <div className="order-processing-hero__orb order-processing-hero__orb--two" aria-hidden="true" />

        <div className="order-processing-hero__inner">
          <header className="order-processing-hero__header">
            <div>
              <span className="order-processing-hero__eyebrow">
                <LuWalletCards />
                Order wallet
              </span>
              <h2 className="order-processing-hero__title">Order Processing Balance</h2>
              <p className="order-processing-hero__subtitle">
                Manage deposits, track spend, and fund automation in one place.
              </p>
            </div>

            <div className="order-processing-hero__spotlight">
              <span>Available to spend</span>
              <strong>{formatUsd(Math.max(availableBalance, 0))}</strong>
              <em>{summary?.currency ?? "USD"} · Updated in real time</em>
            </div>
          </header>

          <div className="order-processing-hero__grid">
            <div className="order-processing-hero__actions">
              <p className="order-processing-hero__panel-label">Quick actions</p>

              <button
                type="button"
                className="order-processing-btn order-processing-btn--primary"
                onClick={() => setAddFundsOpen(true)}
              >
                <span className="order-processing-btn__icon">
                  <LuPlus />
                </span>
                <span className="order-processing-btn__copy">
                  <strong>Add funds</strong>
                  <small>Pay securely with Stripe or PayPal</small>
                </span>
              </button>

              <button
                type="button"
                className="order-processing-btn order-processing-btn--secondary"
                onClick={() => setNotice("Withdraw flow will be available once your payout method is verified.")}
              >
                <span className="order-processing-btn__icon">
                  <LuArrowDownToLine />
                </span>
                <span className="order-processing-btn__copy">
                  <strong>Withdraw</strong>
                  <small>Transfer to your bank</small>
                </span>
              </button>
            </div>

            <div className="order-processing-hero__metrics">
              <p className="order-processing-hero__panel-label">Balance overview</p>

              <div className="order-processing-metrics">
                {balanceMetrics.map((metric) => {
                  const Icon = metric.icon;
                  const isActive = activeMetric === metric.key;

                  return (
                    <button
                      type="button"
                      key={metric.key}
                      className={
                        isActive
                          ? `order-processing-metric order-processing-metric--${metric.tone} order-processing-metric--active`
                          : `order-processing-metric order-processing-metric--${metric.tone}`
                      }
                      onClick={() => setActiveMetric(metric.key)}
                    >
                      <span className={`order-processing-metric__icon order-processing-metric__icon--${metric.tone}`}>
                        <Icon />
                      </span>
                      <span className="order-processing-metric__copy">
                        <span className="order-processing-metric__label">{metric.label}</span>
                        <strong className="order-processing-metric__value">{formatUsd(summary?.[metric.key])}</strong>
                        <span className="order-processing-metric__hint">{metric.hint}</span>
                      </span>
                      {isActive ? <span className="order-processing-metric__pulse" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>

              <div className={`order-processing-hero__insight order-processing-hero__insight--${activeMetricConfig.tone}`}>
                <span>Selected</span>
                <strong>
                  {activeMetricConfig.label}: {formatUsd(summary?.[activeMetricConfig.key])}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddFundsModal
        isOpen={addFundsOpen}
        currentBalance={availableBalance}
        onClose={() => setAddFundsOpen(false)}
        onDeposit={handleDeposit}
      />
    </section>
  );
}

export default OrderProcessingContent;
