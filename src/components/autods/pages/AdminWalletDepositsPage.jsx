import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuCheck, LuLoader, LuWalletCards, LuX } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import {
  approveAdminWalletDeposit,
  getAdminWalletDepositScreenshot,
  getAdminWalletDeposits,
  rejectAdminWalletDeposit,
} from "../../../services/AdminService";
import AuthenticatedImage from "../AuthenticatedImage";
import ConfirmModal from "../ConfirmModal";
import QuickEditModal from "../QuickEditModal";

function formatMoney(value, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(Number(value ?? 0));
  } catch {
    return `$${Number(value ?? 0).toFixed(2)}`;
  }
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "completed", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function AdminWalletDepositsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [deposits, setDeposits] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadDeposits = useCallback(() => {
    setLoading(true);
    getAdminWalletDeposits({ page, per_page: 20, status })
      .then((res) => {
        setDeposits(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load wire transfer deposits."))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => {
    if (role === "super_admin") {
      loadDeposits();
    }
  }, [role, loadDeposits]);

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const res = await approveAdminWalletDeposit(approveTarget.id);
      toast.success(res.data?.message ?? "Deposit approved.");
      setApproveTarget(null);
      loadDeposits();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to approve deposit.");
    } finally {
      setApproving(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const res = await rejectAdminWalletDeposit(rejectTarget.id, rejectReason.trim() || undefined);
      toast.success(res.data?.message ?? "Deposit rejected.");
      setRejectTarget(null);
      setRejectReason("");
      loadDeposits();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to reject deposit.");
    } finally {
      setRejecting(false);
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <section className="admin-page admin-clients-page">
      <header className="admin-page__hero admin-page__hero--split">
        <div>
          <span className="admin-page__eyebrow"><LuWalletCards /> Wire Transfer Deposits</span>
          <h1>Wire Transfer Deposits</h1>
          <p>Review payment screenshots and approve or reject wallet top-up requests.</p>
        </div>
      </header>

      <div className="admin-clients-page__toolbar card-wrapper admin-filters-bar">
        <label className="admin-filters-bar__field">
          <span>Status</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <span className="admin-clients-page__count" style={{ marginLeft: "auto" }}>{meta.total} deposits</span>
      </div>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading deposits…</span>
        </div>
      ) : deposits.length ? (
        <div className="admin-wallet-deposits__grid">
          {deposits.map((deposit) => (
            <article className="admin-wallet-deposits__card card-wrapper" key={deposit.id}>
              <div className="admin-wallet-deposits__screenshot">
                <AuthenticatedImage
                  fetcher={() => getAdminWalletDepositScreenshot(deposit.id)}
                  alt="Payment screenshot"
                  className="admin-wallet-deposits__screenshot-img"
                />
              </div>

              <div className="admin-wallet-deposits__body">
                <div className="admin-clients-page__identity">
                  <strong>{deposit.user?.name ?? "—"}</strong>
                  <span>{deposit.user?.email ?? "—"}</span>
                </div>

                <div className="admin-wallet-deposits__amount">{formatMoney(deposit.amount, deposit.currency)}</div>

                {deposit.metadata?.note ? (
                  <p className="admin-wallet-deposits__note">&ldquo;{deposit.metadata.note}&rdquo;</p>
                ) : null}

                <span className="admin-wallet-deposits__date">Submitted {formatDateTime(deposit.created_at)}</span>

                <span className={`admin-badge ${
                  deposit.status === "completed" ? "admin-badge--success"
                    : deposit.status === "rejected" ? "admin-badge--danger"
                      : "admin-badge--muted"
                }`}>
                  {deposit.status === "completed" ? "Approved" : deposit.status === "rejected" ? "Rejected" : "Pending"}
                </span>

                {deposit.metadata?.rejection_reason ? (
                  <p className="admin-wallet-deposits__note">Reason: {deposit.metadata.rejection_reason}</p>
                ) : null}

                {deposit.status === "pending" ? (
                  <div className="admin-wallet-deposits__actions">
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--primary"
                      onClick={() => setApproveTarget(deposit)}
                    >
                      <LuCheck />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--ghost"
                      onClick={() => { setRejectTarget(deposit); setRejectReason(""); }}
                    >
                      <LuX />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-page__loading card-wrapper">
          <span>No deposits found.</span>
        </div>
      )}

      {meta.last_page > 1 ? (
        <div className="admin-page__pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(approveTarget)}
        title="Approve this deposit?"
        description={approveTarget ? `${formatMoney(approveTarget.amount, approveTarget.currency)} will be credited to ${approveTarget.user?.name ?? "this user"}'s wallet immediately.` : ""}
        confirmLabel="Approve & Credit Wallet"
        danger={false}
        saving={approving}
        onConfirm={confirmApprove}
        onClose={() => setApproveTarget(null)}
      />

      <QuickEditModal
        open={Boolean(rejectTarget)}
        title="Reject this deposit"
        description="Optionally explain why — this is stored for your own records."
        label="Reason (optional)"
        value={rejectReason}
        onChange={setRejectReason}
        onSave={confirmReject}
        onClose={() => setRejectTarget(null)}
        saving={rejecting}
        placeholder="e.g. Screenshot doesn't match the requested amount"
      />
    </section>
  );
}

export default AdminWalletDepositsPage;
