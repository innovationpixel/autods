import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LuCheck,
  LuHeadphones,
  LuLoader,
  LuLock,
  LuLockOpen,
  LuSearch,
  LuSend,
  LuX,
} from "react-icons/lu";
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
import {
  TICKET_PRIORITIES,
  TICKET_STATUS_LABELS,
  TICKET_TYPES,
  TicketPriorityBadge,
  TicketStatusBadge,
  TicketTypeBadge,
} from "./supportTicketConstants";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusFilters = ["All", "open", "answered", "closed"];

function AdminSupportTicketsPage() {
  const role = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [loading, setLoading] = useState(true);

  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [sortDirection, setSortDirection] = useState("desc");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTicket?.messages?.length) {
      scrollToBottom();
    }
  }, [activeTicket?.messages?.length]);

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
      } else if (sortBy === "type") {
        aVal = left.type ?? "";
        bVal = right.type ?? "";
      } else if (sortBy === "priority") {
        aVal = left.priority ?? "";
        bVal = right.priority ?? "";
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
      status: statusFilter !== "All" ? statusFilter : undefined,
      type: typeFilter !== "All" ? typeFilter : undefined,
      priority: priorityFilter !== "All" ? priorityFilter : undefined,
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
  }, [page, perPage, search, statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    if (role === "super_admin") {
      loadTickets();
    }
  }, [role, loadTickets]);

  // Live polling while a ticket conversation is open
  useEffect(() => {
    if (!activeTicket?.id) return;

    const intervalId = setInterval(() => {
      getAdminSupportTicket(activeTicket.id)
        .then((res) => {
          if (res.data?.ticket) {
            setActiveTicket((prev) => {
              if (!prev || prev.id !== res.data.ticket.id) return prev;
              const prevLen = prev.messages?.length || 0;
              const newLen = res.data.ticket.messages?.length || 0;
              if (prevLen !== newLen || prev.status !== res.data.ticket.status) {
                return res.data.ticket;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(intervalId);
  }, [activeTicket?.id]);

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
    if (!activeTicket?.id || !answer.trim() || sending) return;

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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  const changeStatus = async (status) => {
    if (!activeTicket?.id) return;

    setUpdatingStatus(true);
    try {
      const res = await updateAdminSupportTicketStatus(activeTicket.id, { status });
      setActiveTicket(res.data?.ticket ?? activeTicket);
      loadTickets();
      toast.success(status === "closed" ? "Ticket marked as closed." : "Ticket reopened.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update ticket.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const changePriority = async (priority) => {
    if (!activeTicket?.id) return;

    setUpdatingStatus(true);
    try {
      const res = await updateAdminSupportTicketStatus(activeTicket.id, { priority });
      setActiveTicket(res.data?.ticket ?? activeTicket);
      loadTickets();
      toast.success("Priority updated.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update priority.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const changeType = async (type) => {
    if (!activeTicket?.id) return;

    setUpdatingStatus(true);
    try {
      const res = await updateAdminSupportTicketStatus(activeTicket.id, { type });
      setActiveTicket(res.data?.ticket ?? activeTicket);
      loadTickets();
      toast.success("Ticket type updated.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to update type.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (role !== "super_admin") {
    return null;
  }

  const isClosed = activeTicket?.status === "closed" || activeTicket?.is_closed;

  return (
    <section className="admin-page admin-support-page">
      <header className="admin-page__hero">
        <div>
          <span className="admin-page__eyebrow"><LuHeadphones /> Helpdesk &amp; Support</span>
          <h1>Inbound Support Tickets</h1>
          <p>Manage customer tickets for Sales, Billing, and Technical Support with continuous messaging.</p>
        </div>
      </header>

      {/* Toolbar & Filters */}
      <div className="admin-clients-page__toolbar card-wrapper" style={{ flexWrap: "wrap", gap: 12 }}>
        <label className="admin-clients-page__search" style={{ minWidth: 260 }}>
          <LuSearch />
          <input
            type="search"
            className="marketplace-settings__control"
            placeholder="Search by subject, name or email..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </label>

        {/* Status Pills */}
        <div className="support-status-filter" style={{ margin: 0 }}>
          {statusFilters.map((status) => (
            <button
              type="button"
              key={status}
              className={`support-status-filter__btn ${statusFilter === status ? "support-status-filter__btn--active" : ""}`}
              onClick={() => { setStatusFilter(status); setPage(1); }}
            >
              {status === "All" ? "All Statuses" : TICKET_STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>

        {/* Type Dropdown */}
        <select
          className="marketplace-settings__control"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ width: "auto", minWidth: 140, padding: "6px 12px", fontSize: 13, height: "auto" }}
        >
          <option value="All">All Types</option>
          {TICKET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Priority Dropdown */}
        <select
          className="marketplace-settings__control"
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          style={{ width: "auto", minWidth: 130, padding: "6px 12px", fontSize: 13, height: "auto" }}
        >
          <option value="All">All Priorities</option>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <span className="admin-clients-page__count" style={{ marginLeft: "auto" }}>
          {meta.total} tickets
        </span>
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
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("type")}>
                  <GridSortHeader columnId="type" label="Type" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("priority")}>
                  <GridSortHeader columnId="priority" label="Priority" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
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
                  <td>
                    <strong style={{ color: "#0f172a" }}>#{ticket.id}</strong> {ticket.subject}
                  </td>
                  <td>
                    <TicketTypeBadge type={ticket.type} />
                  </td>
                  <td>
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="support-tickets-list__subject">
                    <span>{ticket.last_message || "No messages"}</span>
                  </td>
                  <td>
                    <TicketStatusBadge status={ticket.status} />
                  </td>
                  <td>{formatDateTime(ticket.last_message_at)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="admin-table__empty">No inbound support tickets found.</td>
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

      {/* Ticket Conversation & Chat Modal */}
      {activeTicket ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setActiveTicket(null)} />
          <div className="orders-modal__card admin-modal support-ticket-modal" style={{ maxWidth: 680 }}>
            <button type="button" className="balance-modal__close" aria-label="Close" onClick={() => setActiveTicket(null)}>
              <LuX />
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
                  #{activeTicket.id} {activeTicket.subject ?? "Support Ticket"}
                </h3>
                {activeTicket.user ? (
                  <p className="support-ticket-modal__meta" style={{ margin: 0 }}>
                    {activeTicket.user.name} &middot; {activeTicket.user.email}
                  </p>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <TicketStatusBadge status={activeTicket.status} />
                {!isClosed ? (
                  <span className="support-chat-live-pill">
                    <span className="support-chat-pulse" /> Live Chat
                  </span>
                ) : null}
              </div>
            </div>

            {/* Reclassification & Priority Controls */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 12.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Type:</span>
                <select
                  disabled={updatingStatus}
                  value={activeTicket.type || "technical_support"}
                  onChange={(e) => changeType(e.target.value)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#64748b", fontWeight: 600 }}>Priority:</span>
                <select
                  disabled={updatingStatus}
                  value={activeTicket.priority || "medium"}
                  onChange={(e) => changePriority(e.target.value)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {activeTicket.closed_at ? (
                <span style={{ marginLeft: "auto", color: "#dc2626", fontSize: 11.5, fontWeight: 600 }}>
                  Closed {formatDateTime(activeTicket.closed_at)}
                </span>
              ) : null}
            </div>

            {loadingThread ? (
              <div className="support-tickets-panel__empty">
                <LuLoader className="spin-icon" />
                <span>Loading conversation…</span>
              </div>
            ) : (
              <>
                <div className="support-ticket-thread">
                  <div className="support-ticket-thread__messages" style={{ maxHeight: 320 }}>
                    {(activeTicket.messages ?? []).map((msg) => {
                      const isAdmin = msg.sender_type === "admin";
                      return (
                        <div
                          key={msg.id}
                          className={`support-ticket-message ${isAdmin ? "support-ticket-message--admin" : ""}`}
                        >
                          <span className="support-ticket-message__sender">
                            {isAdmin ? (msg.sender_name ?? "Support Team (Admin)") : (activeTicket.user?.name ?? "Client")}
                          </span>
                          <p>{msg.message}</p>
                          <span className="support-ticket-message__time">{formatDateTime(msg.created_at)}</span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Input Box */}
                  <div className="support-ticket-thread__reply">
                    <textarea
                      placeholder={isClosed ? "Ticket is closed. Reply will reopen the ticket…" : "Write your answer… (Press Enter to send, Shift+Enter for newline)"}
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={3}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                        Continuous chat is open until you close it.
                      </span>
                      <button type="button" disabled={sending || !answer.trim()} onClick={sendAnswer}>
                        {sending ? <LuLoader className="spin-icon" /> : <LuSend />}
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Super Admin Close / Reopen */}
                <div
                  className="admin-modal__footer support-ticket-modal__status-actions"
                  style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                      Status: {TICKET_STATUS_LABELS[activeTicket.status] ?? activeTicket.status}
                    </span>
                  </div>

                  {!isClosed ? (
                    <button
                      type="button"
                      className="admin-page__btn"
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#dc2626",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 700,
                      }}
                      disabled={updatingStatus}
                      onClick={() => changeStatus("closed")}
                    >
                      <LuLock />
                      <span>Close Ticket</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-page__btn admin-page__btn--primary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 700,
                      }}
                      disabled={updatingStatus}
                      onClick={() => changeStatus("open")}
                    >
                      <LuLockOpen />
                      <span>Reopen Ticket</span>
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
