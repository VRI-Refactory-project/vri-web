import { useEffect, useRef, useState } from 'react';
import { LogoDisc } from './BrandMark';
import './Countdown.css';

interface Props {
  /** How long it runs, in seconds. It starts when it appears on screen. */
  seconds: number;
  /** Called once, when it reaches zero. */
  onDone: () => void;
}

const SIZE = 88;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * SignConnect's countdown: the logo inside a purple ring that drains, with the seconds left under
 * it. It runs while it is on screen; take it off the screen to stop it.
 *
 * Time is measured from a fixed end point, not by counting ticks, so it stays right even when the
 * browser slows timers down in a background tab.
 */
export function Countdown({ seconds, onDone }: Props) {
  const [endsAt] = useState(() => Date.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);
  // The latest onDone, so a new function from the parent does not restart the countdown.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(tick);
        done.current();
      }
    }, 250);
    return () => clearInterval(tick);
  }, [endsAt]);

  // The ring drains a step per second: full at the start, empty at zero.
  const offset = CIRCUMFERENCE * (1 - left / seconds);

  return (
    <div className="cd" role="timer" aria-label={`${left} seconds left`}>
      <div className="cd__ring">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className="cd__track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
          <circle
            className="cd__progress"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="cd__logo">
          <LogoDisc size={56} />
        </span>
      </div>
      <span className="cd__seconds" aria-hidden="true">
        {left}
      </span>
    </div>
  );
}
