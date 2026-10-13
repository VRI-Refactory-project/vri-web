
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { interpreterApi } from "../../services/interpreterApi";
import './AvailabilityPage.css';

type DayName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

type DaySchedule = {
  day: DayName;
  enabled: boolean;
  start: string;
  end: string;
};

type AvailabilityException = {
  id: string;
  date: string;
  unavailable: boolean;
  start?: string;
  end?: string;
  note?: string;
};

type AvailabilityPayload = {
  weeklySchedule?: Array<{
    day: string;
    enabled?: boolean;
    available?: boolean;
    start?: string;
    startTime?: string;
    end?: string;
    endTime?: string;
  }>;
  exceptions?: AvailabilityException[];
  available?: boolean;
};

const DAYS: DayName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((day, index) => ({
  day,
  enabled: index < 5,
  start: '08:00',
  end: '17:00',
}));

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour = hours % 12 || 12;
  return `${hour}:${pad(minutes || 0)}${suffix}`;
};

const formatDate = (dateKey: string) => {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

function mapSchedule(payload: AvailabilityPayload): DaySchedule[] {
  if (!Array.isArray(payload.weeklySchedule)) {
    return DEFAULT_SCHEDULE;
  }

  return DAYS.map((day) => {
    const item = payload.weeklySchedule?.find(
      (entry) => entry.day.toLowerCase() === day.toLowerCase(),
    );

    const fallback = DEFAULT_SCHEDULE.find((entry) => entry.day === day)!;

    return {
      day,
      enabled: item ? Boolean(item.enabled ?? item.available) : fallback.enabled,
      start: item?.start ?? item?.startTime ?? fallback.start,
      end: item?.end ?? item?.endTime ?? fallback.end,
    };
  });
}

export function AvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<DayName | null>(null);
  const [exceptionToDelete, setExceptionToDelete] = useState<string | null>(null);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const [draft, setDraft] = useState({
    date: toDateKey(new Date()),
    type: 'unavailable' as 'unavailable' | 'modified',
    start: '08:00',
    end: '17:00',
    note: '',
  });

  const loadAvailability = useCallback(async () => {
    try {
      const result = (await interpreterApi.getAvailability()) as AvailabilityPayload;

      setSchedule(mapSchedule(result));
      setExceptions(Array.isArray(result.exceptions) ? result.exceptions : []);
      setIsAvailable(result.available ?? true);
    } catch {
      // Preserve a usable page while the backend endpoint is being connected.
      setError(
        'Could not load saved availability. Showing a local preview until the API is available.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

//   useEffect(() => {
//     void loadAvailability();
//   }, [loadAvailability]);

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    void loadAvailability();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadAvailability]);

  const updateDay = (
    day: DayName,
    updates: Partial<DaySchedule>,
  ) => {
    setSchedule((current) =>
      current.map((item) => (item.day === day ? { ...item, ...updates } : item)),
    );

    setNotice('');
  };

  const handleLiveStatus = async (nextValue: boolean) => {
    const previousValue = isAvailable;

    setIsAvailable(nextValue);
    setNotice('');
    setError('');

    try {
      await interpreterApi.updateLiveStatus(nextValue);

      setNotice(
        nextValue
          ? 'You are now available for interpreting requests.'
          : 'You are now unavailable for interpreting requests.',
      );
    } catch {
      setIsAvailable(previousValue);
      setError('Live status could not be saved. Please check your connection.');
    }
  };

  const handleSaveSchedule = async () => {
    const invalid = schedule.find(
      (item) => item.enabled && item.start >= item.end,
    );

    if (invalid) {
      setError(`Check the start and end times for ${invalid.day}.`);
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await interpreterApi.updateAvailability({
        weeklySchedule: schedule.map((item) => ({
          day: item.day,
          enabled: item.enabled,
          start: item.start,
          end: item.end,
        })),
        exceptions,
      });

      setNotice('Your weekly availability has been saved.');
    } catch {
      setError(
        'The API did not save your schedule. Confirm the endpoint and request format with your backend team.',
      );
    } finally {
      setSaving(false);
    }
  };

  const copyMondayToWeekdays = () => {
    const monday = schedule.find((item) => item.day === 'Monday');

    if (!monday) return;

    setSchedule((current) =>
      current.map((item) =>
        item.day === 'Saturday' || item.day === 'Sunday'
          ? item
          : { ...item, enabled: monday.enabled, start: monday.start, end: monday.end },
      ),
    );

    setNotice('Monday’s hours copied to weekdays. Save changes to persist them.');
  };

  const openAddDialog = () => {
    setEditingDay(null);

    setDraft({
      date: selectedDate,
      type: 'unavailable',
      start: '08:00',
      end: '17:00',
      note: '',
    });

    setModalOpen(true);
  };

  const openEditDay = (item: DaySchedule) => {
    setEditingDay(item.day);

    setDraft({
      date: selectedDate,
      type: item.enabled ? 'modified' : 'unavailable',
      start: item.start,
      end: item.end,
      note: '',
    });

    setModalOpen(true);
  };

  const saveDialog = () => {
    setError('');

    if (editingDay) {
      if (draft.type === 'modified' && draft.start >= draft.end) {
        setError('The end time must be later than the start time.');
        return;
      }

      updateDay(editingDay, {
        enabled: draft.type === 'modified',
        start: draft.start,
        end: draft.end,
      });

      setModalOpen(false);
      setNotice(`${editingDay}'s schedule updated. Select Save changes to persist it.`);
      return;
    }

    if (!draft.date) {
      setError('Select a date for this exception.');
      return;
    }

    if (draft.type === 'modified' && draft.start >= draft.end) {
      setError('The end time must be later than the start time.');
      return;
    }

    const exception: AvailabilityException = {
      id: `exception-${Date.now()}`,
      date: draft.date,
      unavailable: draft.type === 'unavailable',
      ...(draft.type === 'modified'
        ? { start: draft.start, end: draft.end }
        : {}),
      note: draft.note.trim(),
    };

    setExceptions((current) => [
      ...current.filter((item) => item.date !== exception.date),
      exception,
    ]);

    setSelectedDate(exception.date);
    setMonth(new Date(`${exception.date}T12:00:00`));
    setModalOpen(false);
    setNotice('Exception added locally. Select Save changes to persist it.');
  };

  const selectedException = exceptions.find((item) => item.date === selectedDate);

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    ).getDay();

    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [month]);

  const changeMonth = (delta: number) => {
    setMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  };

  const monthLabel = month.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const removeException = (id: string) => {
    setExceptions((current) => current.filter((item) => item.id !== id));
    setExceptionToDelete(null);
    setNotice('Exception removed locally. Select Save changes to persist it.');
  };

  return (
    <div className="availability-page">
      <header className="availability-header">
        <div>
          <h1>Availability schedule</h1>
          <p>Set the hours when you’re available to receive interpreting requests.</p>
        </div>

        <div className="availability-header-actions">
          <button
            type="button"
            className="availability-icon-button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setNotice('No new availability notifications.')}
          >
            <Bell size={21} />
          </button>

          <span className="availability-user-avatar" aria-label="Signed-in interpreter">
            A
          </span>

          <button
            type="button"
            className="availability-save-button"
            onClick={() => void handleSaveSchedule()}
            disabled={saving}
          >
            {saving ? (
              <LoaderCircle size={16} className="availability-spinner" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      <section className="availability-live-card" aria-label="Real-time availability">
        <span
          className={
            isAvailable ? 'availability-live-dot is-on' : 'availability-live-dot'
          }
        />

        <div className="availability-live-copy">
          <strong>
            {isAvailable ? 'Available for requests' : 'Currently unavailable'}
          </strong>

          <span>
            {isAvailable
              ? 'The routing engine may offer you interpreting requests.'
              : 'New requests should not be routed to you while you are unavailable.'}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isAvailable}
          aria-label="Real-time availability status"
          className={`availability-switch ${isAvailable ? 'is-on' : ''}`}
          onClick={() => void handleLiveStatus(!isAvailable)}
        >
          <span />
        </button>
      </section>

      {error && (
        <div className="availability-message is-error" role="alert">
          {error}
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="availability-message is-success" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setNotice('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="availability-layout">
        <section className="availability-panel weekly-panel">
          <div className="availability-panel-heading">
            <div>
              <h2>Weekly availability</h2>
              <p>Your regular weekly hours</p>
            </div>

            <span className="availability-timezone">(EAT)</span>
          </div>

          <button
            type="button"
            className="availability-copy-button"
            onClick={copyMondayToWeekdays}
          >
            <Copy size={17} />
            Copy Monday’s hours to weekdays
          </button>

          {loading ? (
            <div className="availability-loading">
              <LoaderCircle className="availability-spinner" size={22} />
              Loading availability…
            </div>
          ) : (
            <div className="availability-days">
              {schedule.map((item) => (
                <div className="availability-day-row" key={item.day}>
                  <strong className="availability-day-name">{item.day}</strong>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    aria-label={`${item.day} availability`}
                    className={`availability-switch ${item.enabled ? 'is-on' : ''}`}
                    onClick={() => updateDay(item.day, { enabled: !item.enabled })}
                  >
                    <span />
                  </button>

                  <span
                    className={`availability-day-status ${item.enabled ? 'is-on' : ''}`}
                  >
                    {item.enabled ? 'Available' : 'Unavailable'}
                  </span>

                  {item.enabled ? (
                    <div className="availability-time-range">
                      <span>{formatTime(item.start)}</span>
                      <span className="availability-time-separator">–</span>
                      <span>{formatTime(item.end)}</span>
                    </div>
                  ) : (
                    <div className="availability-time-range is-empty">—</div>
                  )}

                  <button
                    type="button"
                    className="availability-edit-icon"
                    aria-label={`Edit ${item.day} hours`}
                    onClick={() => openEditDay(item)}
                  >
                    <Pencil size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="availability-add-button"
            onClick={openAddDialog}
          >
            <Plus size={21} />
            Add availability
          </button>
        </section>

        <aside className="availability-panel exceptions-panel">
          <h2>Exceptions</h2>
          <p className="availability-panel-description">
            Dates when your normal schedule changes
          </p>

          <div className="availability-calendar">
            <div className="availability-calendar-heading">
              <button
                type="button"
                className="availability-icon-button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft size={20} />
              </button>

              <strong>{monthLabel}</strong>

              <button
                type="button"
                className="availability-icon-button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="availability-calendar-grid availability-calendar-weekdays">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>

            <div className="availability-calendar-grid">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <span key={`blank-${index}`} />;
                }

                const dateKey = toDateKey(
                  new Date(month.getFullYear(), month.getMonth(), day),
                );

                const exception = exceptions.find((item) => item.date === dateKey);
                const selected = selectedDate === dateKey;

                return (
                  <button
                    type="button"
                    key={dateKey}
                    className={[
                      'availability-calendar-day',
                      selected ? 'is-selected' : '',
                      exception?.unavailable ? 'is-unavailable' : '',
                      exception && !exception.unavailable ? 'is-modified' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={`${formatDate(dateKey)}${exception ? ', has an exception' : ''}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedDate(dateKey)}
                  >
                    {day}
                    {exception && <span />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="availability-legend">
            <span><i className="legend-unavailable" /> Unavailable</span>
            <span><i className="legend-modified" /> Modified hours</span>
          </div>

          <div className="availability-selected-exception">
            <CalendarDays size={22} />
            <div>
              <strong>{formatDate(selectedDate)}</strong>
              <p>
                {selectedException
                  ? selectedException.unavailable
                    ? 'Unavailable all day'
                    : `Modified hours: ${formatTime(selectedException.start ?? '08:00')} – ${formatTime(selectedException.end ?? '17:00')}`
                  : 'No exception for this date'}
              </p>

              {selectedException?.note && <small>{selectedException.note}</small>}
            </div>
          </div>

          {selectedException && (
            <div className="availability-exception-actions">
              <button
                type="button"
                onClick={() => {
                  setDraft({
                    date: selectedException.date,
                    type: selectedException.unavailable ? 'unavailable' : 'modified',
                    start: selectedException.start ?? '08:00',
                    end: selectedException.end ?? '17:00',
                    note: selectedException.note ?? '',
                  });

                  setEditingDay(null);
                  setModalOpen(true);
                }}
              >
                Edit
              </button>

              <button
                type="button"
                className="is-danger"
                onClick={() => setExceptionToDelete(selectedException.id)}
              >
                Remove
              </button>
            </div>
          )}

          <button
            type="button"
            className="availability-add-exception"
            onClick={openAddDialog}
          >
            <Plus size={20} />
            Add exception for a date
          </button>
        </aside>
      </div>

      {modalOpen && (
        <div
          className="availability-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <section
            className="availability-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="availability-modal-title"
          >
            <div className="availability-modal-heading">
              <div>
                <span className="availability-modal-icon">
                  <Clock3 size={21} />
                </span>

                <h2 id="availability-modal-title">
                  {editingDay
                    ? `Edit ${editingDay}`
                    : 'Add availability or exception'}
                </h2>

                <p>
                  Set a date and hours when your normal schedule should change.
                </p>
              </div>

              <button
                type="button"
                className="availability-icon-button"
                aria-label="Close dialog"
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="availability-modal-body">
              {!editingDay && (
                <label className="availability-form-field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              )}

              <fieldset className="availability-choice-group">
                <legend>Availability for this period</legend>

                <label>
                  <input
                    type="radio"
                    name="availability-type"
                    value="modified"
                    checked={draft.type === 'modified'}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        type: 'modified',
                      }))
                    }
                  />

                  <span>
                    <strong>Available during specific hours</strong>
                    <small>Receive requests during the hours you set.</small>
                  </span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="availability-type"
                    value="unavailable"
                    checked={draft.type === 'unavailable'}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        type: 'unavailable',
                      }))
                    }
                  />

                  <span>
                    <strong>Unavailable</strong>
                    <small>Do not route new requests during this period.</small>
                  </span>
                </label>
              </fieldset>

              {draft.type === 'modified' && (
                <div className="availability-time-fields">
                  <label className="availability-form-field">
                    <span>Start time</span>
                    <input
                      type="time"
                      value={draft.start}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          start: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="availability-form-field">
                    <span>End time</span>
                    <input
                      type="time"
                      value={draft.end}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          end: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              )}

              {!editingDay && (
                <label className="availability-form-field">
                  <span>Note (optional)</span>
                  <textarea
                    rows={2}
                    value={draft.note}
                    placeholder="e.g. Appointment, training, or personal leave"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                  />
                </label>
              )}

              {error && (
                <p className="availability-modal-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="availability-modal-footer">
              <button
                type="button"
                className="availability-secondary-button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="availability-primary-button"
                onClick={saveDialog}
              >
                <Check size={17} />
                Save
              </button>
            </div>
          </section>
        </div>
      )}

      {exceptionToDelete && (
        <div className="availability-modal-backdrop">
          <section
            className="availability-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="availability-delete-title"
          >
            <span className="availability-confirm-icon">
              <Trash2 size={23} />
            </span>

            <h2 id="availability-delete-title">Remove this exception?</h2>

            <p>
              This removes the exception from the current preview. Save changes
              to persist the updated schedule.
            </p>

            <div className="availability-modal-footer">
              <button
                type="button"
                className="availability-secondary-button"
                onClick={() => setExceptionToDelete(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="availability-danger-button"
                onClick={() => removeException(exceptionToDelete)}
              >
                Remove exception
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AvailabilityPage;
