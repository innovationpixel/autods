import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuCheck,
  LuCreditCard,
  LuHistory,
  LuLoader,
  LuPlus,
  LuSettings,
  LuShield,
  LuSparkles,
  LuWallet,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import { openPaymentCheckout } from "../../../utils/paymentCheckout";
import { loadBalanceAmounts } from "../constants";
import {
  confirmWalletDeposit,
  depositWalletPayPal,
  depositWalletStripe,
  getWalletSummary,
  getWalletTransactions,
} from "../../../services/WalletService";

function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function WalletContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [checkoutId, setCheckoutId] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(loadBalanceAmounts[1] ?? 50);
  const [customAmount, setCustomAmount] = useState("");

  const currency = summary?.currency ?? "USD";
  const depositAmount = useMemo(() => {
    const custom = parseFloat(customAmount);
    if (customAmount.trim() && !Number.isNaN(custom) && custom >= 5) {
      return custom;
    }
    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const loadWallet = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        getWalletSummary(),
        getWalletTransactions({ limit: 20 }),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data?.data ?? []);
      setMeta(txRes.data?.meta ?? {});
    } catch {
      toast.error("Failed to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const provider = searchParams.get("provider");
    const sessionId = searchParams.get("session_id");
    const paypalToken = searchParams.get("token");

    if (canceled) {
      toast.info("Deposit canceled.");
      setSearchParams({}, { replace: true });
      return;
    }

    if (success !== "1") {
      return;
    }

    const shouldConfirmStripe = provider === "stripe" && sessionId;
    const shouldConfirmPayPal = provider === "paypal" && paypalToken;

    if (!shouldConfirmStripe && !shouldConfirmPayPal) {
      return;
    }

    let cancelled = false;

    const confirm = async () => {
      setConfirming(true);
      try {
        if (shouldConfirmStripe) {
          await confirmWalletDeposit({ provider: "stripe", session_id: sessionId });
          toast.success("Wallet deposit completed!");
        } else if (shouldConfirmPayPal) {
          await confirmWalletDeposit({ provider: "paypal", order_id: paypalToken });
          toast.success("Wallet deposit completed!");
        }
        if (!cancelled) {
          await loadWallet();
        }
      } catch (err) {
        toast.error(err.response?.data?.error ?? "Failed to confirm deposit.");
      } finally {
        if (!cancelled) {
          setConfirming(false);
          setSearchParams({}, { replace: true });
        }
      }
    };

    confirm();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

  const handleDeposit = async (provider) => {
    if (depositAmount < 5 || depositAmount > 10000) {
      toast.warn("Enter an amount between $5 and $10,000.");
      return;
    }

    setCheckoutId(`${provider}-${depositAmount}`);
    try {
      const res = provider === "stripe"
        ? await depositWalletStripe(depositAmount)
        : await depositWalletPayPal(depositAmount);

      if (res.data?.url) {
        openPaymentCheckout(res.data.url);
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Checkout failed.");
    } finally {
      setCheckoutId(null);
    }
  };

  if (loading || confirming) {
    return (
      <section className="wallet-hub card-wrapper">
        <div className="wallet-hub__loading">
          <LuLoader className="spin-icon" />
          <span>{confirming ? "Confirming your deposit…" : "Loading wallet…"}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="wallet-hub card-wrapper">
      <header className="wallet-hub__hero">
        <div className="wallet-hub__hero-copy">
          <span className="wallet-hub__eyebrow"><LuSparkles /> AutoDS Wallet</span>
          <h1>Fund your account balance</h1>
          <p>
            Top up your wallet to pay for order processing, subscriptions, and add-ons
            without interrupting your workflow.
          </p>
        </div>
        <div className="wallet-hub__balance-card">
          <span className="wallet-hub__balance-label">Available balance</span>
          <strong>{formatMoney(summary?.balance ?? 0, currency)}</strong>
          <span className="wallet-hub__balance-meta">{currency} · Instant for deposits</span>
        </div>
      </header>

      <div className="wallet-hub__stats">
        <article className="wallet-hub__stat">
          <span className="wallet-hub__stat-icon wallet-hub__stat-icon--deposit"><LuArrowDownLeft /></span>
          <div>
            <span className="wallet-hub__stat-label">Total deposited</span>
            <strong>{formatMoney(summary?.total_deposited ?? 0, currency)}</strong>
          </div>
        </article>
        <article className="wallet-hub__stat">
          <span className="wallet-hub__stat-icon wallet-hub__stat-icon--spent"><LuArrowUpRight /></span>
          <div>
            <span className="wallet-hub__stat-label">Total spent</span>
            <strong>{formatMoney(summary?.total_spent ?? 0, currency)}</strong>
          </div>
        </article>
        <article className="wallet-hub__stat">
          <span className="wallet-hub__stat-icon wallet-hub__stat-icon--pending"><LuHistory /></span>
          <div>
            <span className="wallet-hub__stat-label">Pending deposits</span>
            <strong>{summary?.pending_deposits ?? 0}</strong>
          </div>
        </article>
      </div>

      <div className="wallet-hub__layout">
        <article className="wallet-hub__card wallet-hub__card--deposit">
          <div className="wallet-hub__card-head">
            <div className="wallet-hub__card-title">
              <span className="wallet-hub__card-icon"><LuPlus /></span>
              <div>
                <h2>Add funds</h2>
                <p>Select an amount and pay securely with Stripe or PayPal.</p>
              </div>
            </div>
          </div>

          <div className="wallet-hub__amount-grid">
            {loadBalanceAmounts.map((amount) => (
              <button
                type="button"
                key={amount}
                className={`wallet-hub__amount-chip ${selectedAmount === amount && !customAmount ? "wallet-hub__amount-chip--active" : ""}`}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
              >
                ${amount}
              </button>
            ))}
          </div>

          <label className="wallet-hub__custom-amount">
            <span>Custom amount</span>
            <div className="wallet-hub__custom-input">
              <span>$</span>
              <input
                type="number"
                min="5"
                max="10000"
                step="0.01"
                placeholder="Enter amount (min $5)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
          </label>

          <div className="wallet-hub__deposit-summary">
            <span>You will deposit</span>
            <strong>{formatMoney(depositAmount, currency)}</strong>
          </div>

          <div className="wallet-hub__checkout-actions">
            <button
              type="button"
              className="wallet-hub__btn wallet-hub__btn--primary"
              disabled={checkoutId === `stripe-${depositAmount}`}
              onClick={() => handleDeposit("stripe")}
            >
              {checkoutId === `stripe-${depositAmount}` ? (
                <LuLoader className="spin-icon" />
              ) : (
                <LuCreditCard />
              )}
              <span>{checkoutId === `stripe-${depositAmount}` ? "Redirecting…" : "Pay with Stripe"}</span>
            </button>
            <button
              type="button"
              className="wallet-hub__btn wallet-hub__btn--ghost"
              disabled={checkoutId === `paypal-${depositAmount}`}
              onClick={() => handleDeposit("paypal")}
            >
              {checkoutId === `paypal-${depositAmount}` ? (
                <LuLoader className="spin-icon" />
              ) : null}
              <span>{checkoutId === `paypal-${depositAmount}` ? "Redirecting…" : "Pay with PayPal"}</span>
              {!checkoutId || checkoutId !== `paypal-${depositAmount}` ? <LuArrowUpRight /> : null}
            </button>
          </div>

          <div className="wallet-hub__trust">
            <span><LuShield /> Secure checkout</span>
            <span><LuCheck /> Funds added after payment confirmation</span>
          </div>
        </article>

        <aside className="wallet-hub__sidebar">
          <article className="wallet-hub__card">
            <div className="wallet-hub__card-title">
              <span className="wallet-hub__card-icon wallet-hub__card-icon--info"><LuWallet /></span>
              <div>
                <h2>How it works</h2>
                <p>Use your wallet balance across AutoDS services.</p>
              </div>
            </div>
            <ul className="wallet-hub__tips">
              <li><LuCheck /> Deposit anytime with Stripe or PayPal</li>
              <li><LuCheck /> Balance updates after payment is confirmed</li>
              <li><LuCheck /> Use funds for orders, plans, and add-ons</li>
              <li><LuCheck /> Full transaction history below</li>
            </ul>
            <button
              type="button"
              className="wallet-hub__settings-link"
              onClick={() => navigate("/settings?tab=billing")}
            >
              <LuSettings />
              <span>Manage payment methods</span>
              <LuArrowUpRight />
            </button>
          </article>
        </aside>
      </div>

      <article className="wallet-hub__card wallet-hub__card--wide">
        <div className="wallet-hub__card-head wallet-hub__card-head--split">
          <div className="wallet-hub__card-title">
            <span className="wallet-hub__card-icon wallet-hub__card-icon--history"><LuHistory /></span>
            <div>
              <h2>Transaction history</h2>
              <p>Recent wallet activity and deposits.</p>
            </div>
          </div>
          {meta?.total != null ? (
            <span className="wallet-hub__pill">{meta.total} total</span>
          ) : null}
        </div>

        {transactions.length ? (
          <div className="wallet-hub__history">
            <div className="wallet-hub__history-head">
              <span>Date</span>
              <span>Description</span>
              <span>Type</span>
              <span>Status</span>
              <span>Amount</span>
              <span>Balance</span>
            </div>
            {transactions.map((tx) => (
              <div className="wallet-hub__history-row" key={tx.id}>
                <span data-label="Date">{formatDateTime(tx.created_at)}</span>
                <span data-label="Description">
                  <strong>{tx.description ?? "Wallet transaction"}</strong>
                  <small>{tx.provider_reference ?? `#${tx.id}`}</small>
                </span>
                <span data-label="Type" className="wallet-hub__type">{tx.type}</span>
                <span data-label="Status">
                  <span className={`wallet-hub__status wallet-hub__status--${(tx.status ?? "completed").toLowerCase()}`}>
                    {tx.status ?? "completed"}
                  </span>
                </span>
                <span data-label="Amount" className={`wallet-hub__amount ${tx.type === "deposit" ? "wallet-hub__amount--credit" : ""}`}>
                  {tx.type === "deposit" ? "+" : "−"}{formatMoney(tx.amount, tx.currency ?? currency)}
                </span>
                <span data-label="Balance">{formatMoney(tx.balance_after, tx.currency ?? currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="wallet-hub__empty">
            <LuWallet />
            <strong>No transactions yet</strong>
            <span>Make your first deposit to start using your wallet balance.</span>
          </div>
        )}
      </article>
    </section>
  );
}

export default WalletContent;
