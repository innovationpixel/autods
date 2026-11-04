import { useEffect, useRef, useState } from "react";
import {
  LuCheck,
  LuChevronRight,
  LuExternalLink,
  LuFilePenLine,
  LuHeadphones,
  LuInbox,
  LuLoader,
  LuLock,
  LuMessageCircleMore,
  LuPlay,
  LuPlus,
  LuSend,
  LuX,
} from "react-icons/lu";
import { toast } from "../../../utils/toast";
import {
  createSupportTicket,
  getSupportTicket,
  getSupportTickets,
  replySupportTicket,
} from "../../../services/SupportTicketService";
import {
  TICKET_PRIORITIES,
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

function TicketThread({ ticket, onReply, replying }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const isClosed = ticket.status === "closed" || ticket.is_closed;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages?.length]);

  const submitReply = async () => {
    if (!message.trim() || replying || isClosed) return;
    const textToSend = message.trim();
    setMessage("");
    await onReply(textToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitReply();
    }
  };

  return (
    <div className="support-ticket-thread">
      <div className="support-ticket-chat-header">
        <div className="support-ticket-chat-badges">
          <TicketTypeBadge type={ticket.type} />
          <TicketPriorityBadge priority={ticket.priority} />
          <TicketStatusBadge status={ticket.status} />
        </div>
        {!isClosed ? (
          <span className="support-chat-live-pill">
            <span className="support-chat-pulse" /> Continuous Chat Active
          </span>
        ) : null}
      </div>

      <div className="support-ticket-thread__messages">
        {(ticket.messages ?? []).map((msg) => {
          const isAdmin = msg.sender_type === "admin";
          return (
            <div
              key={msg.id}
              className={`support-ticket-message ${isAdmin ? "support-ticket-message--admin" : ""}`}
            >
              <span className="support-ticket-message__sender">
                {isAdmin ? (msg.sender_name ?? "Support Team") : "You"}
              </span>
              <p>{msg.message}</p>
              <span className="support-ticket-message__time">{formatDateTime(msg.created_at)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!isClosed ? (
        <div className="support-ticket-thread__reply">
          <textarea
            placeholder="Type your message… (Press Enter to send, Shift+Enter for newline)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
              Continuous chat will remain open until super admin closes this ticket.
            </span>
            <button type="button" disabled={replying || !message.trim()} onClick={submitReply}>
              {replying ? <LuLoader className="spin-icon" /> : <LuSend />}
              <span>Send Message</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="support-ticket-closed-banner">
          <LuLock />
          <div>
            <strong>This ticket is closed</strong>
            <p>
              This ticket was marked as closed by super admin. Continuous chat is closed.
              If you have further questions, please create a new ticket.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpCenterContent() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  // New Ticket Form State
  const [ticketType, setTicketType] = useState("technical_support");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active Ticket & Polling
  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replying, setReplying] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const loadTickets = () => {
    setLoadingTickets(true);
    getSupportTickets({
      status: statusFilter !== "All" ? statusFilter : undefined,
      type: typeFilter !== "All" ? typeFilter : undefined,
    })
      .then((res) => setTickets(res.data?.tickets ?? []))
      .catch(() => toast.error("Failed to load your support tickets."))
      .finally(() => setLoadingTickets(false));
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, typeFilter]);

  // Live polling for continuous chat
  useEffect(() => {
    if (!activeTicket?.id) return;
    if (activeTicket.status === "closed" || activeTicket.is_closed) return;

    const intervalId = setInterval(() => {
      getSupportTicket(activeTicket.id)
        .then((res) => {
          if (res.data?.ticket) {
            setActiveTicket((prev) => {
              if (!prev || prev.id !== res.data.ticket.id) return prev;
              // If new messages arrived or status changed, update
              const prevCount = prev.messages?.length || 0;
              const newCount = res.data.ticket.messages?.length || 0;
              if (prevCount !== newCount || prev.status !== res.data.ticket.status) {
                return res.data.ticket;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 3500);

    return () => clearInterval(intervalId);
  }, [activeTicket?.id, activeTicket?.status, activeTicket?.is_closed]);

  const openTicket = (ticketId) => {
    setLoadingThread(true);
    setActiveTicket({ id: ticketId });
    getSupportTicket(ticketId)
      .then((res) => setActiveTicket(res.data?.ticket))
      .catch(() => {
        toast.error("Failed to load ticket.");
        setActiveTicket(null);
      })
      .finally(() => setLoadingThread(false));
  };

  const submitNewTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please add a subject and message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createSupportTicket({
        subject: subject.trim(),
        type: ticketType,
        priority: ticketPriority,
        message: message.trim(),
      });
      toast.success("Support ticket submitted.");
      setNewTicketOpen(false);
      setSubject("");
      setMessage("");
      setTicketType("technical_support");
      setTicketPriority("medium");
      loadTickets();
      if (res.data?.ticket) {
        openTicket(res.data.ticket.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (text) => {
    if (!activeTicket?.id) return;
    setReplying(true);
    try {
      const res = await replySupportTicket(activeTicket.id, text);
      setActiveTicket(res.data?.ticket ?? activeTicket);
      loadTickets();
    } catch (err) {
      const errMsg = err.response?.data?.error ?? "Failed to send reply.";
      toast.error(errMsg);
      if (err.response?.data?.ticket_closed) {
        setActiveTicket((prev) => (prev ? { ...prev, status: "closed", is_closed: true } : prev));
      }
    } finally {
      setReplying(false);
    }
  };

  const helpCards = [
    {
      title: "Help center",
      subtitle: "Technical information",
      icon: LuHeadphones,
      tone: "mint",
    },
    {
      title: "Feature Request",
      subtitle: "",
      icon: LuMessageCircleMore,
      tone: "aqua",
    },
    {
      title: "From our blog",
      subtitle: "",
      icon: LuFilePenLine,
      tone: "rose",
    },
  ];

  return (
    <section className="help-center-page">
      <div className="help-center__cards">
        {helpCards.map((card) => {
          const Icon = card.icon;

          return (
            <button type="button" className="help-center-card" key={card.title}>
              <span className={`help-center-card__icon help-center-card__icon--${card.tone}`}>
                <Icon />
              </span>
              <span className="help-center-card__copy">
                <strong>{card.title}</strong>
                {card.subtitle ? <span>{card.subtitle}</span> : null}
              </span>
              <LuChevronRight className="help-center-card__arrow" />
            </button>
          );
        })}
      </div>

      <section className="support-tickets-panel card-wrapper">
        <div className="support-tickets-panel__head">
          <div>
            <h2>Inbound Support Tickets</h2>
            <p>
              Open a ticket for Sales, Billing, or Technical Support. Chat continuously with our team until resolved.
            </p>
          </div>
          <button type="button" className="button-base button-primary" onClick={() => setNewTicketOpen(true)}>
            <LuPlus />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div className="support-status-filter" style={{ margin: 0 }}>
            {["All", "open", "answered", "closed"].map((st) => (
              <button
                type="button"
                key={st}
                className={`support-status-filter__btn ${statusFilter === st ? "support-status-filter__btn--active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === "All" ? "All Statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Type:</span>
            <select
              className="marketplace-settings__control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "6px 12px", fontSize: 13, height: "auto", minWidth: 140 }}
            >
              <option value="All">All Types</option>
              {TICKET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingTickets ? (
          <div className="support-tickets-panel__empty">
            <LuLoader className="spin-icon" />
            <span>Loading your tickets…</span>
          </div>
        ) : tickets.length ? (
          <ul className="support-tickets-list">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button type="button" className="support-tickets-list__row" onClick={() => openTicket(ticket.id)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 14, color: "#0f172a" }}>#{ticket.id} {ticket.subject}</strong>
                      <TicketTypeBadge type={ticket.type} />
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ticket.last_message || "No messages yet"}
                    </span>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                  <span className="support-tickets-list__time">{formatDateTime(ticket.last_message_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="support-tickets-panel__empty">
            <LuInbox style={{ fontSize: 24 }} />
            <span>No support tickets found. Click "New Ticket" if you need help with Sales, Billing, or Technical Support.</span>
          </div>
        )}
      </section>

      <div className="help-center-links">
        <button type="button">
          <LuPlay />
          <span>YouTube Channel</span>
        </button>
        <button type="button">
          <LuMessageCircleMore />
          <span>Facebook community</span>
        </button>
        <button type="button">
          <LuExternalLink />
          <span>Telegram group</span>
        </button>
        <button type="button">
          <LuCheck />
          <span>System status</span>
        </button>
      </div>

      {/* New Ticket Modal */}
      {newTicketOpen ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setNewTicketOpen(false)} />
          <div className="orders-modal__card admin-modal">
            <button
              type="button"
              className="balance-modal__close"
              aria-label="Close"
              onClick={() => setNewTicketOpen(false)}
            >
              <LuX />
            </button>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 700 }}>New Support Ticket</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <label className="marketplace-settings__field" style={{ margin: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Ticket Type</span>
                <select
                  className="marketplace-settings__control"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="marketplace-settings__field" style={{ margin: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Priority</span>
                <select
                  className="marketplace-settings__control"
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="marketplace-settings__field">
              <span style={{ fontSize: 13, fontWeight: 600 }}>Subject</span>
              <input
                className="marketplace-settings__control"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Brief summary of your inquiry or issue…"
              />
            </label>

            <label className="marketplace-settings__field">
              <span style={{ fontSize: 13, fontWeight: 600 }}>Message</span>
              <textarea
                className="marketplace-settings__control"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe what you need help with. You can chat continuously after creating…"
              />
            </label>

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setNewTicketOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-page__btn admin-page__btn--primary"
                disabled={submitting}
                onClick={submitNewTicket}
              >
                {submitting ? "Submitting…" : "Create & Start Chat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Active Ticket Chat Modal */}
      {activeTicket ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setActiveTicket(null)} />
          <div className="orders-modal__card admin-modal support-ticket-modal">
            <button
              type="button"
              className="balance-modal__close"
              aria-label="Close"
              onClick={() => setActiveTicket(null)}
            >
              <LuX />
            </button>
            <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
              #{activeTicket.id} {activeTicket.subject ?? "Support Ticket"}
            </h3>

            {loadingThread ? (
              <div className="support-tickets-panel__empty">
                <LuLoader className="spin-icon" />
                <span>Loading conversation…</span>
              </div>
            ) : (
              <TicketThread ticket={activeTicket} onReply={handleReply} replying={replying} />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default HelpCenterContent;
