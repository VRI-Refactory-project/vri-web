import { useEffect, useState } from 'react';
import { Countdown } from './Countdown';

/** How long someone may be alone in a call before being asked, and how long they have to answer. */
export const ALONE_MS = 5 * 60_000;
export const ANSWER_SECONDS = 15;

interface Props {
  /** True when the person's leaving ends the session for everyone (the Deaf user). */
  ends: boolean;
  /** What happens when nobody answers: the session ends, or the person leaves. */
  onTimeout: () => void;
}

/**
 * "Are you still there?" Put it on the screen only while the person is alone in the call: it waits
 * five minutes, then asks, and if nobody answers in fifteen seconds the call ends. Someone joining
 * takes it off the screen, which resets it.
 *
 * It looks only at whether anyone else is in the call. A Deaf person signing makes no sound and a
 * quiet interpreter is normal, so the microphone, camera or chat would say nothing useful here.
 */
export function AloneCheck({ ends, onTimeout }: Props) {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (asking) return;
    const ask = setTimeout(() => setAsking(true), ALONE_MS);
    return () => clearTimeout(ask);
  }, [asking]);

  if (!asking) return null;
  return (
    <div className="alone-check" role="presentation">
      <section
        className="alone-check__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alone-check-title"
        aria-describedby="alone-check-text"
      >
        <Countdown
          seconds={ANSWER_SECONDS}
          onDone={() => {
            onTimeout();
            // If ending did not work, start waiting again rather than leaving the question up.
            setAsking(false);
          }}
        />
        <h2 id="alone-check-title">Are you still there?</h2>
        <p id="alone-check-text">
          You’ve been the only one in this call for 5 minutes.{' '}
          {ends ? 'The session will end' : 'You’ll leave the call'} unless you answer.
        </p>
        <button
          type="button"
          className="ls-btn ls-btn--primary"
          autoFocus
          onClick={() => setAsking(false)}
        >
          I’m still here
        </button>
      </section>
    </div>
  );
}
