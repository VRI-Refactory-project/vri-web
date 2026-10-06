interface StepProgressProps {
  current: number;
  total: number;
}

export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="step-progress" role="group" aria-label={`Step ${current} of ${total}`}>
      <div className="step-progress__bars" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={
              i < current ? 'step-progress__bar step-progress__bar--done' : 'step-progress__bar'
            }
          />
        ))}
      </div>
      <p className="step-progress__label">
        Step {current} of {total}
      </p>
    </div>
  );
}
