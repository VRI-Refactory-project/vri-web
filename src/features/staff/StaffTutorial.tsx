import { useEffect, useRef, useState } from 'react';
import { getTutorial, saveTutorial, type Tutorial } from '../../services/staffTutorial';
import { findTarget, PAD, placeCard, type Box } from './tutorialPlacement';
import './StaffTutorial.css';

/**
 * The first-sign-in tutorial for institution staff (V2-065). It opens by itself until it is finished
 * or skipped, one step at a time, highlighting the part of the screen each step is about. Progress
 * is saved after every step, so it carries on where it stopped, even on another device. Help &
 * Support starts it again.
 */
export function StaffTutorial() {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  // Where the card goes, worked out from its real size once it is on screen.
  const [cardAt, setCardAt] = useState<{ top: number; left: number } | null>(null);
  const card = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    getTutorial().then(
      (loaded) => {
        if (cancelled || !loaded.show || loaded.steps.length === 0) return;
        setTutorial(loaded);
        setStep(Math.min(loaded.step, loaded.steps.length - 1));
        setOpen(true);
      },
      () => undefined, // the tutorial is a help, never a reason for the dashboard to fail
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const current = open && tutorial ? tutorial.steps[step] : null;
  const target = current?.target ?? null;

  // Bring the highlighted part into view, then measure it, and again when the window changes.
  useEffect(() => {
    if (!open) return;
    document.querySelector(`[data-tour="${target}"]`)?.scrollIntoView?.({ block: 'center' });
    const measure = () => {
      const found = findTarget(target);
      const size = card.current?.getBoundingClientRect();
      setBox(found);
      setCardAt(found && size ? placeCard(found, size) : null);
    };
    let frame = requestAnimationFrame(measure);
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [open, target]);

  if (!tutorial || !current) return null;

  const last = step === tutorial.steps.length - 1;
  // Saving is best effort: if it fails, the tour still works and the next save catches up.
  const save = (change: Parameters<typeof saveTutorial>[0]) =>
    void saveTutorial(change).catch(() => {});

  const go = (next: number) => {
    setStep(next);
    setBox(null);
    setCardAt(null);
    save({ step: next });
  };
  const close = (action: 'complete' | 'skip') => {
    setOpen(false);
    save({ step, action });
  };

  return (
    <div className="staff-tour-layer">
      {box ? (
        <div
          className="staff-tour-spot"
          aria-hidden="true"
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.width + PAD * 2,
            height: box.height + PAD * 2,
          }}
        />
      ) : (
        <div className="staff-tour-dim" aria-hidden="true" />
      )}

      <section
        ref={card}
        className={`staff-tour-card${cardAt ? '' : ' staff-tour-card--centre'}`}
        style={cardAt ?? undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="st-title"
        aria-describedby="st-body"
        onKeyDown={(e) => e.key === 'Escape' && close('skip')}
      >
        <p className="staff-tour-count">
          Step {step + 1} of {tutorial.steps.length}
        </p>
        <h2 id="st-title">{current.title}</h2>
        <p id="st-body">{current.body}</p>
        <div className="staff-tour-progress" aria-hidden="true">
          {tutorial.steps.map((s, i) => (
            <i key={s.id} className={i <= step ? 'staff-tour-progress__done' : undefined} />
          ))}
        </div>
        <div className="staff-tour-actions">
          <button type="button" className="staff-tour-skip" onClick={() => close('skip')}>
            Skip tour
          </button>
          <span className="staff-tour-nav">
            {step > 0 && (
              <button
                type="button"
                className="staff-tour-button staff-tour-button--ghost"
                onClick={() => go(step - 1)}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="staff-tour-button"
              autoFocus
              key={step} // a fresh button each step, so focus lands on it again
              onClick={() => (last ? close('complete') : go(step + 1))}
            >
              {last ? 'Finish' : 'Next'}
            </button>
          </span>
        </div>
      </section>
    </div>
  );
}
