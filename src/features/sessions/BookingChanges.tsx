import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../../components/Modal';
import { describeError } from '../../services/api';
import {
  cancelBooking,
  deadlineNote,
  noticeRule,
  rescheduleBooking,
  type MyBooking,
} from './myBookings';
import './BookingChanges.css';

const DURATIONS = [15, 30, 45, 60];

const whenOf = (b: MyBooking) =>
  new Date(`${b.date}T${b.time}`).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

interface Props {
  booking: MyBooking;
  /** Called with the server's copy after the booking was cancelled or moved. */
  onChanged: (booking: MyBooking) => void;
  /** Class for the two buttons, so they match the list they sit in. */
  buttonClassName?: string;
}

/**
 * Cancel and Reschedule for one upcoming booking (V2-051). Both ask for confirmation first and show
 * the notice rule (Clarification C-04). Once the booking is inside the notice window the buttons
 * are replaced by a short note saying why it can no longer be changed.
 */
export function BookingChanges({ booking, onChanged, buttonClassName = '' }: Props) {
  const [open, setOpen] = useState<'cancel' | 'reschedule' | null>(null);

  if (booking.can_change === false) {
    return (
      <span className="bc-locked" title={deadlineNote(booking)}>
        Too late to change
      </span>
    );
  }

  return (
    <span className="bc-actions">
      <button
        type="button"
        className={`${buttonClassName} bc-reschedule`.trim()}
        onClick={() => setOpen('reschedule')}
      >
        Reschedule
      </button>
      <button type="button" className={buttonClassName} onClick={() => setOpen('cancel')}>
        Cancel
      </button>
      {/* Drawn on <body>, not inside the card: the dashboard cards lift on hover with a transform,
          which would move a fixed pop-up with them and make it jump as the mouse moves. */}
      {open &&
        createPortal(
          <BookingChangeDialog
            booking={booking}
            mode={open}
            onClose={() => setOpen(null)}
            onDone={(updated) => {
              setOpen(null);
              onChanged(updated);
            }}
          />,
          document.body,
        )}
    </span>
  );
}

interface DialogProps {
  booking: MyBooking;
  mode: 'cancel' | 'reschedule';
  onClose: () => void;
  onDone: (booking: MyBooking) => void;
}

/** Confirms a cancellation, or asks for the new time, with the notice rule shown first (WEB-02). */
export function BookingChangeDialog({ booking, mode, onClose, onDone }: DialogProps) {
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time.slice(0, 5));
  const [duration, setDuration] = useState(booking.duration);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const durations = DURATIONS.includes(booking.duration)
    ? DURATIONS
    : [...DURATIONS, booking.duration].sort((a, b) => a - b);
  const unchanged =
    date === booking.date && time === booking.time.slice(0, 5) && duration === booking.duration;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onDone(
        mode === 'cancel'
          ? await cancelBooking(booking.id)
          : await rescheduleBooking(booking.id, { date, time, duration }),
      );
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  };

  const title = mode === 'cancel' ? 'Cancel this booking?' : 'Reschedule booking';

  return (
    <Modal title={title} onClose={busy ? undefined : onClose}>
      <form className="bc-dialog" onSubmit={submit}>
        <h2>{title}</h2>
        <p className="bc-current">
          Booked for <strong>{whenOf(booking)}</strong> ({booking.duration} minutes)
          {booking.interpreter_name ? ` with ${booking.interpreter_name}` : ''}.
        </p>

        <div className="bc-rule" role="note">
          <strong>{noticeRule(booking)}</strong>
          <span>{deadlineNote(booking)}</span>
        </div>

        {mode === 'reschedule' ? (
          <>
            <div className="bc-fields">
              <label>
                New date
                <input
                  type="date"
                  required
                  min={today()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                New time
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
              <label>
                Length
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {durations.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes === 60 ? '1 hour' : `${minutes} minutes`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="bc-hint">
              {booking.interpreter_name
                ? `${booking.interpreter_name} keeps the session if they are free at the new time. If not, we find another interpreter.`
                : 'We will look for an interpreter for the new time.'}{' '}
              You will get reminders for the new time.
            </p>
          </>
        ) : (
          <p className="bc-hint">
            {booking.interpreter_name
              ? `${booking.interpreter_name} will be told it is cancelled.`
              : 'Interpreters will no longer be asked to take it.'}
          </p>
        )}

        {error && (
          <p className="bc-error" role="alert">
            {error}
          </p>
        )}

        <div className="bc-buttons">
          <button type="button" className="bc-secondary" onClick={onClose} disabled={busy}>
            {mode === 'cancel' ? 'Keep booking' : 'Back'}
          </button>
          <button
            type="submit"
            className={mode === 'cancel' ? 'bc-danger' : 'bc-primary'}
            disabled={busy || (mode === 'reschedule' && unchanged)}
          >
            {busy ? 'Saving…' : mode === 'cancel' ? 'Cancel booking' : 'Move booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
