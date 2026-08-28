import { useEffect, useMemo, useState } from "react";
import { LuCalendar, LuClock3, LuLoader, LuShuffle, LuX } from "react-icons/lu";
import { getListingImageUrl } from "./helpers";

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultScheduleValues(existingAt) {
  const base = existingAt ? new Date(existingAt) : new Date(Date.now() + 60 * 60 * 1000);
  if (!existingAt && base.getMinutes() > 0) {
    base.setHours(base.getHours() + 1, 0, 0, 0);
  }

  return {
    date: toDateInputValue(base),
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

function formatDayTime(ms) {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Spreads `count` timestamps across [startMs, endMs) with an organic, non-uniform
 * gap (AutoDS-style "random hours" queue) while guaranteeing at least `minGapMs`
 * between consecutive picks whenever the window allows it.
 */
function buildRandomTimes(startMs, endMs, count, minGapMs) {
  if (count <= 0 || endMs <= startMs) {
    return [];
  }

  const totalWindow = endMs - startMs;
  const slotWidth = totalWindow / count;
  const gap = Math.min(minGapMs, slotWidth);

  const times = [];
  for (let i = 0; i < count; i += 1) {
    const slotStart = startMs + i * slotWidth;
    const slotEnd = slotStart + slotWidth;
    let t = slotStart + Math.random() * (slotEnd - slotStart);

    if (i > 0 && t - times[i - 1] < gap) {
      t = times[i - 1] + gap;
    }

    t = Math.min(t, endMs - 1);
    times.push(Math.round(t / 60000) * 60000);
  }

  return times;
}

function enumerateDays(fromDate, toDate) {
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }

  const days = [];
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)) {
    days.push(toDateInputValue(cursor));
  }
  return days;
}

/**
 * Spreads `count` listings across every day from fromDate to toDate (inclusive),
 * each day still confined to the daily RANDOM_FROM_TIME–RANDOM_TO_TIME window so
 * nothing publishes overnight — listings are divided evenly across the days, then
 * randomized within each day the same way a single-day spread already works.
 */
function buildRandomTimesAcrossDays(days, count) {
  if (!days.length || count <= 0) {
    return [];
  }

  const perDay = Math.ceil(count / days.length);
  const times = [];
  let remaining = count;

  days.forEach((day, index) => {
    if (remaining <= 0) {
      return;
    }

    const dayCount = index === days.length - 1 ? remaining : Math.min(perDay, remaining);
    remaining -= dayCount;

    const startMs = new Date(`${day}T${RANDOM_FROM_TIME}:00`).getTime();
    const endMs = new Date(`${day}T${RANDOM_TO_TIME}:00`).getTime();
    times.push(...buildRandomTimes(startMs, endMs, dayCount, RANDOM_MIN_GAP_MINUTES * 60000));
  });

  return times.sort((a, b) => a - b);
}

// Random Hours asks for a date range — the daily spread window and minimum gap
// between listings are fixed so the flow stays quick.
const RANDOM_FROM_TIME = "09:00";
const RANDOM_TO_TIME = "21:00";
const RANDOM_MIN_GAP_MINUTES = 15;

function defaultRandomWindow() {
  const tomorrow = toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000));
  return {
    fromDate: tomorrow,
    toDate: tomorrow,
  };
}

