import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LuHeadphones, LuLoader, LuSearch, LuSend, LuX } from "react-icons/lu";
import { selectUserRole } from "../../../store/selectors/AuthSelectors";
import { toast } from "../../../utils/toast";
import {
  getAdminSupportTicket,
  getAdminSupportTickets,
  replyAdminSupportTicket,
  updateAdminSupportTicketStatus,
} from "../../../services/AdminService";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusLabels = {
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

const statusFilters = ["All", "open", "answered", "closed"];

function AdminSupportTicketsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (role !== "super_admin") {
      navigate("/");
    }
  }, [role, navigate]);

  const loadTickets = useCallback(() => {
    setLoading(true);
    getAdminSupportTickets({
      page,
      per_page: 15,
      q: search.trim() || undefined,
      status: statusFilter,
    })
      .then((res) => {
        setTickets(res.data?.data ?? []);
        setMeta({
          current_page: res.data?.current_page ?? 1,
          last_page: res.data?.last_page ?? 1,
          total: res.data?.total ?? 0,
        });
      })
      .catch(() => toast.error("Failed to load support tickets."))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (role === "super_admin") {
      loadTickets();
    }
  }, [role, loadTickets]);

  const openTicket = (id) => {
    setLoadingThread(true);
    setActiveTicket({ id });
    setAnswer("");
    getAdminSupportTicket(id)
      .then((res) => setActiveTicket(res.data?.ticket))
      .catch(() => {
        toast.error("Failed to load ticket.");
        setActiveTicket(null);
      })
      .finally(() => setLoadingThread(false));
  };

  const sendAnswer = async () => {
    if (!activeTicket?.id || !answer.trim()) return;

    setSending(true);
    try {
      const res = await replyAdminSupportTicket(activeTicket.id, answer.trim());
      setActiveTicket(res.data?.ticket ?? activeTicket);
      setAnswer("");
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to send answer.");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status) => {
    if (!activeTicket?.id) return;

    setUpdatingStatus(true);
    try {
      const res = await updateAdminSupportTicketStatus(activeTicket.id, status);
      setActiveTicket(res.data?.ticket ?? activeTicket);
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update ticket.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  return (
    <section className="admin-page admin-support-page">
      <header className="admin-page__hero">
        <div>
          <span className="admin-page__eyebrow"><LuHeadphones /> Customer Support</span>
          <h1>Support Tickets</h1>
          <p>Answer support requests submitted by your clients.</p>
        </div>
      </header>

      <div className="admin-clients-page__toolbar card-wrapper">
        <label className="admin-clients-page__search">
          <LuSearch />
          <input
            type="search"
            className="marketplace-settings__control"
            placeholder="Search by subject, name or email..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </label>

        <div className="support-status-filter">
          {statusFilters.map((status) => (
            <button
              type="button"
              key={status}
              className={`support-status-filter__btn ${statusFilter === status ? "support-status-filter__btn--active" : ""}`}
              onClick={() => { setStatusFilter(status); setPage(1); }}
            >
              {status === "All" ? "All" : statusLabels[status]}
            </button>
          ))}
        </div>

        <span className="admin-clients-page__count">{meta.total} tickets</span>
      </div>

      {loading ? (
        <div className="admin-page__loading card-wrapper">
          <LuLoader className="spin-icon" />
          <span>Loading tickets…</span>
        </div>
      ) : (
        <div className="admin-clients-page__table card-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Subject</th>
                <th>Last message</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length ? tickets.map((ticket) => (
                <tr key={ticket.id} className="admin-table__row-clickable" onClick={() => openTicket(ticket.id)}>
                  <td>
                    <div className="admin-clients-page__identity">
                      <strong>{ticket.user?.name ?? "—"}</strong>
                      <span>{ticket.user?.email ?? "—"}</span>
                    </div>
                  </td>
                  <td>{ticket.subject}</td>
                  <td className="support-tickets-list__subject">
                    <span>{ticket.last_message}</span>
                  </td>
                  <td>
                    <span className={`support-status-badge support-status-badge--${ticket.status}`}>
                      {statusLabels[ticket.status] ?? ticket.status}
                    </span>
                  </td>
                  <td>{formatDateTime(ticket.last_message_at)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="admin-table__empty">No support tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 ? (
        <div className="admin-page__pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      ) : null}

      {activeTicket ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setActiveTicket(null)} />
          <div className="orders-modal__card admin-modal support-ticket-modal">
            <button type="button" className="balance-modal__close" aria-label="Close" onClick={() => setActiveTicket(null)}>
              <LuX />
            </button>

            <h3>{activeTicket.subject ?? "Ticket"}</h3>
            {activeTicket.user ? (
              <p className="support-ticket-modal__meta">
                {activeTicket.user.name} &middot; {activeTicket.user.email}
              </p>
            ) : null}

            {loadingThread ? (
              <div className="support-tickets-panel__empty">
                <LuLoader className="spin-icon" />
                <span>Loading conversation…</span>
              </div>
            ) : (
              <>
                <div className="support-ticket-thread">
                  <div className="support-ticket-thread__messages">
                    {(activeTicket.messages ?? []).map((msg) => (
                      <div key={msg.id} className={`support-ticket-message support-ticket-message--${msg.sender_type}`}>
                        <span className="support-ticket-message__sender">
                          {msg.sender_type === "admin" ? (msg.sender_name ?? "Support Team") : (activeTicket.user?.name ?? "Client")}
                        </span>
                        <p>{msg.message}</p>
                        <span className="support-ticket-message__time">{formatDateTime(msg.created_at)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="support-ticket-thread__reply">
                    <textarea
                      placeholder="Write your answer…"
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                    />
                    <button type="button" disabled={sending || !answer.trim()} onClick={sendAnswer}>
                      {sending ? <LuLoader className="spin-icon" /> : <LuSend />}
                      <span>Answer</span>
                    </button>
                  </div>
                </div>

                <div className="admin-modal__footer support-ticket-modal__status-actions">
                  <span>Status: {statusLabels[activeTicket.status] ?? activeTicket.status}</span>
                  {activeTicket.status !== "closed" ? (
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--ghost"
                      disabled={updatingStatus}
                      onClick={() => changeStatus("closed")}
                    >
                      Mark as Closed
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--ghost"
                      disabled={updatingStatus}
                      onClick={() => changeStatus("open")}
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminSupportTicketsPage;
