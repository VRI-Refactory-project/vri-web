import { useEffect, useState } from 'react';
import { Countdown } from './Countdown';

/** How long the ended screen waits before it starts counting, and how long it then counts. */
export const RETURN_DELAY_MS = 5_000;
export const RETURN_SECONDS = 10;

interface Props {
  /** Takes the person to their dashboard. */
  onReturn: () => void;
}

/**
 * On the call-ended screen: after a short pause, counts down and takes the person back to their
 * dashboard, as Google Meet does. Anything they touch on the page (a star, Rejoin, the feedback
 * card, a key) stops it, so nobody is taken away halfway through giving feedback.
 */
export function ReturnCountdown({ onReturn }: Props) {
  const [stage, setStage] = useState<'waiting' | 'counting' | 'stopped'>('waiting');

  useEffect(() => {
    if (stage !== 'waiting') return;
    const start = setTimeout(() => setStage('counting'), RETURN_DELAY_MS);
    return () => clearTimeout(start);
  }, [stage]);

  useEffect(() => {
    if (stage === 'stopped') return;
    const stop = () => setStage('stopped');
    document.addEventListener('pointerdown', stop);
    document.addEventListener('keydown', stop);
    return () => {
      document.removeEventListener('pointerdown', stop);
      document.removeEventListener('keydown', stop);
    };
  }, [stage]);

  if (stage !== 'counting') return null;
  return (
    <div className="return-cd" aria-live="polite">
      <Countdown seconds={RETURN_SECONDS} onDone={onReturn} />
      <p className="return-cd__text">Returning to your dashboard</p>
      <button type="button" className="return-cd__stay" onClick={() => setStage('stopped')}>
        Stay on this page
      </button>
    </div>
  );
}