function ScheduleListingModal({
  open,
  drafts = [],
  saving = false,
  onClose,
  onSchedule,
  onScheduleRandom,
  onClearSchedule,
}) {
  const existingSchedule = drafts.find((draft) => draft.scheduled_at)?.scheduled_at ?? null;
  const [mode, setMode] = useState("single");
  const [{ date, time }, setSchedule] = useState(() => defaultScheduleValues(existingSchedule));
  const [randomWindow, setRandomWindow] = useState(defaultRandomWindow);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  useEffect(() => {
    if (open) {
      setSchedule(defaultScheduleValues(existingSchedule));
      setRandomWindow(defaultRandomWindow());
      setMode("single");
      setShuffleSeed(0);
    }
  }, [open, existingSchedule]);

  const preview = useMemo(() => formatScheduledPreview(date, time), [date, time]);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const minDate = useMemo(() => {
    const now = new Date();
    return toDateInputValue(now);
  }, [open]);

  const randomDays = useMemo(
    () => enumerateDays(randomWindow.fromDate, randomWindow.toDate),
    [randomWindow],
  );

  const randomTimes = useMemo(() => {
    if (mode !== "random" || !randomDays.length) {
      return [];
    }

    return buildRandomTimesAcrossDays(randomDays, drafts.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, randomDays, drafts.length, shuffleSeed]);

  if (!open) {
    return null;
  }

  const count = drafts.length;
  const title = count === 1 ? "Schedule Listing" : `Schedule ${count} Listings`;
  const canRandom = count > 1 && typeof onScheduleRandom === "function";

  const handleSubmit = () => {
    if (mode === "random") {
      if (randomTimes.length !== count || randomTimes.some((t) => t <= Date.now())) {
        return;
      }
      const schedules = drafts.map((draft, index) => ({
        id: draft.id,
        scheduled_at: new Date(randomTimes[index]).toISOString(),
      }));
      onScheduleRandom(schedules);
      return;
    }

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

  const randomWindowInvalid = mode === "random" && (
    randomTimes.length !== count
    || randomTimes.some((t) => t <= Date.now())
  );

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

        {canRandom ? (
          <div className="schedule-modal__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "single"}
              className={`schedule-modal__tab ${mode === "single" ? "schedule-modal__tab--active" : ""}`}
              onClick={() => setMode("single")}
            >
              Pick a Time
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "random"}
              className={`schedule-modal__tab ${mode === "random" ? "schedule-modal__tab--active" : ""}`}
              onClick={() => setMode("random")}
            >
              <LuShuffle aria-hidden="true" />
              <span>Random Hours</span>
            </button>
          </div>
        ) : null}

        {mode === "single" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="schedule-modal__fields">
              <label className="schedule-modal__field">
                <span>From date</span>
                <div className="schedule-modal__input-wrap">
                  <LuCalendar aria-hidden="true" />
                  <input
                    type="date"
                    value={randomWindow.fromDate}
                    min={minDate}
                    onChange={(event) =>
                      setRandomWindow((current) => {
                        const fromDate = event.target.value;
                        const toDate = current.toDate < fromDate ? fromDate : current.toDate;
                        return { fromDate, toDate };
                      })
                    }
                  />
                </div>
              </label>

              <label className="schedule-modal__field">
                <span>To date</span>
                <div className="schedule-modal__input-wrap">
                  <LuCalendar aria-hidden="true" />
                  <input
                    type="date"
                    value={randomWindow.toDate}
                    min={randomWindow.fromDate || minDate}
                    onChange={(event) => setRandomWindow((current) => ({ ...current, toDate: event.target.value }))}
                  />
                </div>
              </label>
            </div>

            <p className="schedule-modal__hint">
              Each listing gets a random time between {RANDOM_FROM_TIME} and {RANDOM_TO_TIME} on one of the{" "}
              {randomDays.length || 0} day{randomDays.length === 1 ? "" : "s"} in this range, at least{" "}
              {RANDOM_MIN_GAP_MINUTES} minutes apart from others on the same day.
            </p>

            <div className="schedule-modal__random-head">
              <span>{count} listings will be spread across this range, in random order.</span>
              <button
                type="button"
                className="schedule-modal__shuffle-btn"
                onClick={() => setShuffleSeed((seed) => seed + 1)}
              >
                <LuShuffle />
                <span>Shuffle times</span>
              </button>
            </div>

            <ul className="schedule-modal__queue">
              {drafts.map((draft, index) => (
                <li key={draft.id}>
                  <span className="schedule-modal__queue-index">{index + 1}</span>
                  <span className="schedule-modal__queue-title">{draft.title}</span>
                  <span className="schedule-modal__queue-time">
                    {randomTimes[index] ? formatDayTime(randomTimes[index]) : "—"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="schedule-modal__meta">
              <span>Timezone: {timezone}</span>
            </div>

            {randomWindowInvalid ? (
              <p className="schedule-modal__error">
                The scheduled range must be in the future.
              </p>
            ) : null}
          </>
        )}

        <div className="schedule-modal__actions">
          {existingSchedule && mode === "single" ? (
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
            disabled={saving || (mode === "single" ? isPast : randomWindowInvalid)}
          >
            {saving ? (
              <>
                <LuLoader className="spin-icon" />
                <span>Scheduling…</span>
              </>
            ) : (
              <span>{count === 1 ? "Schedule Listing" : `Schedule ${count} Listings`}</span>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ScheduleListingModal;