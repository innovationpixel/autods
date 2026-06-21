import { useEffect, useMemo, useState } from "react";
import { LuCalendar, LuClock3, LuLoader, LuX } from "react-icons/lu";
import { getListingImageUrl } from "./helpers";

function pad(value) {
  return String(value).padStart(2, "0");
}

function defaultScheduleValues(existingAt) {
  const base = existingAt ? new Date(existingAt) : new Date(Date.now() + 60 * 60 * 1000);
  if (!existingAt && base.getMinutes() > 0) {
    base.setHours(base.getHours() + 1, 0, 0, 0);
  }

  return {
    date: `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`,
    time: `${pad(base.getHours())}:${pad(base.getMinutes())}`,
  };
}

function buildScheduledIso(date, time) {
  const local = new Date(`${date}T${time}:00`);
  if (Number.isNaN(local.getTime())) {
    return null;
  }
  return local.toISOString();
}

function formatScheduledPreview(date, time) {
  const iso = buildScheduledIso(date, time);
  if (!iso) {
    return "";
  }

  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScheduleListingModal({
  open,
  drafts = [],
  saving = false,
  onClose,
  onSchedule,
  onClearSchedule,
}) {
  const existingSchedule = drafts.find((draft) => draft.scheduled_at)?.scheduled_at ?? null;
  const [{ date, time }, setSchedule] = useState(() => defaultScheduleValues(existingSchedule));

  useEffect(() => {
    if (open) {
      setSchedule(defaultScheduleValues(existingSchedule));
    }
  }, [open, existingSchedule]);

  const preview = useMemo(() => formatScheduledPreview(date, time), [date, time]);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const minDate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, [open]);

  if (!open) {
    return null;
  }

  const count = drafts.length;
  const title = count === 1 ? "Schedule Listing" : `Schedule ${count} Listings`;

  const handleSubmit = () => {
    const iso = buildScheduledIso(date, time);
    if (!iso) {
      return;
    }

    if (new Date(iso).getTime() <= Date.now()) {
      return;
    }

    onSchedule(iso);
  };

  const isPast = (() => {
    const iso = buildScheduledIso(date, time);
    return !iso || new Date(iso).getTime() <= Date.now();
  })();

  return (
    <div className="schedule-modal-layer" role="presentation">
      <button
        type="button"
        className="schedule-modal-layer__backdrop"
        aria-label="Close schedule dialog"
        onClick={onClose}
      />

      <section className="schedule-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button type="button" className="schedule-modal__close" aria-label="Close" onClick={onClose}>
          <LuX />
        </button>

        <div className="schedule-modal__head">
          <span className="schedule-modal__icon" aria-hidden="true">
            <LuClock3 />
          </span>
          <div>
            <h2>{title}</h2>
            <p>
              Choose when to publish {count === 1 ? "this draft" : "these drafts"} to your store.
              Listings publish automatically at the scheduled time.
            </p>
          </div>
        </div>

        {drafts.length ? (
          <div className="schedule-modal__drafts">
            {drafts.slice(0, 4).map((draft) => {
              const image = getListingImageUrl(draft);
              return (
                <div className="schedule-modal__draft" key={draft.id}>
                  {image ? <img src={image} alt="" /> : <span className="schedule-modal__draft-fallback" />}
                  <span>{draft.title}</span>
                </div>
              );
            })}
            {drafts.length > 4 ? (
              <div className="schedule-modal__draft schedule-modal__draft--more">
                +{drafts.length - 4} more
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="schedule-modal__fields">
          <label className="schedule-modal__field">
            <span>Date</span>
            <div className="schedule-modal__input-wrap">
              <LuCalendar aria-hidden="true" />
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(event) => setSchedule((current) => ({ ...current, date: event.target.value }))}
              />
            </div>
          </label>

          <label className="schedule-modal__field">
            <span>Time</span>
            <div className="schedule-modal__input-wrap">
              <LuClock3 aria-hidden="true" />
              <input
                type="time"
                value={time}
                onChange={(event) => setSchedule((current) => ({ ...current, time: event.target.value }))}
              />
            </div>
          </label>
        </div>

        <div className="schedule-modal__meta">
          <strong>{preview || "Select a valid date and time"}</strong>
          <span>Timezone: {timezone}</span>
        </div>

        {isPast ? (
          <p className="schedule-modal__error">Scheduled time must be in the future.</p>
        ) : null}

        <div className="schedule-modal__actions">
          {existingSchedule ? (
            <button
              type="button"
              className="schedule-modal__btn schedule-modal__btn--ghost"
              onClick={onClearSchedule}
              disabled={saving}
            >
              Remove schedule
            </button>
          ) : (
            <button type="button" className="schedule-modal__btn schedule-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
          )}

          <button
            type="button"
            className="schedule-modal__btn schedule-modal__btn--primary"
            onClick={handleSubmit}
            disabled={saving || isPast}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Scheduling…</span>
              </>
            ) : (
              <span>{count === 1 ? "Schedule Listing" : "Schedule Listings"}</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ScheduleListingModal;
