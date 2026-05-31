import { useEffect, useMemo, useState } from "react";
import {
  LuArrowDownLeft,
  LuArrowDownToLine,
  LuBadgeCheck,
  LuChevronDown,
  LuCircleHelp,
  LuClock3,
  LuCreditCard,
  LuPlus,
  LuSparkles,
  LuTrendingDown,
  LuWalletCards,
  LuX,
  LuZap,
} from "react-icons/lu";
import {
  orderProcessingBalanceDefaults,
  orderProcessingFundAmounts,
  orderProcessingPaymentMethods,
} from "../constants";

const balanceMetrics = [
  { key: "deposits", label: "Deposits", icon: LuArrowDownLeft, tone: "emerald", hint: "Total funds loaded" },
  { key: "spend", label: "Spend", icon: LuTrendingDown, tone: "rose", hint: "Used on fulfillment" },
  { key: "pending", label: "Pending", icon: LuClock3, tone: "amber", hint: "Awaiting clearance" },
];

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function FeeTooltip({ text }) {
  return (
    <span className="order-processing-tooltip">
      <button type="button" className="order-processing-tooltip__trigger" aria-label="View processing fee details">
        <LuCircleHelp />
      </button>
      <span className="order-processing-tooltip__content" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function AddFundsModal({ isOpen, currentBalance, onClose, onConfirm }) {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(orderProcessingPaymentMethods[0]?.id ?? "");
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentLabel, setNewPaymentLabel] = useState("");

  const selectedPayment = orderProcessingPaymentMethods.find((method) => method.id === paymentMethodId);

  const resolvedAmount = useMemo(() => {
    if (useCustomAmount) {
      const parsed = Number.parseFloat(customAmount);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    return selectedAmount;
  }, [customAmount, selectedAmount, useCustomAmount]);

  const feeRate = paymentMethodId === "paypal" ? 0.029 : 0.05;
  const flatFee = paymentMethodId === "paypal" && resolvedAmount > 0 ? 0.3 : 0;
  const processingFee = resolvedAmount > 0 ? resolvedAmount * feeRate + flatFee : 0;
  const totalCharge = resolvedAmount + processingFee;

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
            <p>Instantly top up your wallet and keep orders moving without delays.</p>
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
                min="1"
                step="0.01"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <div className="order-processing-funds-modal__section">
          <div className="order-processing-funds-modal__section-head">
            <span className="order-processing-funds-modal__step">2</span>
            <label className="order-processing-funds-modal__label">Select payment method</label>
            {selectedPayment ? <FeeTooltip text={selectedPayment.feeNote} /> : null}
          </div>

          <div className="order-processing-funds-modal__payment-picker">
            <button
              type="button"
              className="order-processing-funds-modal__payment-select"
              aria-expanded={paymentMenuOpen}
              onClick={() => setPaymentMenuOpen((current) => !current)}
            >
              <span className="order-processing-funds-modal__payment-icon">
                <LuWalletCards />
              </span>
              <span>
                {selectedPayment?.label}
                {selectedPayment?.last4 ? ` •••• ${selectedPayment.last4}` : ""}
              </span>
              <LuChevronDown className={paymentMenuOpen ? "order-processing-funds-modal__chevron--open" : ""} />
            </button>

            {paymentMenuOpen ? (
              <div className="order-processing-funds-modal__payment-menu">
                {orderProcessingPaymentMethods.map((method) => (
                  <button
                    type="button"
                    key={method.id}
                    className={
                      method.id === paymentMethodId
                        ? "order-processing-funds-modal__payment-option order-processing-funds-modal__payment-option--active"
                        : "order-processing-funds-modal__payment-option"
                    }
                    onClick={() => {
                      setPaymentMethodId(method.id);
                      setPaymentMenuOpen(false);
                    }}
                  >
                    <LuCreditCard />
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="order-processing-funds-modal__add-payment"
            onClick={() => setShowAddPayment((current) => !current)}
          >
            <LuPlus />
            <span>{showAddPayment ? "Hide add payment method" : "Add payment method"}</span>
          </button>

          {showAddPayment ? (
            <div className="order-processing-funds-modal__add-payment-form">
              <input
                type="text"
                placeholder="Payment method name (e.g. Business Visa)"
                value={newPaymentLabel}
                onChange={(event) => setNewPaymentLabel(event.target.value)}
              />
              <button
                type="button"
                className="order-processing-funds-modal__save-payment"
                onClick={() => {
                  setNewPaymentLabel("");
                  setShowAddPayment(false);
                }}
              >
                Save payment method
              </button>
            </div>
          ) : null}
        </div>

        <div className="order-processing-funds-modal__summary">
          <div className="order-processing-funds-modal__summary-row">
            <span>Deposit amount</span>
            <strong>{formatUsd(resolvedAmount)}</strong>
          </div>
          <div className="order-processing-funds-modal__summary-row">
            <span>Processing fee</span>
            <strong>{formatUsd(processingFee)}</strong>
          </div>
          <div className="order-processing-funds-modal__summary-row order-processing-funds-modal__summary-row--total">
            <span>Total charge</span>
            <strong>{formatUsd(totalCharge)}</strong>
          </div>
        </div>

        <div className="order-processing-funds-modal__footer">
          <button type="button" className="order-processing-funds-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="order-processing-funds-modal__confirm"
            disabled={resolvedAmount <= 0}
            onClick={() => onConfirm({ amount: resolvedAmount, paymentMethodId, totalCharge })}
          >
            <LuZap />
            <span>Add {resolvedAmount > 0 ? formatUsd(resolvedAmount) : "funds"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function OrderProcessingContent() {
  const [balances, setBalances] = useState(orderProcessingBalanceDefaults);
  const [activeMetric, setActiveMetric] = useState("deposits");
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const availableBalance = balances.deposits - balances.spend;
  const activeMetricConfig = balanceMetrics.find((metric) => metric.key === activeMetric) ?? balanceMetrics[0];

  const handleAddFunds = ({ amount, paymentMethodId, totalCharge }) => {
    setBalances((current) => ({
      ...current,
      deposits: current.deposits + amount,
      pending: current.pending + amount * 0.05,
    }));
    setAddFundsOpen(false);
    setNotice(
      `${formatUsd(amount)} added via ${orderProcessingPaymentMethods.find((m) => m.id === paymentMethodId)?.label ?? "payment method"} (charged ${formatUsd(totalCharge)}).`,
    );
  };

  return (
    <section className="order-processing-page">
      {notice ? (
        <div className="order-processing-notice">
          <span className="order-processing-notice__icon">
            <LuBadgeCheck />
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
              <em>Updated in real time</em>
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
                  <small>Load balance instantly</small>
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
                        <strong className="order-processing-metric__value">{formatUsd(balances[metric.key])}</strong>
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
                  {activeMetricConfig.label}: {formatUsd(balances[activeMetricConfig.key])}
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
        onConfirm={handleAddFunds}
      />
    </section>
  );
}

export default OrderProcessingContent;
