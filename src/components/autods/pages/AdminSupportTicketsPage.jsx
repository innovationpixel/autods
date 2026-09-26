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
import { compareGridValues } from "../helpers";
import GridSortHeader from "../GridSortHeader";
import AdminPagination from "../AdminPagination";

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
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);

  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [sortDirection, setSortDirection] = useState("desc");

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      const isDescDefault = ["updated"].includes(columnId);
      setSortDirection(isDescDefault ? "desc" : "asc");
    }
  };

  const sortedTickets = useMemo(() => {
    const list = [...tickets];
    list.sort((left, right) => {
      let aVal = left[sortBy];
      let bVal = right[sortBy];

      if (sortBy === "client") {
        aVal = left.user?.name ?? "";
        bVal = right.user?.name ?? "";
      } else if (sortBy === "subject") {
        aVal = left.subject;
        bVal = right.subject;
      } else if (sortBy === "last_message") {
        aVal = left.last_message;
        bVal = right.last_message;
      } else if (sortBy === "status") {
        aVal = left.status;
        bVal = right.status;
      } else if (sortBy === "updated") {
        aVal = left.updated_at ? new Date(left.updated_at).getTime() : 0;
        bVal = right.updated_at ? new Date(right.updated_at).getTime() : 0;
      }

      return compareGridValues(aVal, bVal, sortDirection);
    });
    return list;
  }, [tickets, sortBy, sortDirection]);
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
      per_page: perPage,
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
  }, [page, perPage, search, statusFilter]);

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
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("client")}>
                  <GridSortHeader columnId="client" label="Client" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("subject")}>
                  <GridSortHeader columnId="subject" label="Subject" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("last_message")}>
                  <GridSortHeader columnId="last_message" label="Last message" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
                  <GridSortHeader columnId="status" label="Status" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("updated")}>
                  <GridSortHeader columnId="updated" label="Updated" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTickets.length ? sortedTickets.map((ticket) => (
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

      <AdminPagination
        currentPage={meta.current_page || page}
        lastPage={meta.last_page || 1}
        total={meta.total}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        entityName="tickets"
      />

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
