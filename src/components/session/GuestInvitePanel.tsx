import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { describeError } from '../../services/api';
import {
  createInvitation,
  listInvitations,
  removeInvitation,
  type GuestInvitation,
} from '../../services/guestInvitations';
import './GuestInvitePanel.css';

const POLL_MS = 5000; // how often the list refreshes, so "joined" shows up soon after it happens

const statusOf = (guest: GuestInvitation) => {
  if (guest.removed_at) return 'Removed';
  if (guest.joined_at) return 'Joined the session';
  return 'Invited, not joined yet';
};

/**
 * The Deaf user invites a hearing guest by email, sees when they join, and can remove them (V2-012).
 * It stays closed, and makes no requests, until the Deaf user opens it.
 */
export function GuestInvitePanel({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState<GuestInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // While the panel is open, keep the list fresh.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await listInvitations(sessionId);
        if (!cancelled) setGuests(list);
      } catch {
        // keep the list we already have and try again on the next refresh
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, sessionId]);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createInvitation(sessionId, email.trim());
      setGuests((current) => [...current, created]);
      setEmail('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (guest: GuestInvitation) => {
    setError(null);
    try {
      const updated = await removeInvitation(sessionId, guest.id);
      setGuests((current) => current.map((g) => (g.id === updated.id ? updated : g)));
    } catch (err) {
      setError(describeError(err));
    }
  };

  if (!open) {
    return (
      <button type="button" className="ls-btn ls-btn--outline" onClick={() => setOpen(true)}>
        <UserPlus size={18} aria-hidden="true" /> Invite a hearing guest
      </button>
    );
  }

  return (
    <section className="gip" aria-label="Invite a hearing guest">
      <form className="gip-form" onSubmit={invite}>
        <label htmlFor="gip-email">Guest’s email</label>
        <input
          id="gip-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="ls-btn ls-btn--primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send invitation'}
        </button>
      </form>
      <p className="gip-hint">They get a link by email. They do not need an account.</p>
      {error && (
        <p className="ls-error" role="alert">
          {error}
        </p>
      )}
      {guests.length > 0 && (
        <ul className="gip-list">
          {guests.map((guest) => (
            <li key={guest.id} className="gip-item">
              <span>
                {guest.email}
                <span
                  className={`gip-status${guest.joined_at && !guest.removed_at ? ' gip-status--joined' : ''}`}
                >
                  {statusOf(guest)}
                </span>
              </span>
              {!guest.removed_at && (
                <button
                  type="button"
                  className="ls-btn ls-btn--outline"
                  aria-label={`Remove ${guest.email}`}
                  onClick={() => remove(guest)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="gip-close" onClick={() => setOpen(false)}>
        Close
      </button>
    </section>
  );
}
