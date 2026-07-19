import { useEffect, useState } from "react";
import { LuLoader, LuUserPlus, LuX } from "react-icons/lu";

function parseEmails(value) {
  return [...new Set(
    String(value ?? "")
      .split(/[,;\n]+/)
      .map((email) => email.trim())
      .filter(Boolean),
  )];
}

function InviteSheetMembersModal({ open, saving = false, onClose, onInvite }) {
  const [emailsInput, setEmailsInput] = useState("");

  useEffect(() => {
    if (open) {
      setEmailsInput("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const emails = parseEmails(emailsInput);

  const handleSubmit = () => {
    if (!emails.length) {
      return;
    }

    onInvite(emails);
  };

  return (
    <div className="invite-sheet-modal-layer" role="presentation">
      <button
        type="button"
        className="invite-sheet-modal-layer__backdrop"
        aria-label="Close invite dialog"
        onClick={onClose}
      />

      <section className="invite-sheet-modal" role="dialog" aria-modal="true" aria-label="Invite team members">
        <button type="button" className="invite-sheet-modal__close" aria-label="Close" onClick={onClose}>
          <LuX />
        </button>

        <div className="invite-sheet-modal__head">
          <span className="invite-sheet-modal__icon" aria-hidden="true">
            <LuUserPlus />
          </span>
          <div>
            <h2>Invite Team Members</h2>
            <p>Send view-only access to your orders Google Sheet. Separate multiple emails with commas.</p>
          </div>
        </div>

        <label className="invite-sheet-modal__field">
          <span>Email addresses</span>
          <textarea
            rows={4}
            value={emailsInput}
            onChange={(event) => setEmailsInput(event.target.value)}
            placeholder="member@company.com, teammate@company.com"
            disabled={saving}
          />
        </label>

        <div className="invite-sheet-modal__actions">
          <button type="button" className="invite-sheet-modal__btn invite-sheet-modal__btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="invite-sheet-modal__btn invite-sheet-modal__btn--primary"
            onClick={handleSubmit}
            disabled={saving || !emails.length}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Inviting…</span>
              </>
            ) : (
              <span>Send Invites</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default InviteSheetMembersModal;
