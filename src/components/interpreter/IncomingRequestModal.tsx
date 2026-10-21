import { useEffect, useState } from 'react';
import { PhoneIncoming } from 'lucide-react';
import { getIncomingOffers, type IncomingOffer } from '../../services/interpreterOffers';
import { Modal } from '../Modal';

/** How often to ask the server for new offers, in milliseconds. */
const DEFAULT_POLL_MS = 4000;

const CONTEXT_LABEL: Record<IncomingOffer['context'], string> = {
  GENERAL: 'General',
  MEDICAL: 'Medical',
  LEGAL: 'Legal',
  OTHER: 'Other',
};

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
 * interpreter is signed in and shows the first one with a countdown. Accepting and declining are
 * not built yet (V2-010), so for now the only action is to dismiss it; an unanswered offer
 * expires on the server and moves on to the next interpreter.
 */
export function IncomingRequestModal({ pollMs = DEFAULT_POLL_MS }: Props) {
  const [offers, setOffers] = useState<IncomingOffer[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);
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
    (o) => !dismissed.includes(o.id) && (!o.expiresAt || Date.parse(o.expiresAt) > now),
  );
  if (!offer) return null;

  const dismiss = () => setDismissed((ids) => [...ids, offer.id]);
  const emergency = offer.priority === 'EMERGENCY';
  const secondsLeft = offer.expiresAt ? (Date.parse(offer.expiresAt) - now) / 1000 : null;

  return (
    <Modal title="Incoming request" onClose={dismiss}>
      <div className="modal__icon">
        <PhoneIncoming size={28} aria-hidden="true" />
      </div>
      <h2 className="modal__title">{emergency ? 'Emergency request' : 'Incoming request'}</h2>
      <p className="modal__text">
        <strong>{offer.requesterName}</strong> needs an interpreter. Context:{' '}
        {CONTEXT_LABEL[offer.context]}.{offer.description ? ` “${offer.description}”` : ''}
      </p>
      {secondsLeft !== null && (
        <p className="modal__text" role="timer">
          Respond within {clock(secondsLeft)}
        </p>
      )}
      <p className="modal__text">
        Accepting and declining is coming soon. If you do nothing, the request goes to the next
        interpreter.
      </p>
      <button className="modal__primary" type="button" onClick={dismiss}>
        Dismiss
      </button>
    </Modal>
  );
}
