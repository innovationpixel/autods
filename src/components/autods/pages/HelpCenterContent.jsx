import { useEffect, useState } from "react";
import {
  LuCheck,
  LuChevronRight,
  LuExternalLink,
  LuFilePenLine,
  LuHeadphones,
  LuInbox,
  LuLoader,
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

function TicketThread({ ticket, onReply, replying }) {
  const [message, setMessage] = useState("");

  const submitReply = async () => {
    if (!message.trim()) return;
    await onReply(message.trim());
    setMessage("");
  };

  return (
    <div className="support-ticket-thread">
      <div className="support-ticket-thread__messages">
        {(ticket.messages ?? []).map((msg) => (
          <div
            key={msg.id}
            className={`support-ticket-message support-ticket-message--${msg.sender_type}`}
          >
            <span className="support-ticket-message__sender">
              {msg.sender_type === "admin" ? "Support Team" : "You"}
            </span>
            <p>{msg.message}</p>
            <span className="support-ticket-message__time">{formatDateTime(msg.created_at)}</span>
          </div>
        ))}
      </div>

      {ticket.status !== "closed" ? (
        <div className="support-ticket-thread__reply">
          <textarea
            placeholder="Write a reply…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button type="button" disabled={replying || !message.trim()} onClick={submitReply}>
            {replying ? <LuLoader className="spin-icon" /> : <LuSend />}
            <span>Send</span>
          </button>
        </div>
      ) : (
        <p className="support-ticket-thread__closed-note">This ticket is closed.</p>
      )}
    </div>
  );
}

function HelpCenterContent() {
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replying, setReplying] = useState(false);

  const loadTickets = () => {
    setLoadingTickets(true);
    getSupportTickets()
      .then((res) => setTickets(res.data?.tickets ?? []))
      .catch(() => toast.error("Failed to load your support tickets."))
      .finally(() => setLoadingTickets(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

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
      toast.error("Add a subject and message.");
      return;
    }

    setSubmitting(true);
    try {
      await createSupportTicket({ subject: subject.trim(), message: message.trim() });
      toast.success("Support ticket submitted.");
      setNewTicketOpen(false);
      setSubject("");
      setMessage("");
      loadTickets();
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
      toast.error(err.response?.data?.error ?? "Failed to send reply.");
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
            <h2>Contact Support</h2>
            <p>Send a message to our support team and track replies here.</p>
          </div>
          <button type="button" className="button-base button-primary" onClick={() => setNewTicketOpen(true)}>
            <LuPlus />
            <span>New Ticket</span>
          </button>
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
                  <span className="support-tickets-list__subject">
                    <strong>{ticket.subject}</strong>
                    <span>{ticket.last_message}</span>
                  </span>
                  <span className={`support-status-badge support-status-badge--${ticket.status}`}>
                    {statusLabels[ticket.status] ?? ticket.status}
                  </span>
                  <span className="support-tickets-list__time">{formatDateTime(ticket.last_message_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="support-tickets-panel__empty">
            <LuInbox style={{ fontSize: 24 }} />
            <span>No support tickets yet. Click "New Ticket" if you need help.</span>
          </div>
        )}
      </section>

      <section className="help-center-mentorship">
        <div className="help-center-mentorship__visual" aria-hidden="true">
          <div className="help-center-mentorship__photo help-center-mentorship__photo--top" />
          <div className="help-center-mentorship__photo help-center-mentorship__photo--bottom" />
          <div className="help-center-mentorship__chat">
            <strong>AUTO-DS</strong>
            <span>Hey John, do you find the right products for you?</span>
            <em>Yes! You always helped me a lot!</em>
            <span>Great, we are here for you.</span>
          </div>
        </div>

        <div className="help-center-mentorship__copy">
          <h2>AutoDS` 1-on-1<br />Dropshipping Mentorships</h2>
          <p>Get personal help from expert dropshippers</p>
        </div>

        <button type="button" className="help-center-mentorship__cta">
          START NOW
        </button>
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
            <h3>New Support Ticket</h3>

            <label className="marketplace-settings__field">
              <span>Subject</span>
              <input
                className="marketplace-settings__control"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="What do you need help with?"
              />
            </label>

            <label className="marketplace-settings__field">
              <span>Message</span>
              <textarea
                className="marketplace-settings__control"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe your issue…"
              />
            </label>

            <div className="admin-modal__footer">
              <button type="button" className="admin-page__btn admin-page__btn--ghost" onClick={() => setNewTicketOpen(false)}>
                Cancel
              </button>
              <button type="button" className="admin-page__btn admin-page__btn--primary" disabled={submitting} onClick={submitNewTicket}>
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            <h3>{activeTicket.subject ?? "Ticket"}</h3>

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
