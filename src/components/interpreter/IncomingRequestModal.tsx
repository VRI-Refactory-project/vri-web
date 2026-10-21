import { useEffect, useState } from 'react';
import { PhoneIncoming } from 'lucide-react';
import { describeError } from '../../services/api';
import {
  getIncomingOffers,
  respondToOffer,
  type IncomingOffer,
} from '../../services/interpreterOffers';
import { Modal } from '../Modal';

/** How often to ask the server for new offers, in milliseconds. */
const DEFAULT_POLL_MS = 4000;

/** Seconds as m:ss. */
const clock = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

interface Props {
  /** Tests shorten this. */
  pollMs?: number;
}

/**
 * Pop-up for an interpreter when a request is offered to them. It checks for offers while the
 * interpreter is signed in and shows the first one with a countdown. The interpreter can accept
 * or decline it (V2-010); neither takes them anywhere. An unanswered offer expires on the server
 * and moves on to the next interpreter.
 */
export function IncomingRequestModal({ pollMs = DEFAULT_POLL_MS }: Props) {
  const [offers, setOffers] = useState<IncomingOffer[]>([]);
  // Offers already answered or closed here, so the next check does not bring them back.
  const [handled, setHandled] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // A failed check just leaves the pop-up as it is: it must never block the dashboard.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const next = await getIncomingOffers();
        if (!cancelled) setOffers(next);
      } catch {
        // try again on the next round
      }
      if (!cancelled) timer = setTimeout(check, pollMs);
    };
    void check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pollMs]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const offer = offers.find(
    (o) => !handled.includes(o.id) && (!o.expiresAt || Date.parse(o.expiresAt) > now),
  );

  if (accepted) {
    return (
      <Modal title="Request accepted" onClose={() => setAccepted(false)}>
        <div className="modal__icon">
          <PhoneIncoming size={28} aria-hidden="true" />
        </div>
        <h2 className="modal__title">Request accepted</h2>
        <p className="modal__text">
          You are now assigned to this request. You are marked unavailable until you switch back on.
        </p>
        <button className="modal__primary" type="button" onClick={() => setAccepted(false)}>
          Close
        </button>
      </Modal>
    );
  }

  if (!offer) return null;

  const close = () => {
    setHandled((ids) => [...ids, offer.id]);
    setError('');
  };

  const respond = async (action: 'accept' | 'decline') => {
    setBusy(true);
    setError('');
    try {
      await respondToOffer(offer.id, action);
      setHandled((ids) => [...ids, offer.id]);
      if (action === 'accept') setAccepted(true);
    } catch (err) {
      // A 409 means the offer ran out; the next check drops it, and this shows why.
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const secondsLeft = offer.expiresAt ? (Date.parse(offer.expiresAt) - now) / 1000 : null;

  return (
    <Modal title="Incoming request" onClose={close}>
      <div className="modal__icon">
        <PhoneIncoming size={28} aria-hidden="true" />
      </div>
      <h2 className="modal__title">{offer.emergency ? 'Emergency request' : 'Incoming request'}</h2>
      <p className="modal__text">
        <strong>{offer.requesterName}</strong> needs an interpreter. Context: {offer.sector}.
      </p>
      {secondsLeft !== null && (
        <p className="modal__text" role="timer">
          Respond within {clock(secondsLeft)}
        </p>
      )}
      {error && (
        <p className="modal__text" role="alert">
          {error}
        </p>
      )}
      <button
        className="modal__primary"
        type="button"
        disabled={busy}
        onClick={() => void respond('accept')}
      >
        Accept
      </button>
      <button
        className="modal__secondary"
        type="button"
        disabled={busy}
        onClick={() => void respond('decline')}
      >
        Decline
      </button>
    </Modal>
  );
}
