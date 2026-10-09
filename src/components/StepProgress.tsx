import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';

// Where the person is in a sign-up flow. Two views of the same list: a vertical list of named
// steps beside the card on wide screens, and a compact bar with the current step's name on
// narrow ones (CSS switches between them, see AuthShell.css).

interface StepProgressProps {
  steps: readonly string[];
  /** 1-based position of the current step. */
  current: number;
}

export function StepProgress({ steps, current }: StepProgressProps) {
  const total = steps.length;
  return (
    <nav
      className="step-progress"
      aria-label={`Step ${current} of ${total}: ${steps[current - 1]}`}
    >
      <ol className="step-list">
        {steps.map((label, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'current' : 'todo';
          return (
            <li
              key={label}
              className={`step-list__item step-list__item--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="step-list__dot" aria-hidden="true">
                {state === 'done' ? <Check size={16} strokeWidth={3} /> : n}
              </span>
              <span className="step-list__label">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="step-compact" aria-hidden="true">
        <div className="step-compact__bars" style={{ '--steps': total } as CSSProperties}>
          {steps.map((label, i) => (
            <span
              key={label}
              className={
                i < current ? 'step-compact__bar step-compact__bar--done' : 'step-compact__bar'
              }
            />
          ))}
        </div>
        <p className="step-compact__label">
          Step {current} of {total}: {steps[current - 1]}
        </p>
      </div>
    </nav>
  );
}
